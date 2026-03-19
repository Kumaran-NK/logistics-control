import { Router } from "express";
import { db } from "@workspace/db";
import { shipmentsTable, trucksTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";

const router = Router();

const REGIONS = [
  "South India", "North India", "West India", "East India",
  "Central India", "Maharashtra", "Gujarat", "Rajasthan"
];

function rnd(min: number, max: number, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return +val.toFixed(decimals);
}

function formatDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

router.get("/analytics/kpis", async (_req, res) => {
  try {
    const allShipments = await db.select().from(shipmentsTable);
    const active = allShipments.filter(s => s.status === "in_transit").length;
    const delayed = allShipments.filter(s => s.status === "delayed").length;
    const delivered = allShipments.filter(s => s.status === "delivered").length;
    const total = allShipments.length;
    const onTimeRate = total > 0 ? +((delivered / total) * 100).toFixed(1) : rnd(72, 95, 1);

    const allTrucks = await db.select().from(trucksTable);
    const inTransit = allTrucks.filter(t => t.status === "in_transit").length;
    const utilization = allTrucks.length > 0
      ? +((inTransit / allTrucks.length) * 100).toFixed(1)
      : rnd(55, 85, 1);

    res.json({
      fleet_utilization: utilization,
      active_shipments: active || rnd(8, 25),
      delayed_shipments: delayed || rnd(1, 6),
      on_time_delivery_rate: onTimeRate,
      avg_delivery_time_hrs: rnd(18, 36, 1),
      demand_spike_region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      revenue_today: rnd(180000, 450000, 0),
      cost_savings_pct: rnd(8, 18, 1),
      ai_confidence: "mock",
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to get KPIs" });
  }
});

router.get("/analytics/fleet", async (_req, res) => {
  try {
    const trucks = await db.select().from(trucksTable);
    const inTransit = trucks.filter(t => t.status === "in_transit").length;
    const available = trucks.filter(t => t.status === "available").length;
    const maintenance = trucks.filter(t => t.status === "maintenance").length;
    const idle = trucks.filter(t => t.status === "idle").length;
    const total = trucks.length || 8;

    const hours = Array.from({ length: 12 }, (_, i) => {
      const h = (new Date().getHours() - 11 + i + 24) % 24;
      return {
        hour: `${String(h).padStart(2, "0")}:00`,
        utilization: rnd(30, 90, 1),
      };
    });

    res.json({
      total_trucks: total,
      in_transit: inTransit || rnd(3, 6),
      available: available || rnd(1, 3),
      maintenance: maintenance || rnd(0, 2),
      idle: idle || rnd(0, 2),
      avg_fuel_pct: rnd(45, 80, 1),
      utilization_history: hours,
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to get fleet analytics" });
  }
});

router.get("/analytics/demand", async (_req, res) => {
  const products = [
    "Laptops", "Smartphones", "Industrial Parts", "Textiles",
    "Pharmaceuticals", "Automotive Parts", "Electronics", "Food & Beverage"
  ];
  const demandLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  res.json({
    predictions: products.map(product => ({
      product,
      predicted_demand: demandLevels[Math.floor(Math.random() * demandLevels.length)],
      confidence: "mock",
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      change_pct: rnd(-20, 40, 1),
    })),
    spike_regions: REGIONS.sort(() => Math.random() - 0.5).slice(0, 3),
    overall_trend: (["rising", "stable", "declining"] as const)[Math.floor(Math.random() * 3)],
  });
});

router.get("/analytics/delivery-trends", async (_req, res) => {
  const trends = Array.from({ length: 7 }, (_, i) => {
    const delivered = rnd(20, 60);
    const delayed = rnd(2, 10);
    const cancelled = rnd(0, 4);
    const total = delivered + delayed + cancelled;
    return {
      date: formatDate(6 - i),
      delivered,
      delayed,
      cancelled,
      success_rate: +((delivered / total) * 100).toFixed(1),
    };
  });
  res.json(trends);
});

export default router;
