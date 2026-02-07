import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+?[0-9\s-]{10,}$/, 'Invalid phone number');

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const requiredString = (label) => z.string().min(1, `${label} is required`);

export const requiredNumber = (label) => z.number({ invalid_type_error: `${label} must be a number` }).min(0, `${label} must be positive`);

// Doctor specific schemas
export const doctorSchema = z.object({
    first_name: requiredString('First Name'),
    last_name: requiredString('Last Name'),
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
    qualifications: z.array(z.string()),
    bio: z.string().optional(),
    consultation_fee: z.coerce.number().min(0).optional(),
    experience_years: z.coerce.number().min(0).optional(),
    languages: z.array(z.string()),
    is_active: z.boolean().default(true),
});

// User schemas
export const userSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    first_name: requiredString('First Name'),
    last_name: requiredString('Last Name'),
    phone: phoneSchema.optional().or(z.literal('')),
    user_type: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']),
    is_active: z.boolean().default(true),
    is_verified: z.boolean().default(false),
});

export const userUpdateSchema = userSchema.extend({
    password: passwordSchema.optional().or(z.literal('')),
});

// Category schemas
export const categorySchema = z.object({
    name: requiredString('Category Name'),
    description: z.string().optional(),
    parent_id: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    is_active: z.boolean().default(true),
});

// Service schemas
export const serviceSchema = z.object({
    name: requiredString('Service Name'),
    category: requiredString('Category'),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    duration: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    is_active: z.boolean().default(true),
});

// Role schemas
export const roleSchema = z.object({
    name: requiredString('Role Name'),
    description: z.string().optional(),
});

// Appointment schemas
export const appointmentSchema = z.object({
    patient_name: requiredString('Patient Name'),
    patient_email: emailSchema,
    patient_phone: phoneSchema.optional().or(z.literal('')),
    service_id: z.string().optional(),
    doctor_id: z.string().optional(),
    preferred_date: requiredString('Date'),
    preferred_time: requiredString('Time'),
    special_notes: z.string().optional(),
});

export const appointmentUpdateSchema = z.object({
    preferred_date: requiredString('Date'),
    preferred_time: requiredString('Time'),
    special_notes: z.string().optional(),
});

// Expense schemas
export const expenseSchema = z.object({
    category_id: requiredString('Category'),
    vendor: z.string().optional(),
    description: requiredString('Description'),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    tax_amount: z.coerce.number().min(0).optional(),
    expense_date: requiredString('Date'),
    payment_method: z.string(),
    payment_status: z.string(),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
    is_recurring: z.boolean().default(false),
});

// Customer schemas
export const customerSchema = z.object({
    first_name: requiredString('First Name'),
    last_name: z.string().optional(),
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    customer_type: z.enum(['individual', 'business']),
    company_name: z.string().optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    billing_address: z.string().optional(),
    shipping_address: z.string().optional(),
    payment_terms: z.string(),
});

// Settings schema
export const settingsSchema = z.object({
    clinicName: z.string().optional(),
    clinicEmail: emailSchema.optional().or(z.literal('')),
    clinicPhone: phoneSchema.optional().or(z.literal('')),
    clinicAddress: z.string().optional(),
    emailNotifications: z.boolean().default(true),
    appointmentReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
    smsNotifications: z.boolean().default(true),
    darkMode: z.boolean().default(false),
    compactView: z.boolean().default(false),
    showAnimations: z.boolean().default(true),
    twoFactorAuth: z.boolean().default(false),
    sessionTimeout: z.coerce.number().min(1).default(30),
    invoicePrefix: z.string().optional(),
    invoiceStartNumber: z.coerce.number().min(1).default(1001),
    defaultPaymentTerms: z.string().default('DUE_ON_RECEIPT'),
    defaultTaxRate: z.coerce.number().min(0).default(0),
    companyGstNumber: z.string().optional(),
    companyPanNumber: z.string().optional(),
    invoiceFooterNotes: z.string().optional(),
    showGstBreakdown: z.boolean().default(true),
    autoSendInvoice: z.boolean().default(false),
});

// Invoice schema
export const invoiceSchema = z.object({
    customer_id: z.string().optional(),
    customer_name: requiredString('Customer Name'),
    customer_email: emailSchema.optional().or(z.literal('')),
    customer_phone: phoneSchema.optional().or(z.literal('')),
    customer_address: z.string().optional(),
    invoice_date: requiredString('Invoice Date'),
    due_date: requiredString('Due Date'),
    payment_terms: z.string(),
    notes: z.string().optional(),
    terms_conditions: z.string().optional(),
    discount_type: z.enum(['PERCENTAGE', 'FIXED']),
    discount_value: z.coerce.number().min(0),
    coins_redeemed: z.coerce.number().min(0),
    line_items: z.array(z.object({
        id: z.string().optional(),
        service_id: z.string().nullable().optional(),
        description: requiredString('Description'),
        quantity: z.coerce.number().min(1),
        unit_price: z.coerce.number().min(0),
        tax_rate: z.coerce.number().min(0),
    })).min(1, 'At least one line item is required'),
});

// Payment schema
export const paymentSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    payment_method: z.string().min(1, 'Payment method is required'),
    payment_date: requiredString('Payment Date'),
    notes: z.string().optional(),
});
