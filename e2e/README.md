# E2E Tests Documentation

## Overview
End-to-end tests for Cvety.kz flower shop management system using Playwright.

## Setup

### Install dependencies
```bash
npm install
npx playwright install --with-deps chromium
```

### Environment Variables
Create `.env.test` file:
```env
E2E_BASE_URL=http://localhost:5173
E2E_API_URL=http://localhost:8000
E2E_HEADLESS=false
DEBUG=true
```

## Running Tests

### All tests
```bash
npm run test:e2e
```

### With UI Mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Specific test suites
```bash
npm run test:e2e:smoke      # Quick smoke tests
npm run test:e2e:critical   # Critical business paths
npm run test:e2e:headed     # Run with browser visible
```

### Debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/          # Test data and constants
│   └── test-data.ts   # Reusable test data
├── pages/            # Page Object Model
│   ├── LoginPage.ts
│   ├── OrdersPage.ts
│   └── OrderDetailsPage.ts
├── tests/            # Test specifications
│   ├── auth.spec.ts
│   ├── orders.spec.ts
│   └── tracking.spec.ts
├── utils/            # Helper utilities
│   └── api-helper.ts
└── README.md
```

## Test Coverage

### ✅ Implemented Tests

#### Authentication (auth.spec.ts)
- Login with valid credentials
- Login with invalid phone
- Login with invalid OTP
- Logout functionality
- Session persistence
- Protected route redirect

#### Orders Management (orders.spec.ts)
- Create new order
- Create order with multiple products
- Order status workflow (new → paid → assembled → delivery → completed)
- Cancel order with reason
- Search orders
- Filter orders by status
- Handle urgent orders
- Handle self-pickup orders

#### Order Tracking (tracking.spec.ts)
- Public access without authentication
- Display order status
- Mask sensitive customer data
- Show delivery progress
- Real-time status updates
- Handle invalid tracking tokens
- Mobile responsive design

### 🚧 To Be Implemented

#### Warehouse Management
- Add inventory items
- Create deliveries
- Stock movements
- Search and filter items

#### Customer Management
- Create/edit customers
- Customer order history
- Important dates reminders

#### Production (Kanban Board)
- Create production tasks
- Drag-and-drop task management
- Assign tasks to florists

## Page Objects

### LoginPage
- `login(phone?, otp?)` - Complete login flow
- `quickLogin()` - Quick login for authenticated tests
- `logout()` - Logout user
- `hasError(text?)` - Check for error message
- `hasSuccess(text?)` - Check for success message

### OrdersPage
- `createOrder(data?)` - Create new order
- `searchOrder(query)` - Search orders
- `filterByStatus(status)` - Filter by status
- `openOrder(id)` - Open order details
- `getOrderCount()` - Get visible orders count

### OrderDetailsPage
- `getStatus()` - Get current order status
- `markAsPaid()` - Mark order as paid
- `markAsAssembled()` - Mark as assembled
- `startDelivery()` - Start delivery
- `completeOrder()` - Complete order
- `cancelOrder(reason)` - Cancel with reason
- `completeFullWorkflow()` - Complete entire workflow

## Test Data

Test data is centralized in `fixtures/test-data.ts`:

```typescript
testData.testUser        // Test authentication credentials
testData.customers       // Test customer data
testData.products        // Test products
testData.orders          // Test order templates
testData.warehouse       // Test warehouse items
```

## API Helper

The `APIHelper` class provides methods for:
- Authentication and token management
- Creating test data via API
- Direct API calls for test setup
- Health checks

## Best Practices

1. **Use Page Objects**: All page interactions through page objects
2. **Data-testid attributes**: Use for reliable element selection
3. **Test isolation**: Each test should be independent
4. **Cleanup**: Tests should clean up after themselves
5. **Assertions**: Use explicit waits and assertions
6. **Error handling**: Tests should handle errors gracefully

## Debugging

### Take screenshots on failure
Configured automatically in `playwright.config.ts`

### Trace viewer
```bash
npx playwright show-trace trace.zip
```

### VS Code Extension
Install "Playwright Test for VSCode" for debugging support

## CI/CD Integration

Tests run automatically on:
- Push to main branch
- Pull requests
- Scheduled daily runs

See `.github/workflows/e2e-tests.yml` for configuration.

## Troubleshooting

### Tests fail with "Connection refused"
- Ensure backend is running: `cd backend && uvicorn app.main:app`
- Ensure frontend is running: `npm run dev`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check network conditions
- Verify selectors are correct

### Authentication fails
- Ensure DEBUG=true in backend .env
- Check Redis is running for OTP storage
- Verify test phone number format

## Contributing

1. Create test file in `e2e/tests/`
2. Follow naming convention: `feature.spec.ts`
3. Use existing page objects or create new ones
4. Update this README with new tests
5. Run locally before committing

## License
Part of Cvety.kz system - Proprietary