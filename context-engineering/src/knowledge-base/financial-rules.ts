import { KnowledgeEntry, KnowledgeCategory } from "./types";

function makeEntry(
  id: string,
  title: string,
  content: string,
  category: KnowledgeCategory,
  tags: string[],
  relevanceScore: number
): KnowledgeEntry {
  const now = new Date().toISOString();
  return {
    id,
    title,
    content,
    category,
    tags,
    relevanceScore,
    metadata: {
      source: "wealthwise-financial-rules",
      createdAt: now,
      updatedAt: now,
      version: 1,
      usageCount: 0,
    },
  };
}

/**
 * Returns 55 comprehensive financial knowledge entries covering all categories.
 */
export function getFinancialKnowledgeEntries(): KnowledgeEntry[] {
  return [
    // --- Budgeting Strategy (8 entries) ---
    makeEntry(
      "rule-budget-50-30-20",
      "The 50/30/20 Budget Rule",
      "Allocate 50% of after-tax income to needs (housing, groceries, utilities, insurance), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment. This framework provides a simple starting point for people who struggle with budgeting. Adjust percentages based on your cost of living and financial goals.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "50-30-20", "income allocation", "beginner"],
      0.95
    ),
    makeEntry(
      "rule-budget-zero-based",
      "Zero-Based Budgeting",
      "In zero-based budgeting, every dollar of income is assigned a job before the month begins. Income minus all planned expenses equals zero. This method forces intentional spending decisions and eliminates wasteful spending by requiring justification for every expense category each month.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "zero-based", "intentional spending"],
      0.9
    ),
    makeEntry(
      "rule-budget-envelope",
      "Envelope Budgeting System",
      "Divide cash into envelopes labeled by spending category. When an envelope is empty, stop spending in that category. Digital versions use virtual envelopes. This tactile approach makes overspending physically obvious and works especially well for variable expenses like groceries and entertainment.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "envelope", "cash", "spending control"],
      0.85
    ),
    makeEntry(
      "rule-budget-review-monthly",
      "Monthly Budget Review Practice",
      "Review your budget at the end of each month. Compare actual spending to planned amounts. Identify categories where you consistently over or underspend. Adjust next month's budget based on real patterns, not aspirational goals. Track trends over 3-6 months to find your true spending baseline.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "review", "monthly", "tracking"],
      0.88
    ),
    makeEntry(
      "rule-budget-irregular-expenses",
      "Planning for Irregular Expenses",
      "Create sinking funds for predictable but non-monthly expenses: annual insurance premiums, car registration, holiday gifts, medical copays, home maintenance. Divide the annual total by 12 and set aside that amount monthly. This prevents budget-busting surprises and reduces reliance on credit cards.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "sinking funds", "irregular expenses", "planning"],
      0.87
    ),
    makeEntry(
      "rule-budget-automate",
      "Automate Your Budget Transfers",
      "Set up automatic transfers on payday: savings contribution, investment contribution, bill payments. What is automated gets done. Move discretionary spending money to a separate account. This removes willpower from the equation and ensures priorities are funded first.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "automation", "transfers", "savings"],
      0.92
    ),
    makeEntry(
      "rule-budget-variable-income",
      "Budgeting with Variable Income",
      "If your income fluctuates, budget based on your lowest expected monthly income. In higher-earning months, direct the surplus to emergency fund and debt payoff. Build a buffer of one month's expenses in your checking account to smooth out income variability.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "variable income", "freelance", "buffer"],
      0.83
    ),
    makeEntry(
      "rule-budget-category-limits",
      "Setting Realistic Category Limits",
      "Base spending limits on actual past spending, not ideal numbers. Track 2-3 months of spending before setting limits. Reduce overspent categories by 10-15% per month rather than making drastic cuts. Gradual reductions are more sustainable than extreme budgets that lead to burnout and abandonment.",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "category limits", "realistic", "gradual"],
      0.84
    ),

    // --- Savings Tips (7 entries) ---
    makeEntry(
      "rule-savings-pay-yourself-first",
      "Pay Yourself First Principle",
      "Treat savings as a non-negotiable expense, not what is left over. Transfer savings immediately when you receive income, before paying other bills. Start with at least 10% and increase by 1% every quarter. This single habit is the strongest predictor of long-term wealth accumulation.",
      KnowledgeCategory.SavingsTip,
      ["savings", "pay yourself first", "habit", "wealth building"],
      0.95
    ),
    makeEntry(
      "rule-savings-high-yield",
      "Use High-Yield Savings Accounts",
      "Keep emergency funds and short-term savings in high-yield savings accounts earning 4-5% APY rather than traditional accounts earning 0.01%. The difference on $10,000 over a year is $400-500 vs $1. Online banks typically offer the best rates with FDIC insurance.",
      KnowledgeCategory.SavingsTip,
      ["savings", "high-yield", "interest", "online banking"],
      0.9
    ),
    makeEntry(
      "rule-savings-24-hour-rule",
      "The 24-Hour Rule for Large Purchases",
      "Wait at least 24 hours before making any non-essential purchase over $50. For purchases over $500, wait a week. This cooling-off period eliminates impulse purchases and ensures spending aligns with values. Studies show that 50-70% of impulse purchases are regretted.",
      KnowledgeCategory.SavingsTip,
      ["savings", "impulse control", "spending", "24-hour rule"],
      0.88
    ),
    makeEntry(
      "rule-savings-round-up",
      "Round-Up Savings Strategy",
      "Round every purchase up to the nearest dollar and automatically save the difference. A $3.45 coffee generates $0.55 in savings. Over hundreds of transactions per month, this adds up to $30-50 monthly without noticeable impact on spending. Many banking apps offer this feature natively.",
      KnowledgeCategory.SavingsTip,
      ["savings", "round-up", "micro-savings", "automation"],
      0.82
    ),
    makeEntry(
      "rule-savings-windfall",
      "Windfall Savings Strategy",
      "When receiving unexpected money (tax refund, bonus, gift, rebate), save at least 50% immediately. Allocate: 50% to financial goals (emergency fund, debt, investments), 30% to a planned want, 20% to immediate enjoyment. This balances responsibility with motivation.",
      KnowledgeCategory.SavingsTip,
      ["savings", "windfall", "tax refund", "bonus"],
      0.85
    ),
    makeEntry(
      "rule-savings-no-spend-challenge",
      "No-Spend Day Challenge",
      "Designate 1-2 days per week as no-spend days where you make zero discretionary purchases. Prepare meals from pantry staples, use free entertainment. This builds awareness of spending triggers and can save $200-400 per month depending on typical daily discretionary spending.",
      KnowledgeCategory.SavingsTip,
      ["savings", "no-spend", "challenge", "spending awareness"],
      0.8
    ),
    makeEntry(
      "rule-savings-subscription-audit",
      "Quarterly Subscription Audit",
      "Review all recurring subscriptions every quarter. The average American spends $219/month on subscriptions and underestimates this by 2.5x. Cancel services unused in the past 30 days. Negotiate rates on services you keep. Downgrade premium tiers you do not fully use.",
      KnowledgeCategory.SavingsTip,
      ["savings", "subscriptions", "audit", "recurring expenses"],
      0.91
    ),

    // --- Investment Basics (5 entries) ---
    makeEntry(
      "rule-invest-start-early",
      "The Power of Compound Interest",
      "Starting to invest early is more impactful than investing more later. $200/month invested starting at age 25 at 7% annual return grows to $528,000 by age 65. Starting at 35 with the same amount yields only $244,000. Time in the market beats timing the market for long-term wealth building.",
      KnowledgeCategory.InvestmentBasic,
      ["investing", "compound interest", "time value", "early start"],
      0.93
    ),
    makeEntry(
      "rule-invest-diversification",
      "Investment Diversification Principle",
      "Never put all your money in a single investment. Spread across asset classes (stocks, bonds, real estate), geographies (domestic, international), and sectors. A diversified portfolio reduces risk without proportionally reducing returns. Low-cost index funds provide instant diversification.",
      KnowledgeCategory.InvestmentBasic,
      ["investing", "diversification", "risk", "index funds"],
      0.92
    ),
    makeEntry(
      "rule-invest-employer-match",
      "Maximize Employer 401(k) Match",
      "If your employer offers a 401(k) match, contribute at least enough to get the full match. This is a guaranteed 50-100% return on your contribution. Not taking the match is literally leaving free money on the table. This should be your first investment priority after building a basic emergency fund.",
      KnowledgeCategory.InvestmentBasic,
      ["investing", "401k", "employer match", "retirement"],
      0.95
    ),
    makeEntry(
      "rule-invest-expense-ratios",
      "Minimize Investment Expense Ratios",
      "Choose investments with low expense ratios. A 1% difference in fees on a $100,000 portfolio over 30 years costs approximately $150,000 in lost growth. Index funds typically charge 0.03-0.20% vs 0.50-1.50% for actively managed funds, and most active managers underperform the index.",
      KnowledgeCategory.InvestmentBasic,
      ["investing", "expense ratio", "fees", "index funds"],
      0.89
    ),
    makeEntry(
      "rule-invest-dollar-cost-average",
      "Dollar-Cost Averaging Strategy",
      "Invest a fixed amount at regular intervals regardless of market conditions. This removes emotion from investment decisions, reduces the impact of volatility, and ensures you buy more shares when prices are low and fewer when prices are high. Set up automatic monthly investments.",
      KnowledgeCategory.InvestmentBasic,
      ["investing", "dollar cost averaging", "DCA", "automation"],
      0.88
    ),

    // --- Debt Management (6 entries) ---
    makeEntry(
      "rule-debt-avalanche",
      "Debt Avalanche Method",
      "List all debts by interest rate. Make minimum payments on all debts, then direct all extra money toward the highest-interest debt. This method minimizes total interest paid and is mathematically optimal. Best for disciplined individuals motivated by saving money.",
      KnowledgeCategory.DebtManagement,
      ["debt", "avalanche", "interest rate", "payoff strategy"],
      0.93
    ),
    makeEntry(
      "rule-debt-snowball",
      "Debt Snowball Method",
      "List all debts by balance from smallest to largest. Make minimum payments on all debts, then direct all extra money toward the smallest balance. The quick wins from eliminating small debts provide psychological momentum. Best for people who need motivation and visible progress.",
      KnowledgeCategory.DebtManagement,
      ["debt", "snowball", "small balance", "motivation"],
      0.92
    ),
    makeEntry(
      "rule-debt-to-income",
      "Debt-to-Income Ratio Management",
      "Keep total monthly debt payments below 36% of gross monthly income, with housing costs below 28%. Lenders use this ratio to assess creditworthiness. A high DTI limits borrowing ability and indicates financial strain. Calculate DTI monthly and take action if it trends upward.",
      KnowledgeCategory.DebtManagement,
      ["debt", "DTI", "debt-to-income", "creditworthiness"],
      0.88
    ),
    makeEntry(
      "rule-debt-avoid-minimum",
      "Danger of Minimum Payments Only",
      "Paying only the minimum on a $5,000 credit card balance at 20% APR takes 25+ years to pay off and costs over $8,000 in interest. Always pay more than the minimum. Even an extra $50/month dramatically reduces payoff time and total interest. Automate extra payments to stay consistent.",
      KnowledgeCategory.DebtManagement,
      ["debt", "minimum payment", "credit card", "interest"],
      0.91
    ),
    makeEntry(
      "rule-debt-consolidation",
      "When to Consider Debt Consolidation",
      "Debt consolidation makes sense when you can get a lower interest rate than your current average, you have a plan to avoid accumulating new debt, and total monthly payments decrease. Options include balance transfer cards (0% intro APR), personal loans, and home equity loans. Beware of extending the repayment period.",
      KnowledgeCategory.DebtManagement,
      ["debt", "consolidation", "balance transfer", "refinance"],
      0.84
    ),
    makeEntry(
      "rule-debt-good-vs-bad",
      "Good Debt vs Bad Debt",
      "Good debt finances appreciating assets or income growth: mortgages, student loans for in-demand degrees, business loans. Bad debt finances depreciating assets or consumption: credit card balances, car loans for luxury vehicles, personal loans for vacations. Minimize bad debt aggressively while using good debt strategically.",
      KnowledgeCategory.DebtManagement,
      ["debt", "good debt", "bad debt", "leverage"],
      0.86
    ),

    // --- Emergency Fund (4 entries) ---
    makeEntry(
      "rule-emergency-3-6-months",
      "Emergency Fund Target: 3-6 Months",
      "Maintain an emergency fund covering 3-6 months of essential expenses. Single-income households, self-employed individuals, and those in volatile industries should aim for 6-12 months. Essential expenses include housing, food, transportation, insurance, and minimum debt payments. Keep this fund liquid and separate from daily spending.",
      KnowledgeCategory.EmergencyFund,
      ["emergency fund", "savings", "safety net", "3-6 months"],
      0.95
    ),
    makeEntry(
      "rule-emergency-starter-fund",
      "Start with a $1,000 Starter Emergency Fund",
      "Before aggressively paying down debt, save a $1,000 starter emergency fund. This prevents small emergencies from becoming new debt. Once high-interest debt is eliminated, build the full 3-6 month fund. Even $25/week reaches $1,000 in 10 months.",
      KnowledgeCategory.EmergencyFund,
      ["emergency fund", "starter fund", "1000", "beginner"],
      0.9
    ),
    makeEntry(
      "rule-emergency-true-emergencies",
      "What Qualifies as a True Emergency",
      "True emergencies: job loss, medical emergencies, essential car or home repairs, urgent family situations. Not emergencies: sales, vacations, planned purchases, lifestyle upgrades, holiday spending. Define your criteria in advance so you do not rationalize non-emergency withdrawals under pressure.",
      KnowledgeCategory.EmergencyFund,
      ["emergency fund", "definition", "criteria", "discipline"],
      0.87
    ),
    makeEntry(
      "rule-emergency-replenish",
      "Replenishing Your Emergency Fund",
      "After using emergency funds, make replenishing them your top financial priority. Temporarily reduce discretionary spending and investment contributions until the fund is restored. Set a specific monthly replenishment target and timeline. Treat restoration as urgently as the original emergency.",
      KnowledgeCategory.EmergencyFund,
      ["emergency fund", "replenish", "rebuild", "priority"],
      0.85
    ),

    // --- Tax Planning (4 entries) ---
    makeEntry(
      "rule-tax-retirement-accounts",
      "Maximize Tax-Advantaged Retirement Accounts",
      "Contribute the maximum to tax-advantaged accounts: 401(k) ($23,500 for 2025), IRA ($7,000 for 2025), HSA ($4,300 individual/$8,550 family for 2025). Traditional contributions reduce taxable income now; Roth contributions provide tax-free growth. At minimum, max the employer match, then fund Roth IRA, then additional 401(k).",
      KnowledgeCategory.TaxPlanning,
      ["tax", "retirement", "401k", "IRA", "HSA", "tax-advantaged"],
      0.93
    ),
    makeEntry(
      "rule-tax-withholding-check",
      "Annual Tax Withholding Review",
      "Review your W-4 withholding annually, especially after life changes (marriage, new child, home purchase, job change). A large refund means you over-withheld and gave the government an interest-free loan. Aim to owe less than $500 or get a refund under $500 for optimal cash flow.",
      KnowledgeCategory.TaxPlanning,
      ["tax", "withholding", "W-4", "refund"],
      0.82
    ),
    makeEntry(
      "rule-tax-deductions",
      "Track Deductible Expenses Year-Round",
      "Maintain a running log of potentially deductible expenses: charitable donations, medical costs exceeding 7.5% of AGI, home office expenses, state and local taxes (up to $10,000), mortgage interest. Compare itemized vs standard deduction ($14,600 single/$29,200 married for 2025) to optimize your filing strategy.",
      KnowledgeCategory.TaxPlanning,
      ["tax", "deductions", "itemize", "standard deduction"],
      0.85
    ),
    makeEntry(
      "rule-tax-loss-harvesting",
      "Tax-Loss Harvesting in Investment Accounts",
      "Sell investments at a loss to offset capital gains and reduce taxable income by up to $3,000 per year. Reinvest in similar (but not identical) assets to maintain portfolio allocation. Unused losses carry forward to future tax years. This strategy is most valuable in taxable brokerage accounts.",
      KnowledgeCategory.TaxPlanning,
      ["tax", "tax-loss harvesting", "capital gains", "investing"],
      0.84
    ),

    // --- Retirement Planning (4 entries) ---
    makeEntry(
      "rule-retire-4-percent",
      "The 4% Withdrawal Rule",
      "In retirement, withdraw 4% of your portfolio in the first year, then adjust for inflation annually. This strategy has historically sustained a portfolio for 30+ years. To estimate your retirement number: multiply desired annual spending by 25. Need $60,000/year? Target $1,500,000 in savings.",
      KnowledgeCategory.RetirementPlanning,
      ["retirement", "4% rule", "withdrawal", "planning"],
      0.91
    ),
    makeEntry(
      "rule-retire-age-in-bonds",
      "Age-Based Asset Allocation",
      "A simple guideline: subtract your age from 110 to determine your stock allocation percentage. A 30-year-old would hold 80% stocks and 20% bonds. Adjust based on risk tolerance and retirement timeline. Target-date funds automate this rebalancing. More aggressive investors may subtract from 120.",
      KnowledgeCategory.RetirementPlanning,
      ["retirement", "asset allocation", "stocks", "bonds", "risk"],
      0.86
    ),
    makeEntry(
      "rule-retire-social-security-delay",
      "Delaying Social Security Benefits",
      "Social Security benefits increase approximately 8% for each year you delay claiming past full retirement age (up to age 70). Claiming at 62 reduces benefits by up to 30%. If you are healthy and have other income sources, delaying maximizes lifetime benefits. Break-even age is typically around 80-82.",
      KnowledgeCategory.RetirementPlanning,
      ["retirement", "social security", "delay", "benefits"],
      0.83
    ),
    makeEntry(
      "rule-retire-healthcare-costs",
      "Planning for Healthcare in Retirement",
      "The average couple needs approximately $315,000 saved for healthcare costs in retirement (excluding long-term care). Medicare begins at 65 but does not cover everything. Consider supplemental insurance, dental/vision plans, and long-term care insurance. An HSA is a powerful tool for tax-free healthcare savings.",
      KnowledgeCategory.RetirementPlanning,
      ["retirement", "healthcare", "medicare", "HSA"],
      0.85
    ),

    // --- Spending Optimization (5 entries) ---
    makeEntry(
      "rule-spend-needs-wants",
      "Distinguish Needs from Wants",
      "Before every purchase, ask: is this a need or a want? Needs are required for survival and basic functioning (food, shelter, transportation to work). Wants improve quality of life but are not essential. Delay wants by 48 hours. Prioritize spending on needs first, then allocate discretionary funds to wants that bring lasting satisfaction.",
      KnowledgeCategory.SpendingOptimization,
      ["spending", "needs", "wants", "prioritization"],
      0.88
    ),
    makeEntry(
      "rule-spend-cost-per-use",
      "Cost-Per-Use Analysis",
      "Evaluate purchases by dividing cost by expected number of uses. A $200 jacket worn 100 times costs $2/use; a $50 jacket worn 5 times costs $10/use. Higher upfront costs often yield better value for frequently used items. Apply this to clothing, electronics, kitchen equipment, and furniture.",
      KnowledgeCategory.SpendingOptimization,
      ["spending", "cost per use", "value", "quality"],
      0.83
    ),
    makeEntry(
      "rule-spend-meal-planning",
      "Meal Planning to Reduce Food Waste",
      "Plan meals weekly, shop with a list, and batch cook. The average American household wastes $1,500 worth of food annually. Meal planning reduces grocery spending by 20-30%, eliminates last-minute takeout, and improves nutrition. Cook large batches on weekends and portion for the week.",
      KnowledgeCategory.SpendingOptimization,
      ["spending", "meal planning", "groceries", "food waste"],
      0.86
    ),
    makeEntry(
      "rule-spend-negotiate-bills",
      "Negotiate Recurring Bills Annually",
      "Call providers for cable/internet, insurance, phone, and gym memberships annually to negotiate lower rates. Mention competitor offers. Ask for loyalty discounts or promotional rates. Average savings: $50-100/month across all bills. If a provider will not budge, switch providers or downgrade service.",
      KnowledgeCategory.SpendingOptimization,
      ["spending", "negotiation", "bills", "recurring"],
      0.87
    ),
    makeEntry(
      "rule-spend-lifestyle-creep",
      "Guard Against Lifestyle Inflation",
      "When income increases, resist the urge to proportionally increase spending. Save at least 50% of every raise. The hedonic treadmill means lifestyle upgrades provide diminishing satisfaction while permanently increasing your baseline expenses. A raise is an opportunity to accelerate financial goals, not inflate your lifestyle.",
      KnowledgeCategory.SpendingOptimization,
      ["spending", "lifestyle inflation", "creep", "raises"],
      0.9
    ),

    // --- Income Growth (4 entries) ---
    makeEntry(
      "rule-income-multiple-streams",
      "Build Multiple Income Streams",
      "Do not rely on a single income source. Develop 2-3 income streams: primary employment, side income (freelancing, consulting, gig work), and passive income (investments, rental property, digital products). Multiple streams provide resilience against job loss and accelerate wealth building.",
      KnowledgeCategory.IncomeGrowth,
      ["income", "multiple streams", "side hustle", "passive income"],
      0.89
    ),
    makeEntry(
      "rule-income-invest-skills",
      "Invest in High-Return Skills",
      "Spending on skill development yields the highest ROI of any investment. High-value skills: data analysis, programming, sales, public speaking, negotiation, project management. A $500 course that leads to a $5,000 raise has a 900% first-year return. Prioritize skills your industry values most.",
      KnowledgeCategory.IncomeGrowth,
      ["income", "skills", "education", "career growth"],
      0.87
    ),
    makeEntry(
      "rule-income-salary-negotiation",
      "Negotiate Your Salary Every 1-2 Years",
      "Research market rates using Glassdoor, Levels.fyi, and PayScale. Document your achievements with measurable impact. Ask for 10-20% above your current salary. Practice your pitch. Time the conversation with performance reviews or after major accomplishments. Not negotiating costs the average professional $500,000-$1M over a career.",
      KnowledgeCategory.IncomeGrowth,
      ["income", "salary", "negotiation", "career"],
      0.91
    ),
    makeEntry(
      "rule-income-tax-efficient",
      "Tax-Efficient Income Strategies",
      "Maximize tax-advantaged income: employer retirement contributions, HSA contributions, FSA for childcare and medical expenses. Consider Roth conversions in low-income years. If self-employed, deduct business expenses, contribute to SEP-IRA or Solo 401(k), and consider S-Corp election for FICA savings above $60K profit.",
      KnowledgeCategory.IncomeGrowth,
      ["income", "tax efficient", "self-employed", "retirement"],
      0.84
    ),

    // --- Financial Health (5 entries) ---
    makeEntry(
      "rule-health-net-worth-tracking",
      "Track Net Worth Monthly",
      "Calculate net worth monthly: total assets minus total liabilities. This single number captures your complete financial picture. Track the trend over time rather than fixating on the absolute number. Assets include savings, investments, property equity. Liabilities include all debts. A positive and growing trend is the goal.",
      KnowledgeCategory.FinancialHealth,
      ["financial health", "net worth", "tracking", "assets", "liabilities"],
      0.92
    ),
    makeEntry(
      "rule-health-financial-checkup",
      "Annual Financial Checkup Checklist",
      "Perform an annual review: update beneficiaries on all accounts, verify insurance coverage is adequate, rebalance investment portfolio, review estate documents (will, power of attorney), check credit report for errors, reassess financial goals, update emergency contacts. Schedule this like a medical checkup.",
      KnowledgeCategory.FinancialHealth,
      ["financial health", "annual review", "checkup", "planning"],
      0.88
    ),
    makeEntry(
      "rule-health-insurance-coverage",
      "Ensure Adequate Insurance Coverage",
      "Core insurance needs: health insurance, auto insurance, renters/homeowners insurance, term life insurance (if dependents, 10-12x annual income), disability insurance (covers 60% of income). Umbrella liability policy if net worth exceeds $500K. Insurance protects wealth that took years to build from being destroyed overnight.",
      KnowledgeCategory.FinancialHealth,
      ["financial health", "insurance", "protection", "risk"],
      0.87
    ),
    makeEntry(
      "rule-health-automate-finances",
      "Automate Your Entire Financial System",
      "Set up automatic: bill payments (avoid late fees), savings transfers (pay yourself first), investment contributions (dollar cost averaging), debt extra payments. Review the system monthly but let automation handle execution. This eliminates decision fatigue and ensures consistency regardless of willpower.",
      KnowledgeCategory.FinancialHealth,
      ["financial health", "automation", "system", "consistency"],
      0.91
    ),
    makeEntry(
      "rule-health-financial-goals",
      "Set SMART Financial Goals",
      "Every financial goal should be Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save more,' set 'save $12,000 for emergency fund by December 2025 by contributing $1,000/month.' Break large goals into monthly milestones. Review and adjust quarterly. Write goals down and track progress visually.",
      KnowledgeCategory.FinancialHealth,
      ["financial health", "goals", "SMART", "planning"],
      0.89
    ),

    // --- Risk Management (4 entries) ---
    makeEntry(
      "rule-risk-asset-protection",
      "Asset Protection Strategies",
      "Protect assets through: adequate insurance, legal structures (trusts, LLCs for rental properties), maintaining separate business and personal finances, umbrella liability insurance, and avoiding co-signing loans. Asset protection should be set up before you need it. Consult an attorney for complex situations.",
      KnowledgeCategory.RiskManagement,
      ["risk", "asset protection", "insurance", "legal"],
      0.84
    ),
    makeEntry(
      "rule-risk-identity-theft",
      "Protect Against Identity Theft and Fraud",
      "Freeze credit at all three bureaus (Equifax, Experian, TransUnion) if not actively applying for credit. Use unique passwords with a password manager. Enable two-factor authentication on all financial accounts. Monitor bank statements weekly. Set up transaction alerts. Never share financial information via email or phone.",
      KnowledgeCategory.RiskManagement,
      ["risk", "identity theft", "fraud", "credit freeze", "security"],
      0.9
    ),
    makeEntry(
      "rule-risk-estate-planning",
      "Basic Estate Planning Documents",
      "Everyone needs: a will (directs asset distribution), durable power of attorney (financial decisions if incapacitated), healthcare power of attorney, and HIPAA authorization. Parents of minors need a guardian designation. Update documents after major life changes. Without a will, state law determines asset distribution.",
      KnowledgeCategory.RiskManagement,
      ["risk", "estate planning", "will", "power of attorney"],
      0.86
    ),
    makeEntry(
      "rule-risk-emergency-preparedness",
      "Financial Emergency Preparedness",
      "Maintain accessible records: list of all accounts and passwords (in a secure vault), copies of insurance policies, emergency contacts, vital documents (birth certificate, passport, social security card). Keep a small cash reserve at home ($500-1,000) for situations where electronic payments fail.",
      KnowledgeCategory.RiskManagement,
      ["risk", "emergency", "preparedness", "documents", "cash"],
      0.82
    ),

    // --- Credit Score (4 entries) ---
    makeEntry(
      "rule-credit-utilization",
      "Keep Credit Utilization Below 30%",
      "Credit utilization (balance divided by credit limit) is the second most important credit score factor. Keep it below 30%, ideally below 10%. High utilization signals financial stress to lenders. Strategies: request credit limit increases, make multiple payments per month, or set balance alerts at 25% of limit.",
      KnowledgeCategory.CreditScore,
      ["credit score", "utilization", "credit limit", "improvement"],
      0.92
    ),
    makeEntry(
      "rule-credit-payment-history",
      "Never Miss a Payment",
      "Payment history is the single most important credit score factor (35% of FICO score). Even one 30-day late payment can drop your score 100+ points and remain on your report for 7 years. Set up autopay for at least the minimum payment on every account. A perfect payment history is the foundation of excellent credit.",
      KnowledgeCategory.CreditScore,
      ["credit score", "payment history", "autopay", "on-time"],
      0.95
    ),
    makeEntry(
      "rule-credit-age-accounts",
      "Maintain Long Credit History",
      "Average age of credit accounts matters (15% of FICO score). Do not close old credit cards even if unused; they lengthen your credit history and reduce overall utilization. Put a small recurring charge on old cards to keep them active. Only close a card if it has an annual fee with no offsetting benefits.",
      KnowledgeCategory.CreditScore,
      ["credit score", "credit history", "old accounts", "length"],
      0.87
    ),
    makeEntry(
      "rule-credit-monitoring",
      "Monitor Your Credit Report Regularly",
      "Check your credit report from all three bureaus at least annually via AnnualCreditReport.com (free). Dispute any errors immediately; 25% of reports contain errors that could lower your score. Use free credit monitoring services for ongoing alerts. A strong credit score saves thousands on mortgages, auto loans, and insurance.",
      KnowledgeCategory.CreditScore,
      ["credit score", "monitoring", "credit report", "errors", "dispute"],
      0.89
    ),
  ];
}
