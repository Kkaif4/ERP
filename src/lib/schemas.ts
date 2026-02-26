import { z } from "zod";

export const farmerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    mobile: z.string().length(10, "Mobile must be 10 digits").regex(/^\d+$/, "Mobile must contain only digits"),
    address: z.string().optional(),
});

export const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    mobile: z.string().length(10, "Mobile must be 10 digits").regex(/^\d+$/, "Mobile must contain only digits"),
    address: z.string().optional(),
});

export const itemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    defaultPricingMode: z.enum(["WEIGHT", "UNIT"]),
});

export const paymentSchema = z.object({
    farmerId: z.string().optional(),
    customerId: z.string().optional(),
    amount: z.number().positive("Amount must be greater than 0"),
    mode: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
    notes: z.string().optional(),
    paymentDate: z.string(),
    billId: z.string().optional(),
}).refine(data => data.farmerId || data.customerId, {
    message: "Select either a farmer or a customer",
    path: ["farmerId"],
});

export const billItemSchema = z.object({
    itemId: z.string(),
    pricingMode: z.enum(["WEIGHT", "UNIT"]),
    quantity: z.number().positive("Quantity must be positive"),
    pricePerUnit: z.number().nonnegative("Price cannot be negative"),
});

export const purchaseBillSchema = z.object({
    farmerId: z.string().min(1, "Select a farmer"),
    items: z.array(billItemSchema).min(1, "Add at least one item"),
});

export const saleBillSchema = z.object({
    customerId: z.string().min(1, "Select a customer"),
    items: z.array(billItemSchema).min(1, "Add at least one item"),
    labourCharges: z.number().nonnegative().optional(),
    freightCharges: z.number().nonnegative().optional(),
    advanceDeduction: z.number().nonnegative().optional(),
});
