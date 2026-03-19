import { Router } from "express";
import { db } from "@workspace/db";
import { yardSlotsTable, docksTable, truckArrivalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const CONGESTION_LEVELS = ["low", "moderate", "high", "critical"] as const;
const WAREHOUSES = ["Mumbai Depot", "Delhi Hub", "Bangalore Warehouse", "Chennai Port", "Hyderabad Yard"];

function rnd(min: number, max: number, dp = 0) {
  return +((Math.random() * (max - min) + min).toFixed(dp));
}

// ── Yard Slots ──────────────────────────────────────────────────────────────
router.get("/yard/slots", async (_req, res) => {
  try {
    const slots = await db.select().from(yardSlotsTable);
    res.json(slots);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch yard slots" });
  }
});

// ── Docks ───────────────────────────────────────────────────────────────────
router.get("/yard/docks", async (_req, res) => {
  try {
    const docks = await db.select().from(docksTable);
    res.json(docks);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch docks" });
  }
});

// ── Arrivals ────────────────────────────────────────────────────────────────
router.get("/yard/arrivals", async (_req, res) => {
  try {
    const arrivals = await db.select().from(truckArrivalsTable);
    res.json(arrivals);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch arrivals" });
  }
});

router.post("/yard/schedule-arrival", async (req, res) => {
  try {
    const { truck_id, scheduled_time } = req.body;
    // Find a free slot
    const freeSlots = await db.select().from(yardSlotsTable).where(eq(yardSlotsTable.status, "free"));
    const assignedSlot = freeSlots.length > 0 ? freeSlots[0].id : null;
    if (assignedSlot) {
      await db.update(yardSlotsTable).set({ status: "reserved", truck_id }).where(eq(yardSlotsTable.id, assignedSlot));
    }
    const id = randomUUID();
    const inserted = await db.insert(truckArrivalsTable).values({
      id,
      truck_id,
      scheduled_time,
      assigned_slot: assignedSlot,
      status: "scheduled",
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to schedule arrival" });
  }
});

router.post("/yard/assign-dock", async (req, res) => {
  try {
    const { truck_id, dock_id } = req.body;
    const dock = await db.select().from(docksTable).where(eq(docksTable.id, dock_id));
    if (!dock.length) return res.status(404).json({ error: "Dock not found" });
    await db.update(docksTable)
      .set({ assigned_truck: truck_id, status: "loading" })
      .where(eq(docksTable.id, dock_id));
    // Update any matching arrival
    const arrivals = await db.select().from(truckArrivalsTable).where(eq(truckArrivalsTable.truck_id, truck_id));
    if (arrivals.length) {
      await db.update(truckArrivalsTable)
        .set({ dock_id, status: "docked", actual_arrival: new Date().toISOString() })
        .where(eq(truckArrivalsTable.truck_id, truck_id));
    }
    const waitMinutes = rnd(5, 25, 0);
    res.json({ success: true, message: `Truck ${truck_id} assigned to ${dock[0].name}`, dock_id, estimated_wait_minutes: waitMinutes });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to assign dock" });
  }
});

// ── Traffic / Congestion ─────────────────────────────────────────────────────
router.get("/yard/traffic", async (_req, res) => {
  try {
    const arrivals = await db.select().from(truckArrivalsTable);
    const active = arrivals.filter(a => a.status === "arrived" || a.status === "docked").length;
    const docks = await db.select().from(docksTable);
    const availableDock = docks.find(d => d.status === "available");
    const congestionIdx = Math.min(3, Math.floor(active / 3));
    res.json({
      congestion_level: CONGESTION_LEVELS[congestionIdx],
      trucks_in_yard: active + rnd(1, 5),
      avg_wait_minutes: rnd(5, 30, 1),
      recommended_dock: availableDock?.name ?? `Dock ${rnd(1, 6)}`,
      estimated_wait_minutes: rnd(5, 20, 0),
      ai_confidence: "mock",
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to get yard traffic" });
  }
});

export default router;
