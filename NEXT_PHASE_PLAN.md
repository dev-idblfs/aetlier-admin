# 🚀 Next Phase: Invoice Page Refactoring

## ✅ Tests Completed

### Build Status

- ✅ **Next.js build**: Successful (no errors)
- ✅ **TypeScript**: No type errors
- ✅ **Components created**: All 5 components
- ✅ **Utilities created**: All 3 utility modules
- ✅ **Hook created**: useDebounce
- ✅ **Documentation**: 6 comprehensive guides

### Component Inventory

```
✅ components/invoice/InvoiceLayout.jsx
✅ components/invoice/CustomerSelector.jsx
✅ components/invoice/LineItemsTable.jsx
✅ components/invoice/CalculationSummary.jsx
✅ components/invoice/CoinsRedemption.jsx
✅ components/invoice/index.js
✅ utils/invoice/calculations.js
✅ utils/invoice/coinCalculations.js
✅ utils/invoice/validation.js
✅ hooks/useDebounce.js
```

## 📋 Phase 2: Refactor New Invoice Page

### Option 1: Safe Side-by-Side Approach (RECOMMENDED)

#### Create Test Page First

```
Create: app/(dashboard)/finance/invoices/new-v2/page.jsx
URL: /finance/invoices/new-v2
Purpose: Test new components without affecting existing page
```

**Advantages:**

- ✅ Zero risk to production
- ✅ Easy comparison
- ✅ Can switch back instantly
- ✅ Users can test both versions

**Steps:**

1. Create new-v2 directory
2. Copy structure from existing new/page.jsx
3. Replace inline code with components
4. Test thoroughly
5. Compare outputs
6. Get approval
7. Replace original

### Option 2: Direct Replacement (Higher Risk)

#### Modify Existing Page

```
Edit: app/(dashboard)/finance/invoices/new/page.jsx
Purpose: Replace inline code with components
Backup: Created automatically
```

**Advantages:**

- ✅ Faster deployment
- ✅ One page to maintain

**Disadvantages:**

- ⚠️ Changes live code
- ⚠️ Harder to compare
- ⚠️ Need to revert if issues

## 🎯 Recommended: Start with Option 1

### Step-by-Step Implementation

#### 1. Create Test Directory

```bash
mkdir -p app/(dashboard)/finance/invoices/new-v2
```

#### 2. Create New Page (Estimated: 150 lines vs 790 lines)

```jsx
// app/(dashboard)/finance/invoices/new-v2/page.jsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  InvoiceLayout,
  CustomerSelector,
  LineItemsTable,
  CalculationSummary,
  CoinsRedemption,
  invoiceActions,
} from "@/components/invoice";
import {
  useCreateInvoiceMutation,
  useLazySearchCustomersQuery,
  useGetServicesQuery,
  useGetInvoiceSettingsQuery,
  useCreateInvoiceFromAppointmentMutation,
  useCreateCustomerMutation,
} from "@/redux/services/api";
import { calculateInvoiceTotal } from "@/utils/invoice/calculations";

export default function NewInvoicePageV2() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [customer, setCustomer] = useState(null);
  const [lineItems, setLineItems] = useState([
    {
      id: Date.now(),
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
    },
  ]);
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);
  const [coinsRedeemed, setCoinsRedeemed] = useState(0);
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    payment_terms: "DUE_ON_RECEIPT",
    notes: "",
    terms_conditions: "",
  });

  // API Hooks
  const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation();
  const [searchCustomers] = useLazySearchCustomersQuery();
  const { data: servicesData } = useGetServicesQuery();
  const { data: settings } = useGetInvoiceSettingsQuery();
  const [createCustomer] = useCreateCustomerMutation();

  // Calculations
  const calculations = useMemo(() => {
    return calculateInvoiceTotal({
      lineItems,
      discountType,
      discountValue,
      coinsRedeemed,
    });
  }, [lineItems, discountType, discountValue, coinsRedeemed]);

  // Handlers
  const handleSave = async () => {
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }

    const payload = {
      customer_name: customer.display_name,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      user_id: customer.id || null,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      payment_terms: formData.payment_terms,
      discount_type: discountType,
      discount_value: discountValue,
      coins_redeemed: coinsRedeemed,
      customer_notes: formData.notes || null,
      terms_conditions: formData.terms_conditions || null,
      line_items: lineItems.map((item) => ({
        service_id: item.service_id || null,
        description: item.description,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
      })),
    };

    try {
      const result = await createInvoice(payload).unwrap();
      toast.success("Invoice created successfully");
      router.push(`/finance/invoices/${result.id}`);
    } catch (error) {
      toast.error(error.data?.detail || "Failed to create invoice");
    }
  };

  return (
    <InvoiceLayout
      title="Create Invoice (v2)"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices", href: "/finance/invoices" },
        { label: "New", href: "#" },
      ]}
      actions={[invoiceActions.save(handleSave, isSaving)]}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          <CustomerSelector
            value={customer}
            onChange={setCustomer}
            searchCustomers={async (query) => {
              const result = await searchCustomers(query).unwrap();
              return result;
            }}
            createCustomer={async (data) => {
              const result = await createCustomer(data).unwrap();
              return result;
            }}
          />

          <LineItemsTable
            items={lineItems}
            onChange={setLineItems}
            services={servicesData || []}
          />
        </div>

        {/* Right Column */}
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

#### 3. Test Checklist

```
□ Page loads without errors
□ Customer search works
□ Customer creation works
□ Line items add/remove
□ Service selection works
□ Calculations correct
□ Discount works (both types)
□ Coin redemption works
□ 50% policy enforced
□ Save creates invoice
□ API payload matches old page
□ Redirects correctly
```

#### 4. Comparison Test

```
Navigate between:
- /finance/invoices/new (old)
- /finance/invoices/new-v2 (new)

Compare:
- UI layout
- Functionality
- API calls (Network tab)
- Calculations
- Error handling
```

#### 5. Approval Process

```
□ Developer tested
□ QA tested
□ Side-by-side comparison done
□ No regressions found
□ Stakeholder approved
```

#### 6. Deployment

```
If approved:
1. Backup old page
2. Replace old with new
3. Delete new-v2 directory
4. Monitor for 24 hours
5. If stable, proceed to edit page
```

## 📊 Expected Results

### Before (Current)

```
File: app/(dashboard)/finance/invoices/new/page.jsx
Lines: 790
Components: 0 (all inline)
Reusability: None
```

### After (With Components)

```
File: app/(dashboard)/finance/invoices/new/page.jsx
Lines: ~150 (81% reduction)
Components: 5 (reusable)
Reusability: High (use in edit/view pages)
```

## 🎯 Success Metrics

### Functionality

- ✅ All existing features work
- ✅ No new bugs introduced
- ✅ API calls identical
- ✅ Calculations match

### Code Quality

- ✅ 80% less code
- ✅ Better organized
- ✅ Easier to test
- ✅ More maintainable

### User Experience

- ✅ Same UI/UX
- ✅ Same performance
- ✅ No learning curve

## 🚀 Ready to Proceed?

### Next Actions:

1. **Approve approach** - Option 1 (safe) or Option 2 (direct)?
2. **Create test page** - Start with new-v2
3. **Test thoroughly** - Follow checklist
4. **Get approval** - QA + stakeholder
5. **Deploy** - Replace old page

### Estimated Timeline:

- **Page creation**: 2-3 hours
- **Testing**: 1-2 hours
- **Comparison**: 1 hour
- **Approval**: 1 day
- **Total**: 2-3 days for first page

### After First Page Success:

- Edit page: 1-2 days
- View page: 1-2 days
- **Total project**: 1 week

## 💬 Your Decision

**Which approach would you like?**

**A) Safe Side-by-Side (Recommended)**

- Create new-v2 first
- Test without risk
- Compare outputs
- Deploy when ready

**B) Direct Replacement**

- Modify existing page
- Faster but riskier
- Need backup plan

**Reply with A or B to proceed!**
