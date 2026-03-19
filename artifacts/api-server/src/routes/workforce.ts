import { Router } from "express";
import { db } from "@workspace/db";
import { workersTable, workerTasksTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function rnd(min: number, max: number, dp = 0) {
  return +((Math.random() * (max - min) + min).toFixed(dp));
}

function getRecommendation(score: number): string {
  if (score >= 90) return "Eligible for performance reward — top performer this week";
  if (score >= 75) return "On track — maintain current productivity levels";
  if (score >= 60) return "Schedule skill-building training session";
  return "Assign to supervised tasks — productivity below threshold";
}

function getRewardTier(points: number): "bronze" | "silver" | "gold" | "platinum" {
  if (points >= 1000) return "platinum";
  if (points >= 500) return "gold";
  if (points >= 200) return "silver";
  return "bronze";
}

function formatWorker(w: { id: string; name: string; role: string; warehouse_id: string; performance_score: number; reward_points: number; tasks_completed: number; status: string; ai_recommendation: string | null }) {
  return { ...w, ai_recommendation: w.ai_recommendation || getRecommendation(w.performance_score) };
}

router.get("/workers", async (_req, res) => {
  try {
    const workers = await db.select().from(workersTable);
    res.json(workers.map(formatWorker));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

router.post("/workers", async (req, res) => {
  try {
    const { name, role, warehouse_id } = req.body;
    const score = rnd(60, 95, 1);
    const inserted = await db.insert(workersTable).values({
      id: randomUUID(),
      name,
      role,
      warehouse_id,
      performance_score: score,
      reward_points: rnd(0, 300),
      tasks_completed: rnd(0, 50),
      status: "active",
      ai_recommendation: getRecommendation(score),
    }).returning();
    res.status(201).json(formatWorker(inserted[0]));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to create worker" });
  }
});

router.post("/workers/assign-task", async (req, res) => {
  try {
    const { worker_id, task_type, description, priority } = req.body;
    const inserted = await db.insert(workerTasksTable).values({
      id: randomUUID(),
      worker_id,
      task_type,
      description,
      completed: false,
      priority: priority || "medium",
    }).returning();
    const task = inserted[0];
    res.json({
      ...task,
      assigned_time: task.assigned_time.toISOString(),
      completed_time: null,
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to assign task" });
  }
});

router.get("/workers/tasks", async (_req, res) => {
  try {
    const tasks = await db.select().from(workerTasksTable);
    res.json(tasks.map(t => ({
      ...t,
      assigned_time: t.assigned_time.toISOString(),
      completed_time: t.completed_time?.toISOString() ?? null,
    })));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.get("/workers/performance", async (_req, res) => {
  try {
    const workers = await db.select().from(workersTable);
    res.json(workers.map(w => ({
      worker_id: w.id,
      worker_name: w.name,
      productivity_score: w.performance_score + rnd(-3, 3, 1),
      tasks_completed_today: rnd(3, 15),
      avg_task_time_minutes: rnd(8, 35, 1),
      recommendation: getRecommendation(w.performance_score),
      eligible_for_reward: w.performance_score >= 90,
    })));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to get performance" });
  }
});

router.get("/workers/rewards", async (_req, res) => {
  try {
    const workers = await db.select().from(workersTable);
    const sorted = [...workers].sort((a, b) => b.reward_points - a.reward_points);
    res.json(sorted.map(w => ({
      worker_id: w.id,
      worker_name: w.name,
      reward_points: w.reward_points,
      tier: getRewardTier(w.reward_points),
      last_reward_reason: w.performance_score >= 85 ? "Top performer — weekly bonus" : null,
    })));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to get rewards" });
  }
});

export default router;
