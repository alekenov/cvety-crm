"""
E2E tests for critical business paths.
"""
import pytest
from playwright.sync_api import Page, expect
from decimal import Decimal


class TestCriticalBusinessPaths:
    """Test critical business workflows end-to-end."""
    
    def test_complete_order_lifecycle(self, authenticated_page: Page, api_client, test_config):
        """Test complete order lifecycle from creation to completion."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Step 1: Create new order
        page.goto(f"{base_url}/orders/new")
        
        # Fill order form
        page.fill('input[name="customer_phone"]', "+77019876543")
        page.fill('input[name="customer_name"]', "Айгуль Жумабаева")
        page.fill('textarea[name="delivery_address"]', "пр. Достык 105, офис 310")
        page.fill('input[type="date"]', "2024-12-28")
        page.select_option('select[name="delivery_time"]', "10:00-12:00")
        
        # Add product
        page.click('button:has-text("Добавить товар")')
        page.fill('input[placeholder*="Поиск"]', "101 роза")
        page.click('[data-testid="product-101-roses"]')
        page.fill('input[name="quantity"]', "1")
        
        # Submit order
        page.click('button:has-text("Создать заказ")')
        
        # Get order ID from URL
        page.wait_for_url(lambda url: "/orders/" in url and "/new" not in url)
        order_id = page.url.split("/orders/")[1].split("/")[0]
        
        # Step 2: Process payment
        page.click('button:has-text("Отметить оплаченным")')
        page.click('button:has-text("Подтвердить")')
        
        # Verify status changed
        expect(page.locator('[data-testid="order-status"]')).to_contain_text("Оплачен")
        
        # Step 3: Assign to florist (production)
        page.goto(f"{base_url}/production")
        
        # Find order in production queue
        order_card = page.locator(f'[data-testid="production-order-{order_id}"]')
        expect(order_card).to_be_visible()
        
        # Drag to "In Progress" column
        in_progress_column = page.locator('[data-testid="production-column-in-progress"]')
        order_card.drag_to(in_progress_column)
        
        # Mark as assembled
        page.goto(f"{base_url}/orders/{order_id}")
        page.select_option('select[name="status"]', "assembled")
        page.click('button:has-text("Подтвердить")')
        
        # Step 4: Assign courier and start delivery
        page.click('button:has-text("Назначить курьера")')
        page.select_option('select[name="courier_id"]', "1")  # Select first courier
        page.click('button:has-text("Назначить")')
        
        # Update status to delivery
        page.select_option('select[name="status"]', "delivery")
        page.click('button:has-text("Подтвердить")')
        
        # Step 5: Complete delivery
        page.select_option('select[name="status"]', "completed")
        page.fill('textarea[name="delivery_notes"]', "Доставлено успешно, клиент доволен")
        page.click('button:has-text("Завершить заказ")')
        
        # Verify final status
        expect(page.locator('[data-testid="order-status"]')).to_contain_text("Завершен")
        
        # Step 6: Check tracking page shows completed
        tracking_token = page.locator('[data-testid="tracking-token"]').text_content()
        
        # Open in new context (simulate customer)
        new_context = page.context.browser.new_context()
        customer_page = new_context.new_page()
        customer_page.goto(f"{base_url}/tracking/{tracking_token}")
        
        expect(customer_page.locator('[data-testid="tracking-status"]')).to_contain_text("Завершен")
        expect(customer_page.locator('[data-testid="delivery-notes"]')).to_contain_text("успешно")
        
        new_context.close()
    
    def test_inventory_management_flow(self, authenticated_page: Page, test_config):
        """Test warehouse inventory management flow."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Navigate to warehouse
        page.goto(f"{base_url}/warehouse")
        
        # Add new inventory item
        page.click('button:has-text("Добавить товар")')
        
        # Fill inventory form
        page.fill('input[name="variety"]', "Эквадорская роза Premium")
        page.fill('input[name="height_cm"]', "80")
        page.select_option('select[name="supplier"]', "FreshFlowers KZ")
        page.fill('input[name="quantity"]', "500")
        page.fill('input[name="price_per_stem"]', "350")
        page.select_option('select[name="currency"]', "KZT")
        
        # Submit
        page.click('button:has-text("Добавить")')
        
        # Verify item added
        inventory_row = page.locator('tr:has-text("Эквадорская роза Premium")')
        expect(inventory_row).to_be_visible()
        expect(inventory_row).to_contain_text("500 шт")
        expect(inventory_row).to_contain_text("350 ₸")
        
        # Update quantity (simulate usage)
        page.click(inventory_row.locator('button:has-text("Изменить")'))
        
        quantity_input = page.locator('input[name="quantity"]')
        quantity_input.clear()
        quantity_input.fill("450")
        
        page.click('button:has-text("Сохранить")')
        
        # Verify updated
        expect(inventory_row).to_contain_text("450 шт")
        
        # Check low stock warning (if quantity < 100)
        page.click(inventory_row.locator('button:has-text("Изменить")'))
        quantity_input.clear()
        quantity_input.fill("50")
        page.click('button:has-text("Сохранить")')
        
        # Should show warning
        warning_icon = inventory_row.locator('[data-testid="low-stock-warning"]')
        expect(warning_icon).to_be_visible()
    
    def test_customer_management_flow(self, authenticated_page: Page, test_config):
        """Test customer creation and management."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Navigate to customers
        page.goto(f"{base_url}/customers")
        
        # Create new customer
        page.click('button:has-text("Новый клиент")')
        
        # Fill customer form
        page.fill('input[name="name"]', "Корпоративный клиент ТОО")
        page.fill('input[name="phone"]', "+77051234567")
        page.fill('input[name="email"]', "corporate@example.kz")
        page.fill('textarea[name="address"]', "БЦ Нурлы Тау, офис 1205")
        page.select_option('select[name="type"]', "corporate")
        page.fill('input[name="birthday"]', "1990-05-15")
        page.fill('textarea[name="preferences"]', "Предпочитает белые и кремовые цветы")
        
        # Add important date
        page.click('button:has-text("Добавить дату")')
        page.fill('input[name="date_description"]', "День рождения директора")
        page.fill('input[name="date_value"]', "03-15")  # March 15
        
        # Submit
        page.click('button:has-text("Создать")')
        
        # Verify customer created
        customer_row = page.locator('tr:has-text("Корпоративный клиент")')
        expect(customer_row).to_be_visible()
        expect(customer_row).to_contain_text("+7 (705) 123-45-67")
        
        # View customer details
        page.click(customer_row.locator('a:has-text("Подробнее")'))
        
        # Check customer profile
        expect(page.locator('h1')).to_contain_text("Корпоративный клиент")
        expect(page.locator('[data-testid="customer-type"]')).to_contain_text("Корпоративный")
        expect(page.locator('[data-testid="customer-preferences"]')).to_contain_text("белые и кремовые")
        
        # Check order history
        orders_tab = page.locator('button:has-text("История заказов")')
        orders_tab.click()
        
        # Should show empty state initially
        expect(page.locator('[data-testid="no-orders"]')).to_be_visible()
    
    def test_multi_shop_isolation(self, page: Page, api_client, test_config):
        """Test that data is properly isolated between shops."""
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Login as Shop 1
        page.goto(f"{base_url}/auth/login")
        page.fill('input[type="tel"]', "+77771234567")  # Shop 1 phone
        page.click('button:has-text("Получить код")')
        page.fill('input[placeholder*="код"]', "123456")
        page.click('button:has-text("Войти")')
        
        # Navigate to orders
        page.goto(f"{base_url}/orders")
        
        # Count Shop 1 orders
        shop1_orders = page.locator('[data-testid="order-row"]').count()
        
        # Logout
        page.click('[data-testid="user-menu"]')
        page.click('button:has-text("Выйти")')
        
        # Login as Shop 2 (different phone)
        page.goto(f"{base_url}/auth/login")
        page.fill('input[type="tel"]', "+77051234567")  # Shop 2 phone
        page.click('button:has-text("Получить код")')
        page.fill('input[placeholder*="код"]', "123456")
        page.click('button:has-text("Войти")')
        
        # Navigate to orders
        page.goto(f"{base_url}/orders")
        
        # Count Shop 2 orders
        shop2_orders = page.locator('[data-testid="order-row"]').count()
        
        # Orders should be different (isolated)
        # In test environment, Shop 2 might have no orders
        assert shop2_orders == 0 or shop2_orders != shop1_orders
        
        # Try to access Shop 1 order directly (should fail)
        if shop1_orders > 0:
            # Get first order ID from Shop 1 (would need to store from previous session)
            # This would normally return 404 or redirect
            page.goto(f"{base_url}/orders/1")
            
            # Should show error or redirect
            error_message = page.locator('[data-testid="error-message"]')
            if error_message.is_visible():
                expect(error_message).to_contain_text("Заказ не найден")
            else:
                # Or redirected to orders list
                expect(page).to_have_url(f"{base_url}/orders")