/**
 * Invoice Validation Utilities
 */
import { z } from "zod";

/**
 * Line Item Schema
 */
export const lineItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  service_id: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price cannot be negative"),
  tax_rate: z.number().min(0).max(100, "Tax rate must be between 0-100"),
});

/**
 * Invoice Form Schema
 */
export const invoiceSchema = z
  .object({
    customer_name: z.string().min(2, "Customer name is required"),
    customer_email: z
      .string()
      .email("Invalid email")
      .or(z.literal(""))
      .optional(),
    customer_phone: z.string().optional(),
    customer_address: z.string().optional(),
    invoice_date: z.string().min(1, "Invoice date is required"),
    due_date: z.string().min(1, "Due date is required"),
    payment_terms: z.string(),
    notes: z.string().optional(),
    terms_conditions: z.string().optional(),
    discount_type: z.enum(["PERCENTAGE", "FIXED"]),
    discount_value: z.number().min(0),
    coins_redeemed: z.number().min(0),
    line_items: z
      .array(lineItemSchema)
      .min(1, "At least one line item is required"),
  })
  .refine(
    (data) => {
      // Validate due date is after invoice date
      return new Date(data.due_date) >= new Date(data.invoice_date);
    },
    {
      message: "Due date must be after invoice date",
      path: ["due_date"],
    }
  );

/**
 * Payment Recording Schema
 */
export const paymentSchema = z
  .object({
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    payment_method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"]),
    payment_date: z.string().min(1, "Payment date is required"),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate payment date is not in future
      return new Date(data.payment_date) <= new Date();
    },
    {
      message: "Payment date cannot be in the future",
      path: ["payment_date"],
    }
  );

/**
 * Customer Creation Schema
 */
export const customerSchema = z.object({
  display_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
  customer_type: z.enum(["individual", "business"]),
});

/**
 * Validate line items have unique descriptions
 */
export const validateUniqueLineItems = (lineItems) => {
  const descriptions = lineItems.map((item) => item.description.toLowerCase());
  const unique = new Set(descriptions);
  return unique.size === descriptions.length;
};

/**
 * Validate discount doesn't exceed subtotal
 */
export const validateDiscount = (subtotal, discountType, discountValue) => {
  if (discountType === "FIXED" && discountValue > subtotal) {
    return {
      valid: false,
      error: "Discount cannot exceed subtotal",
    };
  }
  if (discountType === "PERCENTAGE" && discountValue > 100) {
    return {
      valid: false,
      error: "Discount percentage cannot exceed 100%",
    };
  }
  return { valid: true };
};

/**
 * Validate payment amount doesn't exceed balance
 */
export const validatePaymentAmount = (amount, balanceDue) => {
  if (amount > balanceDue) {
    return {
      valid: false,
      error: `Payment cannot exceed balance due (${balanceDue.toFixed(2)})`,
    };
  }
  return { valid: true };
};
