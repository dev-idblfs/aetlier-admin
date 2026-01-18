# Invoice Module - Backward Compatibility Guide

## ⚠️ IMPORTANT: DO NOT BREAK EXISTING FUNCTIONALITY

This document ensures that the new reusable components work seamlessly with the existing invoice system without breaking any functionality.

## Current System Analysis

### Existing Invoice Pages (DO NOT MODIFY YET)

- **New Invoice**: `/app/(dashboard)/finance/invoices/new/page.jsx` (790 lines)
- **Edit Invoice**: `/app/(dashboard)/finance/invoices/[id]/edit/page.jsx` (724 lines)
- **View Invoice**: `/app/(dashboard)/finance/invoices/[id]/page.jsx` (645 lines)
- **List Invoices**: `/app/(dashboard)/finance/invoices/page.jsx`

### Existing Redux API (DO NOT CHANGE)

- `useCreateInvoiceMutation` - Creates invoice
- `useUpdateInvoiceMutation` - Updates invoice with `{ id, ...data }`
- `useGetInvoiceQuery(id)` - Fetches single invoice
- `useGetInvoicesQuery(filters)` - Lists invoices
- `useCancelInvoiceMutation(id)` - Cancels invoice
- `useRecordInvoicePaymentMutation` - Records payment
- `useCheckDuplicateInvoicesMutation` - Checks duplicates
- `useCreateInvoiceFromAppointmentMutation(appointmentId)` - Creates from appointment
- `useLazySearchCustomersQuery` - Searches customers
- `useGetServicesQuery` - Fetches services
- `useGetUserWalletQuery(userId, options)` - Fetches user wallet
- `useGetInvoiceSettingsQuery` - Fetches settings
- `useCreateCustomerMutation` - Creates customer
- `useSendInvoiceMutation` - Sends invoice email
- `useLazyGetInvoicePdfUrlQuery` - Gets PDF URL

## Data Structure Compatibility

### Invoice Object Structure (From Backend)

```javascript
{
  id: UUID,
  invoice_number: string,
  customer_name: string,
  customer_email: string | null,
  customer_phone: string | null,
  customer_address: string | null,
  user_id: UUID | null,
  invoice_date: string (YYYY-MM-DD),
  due_date: string (YYYY-MM-DD),
  payment_terms: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60',
  status: 'DRAFT' | 'SENT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED',
  subtotal: number,
  discount_type: 'PERCENTAGE' | 'FIXED',
  discount_value: number,
  discount_amount: number,
  coins_redeemed: number,
  tax_total: number,
  grand_total: number,
  amount_paid: number,
  balance_due: number,
  customer_notes: string | null,
  terms_conditions: string | null,
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | null,
  payment_reference: string | null,
  line_items: [
    {
      id: number,
      service_id: UUID | null,
      description: string (or item_name for backward compat),
      quantity: number,
      unit_price: number,
      tax_rate: number,
      tax_amount: number,
      line_total: number
    }
  ],
  appointment_id: UUID | null,
  created_at: string,
  updated_at: string,
  paid_at: string | null
}
```

### Customer Object Structure (From Search)

```javascript
{
  id: number,
  display_name: string,
  email: string | null,
  phone: string | null,
  billing_address: object | null,
  customer_type: 'individual' | 'business',
  wallet_balance: number (for coin redemption)
}
```

### Service Object Structure

```javascript
{
  id: UUID,
  title: string,
  description: string,
  price: number,
  category: string,
  duration_minutes: number
}
```

## Component Compatibility Requirements

### 1. CustomerSelector Component

**✅ MUST Support:**

- Search using `useLazySearchCustomersQuery`
- Create using `useCreateCustomerMutation`
- Return customer object with all fields
- Handle `null` email/phone gracefully
- Support `wallet_balance` field for coin redemption

**⚠️ Important:**

```javascript
// Existing code expects customer object with these fields
const customer = {
  id,
  display_name,
  email,
  phone,
  billing_address,
  wallet_balance,
};

// Our component MUST return the same structure
<CustomerSelector
  onChange={(customer) => {
    // customer must have all expected fields
  }}
/>;
```

### 2. LineItemsTable Component

**✅ MUST Support:**

- Line items with `id`, `service_id`, `description`, `quantity`, `unit_price`, `tax_rate`
- Handle both `description` and `item_name` fields (backend uses `item_name` sometimes)
- Service selection auto-fills `description` and `unit_price`
- Support `null` service_id (manual line items)
- Return array of line items compatible with API

**⚠️ Important:**

```javascript
// Existing code structure
const lineItems = [
  {
    id: 1, // Required for React keys
    service_id: "uuid" | null,
    description: "Service name", // API expects this
    quantity: 1,
    unit_price: 100,
    tax_rate: 18,
  },
];

// Our component MUST maintain this structure
```

### 3. CalculationSummary Component

**✅ MUST Support:**

- Calculate subtotal from line items
- Support `PERCENTAGE` and `FIXED` discount types
- Handle coin redemption
- Calculate tax per line item
- Return totals compatible with API expectations

**⚠️ Important:**

```javascript
// Existing calculation logic (DO NOT BREAK)
lineItems.forEach((item) => {
  const itemTotal = item.quantity * item.unit_price;
  const itemTax = itemTotal * (item.tax_rate / 100);
  subtotal += itemTotal;
  totalTax += itemTax;
});

let discount = 0;
if (discountType === "PERCENTAGE") {
  discount = subtotal * (discountValue / 100);
} else {
  discount = discountValue;
}

const total = subtotal + totalTax - discount - coinsRedeemed;
```

### 4. CoinsRedemption Component

**✅ MUST Support:**

- Fetch wallet using `useGetUserWalletQuery(userId)`
- Enforce 50% policy: `max = Math.min(walletBalance, (subtotal - discount) * 0.5)`
- Handle `null` or `0` wallet balance
- Return coin amount as number
- Work when user_id is `null` (no coins available)

**⚠️ Important:**

```javascript
// Existing wallet fetching
const { data: walletData } = useGetUserWalletQuery(
  invoice?.user_id,
  { skip: !invoice?.user_id } // Skip if no user
);

// Our component MUST handle this pattern
```

### 5. InvoiceLayout Component

**✅ MUST Support:**

- All existing page layouts
- Status badges for all invoice statuses
- Flexible action buttons
- Back navigation
- Breadcrumbs

**⚠️ Important:**

```javascript
// Existing status values
const statuses = [
  "DRAFT",
  "SENT",
  "PENDING",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
];

// Our component MUST handle all of these
```

## API Payload Compatibility

### Create Invoice Payload (MUST MATCH)

```javascript
const payload = {
  customer_name: string, // Required
  customer_email: string | null,
  customer_phone: string | null,
  customer_address: string | null,
  user_id: UUID | null, // For coin redemption
  invoice_date: "YYYY-MM-DD",
  due_date: "YYYY-MM-DD",
  payment_terms: "DUE_ON_RECEIPT" | "NET_7" | etc,
  discount_type: "PERCENTAGE" | "FIXED",
  discount_value: number,
  coins_redeemed: number, // Must be 0 if no user_id
  customer_notes: string | null,
  terms_conditions: string | null,
  line_items: [
    {
      service_id: UUID | null,
      description: string, // Required
      quantity: number, // Required, >= 1
      unit_price: number, // Required, >= 0
      tax_rate: number, // Required, 0-100
    },
  ],
};

await createInvoice(payload).unwrap();
```

### Update Invoice Payload (MUST MATCH)

```javascript
const payload = {
  id: UUID,  // Required for mutation
  // Same fields as create, but all optional except what's being updated
  customer_name: string,
  line_items: [...],
  discount_type: 'PERCENTAGE' | 'FIXED',
  discount_value: number,
  coins_redeemed: number,
  // etc.
};

await updateInvoice(payload).unwrap();
```

## Critical Compatibility Checks

### ✅ 1. Existing API Calls MUST Work

```javascript
// DO NOT BREAK THESE PATTERNS

// Pattern 1: Create invoice
const [createInvoice] = useCreateInvoiceMutation();
await createInvoice(payload).unwrap();

// Pattern 2: Update invoice
const [updateInvoice] = useUpdateInvoiceMutation();
await updateInvoice({ id, ...data }).unwrap();

// Pattern 3: Search customers
const [searchCustomers, { data: customerResults }] =
  useLazySearchCustomersQuery();
searchCustomers(query);

// Pattern 4: Get services
const { data: servicesData } = useGetServicesQuery();
const services = servicesData || [];

// Pattern 5: Get wallet
const { data: walletData } = useGetUserWalletQuery(userId, { skip: !userId });
```

### ✅ 2. Field Name Compatibility

```javascript
// Backend sometimes uses different field names
// Our components MUST handle both

// Line items can have:
item.description || item.item_name; // Both should work

// Customer notes can be:
formData.notes || invoice.customer_notes; // Both should work
```

### ✅ 3. Null Safety

```javascript
// MUST handle null values gracefully

customer.email || "";
customer.phone || "";
customer.billing_address || "";
invoice.user_id || null;
walletData?.balance || 0;
```

### ✅ 4. Date Format

```javascript
// API expects YYYY-MM-DD format
// DO NOT change this format

invoice_date: new Date().toISOString().split("T")[0];
due_date: new Date().toISOString().split("T")[0];
```

### ✅ 5. Appointment Integration

```javascript
// Existing pages support ?appointment_id query param
// This creates invoice from appointment
// DO NOT BREAK THIS

const appointmentId = searchParams.get("appointment_id");
if (appointmentId) {
  await createFromAppointment(appointmentId).unwrap();
}
```

## Testing Checklist

### Before Refactoring Pages:

- [ ] All utility functions calculate correctly
- [ ] Components render without errors
- [ ] Components accept all required props
- [ ] Components handle null/undefined gracefully
- [ ] No TypeScript/PropTypes errors
- [ ] No console errors or warnings

### After Refactoring Each Page:

- [ ] Can create new invoice with all fields
- [ ] Can create invoice from appointment
- [ ] Customer search works
- [ ] Customer creation works
- [ ] Service selection auto-fills
- [ ] Line items add/remove works
- [ ] Calculations match exactly
- [ ] Discount (percentage/fixed) works
- [ ] Coin redemption works with 50% policy
- [ ] Invoice saves successfully
- [ ] API payload matches existing format
- [ ] Can edit existing invoice
- [ ] Can view invoice details
- [ ] Can record payment
- [ ] Can cancel invoice
- [ ] Can download PDF
- [ ] Can send email

### Compatibility Tests:

- [ ] Old invoices display correctly
- [ ] Old line items work
- [ ] Old customer data works
- [ ] All statuses display correctly
- [ ] All payment methods work
- [ ] All discount types work
- [ ] Wallet integration works
- [ ] No breaking changes to Redux state
- [ ] No breaking changes to API calls

## Migration Strategy (SAFE APPROACH)

### Phase 1: Side-by-Side (RECOMMENDED)

1. Create NEW pages using components: `/new-invoice`, `/edit-invoice-v2`
2. Test thoroughly with real data
3. Compare output with old pages
4. Verify API payloads match exactly
5. Get user approval

### Phase 2: Gradual Replacement

1. Add feature flag: `USE_NEW_INVOICE_PAGES`
2. Route to new or old pages based on flag
3. Monitor for errors
4. Collect feedback

### Phase 3: Full Migration

1. Once confirmed stable, replace old pages
2. Keep old pages as backup for 1 week
3. Delete old code only after full confidence

## Rollback Plan

### If Something Breaks:

1. Immediately revert to old pages
2. Document what broke
3. Fix components
4. Test again in Phase 1

### Code Backup:

```bash
# Before making changes
cp app/(dashboard)/finance/invoices/new/page.jsx app/(dashboard)/finance/invoices/new/page.jsx.backup
cp app/(dashboard)/finance/invoices/[id]/edit/page.jsx app/(dashboard)/finance/invoices/[id]/edit/page.jsx.backup
cp app/(dashboard)/finance/invoices/[id]/page.jsx app/(dashboard)/finance/invoices/[id]/page.jsx.backup
```

## Component Props - Exact Compatibility

### CustomerSelector

```javascript
<CustomerSelector
  value={customer} // Must accept null initially
  onChange={(customer) => {
    // customer.id, customer.display_name, etc.
  }}
  searchCustomers={async (query) => {
    // Must call useLazySearchCustomersQuery
    return await searchCustomers(query).unwrap();
  }}
  createCustomer={async (data) => {
    // Must call useCreateCustomerMutation
    return await createCustomer(data).unwrap();
  }}
/>
```

### LineItemsTable

```javascript
<LineItemsTable
  items={lineItems} // Array of line items
  onChange={setLineItems} // Must update parent state
  services={services} // Array from useGetServicesQuery
  readonly={false} // For view-only mode
/>
```

### CalculationSummary

```javascript
<CalculationSummary
  lineItems={lineItems}
  discountType={discountType} // 'PERCENTAGE' or 'FIXED'
  discountValue={discountValue} // number
  coinsRedeemed={coinsRedeemed} // number
  onDiscountTypeChange={setDiscountType}
  onDiscountValueChange={setDiscountValue}
  readonly={false}
/>
```

### CoinsRedemption

```javascript
<CoinsRedemption
  value={coinsRedeemed}
  onChange={setCoinsRedeemed}
  walletBalance={walletData?.balance || 0}
  subtotal={calculations.subtotal}
  discount={calculations.discount}
/>
```

## Summary

**DO NOT:**

- Change Redux API structure
- Change API payload format
- Change field names in payloads
- Change date formats
- Break existing functionality
- Modify existing pages until components are fully tested

**DO:**

- Test components thoroughly
- Ensure exact API compatibility
- Handle all edge cases
- Support all existing features
- Maintain null safety
- Keep backward compatibility

**GOLDEN RULE:**
If existing pages work perfectly, new components MUST produce IDENTICAL behavior and API calls.
