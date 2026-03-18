export interface ContextWindow {
  systemContext: string;
  userContext: string;
  graphContext: string;
  knowledgeContext: string;
  conversationContext: string;
  totalTokens: number;
  tokenBudget: number;
  metadata: {
    assembledAt: string;
    components: ContextComponent[];
    truncations: string[];
  };
}

export interface ContextComponent {
  name: string;
  content: string;
  tokenCount: number;
  priority: number; // 1-10, higher = more important
  source: string;
}

export interface ContextConfig {
  maxTotalTokens: number;
  systemTokenBudget: number;
  graphTokenBudget: number;
  knowledgeTokenBudget: number;
  conversationTokenBudget: number;
  userTokenBudget: number;
}
