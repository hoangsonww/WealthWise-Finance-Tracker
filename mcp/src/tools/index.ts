import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "./accounts.tool";
import { registerTransactionTools } from "./transactions.tool";
import { registerBudgetTools } from "./budgets.tool";
import { registerGoalTools } from "./goals.tool";
import { registerCategoryTools } from "./categories.tool";
import { registerRecurringTools } from "./recurring.tool";
import { registerAnalyticsTools } from "./analytics.tool";

export function registerAllTools(
  server: McpServer,
  getUserId: () => string,
): void {
  registerAccountTools(server, getUserId);
  registerTransactionTools(server, getUserId);
  registerBudgetTools(server, getUserId);
  registerGoalTools(server, getUserId);
  registerCategoryTools(server, getUserId);
  registerRecurringTools(server, getUserId);
  registerAnalyticsTools(server, getUserId);
}
