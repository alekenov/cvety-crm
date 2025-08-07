# E2E Testing Guide for Cvety.kz

## Overview

This project uses Playwright for end-to-end testing, providing comprehensive coverage of critical business workflows. Tests are written in Python and can run against both local and production environments.

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Install Playwright browsers
playwright install chromium

# Or use Make command
make -f Makefile.e2e install
```

### Running Tests

```bash
# Run all tests locally
make -f Makefile.e2e test

# Run smoke tests
make -f Makefile.e2e test-smoke

# Run against Railway deployment
make -f Makefile.e2e test-railway

# Run with UI (debug mode)
make -f Makefile.e2e test-debug
```

## Test Structure

```
backend/tests/e2e/
├── conftest.py              # Pytest fixtures and configuration
├── pytest.ini               # Pytest settings
├── run_tests.py            # Test runner script
├── test_auth_flow.py       # Authentication tests
├── test_order_flow.py      # Order management tests
└── test_critical_paths.py  # Critical business workflows
```

## Test Categories

### Smoke Tests (`@pytest.mark.smoke`)
Quick tests that verify basic functionality:
- Login/logout
- Create simple order
- View order list
- Access main pages

### Critical Path Tests (`@pytest.mark.critical`)
Complete business workflows:
- Full order lifecycle (create → pay → deliver → complete)
- Inventory management flow
- Customer management
- Multi-shop data isolation

### Component Tests
- **Authentication**: Login, logout, session management
- **Orders**: CRUD operations, status transitions, filtering
- **Tracking**: Public order tracking pages
- **Warehouse**: Inventory management, stock warnings
- **Customers**: Customer profiles, order history

## Configuration

### Environment Variables

```bash
# Test environment
E2E_BASE_URL=http://localhost:5173      # Frontend URL
E2E_API_URL=http://localhost:8000       # Backend API URL
E2E_USE_RAILWAY=false                   # Use Railway deployment

# Browser settings
E2E_HEADLESS=false                      # Run in headless mode
E2E_SLOW_MO=0                           # Milliseconds between actions
E2E_TIMEOUT=30000                       # Default timeout in ms

# Test account (works in DEBUG mode)
TEST_PHONE=+77011234567
TEST_OTP=123456
```

### Test Data

Test account for local development:
- Phone: `+77011234567`
- OTP Code: `123456` (any 6-digit code in DEBUG mode)

## Writing Tests

### Basic Test Structure

```python
import pytest
from playwright.sync_api import Page, expect

class TestFeatureName:
    def test_specific_scenario(self, page: Page, test_config):
        # Arrange
        page.goto(f"{test_config.BASE_URL}/page")
        
        # Act
        page.fill('input[name="field"]', "value")
        page.click('button:has-text("Submit")')
        
        # Assert
        expect(page.locator('.success')).to_be_visible()
        expect(page).to_have_url("/success")
```

### Using Fixtures

```python
def test_authenticated_action(authenticated_page: Page):
    """Test that requires login."""
    page = authenticated_page  # Already logged in
    page.goto("/protected-page")
    # ... test logic

def test_with_api(api_client, test_config):
    """Test using API client."""
    api_client.login()
    response = api_client.create_order({...})
    assert response.status_code == 201
```

### Page Object Pattern (Optional)

```python
class OrdersPage:
    def __init__(self, page: Page):
        self.page = page
        
    def create_order(self, data):
        self.page.click('button:has-text("New Order")')
        self.page.fill('input[name="customer_name"]', data["name"])
        # ... more actions
        
    def get_order_count(self):
        return self.page.locator('[data-testid="order-row"]').count()
```

## Best Practices

### 1. Use Data Attributes for Testing

```html
<!-- In your React components -->
<button data-testid="submit-order">Submit Order</button>
<div data-testid="order-status">Paid</div>
```

```python
# In tests
page.click('[data-testid="submit-order"]')
expect(page.locator('[data-testid="order-status"]')).to_contain_text("Paid")
```

### 2. Wait for Elements Properly

```python
# Good - explicit wait
page.wait_for_selector('[data-testid="loaded"]')

# Good - expect with timeout
expect(page.locator('.result')).to_be_visible(timeout=5000)

# Avoid - hard-coded sleep
time.sleep(5)  # Don't do this
```

### 3. Test Isolation

```python
@pytest.fixture(autouse=True)
def reset_database():
    """Reset test data before each test."""
    # Setup
    yield
    # Teardown - clean up test data
```

### 4. Meaningful Assertions

```python
# Good - specific assertion
expect(page.locator('.order-total')).to_contain_text("25,000 ₸")

# Less helpful
assert page.locator('.order-total').text_content() is not None
```

## Running in CI/CD

### GitHub Actions

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Daily schedule (2 AM UTC)
- Manual trigger

### Railway Deployment Tests

```bash
# Run tests against Railway
E2E_USE_RAILWAY=true python backend/tests/e2e/run_tests.py --railway --headless
```

## Debugging Failed Tests

### 1. Run in Debug Mode

```bash
# Slow mode with visible browser
make -f Makefile.e2e test-debug

# Or specific test
pytest backend/tests/e2e/test_auth_flow.py::TestAuthenticationFlow::test_login_with_valid_credentials -v --headed --slowmo 500
```

### 2. Take Screenshots

```python
# In your test
page.screenshot(path="debug-screenshot.png")

# Automatic on failure (in conftest.py)
@pytest.fixture(autouse=True)
def screenshot_on_failure(page, request):
    yield
    if request.node.rep_call.failed:
        page.screenshot(path=f"screenshots/{request.node.name}.png")
```

### 3. View Browser Console

```python
# Enable console logging
page.on("console", lambda msg: print(f"Browser: {msg.text}"))
```

### 4. Trace Viewer

```python
# Start tracing
context.tracing.start(screenshots=True, snapshots=True)

# Your test code here

# Stop and save trace
context.tracing.stop(path="trace.zip")

# View trace
# playwright show-trace trace.zip
```

## Common Issues

### Issue: Tests fail with timeout

**Solution**: Increase timeout or check if servers are running
```python
page.wait_for_selector('.element', timeout=10000)  # 10 seconds
```

### Issue: Different behavior in headless mode

**Solution**: Some sites detect headless mode
```python
browser = playwright.chromium.launch(
    args=['--disable-blink-features=AutomationControlled']
)
```

### Issue: Authentication state not preserved

**Solution**: Save and reuse storage state
```python
# Save state after login
context.storage_state(path="auth.json")

# Reuse in other tests
context = browser.new_context(storage_state="auth.json")
```

### Issue: Flaky tests

**Solutions**:
1. Add proper waits
2. Use more specific selectors
3. Check for race conditions
4. Run tests sequentially for debugging

## Performance Tips

### 1. Parallel Execution

```bash
# Run tests in parallel
pytest -n 4  # 4 workers

# Or with make
make -f Makefile.e2e test-parallel
```

### 2. Reuse Authentication

```python
@pytest.fixture(scope="session")
def authenticated_context():
    # Login once, reuse for all tests
    ...
```

### 3. Smart Test Selection

```bash
# Run only changed tests
pytest --lf  # last failed

# Run tests matching pattern
pytest -k "order"  # tests with "order" in name
```

## Monitoring & Reporting

### HTML Reports

```bash
# Generate HTML report
make -f Makefile.e2e test-report

# View report
open test-report.html
```

### Allure Reports (Optional)

```bash
# Install allure
pip install allure-pytest

# Run with allure
pytest --alluredir=allure-results

# Generate report
allure generate allure-results -o allure-report
```

### Integration with Monitoring

- Set up alerts for failed tests in production
- Track test execution time trends
- Monitor flaky test patterns

## Future Improvements

1. **Visual Regression Testing**
   - Add screenshot comparison tests
   - Use tools like `playwright-expect` or `percy`

2. **Performance Testing**
   - Measure page load times
   - Track API response times
   - Monitor memory usage

3. **Accessibility Testing**
   - Add automated a11y checks
   - Test keyboard navigation
   - Verify ARIA attributes

4. **Cross-browser Testing**
   - Extend to Firefox and Safari
   - Test on mobile viewports
   - Add browser-specific test cases

5. **Data-driven Testing**
   - Parameterized tests with multiple datasets
   - Generate test data dynamically
   - Test edge cases systematically

## Resources

- [Playwright Python Documentation](https://playwright.dev/python/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Best Practices for E2E Testing](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/python/docs/debug)