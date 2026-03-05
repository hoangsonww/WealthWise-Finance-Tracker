import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RecurringRule } from "../models/recurring-rule.model";

export function registerUpcomingBillsResource(server: McpServer, getUserId: () => string) {
  server.resource(
    "upcoming-bills",
    "wealthwise://upcoming-bills",
    "Recurring payments due within the next 30 days",
    async () => {
      const userId = getUserId();
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const rules = await RecurringRule.find({
        userId,
        isActive: true,
        nextDueDate: { $gte: now, $lte: thirtyDays },
      }).sort({ nextDueDate: 1 });

      const bills = rules.map((r) => ({
        id: r._id.toString(),
        description: r.description,
        amount: r.amount,
        type: r.type,
        frequency: r.frequency,
        nextDueDate: r.nextDueDate.toISOString(),
        accountId: r.accountId.toString(),
        categoryId: r.categoryId.toString(),
      }));

      return {
        contents: [
          {
            uri: "wealthwise://upcoming-bills",
            text: JSON.stringify(bills),
            mimeType: "application/json",
          },
        ],
      };
    }
  );
}
