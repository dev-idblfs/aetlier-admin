# Invoice Module Testing Guide

## Pre-Deployment Testing Checklist

### 1. Component Unit Tests

#### CustomerSelector Component

```javascript
// Test 1: Renders without crashing
✓ Component renders
✓ Search input is visible
✓ "New" button is visible (if showCreateButton=true)

// Test 2: Search functionality
✓ Typing in search triggers searchCustomers callback
✓ Results display in dropdown
✓ Selecting customer calls onChange with customer object
✓ Customer object has all required fields: id, display_name, email, phone, wallet_balance

// Test 3: Create customer
✓ Clicking "New" opens modal
✓ Form fields are editable
✓ Validation works (name required)
✓ Create button calls createCustomer callback
✓ Success creates customer and selects it
✓ Error shows toast message

// Test 4: Readonly mode
✓ readonly=true shows customer info only
✓ No search input in readonly mode
✓ No "New" button in readonly mode
```

#### LineItemsTable Component

```javascript
// Test 1: Renders with items
✓ Table displays all line items
✓ All columns visible: Service, Description, Qty, Price, Tax%, Total
✓ Totals calculate correctly per row

// Test 2: Add item
✓ "Add Line Item" button visible
✓ Clicking adds new row
✓ New row has default values

// Test 3: Edit item
✓ Can edit description
✓ Can edit quantity (>= 1)
✓ Can edit unit_price (>= 0)
✓ Can edit tax_rate (0-100)
✓ Selecting service auto-fills description and price

// Test 4: Remove item
✓ Remove button visible on each row
✓ Can remove items (minimum 1 enforced)
✓ Removing item updates total

// Test 5: Readonly mode
✓ All fields are disabled
✓ No add/remove buttons
```

#### CalculationSummary Component

```javascript
// Test 1: Calculations
✓ Subtotal = sum of (quantity * unit_price) for all items
✓ Tax = sum of (subtotal * tax_rate) per item
✓ Discount (Percentage) = subtotal * (discountValue / 100)
✓ Discount (Fixed) = discountValue
✓ Total = subtotal + tax - discount - coins

// Test 2: Discount type switching
✓ Can switch between PERCENTAGE and FIXED
✓ Calculation updates correctly
✓ Values persist when switching types

// Test 3: Discount validation
✓ Fixed discount cannot exceed subtotal
✓ Percentage cannot exceed 100%
✓ Negative values not allowed

// Test 4: Display
✓ All amounts show 2 decimal places
✓ Currency symbol (₹) is correct
✓ Total is highlighted
```

#### CoinsRedemption Component

```javascript
// Test 1: Wallet display
✓ Shows available coins
✓ Shows max redeemable (50% policy)
✓ Shows policy explanation

// Test 2: Input validation
✓ Cannot exceed wallet balance
✓ Cannot exceed 50% of (subtotal - discount)
✓ Cannot be negative
✓ Error messages display

// Test 3: Apply Max button
✓ Clicking sets coins to maximum
✓ Toast confirms amount
✓ Calculation updates

// Test 4: Edge cases
✓ Wallet balance = 0: shows warning
✓ After discount = 0: shows warning
✓ No user_id: component handles gracefully
```

#### InvoiceLayout Component

```javascript
// Test 1: Layout
✓ Header displays title
✓ Invoice number shows (if provided)
✓ Status badge shows (if provided)
✓ Breadcrumbs render
✓ Back button works

// Test 2: Actions
✓ Action buttons render
✓ Buttons have correct icons
✓ onClick callbacks fire
✓ Loading states work
✓ Disabled states work

// Test 3: Status colors
✓ PAID = green
✓ UNPAID/OVERDUE = red
✓ PARTIALLY_PAID = blue
✓ DRAFT = gray
```

### 2. Integration Tests

#### Create Invoice Flow

```javascript
// Test: New invoice page with components
✓ Page loads without errors
✓ Customer search works
✓ Can create new customer
✓ Customer selection auto-fills form
✓ Can add multiple line items
✓ Service selection works
✓ Calculations are correct
✓ Can apply discount
✓ Can redeem coins (if customer has wallet)
✓ Save button creates invoice
✓ API payload matches expected format
✓ Redirects to invoice detail page
✓ Invoice appears in list
```

#### Edit Invoice Flow

```javascript
// Test: Edit existing invoice
✓ Page loads with invoice data
✓ All fields pre-filled correctly
✓ Customer name displays
✓ Line items display
✓ Calculations match original
✓ Can modify line items
✓ Can change discount
✓ Can modify coin redemption
✓ Save button updates invoice
✓ Changes reflect on detail page
✓ List page shows updated data
```

#### View Invoice Flow

```javascript
// Test: View invoice details
✓ Page loads invoice data
✓ All info displays correctly
✓ Customer info shows
✓ Line items show (readonly)
✓ Calculations display
✓ Status badge correct
✓ Action buttons work
✓ Can navigate to edit page
✓ Can download PDF
✓ Can send email
✓ Can record payment
```

### 3. API Compatibility Tests

#### Create Invoice API

```javascript
// Test: Payload structure
const payload = {
  customer_name: "Test Customer",
  customer_email: "test@example.com",
  customer_phone: "+91 1234567890",
  invoice_date: "2026-01-17",
  due_date: "2026-01-24",
  payment_terms: "NET_7",
  discount_type: "PERCENTAGE",
  discount_value: 10,
  coins_redeemed: 50,
  line_items: [
    {
      description: "Test Service",
      quantity: 2,
      unit_price: 500,
      tax_rate: 18,
    },
  ],
};

// ✓ API accepts payload
// ✓ Invoice created successfully
// ✓ Response includes invoice_number
// ✓ Calculations correct on backend
```

#### Update Invoice API

```javascript
// Test: Update payload
const payload = {
  id: "invoice-uuid",
  customer_name: "Updated Name",
  discount_value: 15,
  coins_redeemed: 100,
  line_items: [
    /* updated */
  ],
};

// ✓ API accepts payload
// ✓ Invoice updated successfully
// ✓ Changes persist
// ✓ Recalculations correct
```

### 4. Edge Case Tests

#### Null/Undefined Handling

```javascript
✓ Customer with no email
✓ Customer with no phone
✓ Invoice with no user_id (no coins)
✓ Line item with no service_id
✓ Zero discount
✓ Zero coins
✓ Empty wallet
```

#### Validation Tests

```javascript
✓ Cannot create invoice without customer
✓ Cannot create invoice without line items
✓ Cannot apply coins without user_id
✓ Cannot exceed wallet balance
✓ Cannot exceed 50% coin policy
✓ Cannot set negative values
✓ Cannot set due date before invoice date
```

#### Calculation Edge Cases

```javascript
✓ Single line item
✓ Multiple line items with different tax rates
✓ Zero price item
✓ 100% discount
✓ Fixed discount = subtotal
✓ Coins = max allowed
✓ Subtotal + tax - discount - coins = correct total
```

### 5. Cross-Browser Testing

```javascript
✓ Chrome (latest)
✓ Firefox (latest)
✓ Safari (latest)
✓ Edge (latest)
```

### 6. Responsive Design Testing

```javascript
✓ Desktop (1920x1080)
✓ Laptop (1366x768)
✓ Tablet (768x1024)
✓ Mobile (375x667)
```

### 7. Performance Tests

```javascript
✓ Customer search debounces (500ms)
✓ No unnecessary re-renders
✓ Calculations memoized
✓ Large line item list (50+ items) performs well
```

## Test Execution Plan

### Phase 1: Component Tests (Day 1)

1. Test each component in isolation
2. Verify props and callbacks
3. Check error states
4. Test readonly modes

### Phase 2: Integration Tests (Day 2)

1. Test create invoice flow
2. Test edit invoice flow
3. Test view invoice flow
4. Test with real API

### Phase 3: Compatibility Tests (Day 3)

1. Compare old vs new pages side-by-side
2. Verify identical API payloads
3. Test with existing invoice data
4. Ensure no breaking changes

### Phase 4: User Acceptance (Day 4)

1. Demo to stakeholders
2. Collect feedback
3. Fix any issues
4. Get approval

## Test Data

### Sample Customer

```javascript
{
  id: 1,
  display_name: "John Doe",
  email: "john@example.com",
  phone: "+91 9876543210",
  billing_address: "123 Main St, City",
  customer_type: "individual",
  wallet_balance: 500
}
```

### Sample Invoice

```javascript
{
  id: "uuid",
  invoice_number: "INV-2026-0001",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  user_id: "user-uuid",
  invoice_date: "2026-01-17",
  due_date: "2026-01-24",
  payment_terms: "NET_7",
  status: "DRAFT",
  discount_type: "PERCENTAGE",
  discount_value: 10,
  coins_redeemed: 100,
  line_items: [
    {
      id: 1,
      description: "Hair Cut",
      quantity: 1,
      unit_price: 500,
      tax_rate: 18
    },
    {
      id: 2,
      description: "Hair Color",
      quantity: 1,
      unit_price: 1000,
      tax_rate: 18
    }
  ]
}
```

### Expected Calculations

```javascript
// From above invoice:
Subtotal: 1500 (500 + 1000)
Tax: 270 (1500 * 0.18)
Discount: 150 (1500 * 0.10)
After Discount: 1350
Coins: 100
Total: 1520 (1500 + 270 - 150 - 100)
```

## Automated Test Script

Create `/tests/invoice-compatibility.test.js`:

```javascript
import { calculateInvoiceTotal } from "@/utils/invoice/calculations";
import {
  calculateMaxRedeemable,
  validateCoinRedemption,
} from "@/utils/invoice/coinCalculations";

describe("Invoice Calculations Compatibility", () => {
  test("calculates invoice totals correctly", () => {
    const result = calculateInvoiceTotal({
      lineItems: [
        { quantity: 1, unit_price: 500, tax_rate: 18 },
        { quantity: 1, unit_price: 1000, tax_rate: 18 },
      ],
      discountType: "PERCENTAGE",
      discountValue: 10,
      coinsRedeemed: 100,
    });

    expect(result.subtotal).toBe(1500);
    expect(result.totalTax).toBe(270);
    expect(result.discount).toBe(150);
    expect(result.total).toBe(1520);
  });

  test("enforces 50% coin redemption policy", () => {
    const max = calculateMaxRedeemable(500, 2000, 200);
    expect(max).toBe(450); // 50% of (2000 - 200) = 900, min(500, 900) = 500... wait, should be 900, but limited to wallet

    // Correct: 50% of 1800 = 900, but wallet only has 500
    expect(max).toBeLessThanOrEqual(500);
    expect(max).toBeLessThanOrEqual(900);
  });

  test("validates coin redemption", () => {
    const validation = validateCoinRedemption(600, 450, 500);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("450");
  });
});
```

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **API payloads identical to old system**
✅ **Calculations match exactly**
✅ **No breaking changes**
✅ **User approval obtained**

## Rollback Criteria

❌ **Any test fails**
❌ **API errors occur**
❌ **Data corruption**
❌ **Performance degradation**
❌ **User reports issues**

If any rollback criteria met: **IMMEDIATELY revert to old pages**

## Sign-off

- [ ] Developer tested locally
- [ ] QA tested on staging
- [ ] Product owner approved
- [ ] Stakeholders signed off
- [ ] Documentation updated
- [ ] Ready for production

---

**Remember:** The goal is to maintain 100% compatibility while adding reusability. When in doubt, favor safety over new features.
