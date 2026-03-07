import { inspect } from "util";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
  type Content,
  type GenerationConfig,
  type ResponseSchema,
} from "@google/generative-ai";
import {
  advisorChatModelOutputSchema,
  type AdvisorChatRequest,
  type AdvisorChatResponse,
  type AdvisorContextStats,
} from "@wealthwise/shared-types";
import { Account } from "../models/account.model";
import { Budget } from "../models/budget.model";
import { Category } from "../models/category.model";
import { Goal } from "../models/goal.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { User } from "../models/user.model";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

type GeminiRole = "user" | "model";

type GeminiModelListResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

type GeminiModelAttemptError = {
  model: string;
  message: string;
  status?: number;
  statusText?: string;
  errorDetails?: unknown;
};

interface AdvisorContextBundle {
  userName: string;
  currency: string;
  contextStats: AdvisorContextStats;
  serializedContext: string;
}

const GEMINI_MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const GEMINI_MODELS_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

let cachedGeminiModels: {
  models: string[];
  fetchedAt: number;
  allowPro: boolean;
} | null = null;
let modelRotationIndex = 0;

const ADVISOR_CHAT_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description:
        "The assistant reply shown to the user. It may include markdown, step-by-step instructions, navigation guidance, or follow-up questions.",
    },
  },
  required: ["reply"],
};

const ADVISOR_GENERATION_CONFIG: GenerationConfig = {
  responseMimeType: "application/json",
  responseSchema: ADVISOR_CHAT_RESPONSE_SCHEMA,
  temperature: 0.3,
  topP: 0.9,
  topK: 64,
  maxOutputTokens: 1600,
};

const GEMINI_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

function sanitizeText(value: string | null | undefined, fallback = "n/a") {
  if (!value) {
    return fallback;
  }

  const normalized = value.replace(/\s+/g, " ").replace(/[|]/g, "/").trim();
  return normalized || fallback;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeLogDetails(details: unknown, seen = new WeakSet<object>()): unknown {
  if (details === null || details === undefined) {
    return details;
  }

  if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
    return details;
  }

  if (typeof details === "bigint") {
    return details.toString();
  }

  if (details instanceof Date) {
    return details.toISOString();
  }

  if (details instanceof Error) {
    const errorWithExtras = details as Error & Record<string, unknown>;
    const extraEntries = Object.entries(errorWithExtras).filter(
      ([key]) => !["name", "message", "stack", "cause"].includes(key)
    );

    return {
      name: details.name,
      message: details.message,
      stack: details.stack,
      cause:
        errorWithExtras.cause !== undefined
          ? normalizeLogDetails(errorWithExtras.cause, seen)
          : undefined,
      ...Object.fromEntries(
        extraEntries.map(([key, value]) => [key, normalizeLogDetails(value, seen)])
      ),
    };
  }

  if (Array.isArray(details)) {
    return details.map((value) => normalizeLogDetails(value, seen));
  }

  if (typeof details === "object") {
    if (seen.has(details)) {
      return "[Circular]";
    }

    seen.add(details);

    return Object.fromEntries(
      Object.entries(details).map(([key, value]) => [key, normalizeLogDetails(value, seen)])
    );
  }

  return String(details);
}

function logAdvisorError(message: string, details?: unknown) {
  if (details === undefined) {
    console.error(`[advisor] ${message}`);
    return;
  }

  const renderedDetails = inspect(normalizeLogDetails(details), {
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
    compact: false,
    breakLength: 120,
    sorted: true,
  });

  console.error(`[advisor] ${message}\n${renderedDetails}`);
}

function getGeminiApiKey() {
  return env.GOOGLE_AI_API_KEY ?? env.GEMINI_API_KEY;
}

function normalizeModelName(name: string) {
  return name.replace(/^models\//, "").trim();
}

function isProGeminiModel(name: string) {
  return /(^|-)pro($|-)/.test(name);
}

function parseModelList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((modelName) => normalizeModelName(modelName))
    .filter(Boolean);
}

function filterGeminiModels(models: string[], allowPro: boolean) {
  const filtered = models
    .map((name) => normalizeModelName(name))
    .filter((name) => name.startsWith("gemini-"))
    .filter((name) => !name.includes("embedding"))
    .filter((name) => allowPro || !isProGeminiModel(name));

  return Array.from(new Set(filtered));
}

function rotateModels(models: string[]) {
  if (models.length <= 1) {
    return models;
  }

  modelRotationIndex = (modelRotationIndex + 1) % models.length;
  return models.slice(modelRotationIndex).concat(models.slice(0, modelRotationIndex));
}

async function fetchGeminiModels(apiKey: string, allowPro: boolean) {
  const now = Date.now();
  if (
    cachedGeminiModels &&
    cachedGeminiModels.allowPro === allowPro &&
    now - cachedGeminiModels.fetchedAt < GEMINI_MODELS_CACHE_TTL_MS
  ) {
    return cachedGeminiModels.models;
  }

  const response = await fetch(`${GEMINI_MODELS_ENDPOINT}?key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Gemini models: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GeminiModelListResponse;
  const models = filterGeminiModels(
    data.models
      ?.filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => model.name)
      .filter((name): name is string => Boolean(name)) ?? [],
    allowPro
  );

  cachedGeminiModels = { models, fetchedAt: now, allowPro };
  return models;
}

export async function getGeminiModelCandidates(apiKey: string) {
  const allowProModels = env.GEMINI_ALLOW_PRO_MODELS === "true";
  const modelAllowlist = parseModelList(env.GEMINI_MODEL_ALLOWLIST);
  const defaultFallbacks = filterGeminiModels(
    [env.GEMINI_MODEL, ...DEFAULT_GEMINI_MODEL_FALLBACKS],
    allowProModels
  );

  let modelsToTry: string[] = [];
  if (modelAllowlist.length > 0) {
    modelsToTry = filterGeminiModels(modelAllowlist, allowProModels);
  } else {
    try {
      modelsToTry = await fetchGeminiModels(apiKey, allowProModels);
    } catch (error) {
      logAdvisorError("Failed to fetch Gemini models. Falling back to defaults.", error);
      modelsToTry = [];
    }
  }

  if (modelAllowlist.length === 0 && modelsToTry.length < 2) {
    modelsToTry = filterGeminiModels(modelsToTry.concat(defaultFallbacks), allowProModels);
  }

  return modelsToTry;
}

export function getRotatedModelCandidates(models: string[]) {
  return rotateModels(models);
}

function toGeminiRole(role: AdvisorChatRequest["history"][number]["role"]): GeminiRole {
  return role === "assistant" ? "model" : "user";
}

function toGeminiHistoryContent(role: GeminiRole, text: string): Content {
  return {
    role,
    parts: [{ text }],
  };
}

function parseGeminiJson(text: string) {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw ApiError.internal("AI advisor returned an empty response");
  }

  const candidates = [trimmedText];
  const fencedMatch = trimmedText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    candidates.unshift(fencedMatch[1].trim());
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      logAdvisorError("Failed to parse Gemini JSON candidate.", {
        error,
        candidatePreview: candidate.slice(0, 240),
      });
    }
  }

  logAdvisorError("Gemini response was not valid JSON after all parse attempts.", {
    responsePreview: trimmedText.slice(0, 500),
  });
  throw ApiError.internal("AI advisor returned malformed structured data");
}

function toGeminiAttemptError(model: string, error: unknown): GeminiModelAttemptError {
  const err = error instanceof Error ? error : new Error(String(error));

  if (error instanceof GoogleGenerativeAIFetchError) {
    return {
      model,
      message: err.message,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails,
    };
  }

  if (error instanceof GoogleGenerativeAIResponseError) {
    return {
      model,
      message: err.message,
      errorDetails: error.response,
    };
  }

  return {
    model,
    message: err.message,
  };
}

export async function runWithGeminiModelFallback<T>(
  models: string[],
  runner: (modelName: string) => Promise<T>
): Promise<{ model: string; result: T }> {
  if (models.length === 0) {
    throw ApiError.serviceUnavailable("No eligible Gemini models were available to try.");
  }

  const errors: GeminiModelAttemptError[] = [];

  for (const model of models) {
    try {
      return {
        model,
        result: await runner(model),
      };
    } catch (error) {
      logAdvisorError(`Gemini model attempt failed for ${model}.`, error);
      errors.push(toGeminiAttemptError(model, error));
    }
  }

  throw new ApiError(503, "SERVICE_UNAVAILABLE", "All Gemini model attempts failed.", {
    attempts: errors,
  });
}

function buildSystemInstruction(userName: string, currency: string) {
  const referenceNow = new Date().toISOString();

  return [
    "You are WealthWise Advisor, an in-app financial analysis assistant.",
    `The user's name is ${userName} and their primary currency is ${currency}.`,
    `Reference datetime for all relative date resolution is ${referenceNow}.`,
    "You must return exactly one JSON object that matches the response schema.",
    "Do not return markdown fences, commentary, or any text before or after the JSON object.",
    "The JSON object must always contain exactly one top-level key: reply.",
    'Top-level JSON shape: {"reply": string}.',
    "The reply field is a string and may contain markdown, bullet lists, and numbered steps.",
    "Base every claim on the supplied WealthWise dataset and recent chat history only.",
    "Quote concrete numbers, categories, dates, and account names whenever they strengthen the answer.",
    "Be practical, candid, and professional. Surface risks, opportunities, and tradeoffs clearly.",
    "If the data is missing or insufficient, say that directly instead of guessing.",
    "Do not invent transactions, balances, categories, or trends that are not present in the dataset.",
    "Do not provide legal, tax, or investment advice. Offer general educational guidance when those topics arise.",
    "If the user asks you to do something in the app for them, do not claim you performed it and do not pretend you can click buttons or save data.",
    "Instead, explain the exact steps they should take in the current WealthWise UI using the real page names, button labels, dialogs, and controls listed below.",
    "If the user wants an action completed in-app, structure the reply as short numbered steps with concrete field values copied from their request and the dataset.",
    "When guiding the user through the UI, refer to visible field labels and button text, not backend property names like accountId or categoryId.",
    "Use exact sidebar labels and page labels from the app.",
    "WealthWise dashboard navigation labels: Dashboard, Transactions, Categories, Budgets, Goals, Accounts, Recurring, Analytics, AI Advisor, Settings.",
    "Frontend workflow guide:",
    "Transactions page (/transactions): use the Add Transaction button in the top-right to open the Add Transaction dialog. The header also has an Import CSV button. The Add Transaction dialog uses Type tabs named Income, Expense, and Transfer, and visible fields named Amount, Description, Account, Category, Date, Notes, and Tags. The search box placeholder is Search transactions.... Filters appear in the left sidebar on desktop and in a mobile sheet titled Filters. Transaction row menus support Edit, Delete, and Duplicate.",
    "Accounts page (/accounts): use the Add Account button to open the Add New Account dialog. The dialog fields are Account Name, Account Type, Initial Balance (or Balance when editing), Currency, and Color. Existing account cards have a menu with Edit, Archive, and Delete.",
    "Budgets page (/budgets): use the Create Budget button to open the Create Budget dialog. The dialog fields are Category, Budget Amount, Period, and Alert Threshold. Existing budget cards support Edit and Delete.",
    "Goals page (/goals): use the New Goal button to open the Create New Goal dialog. The dialog fields are Goal Name, Target Amount, Deadline (optional), Icon, and Color. Goal cards support Add Funds, Edit, and Delete. Add Funds opens a dialog titled Add Funds to <goal name> with an Amount field. Completed goals are shown in a collapsible Completed Goals section.",
    "Recurring page (/recurring): use the Add Recurring button to open the Add Recurring Rule dialog. The dialog uses Income and Expense tabs and fields named Amount, Description, Account, Category, Frequency, Start Date, and End Date (optional). Existing rules support Edit, Pause or Resume, Mark as Paid, and Delete. Upcoming recurring items appear in the Upcoming section.",
    "Categories page (/categories): use the New Category button to open the Create a new category dialog, and editing opens a dialog titled Refine category. The dialog fields are Name, Type, Icon, and Accent color. The page search input placeholder is Search by name, type, or icon label.... Filter chips are All, Expense, Income, Custom, and Protected. Category cards support edit and delete flows, and delete protection warnings may appear when a category is linked elsewhere.",
    "Analytics page (/analytics): users can change the date range from the dropdown in the header and export analytics with the Export CSV button. This page is for analysis only, not editing data.",
    "Settings page (/settings): tabs are Profile, Appearance, Data Export, and Danger Zone. Profile contains an Edit Profile form with fields Display Name and Default Currency plus a Save Changes button. Appearance controls theme, reduced motion, and contrast. Data Export lets users choose export format and optional start/end dates before downloading transaction data. Danger Zone is for Delete Account.",
    "Dashboard page (/dashboard): this is the overview page for recent financial status rather than a primary editing surface.",
    "When you describe a workflow, prefer this format: 1. Go to <page>. 2. Click <button>. 3. Fill in <fields>. 4. Save or confirm.",
    "If a requested workflow depends on existing app data, mention the exact account names, category names, amounts, or dates from the dataset and request.",
    "If the workflow requires missing data, such as an account or category that does not exist, say that clearly and tell the user to create that prerequisite first.",
    "If the user asks for analysis only, answer directly without unnecessary navigation steps.",
    "If you are unsure whether a control exists, say so instead of inventing it.",
    "Keep the reply concise and useful, but detailed enough that the user can follow it without guessing.",
    'Valid shape example: {"reply":"1. Go to Transactions. 2. Click Add Transaction. 3. Set Type to Expense, Account to Main Checking, Category to Groceries, Amount to 42.18, Description to Trader Joe\'s, and Date to today. 4. Save the transaction."}',
    'If details are missing, valid shape example: {"reply":"I can walk you through it, but I still need the account name and category you want to use."}',
  ].join("\n");
}

function buildMonthlyCategorySummary(
  categorySpendMap: Map<string, { name: string; total: number }>
): string[] {
  return Array.from(categorySpendMap.values())
    .sort((left, right) => right.total - left.total)
    .slice(0, 8)
    .map((entry) => `${entry.name}|spent=${roundCurrency(entry.total)}`);
}

async function buildAdvisorContext(userId: string): Promise<AdvisorContextBundle> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billsCutoff = new Date(now);
  billsCutoff.setDate(billsCutoff.getDate() + 30);

  const [user, accounts, categories, budgets, goals, recurringRules, transactions] =
    await Promise.all([
      User.findById(userId).select("name currency"),
      Account.find({ userId }).sort({ isArchived: 1, balance: -1 }),
      Category.find({ $or: [{ userId: null }, { userId }] }).sort({ type: 1, name: 1 }),
      Budget.find({ userId }).sort({ isActive: -1, amount: -1 }),
      Goal.find({ userId }).sort({ isCompleted: 1, createdAt: -1 }),
      RecurringRule.find({ userId }).sort({ isActive: -1, nextDueDate: 1 }),
      Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }),
    ]);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const accountMap = new Map(
    accounts.map((account) => [
      account._id.toString(),
      {
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        isArchived: account.isArchived,
      },
    ])
  );

  const categoryMap = new Map(
    categories.map((category) => [
      category._id.toString(),
      {
        name: category.name,
        icon: category.icon,
        type: category.type,
        color: category.color,
        isDefault: category.isDefault,
      },
    ])
  );

  let totalAssets = 0;
  let totalDebt = 0;

  for (const account of accounts) {
    const absoluteBalance = Math.abs(account.balance);

    if (account.type === "credit_card") {
      totalDebt += absoluteBalance;
      continue;
    }

    if (account.balance >= 0) {
      totalAssets += account.balance;
    } else {
      totalDebt += absoluteBalance;
    }
  }

  let incomeThisMonth = 0;
  let spendingThisMonth = 0;
  let upcomingBills30Days = 0;
  let largestExpense: { amount: number; description: string; date: string } | null = null;
  let largestIncome: { amount: number; description: string; date: string } | null = null;

  const monthCategorySpend = new Map<string, { name: string; total: number }>();

  for (const transaction of transactions) {
    if (transaction.date < monthStart) {
      continue;
    }

    if (transaction.type === "income") {
      incomeThisMonth += transaction.amount;

      if (!largestIncome || transaction.amount > largestIncome.amount) {
        largestIncome = {
          amount: transaction.amount,
          description: sanitizeText(transaction.description),
          date: transaction.date.toISOString(),
        };
      }
    }

    if (transaction.type === "expense") {
      spendingThisMonth += transaction.amount;

      const category = categoryMap.get(transaction.categoryId.toString());
      const categoryName = category?.name ?? "Uncategorized";
      const current = monthCategorySpend.get(categoryName) ?? { name: categoryName, total: 0 };
      current.total += transaction.amount;
      monthCategorySpend.set(categoryName, current);

      if (!largestExpense || transaction.amount > largestExpense.amount) {
        largestExpense = {
          amount: transaction.amount,
          description: sanitizeText(transaction.description),
          date: transaction.date.toISOString(),
        };
      }
    }
  }

  for (const rule of recurringRules) {
    if (rule.isActive && rule.nextDueDate >= now && rule.nextDueDate <= billsCutoff) {
      upcomingBills30Days += 1;
    }
  }

  const netWorth = totalAssets - totalDebt;
  const savingsThisMonth = incomeThisMonth - spendingThisMonth;
  const savingsRate =
    incomeThisMonth > 0 ? roundCurrency((savingsThisMonth / incomeThisMonth) * 100) : 0;

  const contextStats: AdvisorContextStats = {
    accountCount: accounts.length,
    transactionCount: transactions.length,
    categoryCount: categories.length,
    budgetCount: budgets.length,
    goalCount: goals.length,
    recurringCount: recurringRules.length,
    netWorth: roundCurrency(netWorth),
    totalAssets: roundCurrency(totalAssets),
    totalDebt: roundCurrency(totalDebt),
    incomeThisMonth: roundCurrency(incomeThisMonth),
    spendingThisMonth: roundCurrency(spendingThisMonth),
    savingsThisMonth: roundCurrency(savingsThisMonth),
    savingsRate,
    upcomingBills30Days,
    currency: user.currency,
  };

  const lines: string[] = [
    `profile|name=${sanitizeText(user.name)}|currency=${user.currency}|generated_at=${now.toISOString()}`,
    `summary|accounts=${contextStats.accountCount}|transactions=${contextStats.transactionCount}|categories=${contextStats.categoryCount}|budgets=${contextStats.budgetCount}|goals=${contextStats.goalCount}|recurring=${contextStats.recurringCount}`,
    `summary_financial|net_worth=${contextStats.netWorth}|assets=${contextStats.totalAssets}|debt=${contextStats.totalDebt}|income_this_month=${contextStats.incomeThisMonth}|spending_this_month=${contextStats.spendingThisMonth}|savings_this_month=${contextStats.savingsThisMonth}|savings_rate_pct=${contextStats.savingsRate}|upcoming_bills_30d=${contextStats.upcomingBills30Days}`,
  ];

  if (largestExpense) {
    lines.push(
      `largest_expense_this_month|amount=${roundCurrency(largestExpense.amount)}|date=${largestExpense.date}|description=${sanitizeText(largestExpense.description)}`
    );
  }

  if (largestIncome) {
    lines.push(
      `largest_income_this_month|amount=${roundCurrency(largestIncome.amount)}|date=${largestIncome.date}|description=${sanitizeText(largestIncome.description)}`
    );
  }

  const topCategories = buildMonthlyCategorySummary(monthCategorySpend);
  if (topCategories.length > 0) {
    lines.push("top_spending_categories_this_month");
    lines.push(...topCategories.map((entry) => `category_spend|${entry}`));
  }

  lines.push("accounts");
  for (const account of accounts) {
    lines.push(
      [
        "account",
        `name=${sanitizeText(account.name)}`,
        `type=${account.type}`,
        `balance=${roundCurrency(account.balance)}`,
        `currency=${account.currency}`,
        `archived=${account.isArchived}`,
      ].join("|")
    );
  }

  lines.push("categories");
  for (const category of categories) {
    lines.push(
      [
        "category",
        `name=${sanitizeText(category.name)}`,
        `type=${category.type}`,
        `icon=${sanitizeText(category.icon)}`,
        `color=${category.color}`,
        `default=${category.isDefault}`,
      ].join("|")
    );
  }

  lines.push("budgets");
  for (const budget of budgets) {
    const category = categoryMap.get(budget.categoryId.toString());
    lines.push(
      [
        "budget",
        `category=${sanitizeText(category?.name, budget.categoryId.toString())}`,
        `amount=${roundCurrency(budget.amount)}`,
        `period=${budget.period}`,
        `alert_threshold=${budget.alertThreshold}`,
        `active=${budget.isActive}`,
      ].join("|")
    );
  }

  lines.push("goals");
  for (const goal of goals) {
    lines.push(
      [
        "goal",
        `name=${sanitizeText(goal.name)}`,
        `target=${roundCurrency(goal.targetAmount)}`,
        `current=${roundCurrency(goal.currentAmount)}`,
        `deadline=${goal.deadline ? goal.deadline.toISOString() : "none"}`,
        `completed=${goal.isCompleted}`,
      ].join("|")
    );
  }

  lines.push("recurring_rules");
  for (const rule of recurringRules) {
    const account = accountMap.get(rule.accountId.toString());
    const category = categoryMap.get(rule.categoryId.toString());
    lines.push(
      [
        "recurring",
        `type=${rule.type}`,
        `description=${sanitizeText(rule.description)}`,
        `amount=${roundCurrency(rule.amount)}`,
        `frequency=${rule.frequency}`,
        `account=${sanitizeText(account?.name, rule.accountId.toString())}`,
        `category=${sanitizeText(category?.name, rule.categoryId.toString())}`,
        `next_due=${rule.nextDueDate.toISOString()}`,
        `active=${rule.isActive}`,
      ].join("|")
    );
  }

  lines.push(`transactions|count=${transactions.length}`);
  for (const transaction of transactions) {
    const account = accountMap.get(transaction.accountId.toString());
    const category = categoryMap.get(transaction.categoryId.toString());

    lines.push(
      [
        "transaction",
        `date=${transaction.date.toISOString()}`,
        `type=${transaction.type}`,
        `amount=${roundCurrency(transaction.amount)}`,
        `currency=${transaction.currency}`,
        `account=${sanitizeText(account?.name, transaction.accountId.toString())}`,
        `category=${sanitizeText(category?.name, transaction.categoryId.toString())}`,
        `subcategory=${sanitizeText(transaction.subcategory)}`,
        `description=${sanitizeText(transaction.description)}`,
        `notes=${sanitizeText(transaction.notes)}`,
        `tags=${transaction.tags.length > 0 ? transaction.tags.map((tag) => sanitizeText(tag)).join(",") : "none"}`,
        `recurring=${transaction.isRecurring}`,
      ].join("|")
    );
  }

  return {
    userName: user.name,
    currency: user.currency,
    contextStats,
    serializedContext: lines.join("\n"),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAdvisorModelOutput(parsedJson: unknown, responseText: string) {
  const strictParse = advisorChatModelOutputSchema.safeParse(parsedJson);
  if (strictParse.success) {
    return strictParse.data;
  }

  logAdvisorError(
    "Advisor model output failed strict schema validation. Falling back to lenient normalization.",
    {
      issues: strictParse.error.flatten(),
      parsedJson,
    }
  );

  const reply =
    (isObject(parsedJson) && typeof parsedJson.reply === "string" ? parsedJson.reply : null) ??
    (typeof parsedJson === "string" ? parsedJson : null) ??
    responseText;

  const normalizedReply = reply.trim();
  if (!normalizedReply) {
    throw ApiError.internal("AI advisor returned an invalid structured response");
  }

  return {
    reply: normalizedReply,
  };
}

export async function chat(
  userId: string,
  input: AdvisorChatRequest
): Promise<AdvisorChatResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw ApiError.serviceUnavailable(
      "AI advisor is not configured. Add GOOGLE_AI_API_KEY (or GEMINI_API_KEY) on the server."
    );
  }

  const context = await buildAdvisorContext(userId);
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiHistory: Content[] = [
    toGeminiHistoryContent(
      "user",
      `Authoritative WealthWise dataset for this turn:\n${context.serializedContext}`
    ),
    ...input.history
      .slice(-12)
      .map((entry) => toGeminiHistoryContent(toGeminiRole(entry.role), entry.content)),
  ];

  const modelCandidates = getRotatedModelCandidates(await getGeminiModelCandidates(apiKey));
  const { model, result: responseText } = await runWithGeminiModelFallback(
    modelCandidates,
    async (modelName) => {
      const modelClient = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemInstruction(context.userName, context.currency),
      });

      const chatSession = modelClient.startChat({
        generationConfig: ADVISOR_GENERATION_CONFIG,
        safetySettings: GEMINI_SAFETY_SETTINGS,
        history: geminiHistory,
      });

      const response = await chatSession.sendMessage(input.message);
      const text = response.response.text();
      if (!text) {
        throw new Error(`Gemini returned no text for model ${modelName}`);
      }

      return text;
    }
  );

  const parsedJson = parseGeminiJson(responseText);
  const parsedOutput = normalizeAdvisorModelOutput(parsedJson, responseText);

  return {
    reply: parsedOutput.reply,
    model,
    generatedAt: new Date().toISOString(),
    contextStats: context.contextStats,
  };
}
