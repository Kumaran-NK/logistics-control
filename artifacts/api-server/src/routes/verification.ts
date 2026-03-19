import { Router } from "express";
import { db } from "@workspace/db";
import { shipmentVerificationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function mockVerify(damageProbability = 0.15): { status: string; damage: boolean } {
  const damage = Math.random() < damageProbability;
  if (damage) return { status: "damaged", damage: true };
  return { status: Math.random() > 0.08 ? "passed" : "failed", damage: false };
}

function formatVerification(v: { id: string; shipment_id: string; scan_code: string | null; verification_status: string; image_url: string | null; damage_flag: boolean; damage_description: string | null; verified_by: string | null; confidence: string; timestamp: Date }) {
  return { ...v, timestamp: v.timestamp.toISOString() };
}

router.get("/verify/list", async (_req, res) => {
  try {
    const records = await db.select().from(shipmentVerificationsTable).orderBy(shipmentVerificationsTable.timestamp);
    res.json(records.map(formatVerification));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
});

router.get("/verify/:shipmentId", async (req, res) => {
  try {
    const rows = await db.select().from(shipmentVerificationsTable)
      .where(eq(shipmentVerificationsTable.shipment_id, req.params.shipmentId));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(formatVerification(rows[rows.length - 1]));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch verification" });
  }
});

router.post("/verify/scan", async (req, res) => {
  try {
    const { shipment_id, scan_code, verified_by } = req.body;
    const { status, damage } = mockVerify(0.1);
    const inserted = await db.insert(shipmentVerificationsTable).values({
      id: randomUUID(),
      shipment_id,
      scan_code,
      verification_status: status,
      damage_flag: damage,
      verified_by: verified_by || "System",
      confidence: "mock",
    }).returning();
    res.json(formatVerification(inserted[0]));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to scan shipment" });
  }
});

router.post("/verify/photo", async (req, res) => {
  try {
    const { shipment_id, image_url, verified_by } = req.body;
    const { status, damage } = mockVerify(0.12);
    const inserted = await db.insert(shipmentVerificationsTable).values({
      id: randomUUID(),
      shipment_id,
      image_url,
      verification_status: status,
      damage_flag: damage,
      verified_by: verified_by || "System",
      confidence: "mock",
    }).returning();
    res.json(formatVerification(inserted[0]));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to photo-verify shipment" });
  }
});

router.post("/verify/report-damage", async (req, res) => {
  try {
    const { shipment_id, damage_description, verified_by } = req.body;
    const inserted = await db.insert(shipmentVerificationsTable).values({
      id: randomUUID(),
      shipment_id,
      verification_status: "damaged",
      damage_flag: true,
      damage_description,
      verified_by: verified_by || "System",
      confidence: "mock",
    }).returning();
    res.json(formatVerification(inserted[0]));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to report damage" });
  }
});

export default router;
