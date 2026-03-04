import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Category } from "../../models/category.model";

const userId = new mongoose.Types.ObjectId().toString();

describe("categories tools", () => {
  describe("list_categories", () => {
    it("should list user categories and system defaults", async () => {
      await Category.create({
        userId: null,
        name: "Groceries",
        icon: "G",
        color: "#00ff00",
        type: "expense",
        isDefault: true,
      });
      await Category.create({
        userId,
        name: "Custom Cat",
        icon: "C",
        color: "#0000ff",
        type: "expense",
        isDefault: false,
      });
      await Category.create({
        userId: new mongoose.Types.ObjectId(),
        name: "Other User Cat",
        icon: "O",
        color: "#ff0000",
        type: "expense",
        isDefault: false,
      });

      const categories = await Category.find({
        $or: [{ userId }, { userId: null }],
      });
      expect(categories).toHaveLength(2);
    });

    it("should return only defaults when user has no custom categories", async () => {
      await Category.create({
        userId: null,
        name: "Default",
        icon: "D",
        color: "#000",
        type: "income",
        isDefault: true,
      });

      const categories = await Category.find({
        $or: [{ userId }, { userId: null }],
      });
      expect(categories).toHaveLength(1);
      expect(categories[0].isDefault).toBe(true);
    });
  });

  describe("create_category", () => {
    it("should create a custom category", async () => {
      const cat = await Category.create({
        userId,
        name: "Hobbies",
        icon: "H",
        color: "#purple",
        type: "expense",
        isDefault: false,
      });

      expect(cat.userId!.toString()).toBe(userId);
      expect(cat.name).toBe("Hobbies");
      expect(cat.isDefault).toBe(false);
    });
  });
});
