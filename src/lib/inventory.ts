import { prisma } from "./prisma";

/**
 * Recalculates and persists the available stock for a specific item.
 * Syncs the cached availableKg and availableUnits fields in the Item model.
 */
export async function syncItemStock(itemId: string, organizationId: string) {
    const result = await prisma.billItem.findMany({
        where: {
            itemId,
            bill: { organizationId },
        },
        select: {
            quantityKg: true,
            quantityUnits: true,
            bill: {
                select: { type: true },
            },
        },
    });

    let purchasedKg = 0;
    let purchasedUnits = 0;
    let soldKg = 0;
    let soldUnits = 0;

    for (const bi of result) {
        if (bi.bill.type === "PURCHASE") {
            purchasedKg += Number(bi.quantityKg);
            purchasedUnits += Number(bi.quantityUnits);
        } else if (bi.bill.type === "SALE") {
            soldKg += Number(bi.quantityKg);
            soldUnits += Number(bi.quantityUnits);
        }
    }

    const availableKg = Math.max(0, purchasedKg - soldKg);
    const availableUnits = Math.max(0, purchasedUnits - soldUnits);

    await prisma.item.update({
        where: { id: itemId },
        data: { availableKg, availableUnits },
    });

    return { availableKg, availableUnits };
}

/**
 * Returns the cached available stock for a specific item.
 * Falls back to live calculation if necessary, but primarily uses cached fields.
 */
export async function getAvailableStock(
    itemId: string,
    organizationId: string
) {
    const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { availableKg: true, availableUnits: true },
    });

    if (!item) return { availableKg: 0, availableUnits: 0 };

    return {
        availableKg: Number(item.availableKg),
        availableUnits: Number(item.availableUnits),
    };
}

/**
 * Batch version of getAvailableStock using cached fields.
 */
export async function getBatchAvailableStock(
    itemIds: string[],
    organizationId: string
) {
    const items = await prisma.item.findMany({
        where: { id: { in: itemIds }, organizationId },
        select: { id: true, availableKg: true, availableUnits: true },
    });

    const stockMap: Record<string, { availableKg: number; availableUnits: number }> = {};

    for (const item of items) {
        stockMap[item.id] = {
            availableKg: Number(item.availableKg),
            availableUnits: Number(item.availableUnits),
        };
    }

    // Ensure all requested IDs are in the map
    for (const id of itemIds) {
        if (!stockMap[id]) {
            stockMap[id] = { availableKg: 0, availableUnits: 0 };
        }
    }

    return stockMap;
}
