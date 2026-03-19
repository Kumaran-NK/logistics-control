import { Router } from "express";
import { db } from "@workspace/db";
import { driversTable, trucksTable, locationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GPS simulation: update truck locations every 5 seconds
const BASE_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "T001": { lat: 19.0760, lng: 72.8777 },
  "T002": { lat: 28.7041, lng: 77.1025 },
  "T003": { lat: 12.9716, lng: 77.5946 },
  "T004": { lat: 13.0827, lng: 80.2707 },
  "T005": { lat: 17.3850, lng: 78.4867 },
  "T006": { lat: 22.5726, lng: 88.3639 },
  "T007": { lat: 23.0225, lng: 72.5714 },
  "T008": { lat: 18.5204, lng: 73.8567 },
};

function jitter(base: number, range = 0.05) {
  return +(base + (Math.random() - 0.5) * range).toFixed(4);
}

function randomBetween(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}

// Keep in-memory location state for simulation
const locationCache: Record<string, { lat: number; lng: number; speed: number; fuel: number }> = {};

Object.entries(BASE_LOCATIONS).forEach(([id, loc]) => {
  locationCache[id] = { ...loc, speed: randomBetween(40, 90), fuel: randomBetween(40, 100) };
});

// Simulate movement every 5s
setInterval(() => {
  Object.keys(locationCache).forEach(id => {
    const loc = locationCache[id];
    locationCache[id] = {
      lat: jitter(loc.lat),
      lng: jitter(loc.lng),
      speed: randomBetween(0, 110),
      fuel: Math.max(5, loc.fuel - Math.random() * 0.3),
    };
  });
}, 5000);

router.get("/drivers", async (_req, res) => {
  try {
    const drivers = await db.select().from(driversTable);
    res.json(drivers);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

router.get("/fleet", async (_req, res) => {
  try {
    const trucks = await db.select().from(trucksTable);
    const result = trucks.map(t => {
      const loc = locationCache[t.truck_id] || { lat: 20.5937, lng: 78.9629, speed: 0, fuel: 80 };
      return {
        truck_id: t.truck_id,
        license_plate: t.license_plate,
        model: t.model,
        capacity_kg: t.capacity_kg,
        status: t.status,
        driver_id: t.driver_id,
        lat: loc.lat,
        lng: loc.lng,
        speed_kmh: loc.speed,
        fuel_pct: +loc.fuel.toFixed(1),
        last_updated: new Date().toISOString(),
      };
    });
    res.json(result);
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch fleet" });
  }
});

router.post("/fleet/assign", async (req, res) => {
  try {
    const { driver_id, truck_id } = req.body;
    await db.update(driversTable).set({ truck_id, status: "on_duty" }).where(eq(driversTable.id, driver_id));
    await db.update(trucksTable).set({ driver_id, status: "in_transit" }).where(eq(trucksTable.truck_id, truck_id));
    res.json({ success: true, message: `Driver ${driver_id} assigned to truck ${truck_id}`, driver_id, truck_id });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to assign driver" });
  }
});

export default router;
