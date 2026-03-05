import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFinancialSummaryResource } from "./financial-summary";
import { registerBudgetStatusResource } from "./budget-status";
import { registerGoalProgressResource } from "./goal-progress";
import { registerUpcomingBillsResource } from "./upcoming-bills";

export function registerAllResources(server: McpServer, getUserId: () => string): void {
  registerFinancialSummaryResource(server, getUserId);
  registerBudgetStatusResource(server, getUserId);
  registerGoalProgressResource(server, getUserId);
  registerUpcomingBillsResource(server, getUserId);
}
