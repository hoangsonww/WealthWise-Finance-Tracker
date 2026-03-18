export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  relevanceScore: number;
  metadata: {
    source: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    usageCount: number;
  };
}

export enum KnowledgeCategory {
  BudgetingStrategy = "budgeting_strategy",
  SavingsTip = "savings_tip",
  InvestmentBasic = "investment_basic",
  DebtManagement = "debt_management",
  EmergencyFund = "emergency_fund",
  TaxPlanning = "tax_planning",
  RetirementPlanning = "retirement_planning",
  SpendingOptimization = "spending_optimization",
  IncomeGrowth = "income_growth",
  FinancialHealth = "financial_health",
  RiskManagement = "risk_management",
  CreditScore = "credit_score",
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
  matchedTerms: string[];
}

export interface KnowledgeBaseStats {
  totalEntries: number;
  entriesByCategory: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  averageRelevanceScore: number;
}
