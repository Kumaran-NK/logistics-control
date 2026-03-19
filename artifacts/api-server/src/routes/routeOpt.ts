import { Router } from "express";
import { db } from "@workspace/db";
import { routesTable } from "@workspace/db/schema";
import { randomUUID } from "crypto";

const router = Router();

const TRAFFIC_LEVELS = ["low", "moderate", "high"] as const;
const WAYPOINTS_POOL = [
  "Nashik", "Pune", "Aurangabad", "Nagpur", "Surat",
  "Vadodara", "Bhopal", "Indore", "Agra", "Jaipur",
  "Chandigarh", "Amritsar", "Ludhiana", "Coimbatore", "Madurai"
];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function pickWaypoints(origin: string, destination: string) {
  const others = WAYPOINTS_POOL.filter(w => w !== origin && w !== destination);
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = others.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatTime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

router.get("/routes", async (_req, res) => {
  try {
    const routes = await db.select().from(routesTable).orderBy(routesTable.created_at);
    res.json(routes.map(r => ({
      ...r,
      waypoints: JSON.parse(r.waypoints),
      created_at: r.created_at.toISOString(),
    })));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

router.post("/routes/optimize", async (req, res) => {
  try {
    const { origin, destination, shipment_id } = req.body;
    const distance = randomBetween(80, 600);
    const avgSpeed = randomBetween(50, 80);
    const hours = distance / avgSpeed;
    const traffic = TRAFFIC_LEVELS[Math.floor(Math.random() * TRAFFIC_LEVELS.length)];
    const waypoints = pickWaypoints(origin, destination);
    const fuelSavings = randomBetween(5, 22);
    const route_id = `R${String(Math.floor(Math.random() * 90000) + 10000)}`;

    const inserted = await db.insert(routesTable).values({
      route_id,
      shipment_id: shipment_id || null,
      origin,
      destination,
      distance_km: distance,
      estimated_time: formatTime(hours),
      traffic_level: traffic,
      optimized: true,
      waypoints: JSON.stringify(waypoints),
      fuel_savings_pct: fuelSavings,
    }).returning();

    const r = inserted[0];
    res.json({
      ...r,
      waypoints: JSON.parse(r.waypoints),
      created_at: r.created_at.toISOString(),
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to optimize route" });
  }
});

export default router;
