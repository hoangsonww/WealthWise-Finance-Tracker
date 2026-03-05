import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Goal } from "../../models/goal.model";

const userId = new mongoose.Types.ObjectId().toString();

describe("goals tools", () => {
  describe("list_goals", () => {
    it("should list all goals for user", async () => {
      await Goal.create({
        userId,
        name: "Vacation",
        targetAmount: 5000,
      });
      await Goal.create({
        userId,
        name: "Car",
        targetAmount: 20000,
      });

      const goals = await Goal.find({ userId });
      expect(goals).toHaveLength(2);
    });
  });

  describe("create_goal", () => {
    it("should create a goal with defaults", async () => {
      const goal = await Goal.create({
        userId,
        name: "Emergency Fund",
        targetAmount: 10000,
      });

      expect(goal.currentAmount).toBe(0);
      expect(goal.isCompleted).toBe(false);
      expect(goal.color).toBe("#10b981");
    });

    it("should create a goal with custom values", async () => {
      const deadline = new Date(2025, 11, 31);
      const goal = await Goal.create({
        userId,
        name: "House",
        targetAmount: 50000,
        currentAmount: 10000,
        deadline,
        color: "#ff0000",
        icon: "H",
      });

      expect(goal.currentAmount).toBe(10000);
      expect(goal.deadline!.getTime()).toBe(deadline.getTime());
      expect(goal.color).toBe("#ff0000");
    });
  });

  describe("update_goal", () => {
    it("should update goal fields", async () => {
      const goal = await Goal.create({
        userId,
        name: "Old Goal",
        targetAmount: 1000,
      });

      const updated = await Goal.findOneAndUpdate(
        { _id: goal._id, userId },
        { $set: { name: "New Goal", targetAmount: 2000 } },
        { new: true }
      );

      expect(updated!.name).toBe("New Goal");
      expect(updated!.targetAmount).toBe(2000);
    });

    it("should not update goal of another user", async () => {
      const goal = await Goal.create({
        userId: new mongoose.Types.ObjectId(),
        name: "Other",
        targetAmount: 1000,
      });

      const updated = await Goal.findOneAndUpdate(
        { _id: goal._id, userId },
        { $set: { name: "Hacked" } },
        { new: true }
      );
      expect(updated).toBeNull();
    });
  });

  describe("delete_goal", () => {
    it("should delete a goal", async () => {
      const goal = await Goal.create({
        userId,
        name: "To Delete",
        targetAmount: 100,
      });

      await Goal.findOneAndDelete({ _id: goal._id, userId });
      const found = await Goal.findById(goal._id);
      expect(found).toBeNull();
    });
  });

  describe("add_goal_funds", () => {
    it("should add funds to a goal", async () => {
      const goal = await Goal.create({
        userId,
        name: "Savings",
        targetAmount: 1000,
        currentAmount: 200,
      });

      goal.currentAmount += 300;
      await goal.save();

      const updated = await Goal.findById(goal._id);
      expect(updated!.currentAmount).toBe(500);
      expect(updated!.isCompleted).toBe(false);
    });

    it("should auto-complete goal when target is reached", async () => {
      const goal = await Goal.create({
        userId,
        name: "Almost Done",
        targetAmount: 1000,
        currentAmount: 900,
      });

      goal.currentAmount += 200;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
      }
      await goal.save();

      const updated = await Goal.findById(goal._id);
      expect(updated!.currentAmount).toBe(1100);
      expect(updated!.isCompleted).toBe(true);
    });

    it("should reject adding funds to completed goal", async () => {
      const goal = await Goal.create({
        userId,
        name: "Completed",
        targetAmount: 1000,
        currentAmount: 1000,
        isCompleted: true,
      });

      expect(goal.isCompleted).toBe(true);
    });
  });
});
