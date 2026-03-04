import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Goal } from "../models/goal.model";

export function registerGoalProgressResource(
  server: McpServer,
  getUserId: () => string,
) {
  server.resource(
    "goal-progress",
    "wealthwise://goal-progress",
    "All savings goals with percentage complete",
    async () => {
      const userId = getUserId();
      const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

      const progress = goals.map((g) => ({
        id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        percentComplete:
          g.targetAmount > 0
            ? Math.round((g.currentAmount / g.targetAmount) * 10000) / 100
            : 0,
        deadline: g.deadline ? g.deadline.toISOString() : null,
        isCompleted: g.isCompleted,
        color: g.color,
        icon: g.icon,
      }));

      return {
        contents: [
          {
            uri: "wealthwise://goal-progress",
            text: JSON.stringify(progress),
            mimeType: "application/json",
          },
        ],
      };
    },
  );
}
