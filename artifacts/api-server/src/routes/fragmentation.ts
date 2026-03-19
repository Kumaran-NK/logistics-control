import { Router } from "express";
import { db } from "@workspace/db";
import { shipmentsTable } from "@workspace/db/schema";
import { randomUUID } from "crypto";

const router = Router();

const ROUTES = [
  "MUM → DEL", "BLR → HYD", "DEL → KOL", "CHN → BLR",
  "HYD → PUN", "AHM → JAI", "PUN → MUM", "KOL → HYD",
];
const CARRIERS = ["BlueDart", "DTDC", "Delhivery", "Ecom Express", "XpressBees", "FedEx India"];

function rnd(min: number, max: number, dp = 1) {
  return +((Math.random() * (max - min) + min).toFixed(dp));
}

function randomRoute() {
  return ROUTES[Math.floor(Math.random() * ROUTES.length)];
}

function randomCarriers(n: number) {
  const shuffled = [...CARRIERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

router.get("/fragmentation/analysis", async (_req, res) => {
  try {
    const shipments = await db.select().from(shipmentsTable);
    const total = shipments.length || 10;
    const fragmented = Math.floor(total * rnd(0.3, 0.7, 2));
    res.json({
      total_shipments: total,
      fragmented_count: fragmented,
      carriers_involved: rnd(3, 8, 0),
      network_efficiency_score: rnd(52, 81, 1),
      potential_savings_pct: rnd(10, 28, 1),
      ai_confidence: "mock",
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

router.get("/fragmentation/opportunities", async (_req, res) => {
  const count = 5;
  const opportunities = Array.from({ length: count }, (_, i) => ({
    id: `OPP${1000 + i}`,
    route: randomRoute(),
    shipment_ids: [`S${1001 + i}`, `S${1002 + i}`, `S${1003 + i}`].slice(0, rnd(2, 4, 0)),
    carrier_count: rnd(2, 4, 0),
    cost_reduction_pct: rnd(10, 28, 1),
    truck_utilization_increase_pct: rnd(15, 35, 1),
    recommendation: `Consolidate ${rnd(2, 4, 0)} shipments to reduce carrier overhead and improve load factor`,
    priority: (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)],
  }));
  res.json(opportunities);
});

router.post("/fragmentation/optimize", async (_req, res) => {
  const route = randomRoute();
  const count = rnd(2, 5, 0);
  res.json({
    optimization: `Consolidate ${count} shipments on Route ${route}`,
    cost_reduction: `${rnd(12, 28, 0)}%`,
    truck_utilization_increase: `${rnd(18, 40, 0)}%`,
    shipments_consolidated: count,
    estimated_savings_inr: rnd(25000, 150000, 0),
    ai_confidence: "mock",
  });
});

export default router;
