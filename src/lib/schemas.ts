import { z } from "zod";

export const farmerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .length(10, "Mobile must be 10 digits")
    .regex(/^\d+$/, "Mobile must contain only digits"),
  address: z.string().optional(),
  openingBalance: z.number().nonnegative().optional().default(0),
  openingBalanceType: z.enum(["DUE", "ADVANCE"]).optional().default("DUE"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .length(10, "Mobile must be 10 digits")
    .regex(/^\d+$/, "Mobile must contain only digits"),
  address: z.string().optional(),
  openingBalance: z.number().nonnegative().optional().default(0),
  openingBalanceType: z.enum(["DUE", "ADVANCE"]).optional().default("DUE"),
});

export const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  defaultPricingMode: z.enum(["WEIGHT", "WEIGHT_KG", "UNIT"]),
});

export const paymentSchema = z
  .object({
    farmerId: z.string().optional(),
    customerId: z.string().optional(),
    amount: z.number().positive("Amount must be greater than 0").max(1000000000, "Amount too large").transform(v => Number(v.toFixed(2))),
    mode: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
    notes: z.string().optional(),
    paymentDate: z.string(),
    billId: z.string().optional(),
    roundOff: z.boolean().optional().default(false),
    roundOffAmount: z.number().nonnegative().max(1000000, "Amount too large").optional().default(0).transform(v => Number(v.toFixed(2))),
  })
  .refine((data) => data.farmerId || data.customerId, {
    message: "Select either a farmer or a customer",
    path: ["farmerId"],
  })
  .refine(
    (data) => {
      if (data.roundOff && data.roundOffAmount <= 0) return false;
      return true;
    },
    {
      message:
        "Round-off amount must be greater than 0 when round-off is enabled",
      path: ["roundOffAmount"],
    },
  );

export const billItemSchema = z.object({
  itemId: z.string(),
  pricingMode: z.enum(["WEIGHT", "WEIGHT_KG", "UNIT"]),
  quantity: z.number().positive("Quantity must be positive").max(1000000, "Quantity too large").transform(v => Number(v.toFixed(2))),
  pricePerUnit: z.number().nonnegative("Price cannot be negative").max(1000000000, "Price too large").transform(v => Number(v.toFixed(2))),
  quantityKg: z.number().nonnegative("KG quantity is required").max(1000000, "Quantity too large").transform(v => Number(v.toFixed(2))),
  quantityUnits: z.number().nonnegative("Units quantity is required").max(1000000, "Quantity too large").transform(v => Number(v.toFixed(2))),
});

export const purchaseBillSchema = z.object({
  farmerId: z.string().min(1, "Select a farmer"),
  items: z.array(billItemSchema).min(1, "Add at least one item"),
  labourCharges: z.number().nonnegative().max(1000000, "Charge too large").optional().transform(v => v ? Number(v.toFixed(2)) : undefined),
  freightCharges: z.number().nonnegative().max(1000000, "Charge too large").optional().transform(v => v ? Number(v.toFixed(2)) : undefined),
  advanceDeduction: z.number().nonnegative().max(1000000, "Deduction too large").optional().transform(v => v ? Number(v.toFixed(2)) : undefined),
  othersAmount: z.number().max(1000000, "Amount too large").optional().transform(v => v ? Number(v.toFixed(2)) : undefined),
  othersNote: z.string().optional(),
});

export const saleBillSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  items: z.array(billItemSchema).min(1, "Add at least one item"),
});

export const businessConfigSchema = z
  .object({
    taxType: z.enum(["PERCENTAGE", "FIXED"]),
    taxValue: z.number().nonnegative().max(1000000, "Value too large").transform(v => Number(v.toFixed(2))),
    serviceChargeType: z.enum(["PERCENTAGE", "FIXED"]),
    serviceChargeValue: z.number().nonnegative().max(1000000, "Value too large").transform(v => Number(v.toFixed(2))),
  })
  .refine(
    (data) => {
      if (data.taxType === "PERCENTAGE" && data.taxValue > 100) return false;
      if (
        data.serviceChargeType === "PERCENTAGE" &&
        data.serviceChargeValue > 100
      )
        return false;
      return true;
    },
    {
      message: "Percentage values cannot exceed 100%",
      path: ["taxValue"],
    },
  );

export const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    pin: z.string().optional(),
  })
  .refine((data) => data.password || data.pin, {
    message: "Password or PIN is required",
    path: ["password"],
  });

export const itemPatchSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export const staffSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
    pin: z
      .string()
      .length(4, "PIN must be 4 digits")
      .regex(/^\d+$/, "PIN must contain only digits")
      .optional()
      .or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.password || data.pin, {
    message: "Either Password or PIN must be provided",
    path: ["password"],
  });
export const expenseSchema = z.object({
  expenseDate: z.string().transform((val) => new Date(val)),
  amount: z.number().positive("Expense amount must be greater than zero"),
  paymentMode: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
  category: z.string().optional(),
  description: z.string().optional(),
});
