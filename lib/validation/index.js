import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+?[0-9\s-]{10,}$/, 'Invalid phone number');

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const requiredString = (label) => z.string().min(1, `${label} is required`);

export const requiredNumber = (label) => z.number({ invalid_type_error: `${label} must be a number` }).min(0, `${label} must be positive`);

/** API often returns null; Zod .optional() only accepts undefined. */
const nullToEmptyString = (val) => (val == null ? '' : String(val));

const nullToOptionalString = (val) => {
    if (val == null || val === '') return undefined;
    return String(val);
};

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
    accepts_online_consultation: z.boolean().default(false),
    can_prescribe: z.boolean().default(false),
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
export const namedAmountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.coerce.number().min(0, 'Amount must be zero or greater'),
});

export const contentBlockSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['text', 'list']),
    body: z.string().optional(),
    items: z.array(z.string()).default([]),
    sort_order: z.coerce.number().min(0).default(0),
});

export const serviceSchema = z.object({
    name: requiredString('Service Name'),
    category_id: requiredString('Category'),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    duration: z.coerce.number().min(1, 'Duration is required'),
    base_price: z.coerce.number().min(0).optional(),
    selling_price: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    fees: z.array(namedAmountSchema).default([]),
    content_blocks: z.array(contentBlockSchema).default([]),
    image_url: z.string().optional().or(z.literal('')),
    is_active: z.boolean().default(true),
}).refine(
    (data) => (data.selling_price ?? 0) > 0 || (data.price ?? 0) > 0,
    {
        message: 'Selling price is required',
        path: ['selling_price'],
    }
);

// Role schemas
export const roleSchema = z.object({
    name: requiredString('Role Name'),
    description: z.string().optional(),
    grants_admin_portal: z.boolean().default(false),
    prefer_admin_redirect_on_login: z.boolean().default(false),
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
    customer_id: z.preprocess(nullToOptionalString, z.string().optional()),
    customer_name: z.preprocess(
        nullToEmptyString,
        z.string().min(1, 'Customer Name is required')
    ),
    customer_email: z.preprocess(
        nullToEmptyString,
        z.union([emailSchema, z.literal('')])
    ),
    customer_phone: z.preprocess(
        nullToEmptyString,
        z.union([phoneSchema, z.literal('')])
    ),
    customer_address: z.preprocess(
        (val) => {
            if (val == null || val === '') return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
        },
        z.string().optional()
    ),
    invoice_date: z.preprocess(
        nullToEmptyString,
        z.string().min(1, 'Invoice Date is required')
    ),
    due_date: z.preprocess(
        nullToEmptyString,
        z.string().min(1, 'Due Date is required')
    ),
    payment_terms: z.preprocess(
        (val) => (val == null || val === '' ? 'DUE_ON_RECEIPT' : String(val)),
        z.string()
    ),
    notes: z.preprocess(nullToEmptyString, z.string().optional()),
    terms_conditions: z.preprocess(nullToEmptyString, z.string().optional()),
    discount_type: z.enum(['PERCENTAGE', 'FIXED']),
    discount_value: z.coerce.number().min(0),
    coins_redeemed: z.coerce.number().min(0),
    line_items: z.array(z.object({
        id: z.union([z.string(), z.number()]).optional(),
        service_id: z.preprocess(
            (val) => (val == null || val === '' ? null : String(val)),
            z.string().nullable().optional()
        ),
        description: z.preprocess(
            nullToEmptyString,
            z.string().min(1, 'Description is required')
        ),
        quantity: z.coerce.number().min(1),
        unit_price: z.coerce.number().min(0),
        tax_rate: z.coerce.number().min(0),
    })).min(1, 'At least one line item is required'),
});

// Payment schema (static; RecordPaymentModal uses buildPaymentSchema with max amount)
export const paymentSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    payment_method: z.enum([
        'CASH',
        'CARD',
        'UPI',
        'BANK_TRANSFER',
        'PAYTM',
        'OTHER',
    ]),
    notes: z.string().optional(),
});

export const buildPaymentSchema = (maxAmount) =>
    paymentSchema.extend({
        amount: z.coerce
            .number()
            .min(0.01, 'Amount must be greater than 0')
            .max(maxAmount, `Amount cannot exceed ${maxAmount}`),
    });

// Auth / login
export const loginSchema = z.object({
    email: emailSchema,
    password: requiredString('Password'),
});

// Platform tenant onboard (control plane)
export const platformTenantOnboardSchema = z
    .object({
        slug: z
            .string()
            .min(2, 'Slug must be at least 2 characters')
            .max(63, 'Slug must be at most 63 characters')
            .regex(
                /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
                'Lowercase alphanumeric with optional - or _'
            ),
        name: requiredString('Clinic name'),
        data_plane_mode: z.enum(['hosted', 'byo']),
        database_url: z.string().optional().or(z.literal('')),
        admin_email: emailSchema,
        admin_name: z.string().max(255).optional().or(z.literal('')),
        market: z.string().optional().or(z.literal('')),
        default_currency: z.string().optional().or(z.literal('')),
        timezone: z.string().optional().or(z.literal('')),
        country: z.string().optional().or(z.literal('')),
        plan_tier: z.string().optional().or(z.literal('')),
    })
    .superRefine((data, ctx) => {
        if (data.data_plane_mode === 'byo' && !data.database_url?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Database URL is required for BYO mode',
                path: ['database_url'],
            });
        }
    });

// Lead admin update (matches LeadUpdate backend schema)
export const leadUpdateSchema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']),
    interest: z.string().max(255, 'Interest must be 255 characters or less').optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    scheduled_call_at: z.string().optional().or(z.literal('')),
});

// Navigation item (settings)
export const navigationItemSchema = z.object({
    label: requiredString('Label'),
    href: z.string().optional(),
    icon: z.string().optional(),
    permission: z.string().optional(),
    sort_order: z.coerce.number().min(0).optional(),
    is_active: z.boolean().default(true),
});

// Quick user create (list modal)
export const quickUserSchema = z.object({
    first_name: requiredString('First Name'),
    last_name: z.string().optional().or(z.literal('')),
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
});

// WhatsApp integration settings
export const whatsAppIntegrationSchema = z
    .object({
        whatsapp_enabled: z.boolean(),
        whatsapp_phone_number_id: z.string().optional().or(z.literal('')),
        whatsapp_business_account_id: z.string().optional().or(z.literal('')),
        whatsapp_access_token: z.string().optional().or(z.literal('')),
        whatsapp_verify_token: z.string().optional().or(z.literal('')),
        whatsapp_app_secret: z.string().optional().or(z.literal('')),
    })
    .superRefine((data, ctx) => {
        if (data.whatsapp_enabled && !data.whatsapp_phone_number_id?.trim()) {
            ctx.addIssue({
                code: 'custom',
                message: 'Phone number ID is required when WhatsApp is enabled',
                path: ['whatsapp_phone_number_id'],
            });
        }
    });

export const permissionCreateSchema = z.object({
    name: z
        .string()
        .min(1, 'Permission name is required')
        .regex(
            /^[a-z]+\.[a-z]+(\.[a-z]+)?$/,
            'Permission must be in format: resource.action or resource.action.scope'
        ),
    description: z.string().optional().or(z.literal('')),
});

export const invoiceCustomerQuickSchema = z.object({
    display_name: requiredString('Customer name'),
    customer_type: z.enum(['individual', 'business']).default('individual'),
    email: z.union([emailSchema, z.literal('')]).optional(),
    phone: phoneSchema.optional().or(z.literal('')),
    billing_address_line1: z.string().optional().or(z.literal('')),
    billing_address_line2: z.string().optional().or(z.literal('')),
    billing_city: z.string().optional().or(z.literal('')),
    billing_state: z.string().optional().or(z.literal('')),
    billing_pincode: z.string().optional().or(z.literal('')),
});

export const customerListModalSchema = z.object({
    display_name: requiredString('Display name'),
    email: z.union([emailSchema, z.literal('')]).optional(),
});
