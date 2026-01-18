# Invoice Module - Reusable Components System

## Overview

This directory contains reusable components and utilities for the invoice management system. The components provide a consistent UI/UX across create, edit, and view pages while reducing code duplication.

## Architecture

### Components (`/components/invoice/`)

- **InvoiceLayout** - Page layout with header, breadcrumbs, and action buttons
- **CustomerSelector** - Autocomplete search with create modal
- **LineItemsTable** - Add/edit/remove line items with service dropdown
- **CalculationSummary** - Subtotal, tax, discount, coins, and total
- **CoinsRedemption** - Enhanced coin redemption with 50% policy

### Utilities (`/utils/invoice/`)

- **calculations.js** - Invoice math (subtotal, tax, discount, total)
- **coinCalculations.js** - Coin redemption calculations and validation
- **validation.js** - Zod schemas for form validation

### Hooks (`/hooks/`)

- **useDebounce.js** - Debounce hook for search inputs

## Installation

Dependencies are already installed:

```json
{
  "react-hook-form": "^7.71.1",
  "zod": "^4.3.5",
  "@hookform/resolvers": "^5.2.2"
}
```

## Components Usage

### 1. InvoiceLayout

Provides consistent page structure with header, breadcrumbs, and actions.

```jsx
import { InvoiceLayout, invoiceActions } from "@/components/invoice";

<InvoiceLayout
  title="Create Invoice"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Invoices", href: "/finance/invoices" },
    { label: "New", href: "#" },
  ]}
  actions={[
    invoiceActions.save(handleSave, isSaving),
    invoiceActions.download(handleDownload),
  ]}
  onBack={() => router.push("/finance/invoices")}
>
  {/* Page content */}
</InvoiceLayout>;
```

**Pre-built Action Buttons:**

- `invoiceActions.save(onClick, loading)` - Primary save button
- `invoiceActions.download(onClick)` - Download PDF
- `invoiceActions.print(onClick)` - Print invoice
- `invoiceActions.email(onClick)` - Email invoice
- `invoiceActions.edit(onClick)` - Edit button
- `invoiceActions.delete(onClick)` - Delete button

### 2. CustomerSelector

Autocomplete search with create modal.

```jsx
import { CustomerSelector } from "@/components/invoice";

<CustomerSelector
  value={selectedCustomer}
  onChange={setSelectedCustomer}
  onCustomerSelect={(customer) => {
    // Autofill email, phone, etc.
    console.log("Selected:", customer);
  }}
  searchCustomers={async (query) => {
    const res = await fetch(`/api/customers/search?q=${query}`);
    return res.json();
  }}
  createCustomer={async (data) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  }}
  isLoadingSearch={false}
  showCreateButton={true}
/>;
```

### 3. LineItemsTable

Editable table with service dropdown.

```jsx
import { LineItemsTable } from "@/components/invoice";

<LineItemsTable
  items={lineItems}
  onChange={setLineItems}
  services={servicesData}
  isLoadingServices={false}
  readonly={false}
  showTax={true}
/>;
```

**Features:**

- Add/remove line items
- Service dropdown auto-fills description and price
- Quantity, price, and tax rate inputs
- Calculated totals per row
- Minimum 1 item validation

### 4. CalculationSummary

Displays invoice calculations.

```jsx
import { CalculationSummary } from "@/components/invoice";

<CalculationSummary
  lineItems={lineItems}
  discountType={discountType}
  discountValue={discountValue}
  coinsRedeemed={coinsRedeemed}
  onDiscountTypeChange={setDiscountType}
  onDiscountValueChange={setDiscountValue}
  readonly={false}
  showCoins={true}
  highlightTotal={true}
/>;
```

**Calculations:**

- Subtotal (sum of line items)
- Tax (per-item tax rates)
- Discount (percentage or fixed)
- Coins redeemed
- Grand total

### 5. CoinsRedemption

Enhanced coin redemption with wallet integration.

```jsx
import { CoinsRedemption } from "@/components/invoice";

<CoinsRedemption
  value={coinsRedeemed}
  onChange={setCoinsRedeemed}
  walletBalance={customerWallet?.balance || 0}
  subtotal={subtotal}
  discount={discountAmount}
  isLoadingWallet={isLoadingWallet}
  showWalletInfo={true}
/>;
```

**Features:**

- Displays wallet balance
- Calculates max redeemable (50% policy)
- "Apply Max" button for quick redemption
- Real-time validation
- Visual policy explanation

## Utilities Usage

### Calculation Utilities

```js
import {
  calculateSubtotal,
  calculateTotalTax,
  calculateDiscount,
  calculateInvoiceTotal,
  getPaymentStatus,
} from "@/utils/invoice/calculations";

const calculations = calculateInvoiceTotal({
  lineItems: [
    { quantity: 2, unit_price: 500, tax_rate: 18 },
    { quantity: 1, unit_price: 1000, tax_rate: 18 },
  ],
  discountType: "PERCENTAGE",
  discountValue: 10,
  coinsRedeemed: 100,
});

console.log(calculations);
// {
//     subtotal: 2000,
//     totalTax: 360,
//     discount: 200,
//     coinsRedeemed: 100,
//     total: 2060,
//     afterDiscount: 1800
// }
```

### Coin Calculations

```js
import {
  calculateMaxRedeemable,
  validateCoinRedemption,
} from "@/utils/invoice/coinCalculations";

const maxCoins = calculateMaxRedeemable(
  500, // wallet balance
  2000, // subtotal
  200 // discount
);
// Returns: 450 (50% of 1800)

const validation = validateCoinRedemption(600, 450, 500);
// Returns: { valid: false, error: 'Maximum 450 coins allowed (50% policy)' }
```

### Validation Schemas

```js
import { invoiceSchema, lineItemSchema } from "@/utils/invoice/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(invoiceSchema),
  defaultValues: {
    customer_name: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
    discount_type: "PERCENTAGE",
    discount_value: 0,
    coins_redeemed: 0,
  },
});
```

## Implementation Guide

### Step 1: Refactor New Invoice Page

```jsx
// app/finance/invoices/new/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InvoiceLayout,
  CustomerSelector,
  LineItemsTable,
  CalculationSummary,
  CoinsRedemption,
  invoiceActions,
} from "@/components/invoice";
import { calculateInvoiceTotal } from "@/utils/invoice/calculations";

export default function NewInvoicePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [lineItems, setLineItems] = useState([
    {
      id: Date.now(),
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
    },
  ]);
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);
  const [coinsRedeemed, setCoinsRedeemed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const calculations = calculateInvoiceTotal({
    lineItems,
    discountType,
    discountValue,
    coinsRedeemed,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save invoice logic
      const response = await fetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customer.id,
          line_items: lineItems,
          discount_type: discountType,
          discount_value: discountValue,
          coins_redeemed: coinsRedeemed,
          total: calculations.total,
        }),
      });

      if (response.ok) {
        router.push("/finance/invoices");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <InvoiceLayout
      title="Create Invoice"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices", href: "/finance/invoices" },
        { label: "New", href: "#" },
      ]}
      actions={[invoiceActions.save(handleSave, isSaving)]}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="col-span-2 space-y-6">
          <CustomerSelector
            value={customer}
            onChange={setCustomer}
            searchCustomers={searchCustomersAPI}
            createCustomer={createCustomerAPI}
          />

          <LineItemsTable
            items={lineItems}
            onChange={setLineItems}
            services={servicesData}
          />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <CalculationSummary
            lineItems={lineItems}
            discountType={discountType}
            discountValue={discountValue}
            coinsRedeemed={coinsRedeemed}
            onDiscountTypeChange={setDiscountType}
            onDiscountValueChange={setDiscountValue}
          />

          {customer && (
            <CoinsRedemption
              value={coinsRedeemed}
              onChange={setCoinsRedeemed}
              walletBalance={customer.wallet_balance || 0}
              subtotal={calculations.subtotal}
              discount={calculations.discount}
            />
          )}
        </div>
      </div>
    </InvoiceLayout>
  );
}
```

### Step 2: Refactor Edit Page

Similar structure, just load existing invoice data:

```jsx
// app/finance/invoices/[id]/edit/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InvoiceLayout /* ... */ } from "@/components/invoice";

export default function EditInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    // Fetch invoice data
    fetchInvoice(id).then(setInvoice);
  }, [id]);

  if (!invoice) return <div>Loading...</div>;

  return (
    <InvoiceLayout
      title="Edit Invoice"
      invoiceNumber={invoice.invoice_number}
      status={invoice.status}
      breadcrumbs={
        [
          /* ... */
        ]
      }
      actions={[
        invoiceActions.save(handleUpdate, isSaving),
        invoiceActions.download(handleDownload),
      ]}
    >
      {/* Same form structure as new page */}
    </InvoiceLayout>
  );
}
```

### Step 3: Refactor View Page

Use readonly mode for components:

```jsx
// app/finance/invoices/[id]/page.jsx
"use client";

export default function ViewInvoicePage() {
  return (
    <InvoiceLayout
      title="Invoice Details"
      invoiceNumber={invoice.invoice_number}
      status={invoice.status}
      actions={[
        invoiceActions.edit(() => router.push(`/finance/invoices/${id}/edit`)),
        invoiceActions.download(handleDownload),
        invoiceActions.print(handlePrint),
        invoiceActions.email(handleEmail),
      ]}
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <CustomerSelector value={invoice.customer} readonly={true} />

          <LineItemsTable items={invoice.line_items} readonly={true} />
        </div>

        <div className="space-y-6">
          <CalculationSummary
            lineItems={invoice.line_items}
            discountType={invoice.discount_type}
            discountValue={invoice.discount_value}
            coinsRedeemed={invoice.coins_redeemed}
            readonly={true}
          />

          {/* Payment history */}
          <PaymentRecorder
            invoiceId={id}
            total={invoice.total}
            amountPaid={invoice.amount_paid}
          />
        </div>
      </div>
    </InvoiceLayout>
  );
}
```

## Benefits

1. **Code Reduction**: Reduces ~2000 lines to ~500 lines
2. **Consistency**: Same UI/UX across all pages
3. **Maintainability**: Fix bugs once, applied everywhere
4. **Reusability**: Use components in reports, statements, etc.
5. **Validation**: Centralized Zod schemas
6. **Performance**: React Hook Form reduces re-renders
7. **Type Safety**: Zod provides runtime type checking

## Testing

```js
// Test calculation utilities
import { calculateInvoiceTotal } from "@/utils/invoice/calculations";

test("calculates invoice total correctly", () => {
  const result = calculateInvoiceTotal({
    lineItems: [{ quantity: 2, unit_price: 100, tax_rate: 18 }],
    discountType: "PERCENTAGE",
    discountValue: 10,
    coinsRedeemed: 20,
  });

  expect(result.subtotal).toBe(200);
  expect(result.totalTax).toBe(36);
  expect(result.discount).toBe(20);
  expect(result.total).toBe(196); // 200 + 36 - 20 - 20
});
```

## Next Steps

1. ✅ Create utility functions
2. ✅ Create reusable components
3. ⏳ Refactor new invoice page
4. ⏳ Refactor edit invoice page
5. ⏳ Refactor view invoice page
6. ⏳ Create PaymentRecorder component
7. ⏳ Create PaymentHistory component
8. ⏳ Add comprehensive error handling
9. ⏳ Add loading states
10. ⏳ Test all flows

## Support

For questions or issues, refer to:

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [HeroUI Docs](https://heroui.com/)
