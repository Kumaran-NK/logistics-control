import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, warehouseStockTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const DEMAND_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function mockDemandLevel(): string {
  const weights = [20, 40, 30, 10];
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return DEMAND_LEVELS[i];
  }
  return "MEDIUM";
}

router.get("/inventory", async (_req, res) => {
  try {
    const stocks = await db.select({
      id: warehouseStockTable.id,
      product_id: warehouseStockTable.product_id,
      product_name: productsTable.product_name,
      sku: productsTable.sku,
      quantity: warehouseStockTable.quantity,
      warehouse: warehouseStockTable.warehouse,
      category: productsTable.category,
      predicted_demand: warehouseStockTable.predicted_demand,
      confidence: warehouseStockTable.confidence,
      reorder_point: warehouseStockTable.reorder_point,
      unit_price: productsTable.unit_price,
      updated_at: warehouseStockTable.updated_at,
    }).from(warehouseStockTable)
      .innerJoin(productsTable, eq(warehouseStockTable.product_id, productsTable.id));

    res.json(stocks.map(s => ({
      ...s,
      updated_at: s.updated_at.toISOString(),
    })));
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const body = req.body;
    const productId = randomUUID();
    await db.insert(productsTable).values({
      id: productId,
      product_name: body.product_name,
      sku: body.sku,
      category: body.category,
      unit_price: body.unit_price,
    });

    const stockId = randomUUID();
    const inserted = await db.insert(warehouseStockTable).values({
      id: stockId,
      product_id: productId,
      warehouse: body.warehouse,
      quantity: body.quantity,
      reorder_point: body.reorder_point,
      predicted_demand: mockDemandLevel(),
      confidence: "mock",
    }).returning();

    const stock = inserted[0];
    res.status(201).json({
      id: stock.id,
      product_id: productId,
      product_name: body.product_name,
      sku: body.sku,
      quantity: stock.quantity,
      warehouse: stock.warehouse,
      category: body.category,
      predicted_demand: stock.predicted_demand,
      confidence: stock.confidence,
      reorder_point: stock.reorder_point,
      unit_price: body.unit_price,
      updated_at: stock.updated_at.toISOString(),
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

router.put("/inventory/:id", async (req, res) => {
  try {
    const { quantity, warehouse } = req.body;
    const updated = await db.update(warehouseStockTable)
      .set({
        quantity,
        warehouse: warehouse || undefined,
        predicted_demand: mockDemandLevel(),
        updated_at: new Date(),
      })
      .where(eq(warehouseStockTable.id, req.params.id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Not found" });

    const stock = updated[0];
    const product = await db.select().from(productsTable).where(eq(productsTable.id, stock.product_id));
    const p = product[0];
    res.json({
      id: stock.id,
      product_id: stock.product_id,
      product_name: p?.product_name,
      sku: p?.sku,
      quantity: stock.quantity,
      warehouse: stock.warehouse,
      category: p?.category,
      predicted_demand: stock.predicted_demand,
      confidence: stock.confidence,
      reorder_point: stock.reorder_point,
      unit_price: p?.unit_price,
      updated_at: stock.updated_at.toISOString(),
    });
  } catch (err) { console.error('API Error:', err);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

export default router;
