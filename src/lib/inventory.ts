import { prisma } from "./prisma";

/**
 * Calculates the available stock for a specific item within an organization.
 * Available Stock = Total Purchased Quantity - Total Sold Quantity.
 * 
 * @param itemId The ID of the item to check stock for.
 * @param organizationId The organization ID.
 * @param excludeBillId Optional bill ID to exclude from calculations (useful for editing).
 * @returns An object containing available quantity in KG and Units.
 */
export async function getAvailableStock(
    itemId: string,
    organizationId: string,
    excludeBillId?: string
) {
    const result = await prisma.billItem.findMany({
        where: {
            itemId,
            bill: {
                organizationId,
                ...(excludeBillId ? { id: { not: excludeBillId } } : {}),
            },
        },
        select: {
            quantityKg: true,
            quantityUnits: true,
            bill: {
                select: {
                    type: true,
                },
            },
        },
    });

    let totalPurchasedKg = 0;
    let totalPurchasedUnits = 0;
    let totalSoldKg = 0;
    let totalSoldUnits = 0;

    for (const bi of result) {
        if (bi.bill.type === "PURCHASE") {
            totalPurchasedKg += Number(bi.quantityKg);
            totalPurchasedUnits += Number(bi.quantityUnits);
        } else if (bi.bill.type === "SALE") {
            totalSoldKg += Number(bi.quantityKg);
            totalSoldUnits += Number(bi.quantityUnits);
        }
    }

    return {
        availableKg: Math.max(0, totalPurchasedKg - totalSoldKg),
        availableUnits: Math.max(0, totalPurchasedUnits - totalSoldUnits),
    };
}

/**
 * Batch version of getAvailableStock for multiple items.
 */
export async function getBatchAvailableStock(
    itemIds: string[],
    organizationId: string
) {
    const result = await prisma.billItem.findMany({
        where: {
            itemId: { in: itemIds },
            bill: { organizationId },
        },
        select: {
            itemId: true,
            quantityKg: true,
            quantityUnits: true,
            bill: {
                select: {
                    type: true,
                },
            },
        },
    });

    const stockMap: Record<string, { availableKg: number; availableUnits: number; purchasedKg: number; purchasedUnits: number; soldKg: number; soldUnits: number }> = {};

    for (const itemId of itemIds) {
        stockMap[itemId] = { availableKg: 0, availableUnits: 0, purchasedKg: 0, purchasedUnits: 0, soldKg: 0, soldUnits: 0 };
    }

    for (const bi of result) {
        if (!stockMap[bi.itemId]) continue;

        if (bi.bill.type === "PURCHASE") {
            stockMap[bi.itemId].purchasedKg += Number(bi.quantityKg);
            stockMap[bi.itemId].purchasedUnits += Number(bi.quantityUnits);
        } else if (bi.bill.type === "SALE") {
            stockMap[bi.itemId].soldKg += Number(bi.quantityKg);
            stockMap[bi.itemId].soldUnits += Number(bi.quantityUnits);
        }
    }

    for (const itemId of itemIds) {
        stockMap[itemId].availableKg = Math.max(0, stockMap[itemId].purchasedKg - stockMap[itemId].soldKg);
        stockMap[itemId].availableUnits = Math.max(0, stockMap[itemId].purchasedUnits - stockMap[itemId].soldUnits);
    }

    return stockMap;
}
