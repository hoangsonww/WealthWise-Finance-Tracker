import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Category } from "../models/category.model";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function formatCategory(cat: {
  _id: { toString(): string };
  userId?: { toString(): string } | null;
  name: string;
  icon: string;
  color: string;
  type: string;
  isDefault: boolean;
}) {
  return {
    id: cat._id.toString(),
    userId: cat.userId ? cat.userId.toString() : null,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    type: cat.type,
    isDefault: cat.isDefault,
  };
}

export function registerCategoryTools(server: McpServer, getUserId: () => string) {
  server.tool(
    "list_categories",
    "List user categories and system default categories",
    {},
    async () => {
      const userId = getUserId();
      const categories = await Category.find({
        $or: [{ userId }, { userId: null }],
      }).sort({ type: 1, name: 1 });
      return textResult(categories.map(formatCategory));
    }
  );

  server.tool(
    "create_category",
    "Create a custom spending or income category",
    {
      name: z.string().max(30).describe("Category name"),
      icon: z.string().describe("Emoji icon"),
      color: z.string().describe("Color hex code"),
      type: z.enum(["income", "expense"]).describe("Category type"),
    },
    async (params) => {
      const userId = getUserId();
      const category = await Category.create({
        userId,
        name: params.name,
        icon: params.icon,
        color: params.color,
        type: params.type,
        isDefault: false,
      });
      return textResult(formatCategory(category));
    }
  );
}
