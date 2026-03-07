import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Account } from "../models/account.model";
import { Budget } from "../models/budget.model";
import { Category } from "../models/category.model";
import { Goal } from "../models/goal.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { User } from "../models/user.model";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import * as advisorService from "../services/advisor.service";

function objectId() {
  return new mongoose.Types.ObjectId();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("advisor.service", () => {
  it("builds a grounded Gemini request and returns advisor stats with a reply-only payload", async () => {
    const uid = objectId();
    const accountId = objectId();
    const categoryId = objectId();
    const goalId = objectId();
    const now = new Date("2026-03-07T12:00:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await User.create({
      _id: uid,
      email: "advisor@example.com",
      name: "Avery Analyst",
      passwordHash: "hashed-password",
      currency: "USD",
    });

    await Account.create({
      _id: accountId,
      userId: uid,
      name: "Main Checking",
      type: "checking",
      balance: 5200,
      currency: "USD",
      color: "#2563eb",
      isArchived: false,
    });

    await Category.create({
      _id: categoryId,
      userId: uid,
      name: "Groceries",
      icon: "cart",
      color: "#14b8a6",
      type: "expense",
      isDefault: false,
    });

    await Budget.create({
      userId: uid,
      categoryId,
      amount: 600,
      period: "monthly",
      alertThreshold: 0.8,
      isActive: true,
    });

    await Goal.create({
      _id: goalId,
      userId: uid,
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 4500,
      color: "#10b981",
      icon: "shield",
      isCompleted: false,
    });

    await RecurringRule.create({
      userId: uid,
      accountId,
      categoryId,
      type: "expense",
      amount: 89,
      description: "Weekly grocery pickup",
      frequency: "weekly",
      startDate: now,
      nextDueDate: new Date("2026-03-20T12:00:00.000Z"),
      isActive: true,
    });

    await Transaction.create([
      {
        userId: uid,
        accountId,
        type: "expense",
        amount: 132.45,
        currency: "USD",
        categoryId,
        description: "Market run",
        notes: "Bought extra pantry staples",
        date: new Date("2026-03-05T12:00:00.000Z"),
        isRecurring: false,
        tags: ["grocery", "essentials"],
      },
      {
        userId: uid,
        accountId,
        type: "income",
        amount: 3200,
        currency: "USD",
        categoryId,
        description: "Paycheck",
        date: new Date("2026-03-01T12:00:00.000Z"),
        isRecurring: false,
        tags: [],
      },
    ]);

    const originalGoogleKey = env.GOOGLE_AI_API_KEY;
    const originalLegacyKey = env.GEMINI_API_KEY;

    try {
      (env as { GOOGLE_AI_API_KEY?: string }).GOOGLE_AI_API_KEY = "test-google-ai-key";
      (env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = undefined;

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            models: [
              {
                name: "models/gemini-2.0-flash",
                supportedGenerationMethods: ["generateContent"],
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      const sendMessageMock = vi.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              reply:
                "Your grocery spend is well within budget, but it is one of your most active expense categories this month.",
            }),
        },
      });
      const startChatArgs: unknown[] = [];
      const startChatMock = vi.fn((input: unknown) => {
        startChatArgs.push(input);
        return {
          sendMessage: sendMessageMock,
        };
      });
      const getGenerativeModelSpy = vi
        .spyOn(GoogleGenerativeAI.prototype, "getGenerativeModel")
        .mockReturnValue({
          startChat: startChatMock,
        } as never);

      const result = await advisorService.chat(uid.toString(), {
        message: "Analyze my recent spending and suggest a budget.",
        history: [
          {
            role: "user",
            content: "What should I pay attention to?",
          },
        ],
      });

      expect(result.reply).toContain("grocery spend");
      expect([
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
      ]).toContain(result.model);
      expect(result.contextStats).toMatchObject({
        accountCount: 1,
        transactionCount: 2,
        budgetCount: 1,
        goalCount: 1,
        recurringCount: 1,
        incomeThisMonth: 3200,
        spendingThisMonth: 132.45,
        currency: "USD",
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0]?.[0]).toBe(
        "https://generativelanguage.googleapis.com/v1/models?key=test-google-ai-key"
      );
      expect(getGenerativeModelSpy).toHaveBeenCalledWith({
        model: result.model,
        systemInstruction: expect.stringContaining("WealthWise Advisor"),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining("You must return exactly one JSON object"),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining('Top-level JSON shape: {"reply": string}.'),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "WealthWise dashboard navigation labels: Dashboard, Transactions, Categories, Budgets, Goals, Accounts, Recurring, Analytics, AI Advisor, Settings."
        ),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "Transactions page (/transactions): use the Add Transaction button in the top-right to open the Add Transaction dialog."
        ),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "The Add Transaction dialog uses Type tabs named Income, Expense, and Transfer, and visible fields named Amount, Description, Account, Category, Date, Notes, and Tags."
        ),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "The dialog fields are Account Name, Account Type, Initial Balance (or Balance when editing), Currency, and Color."
        ),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "The dialog fields are Goal Name, Target Amount, Deadline (optional), Icon, and Color."
        ),
      });
      expect(getGenerativeModelSpy.mock.calls[0]?.[0]).toMatchObject({
        systemInstruction: expect.stringContaining(
          "If the user asks you to do something in the app for them, do not claim you performed it"
        ),
      });
      expect(startChatMock).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            responseMimeType: "application/json",
          }),
        })
      );

      const startChatInput = startChatArgs[0];
      expect(startChatInput).toBeDefined();

      const typedStartChatInput = startChatInput as unknown as {
        history: Array<{ role: string; parts: Array<{ text: string }> }>;
      };
      expect(typedStartChatInput.history[0]?.parts[0]?.text).toContain("Main Checking");
      expect(typedStartChatInput.history[0]?.parts[0]?.text).toContain("Market run");
      expect(typedStartChatInput.history[0]?.parts[0]?.text).toContain("Emergency Fund");
      expect(typedStartChatInput.history[1]).toMatchObject({
        role: "user",
        parts: [
          {
            text: "What should I pay attention to?",
          },
        ],
      });
      expect(sendMessageMock).toHaveBeenCalledWith(
        "Analyze my recent spending and suggest a budget."
      );
    } finally {
      (env as { GOOGLE_AI_API_KEY?: string }).GOOGLE_AI_API_KEY = originalGoogleKey;
      (env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = originalLegacyKey;
      vi.useRealTimers();
    }
  });

  it("fails clearly when the Gemini API key is missing", async () => {
    const originalGoogleKey = env.GOOGLE_AI_API_KEY;
    const originalLegacyKey = env.GEMINI_API_KEY;
    (env as { GOOGLE_AI_API_KEY?: string }).GOOGLE_AI_API_KEY = undefined;
    (env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = undefined;

    try {
      await expect(
        advisorService.chat(objectId().toString(), {
          message: "Analyze my spending.",
          history: [],
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
      } satisfies Partial<ApiError>);
    } finally {
      (env as { GOOGLE_AI_API_KEY?: string }).GOOGLE_AI_API_KEY = originalGoogleKey;
      (env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = originalLegacyKey;
    }
  });

  it("falls back to the next Gemini model when the first model fails", async () => {
    const result = await advisorService.runWithGeminiModelFallback(
      ["gemini-2.5-flash", "gemini-2.0-flash"],
      async (model) => {
        if (model === "gemini-2.5-flash") {
          throw new Error("first model failed");
        }

        return `ok:${model}`;
      }
    );

    expect(result).toEqual({
      model: "gemini-2.0-flash",
      result: "ok:gemini-2.0-flash",
    });
  });

  it("uses the explicit model allowlist as-is before any fallback expansion", async () => {
    const originalAllowlist = env.GEMINI_MODEL_ALLOWLIST;
    const originalModel = env.GEMINI_MODEL;

    (env as { GEMINI_MODEL_ALLOWLIST?: string }).GEMINI_MODEL_ALLOWLIST =
      "gemini-2.0-flash, gemini-1.5-flash";
    (env as { GEMINI_MODEL: string }).GEMINI_MODEL = "gemini-2.5-flash";

    try {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const models = await advisorService.getGeminiModelCandidates("test-google-ai-key");

      expect(models).toEqual(["gemini-2.0-flash", "gemini-1.5-flash"]);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      (env as { GEMINI_MODEL_ALLOWLIST?: string }).GEMINI_MODEL_ALLOWLIST = originalAllowlist;
      (env as { GEMINI_MODEL: string }).GEMINI_MODEL = originalModel;
    }
  });

  it("rotates Gemini model order across calls", () => {
    const first = advisorService.getRotatedModelCandidates([
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ]);
    const second = advisorService.getRotatedModelCandidates([
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ]);

    expect(second).toEqual(first.slice(1).concat(first.slice(0, 1)));
  });
});
