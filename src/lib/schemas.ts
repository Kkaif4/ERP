import { z } from "zod";

export const farmerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .length(10, "Mobile must be 10 digits")
    .regex(/^\d+$/, "Mobile must contain only digits"),
  address: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .length(10, "Mobile must be 10 digits")
    .regex(/^\d+$/, "Mobile must contain only digits"),
  address: z.string().optional(),
});

export const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  defaultPricingMode: z.enum(["WEIGHT", "WEIGHT_KG", "UNIT"]),
});

export const paymentSchema = z
  .object({
    farmerId: z.string().optional(),
    customerId: z.string().optional(),
    amount: z.number().positive("Amount must be greater than 0"),
    mode: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
    notes: z.string().optional(),
    paymentDate: z.string(),
    billId: z.string().optional(),
    roundOff: z.boolean().optional().default(false),
    roundOffAmount: z.number().nonnegative().optional().default(0),
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
  quantity: z.number().positive("Quantity must be positive"),
  pricePerUnit: z.number().nonnegative("Price cannot be negative"),
  quantityKg: z.number().nonnegative("KG quantity is required"),
  quantityUnits: z.number().nonnegative("Units quantity is required"),
});

export const purchaseBillSchema = z.object({
  farmerId: z.string().min(1, "Select a farmer"),
  items: z.array(billItemSchema).min(1, "Add at least one item"),
  labourCharges: z.number().nonnegative().optional(),
  freightCharges: z.number().nonnegative().optional(),
  advanceDeduction: z.number().nonnegative().optional(),
});

export const saleBillSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  items: z.array(billItemSchema).min(1, "Add at least one item"),
});

export const businessConfigSchema = z
  .object({
    taxType: z.enum(["PERCENTAGE", "FIXED"]),
    taxValue: z.number().nonnegative(),
    serviceChargeType: z.enum(["PERCENTAGE", "FIXED"]),
    serviceChargeValue: z.number().nonnegative(),
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
