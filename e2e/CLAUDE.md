# E2E Tests Documentation for Claude

## Overview
Playwright E2E tests for Cvety.kz flower shop management system. Tests simulate real user interactions with the application.

## Current Status (2025-08-08)
- **Total Tests**: 67 (chromium only)
- **Pass Rate**: ~85%
- **Framework**: Playwright with TypeScript
- **Pattern**: Page Object Model (POM)

## Directory Structure
```
e2e/
├── pages/                  # Page Object classes
│   ├── LoginPage.ts        # Auth page methods
│   ├── OrdersPage.ts       # Orders management
│   ├── WarehousePage.ts    # Warehouse operations
│   └── CustomersPage.ts    # Customer CRM
├── tests/                  # Test specifications
│   ├── auth.spec.ts        # Authentication tests (6/7 passing)
│   ├── orders.spec.ts      # Orders CRUD tests (mostly passing)
│   ├── warehouse.spec.ts   # Warehouse tests
│   ├── customers.spec.ts   # Customer tests
│   └── basic-flow.spec.ts  # Smoke test (100% passing)
├── helpers/                # Utility functions
│   ├── test-helpers.ts     # Test data generators
│   ├── auth-helper.ts      # Auth flow helpers
│   └── wait-helpers.ts     # Wait utilities (NEW)
└── fixtures/               # Test data
```

## Key Improvements Made
1. **Added data-testid attributes** to React components for stable selectors
2. **Created wait-helpers.ts** with 8 utility functions
3. **Updated all Page Objects** to use data-testid selectors
4. **Improved error handling** with meaningful messages

## Test Execution Commands

### Basic Commands
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/tests/orders.spec.ts

# Run single test by line number
npx playwright test e2e/tests/orders.spec.ts:34

# Run with UI mode (interactive)
npx playwright test --ui

# Run with debug mode
npx playwright test --debug

# Run only chromium tests (faster)
npx playwright test --project=chromium

# Generate and view report
npx playwright show-report
```

### Troubleshooting Commands
```bash
# Install browsers if missing
npx playwright install

# Run with trace for debugging
npx playwright test --trace=on

# View trace file
npx playwright show-trace test-results/.../trace.zip

# Run headed (see browser)
npx playwright test --headed

# Run specific test suite
npx playwright test -g "Orders Management"
```

## Test Account
```javascript
// DEBUG mode test account (works locally)
const TEST_PHONE = '+77011234567';
const TEST_OTP = '123456'; // Any 6-digit code in DEBUG mode
```

## Page Objects Guide

### LoginPage
- `login(phone, otp)` - Complete login flow
- `logout()` - Logout user
- `isLoggedIn()` - Check auth state

### OrdersPage
- Uses data-testid selectors (stable)
- `filterByStatus()` - Filter orders
- `createCompleteOrder()` - Multi-step order creation
- `changeOrderStatus()` - Update order status
- `markIssue()` - Mark order with issue

### WarehousePage
- `quickReceiveItem()` - Fast item addition
- `updateItemPrice()` - Price management
- `getItemStock()` - Check inventory
- Uses safeFillInput() for forms

### CustomersPage  
- `addCustomer()` - Create new customer
- `searchCustomers()` - Search functionality
- `createOrderForCustomer()` - Link order to customer
- Better dialog handling with waitForDialog()

## Helper Functions (wait-helpers.ts)

```typescript
// Wait for table data
await waitForTableData(page, 'table', minRows);

// Safe input filling
await safeFillInput(page, selector, value);

// Wait for toast notification
await waitForToast(page, 'Success message');

// Retry click with scroll
await retryClick(locator, maxRetries);

// Wait for dialog
await waitForDialog(page, 'Dialog Title');

// Wait for loading to complete
await waitForLoadingComplete(page);

// Get element count safely
const count = await getElementCount(page, selector);

// Safe text extraction
const text = await safeGetText(page, selector, defaultValue);
```

## Common Test Patterns

### Authentication Before Each Test
```typescript
test.beforeEach(async ({ page }) => {
  await loginAndNavigateTo(page, '/orders', '+77011234567');
});
```

### Wait for Elements
```typescript
// Good - uses data-testid
await page.click('[data-testid="new-order-button"]');

// Bad - fragile text selector
await page.click('button:has-text("Новый заказ")');
```

### Error Handling
```typescript
const rowCount = await row.count();
if (rowCount === 0) {
  throw new Error(`Item "${itemName}" not found`);
}
```

## Known Issues & Solutions

### Issue: Rate limiting (429 errors)
**Solution**: Fixed in backend - DEBUG mode skips rate limiting

### Issue: Logout test failing
**Solution**: Added data-testid="user-menu" to header component

### Issue: Session expiry test
**Status**: Needs backend adjustment for proper 401 handling

### Issue: Multi-browser tests
**Solution**: Run with `--project=chromium` for now

## Test Data Management

### Phone Number Generator
```typescript
import { generateUniquePhone } from '../helpers/test-helpers';
const newPhone = generateUniquePhone(); // +7XXXXXXXXXX
```

### Test Cleanup
- Tests use unique phone numbers to avoid conflicts
- No manual cleanup needed (isolated test data)

## CI/CD Integration (Future)
```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npm run test:e2e
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: playwright-report
    path: playwright-report/
```

## Performance Tips
1. Use `--project=chromium` for faster execution
2. Run specific test files instead of all tests
3. Use `test.only()` when debugging single test
4. Disable other browsers in playwright.config.ts

## Debugging Failed Tests

### 1. Check screenshot
```
test-results/[test-name]/test-failed-1.png
```

### 2. View trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 3. Run in headed mode
```bash
npx playwright test --headed --project=chromium path/to/test.spec.ts
```

### 4. Use debugger
```typescript
await page.pause(); // Pauses execution
```

## Recent Changes (2025-08-08)
1. ✅ Fixed rate limiting in OTP service
2. ✅ Added data-testid to critical components
3. ✅ Created wait-helpers.ts utilities
4. ✅ Updated Page Objects with better selectors
5. ✅ Fixed auth-helper.ts for centralized login
6. ✅ Improved error messages in tests

## Next Time TODO
- Fix remaining ~15% failing tests
- Add visual regression tests
- Implement test data fixtures
- Add API mocking for stability
- Create custom test reporter
- Add parallel execution config

## Quick Test Health Check
```bash
# Run this to check current test status
npx playwright test --project=chromium --reporter=list | grep -E "(✓|✘)" | wc -l
```

## Important Files to Check
- `/e2e/TEST_REPORT.md` - Last test run results
- `/e2e/TEST_IMPROVEMENTS_REPORT.md` - Recent improvements
- `playwright.config.ts` - Test configuration
- `.env` - Make sure DEBUG=True for local testing