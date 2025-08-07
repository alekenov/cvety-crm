"""
E2E tests for order management flow.
"""
import pytest
from playwright.sync_api import Page, expect
from datetime import datetime, timedelta


class TestOrderFlow:
    """Test order creation and management workflows."""
    
    def test_create_new_order(self, authenticated_page: Page, test_config, test_data):
        """Test creating a new order from scratch."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Navigate to orders page
        page.goto(f"{base_url}/orders")
        
        # Click "New Order" button
        new_order_btn = page.locator('button:has-text("Новый заказ")')
        expect(new_order_btn).to_be_visible()
        new_order_btn.click()
        
        # Wait for order form modal/page
        page.wait_for_selector('[data-testid="order-form"]', timeout=5000)
        
        # Fill customer information
        customer_phone = page.locator('input[name="customer_phone"]')
        customer_phone.fill(test_data["customer"]["phone"])
        
        customer_name = page.locator('input[name="customer_name"]')
        customer_name.fill(test_data["customer"]["name"])
        
        # Fill delivery address
        delivery_address = page.locator('textarea[name="delivery_address"]')
        delivery_address.fill(test_data["customer"]["address"])
        
        # Select delivery date (tomorrow)
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        delivery_date = page.locator('input[type="date"]')
        delivery_date.fill(tomorrow)
        
        # Select delivery time window
        delivery_time = page.locator('select[name="delivery_time"]')
        delivery_time.select_option("14:00-16:00")
        
        # Add products to order
        add_product_btn = page.locator('button:has-text("Добавить товар")')
        add_product_btn.click()
        
        # Select product from catalog
        product_search = page.locator('input[placeholder*="Поиск товара"]')
        product_search.fill("Букет роз")
        
        # Wait for search results
        page.wait_for_selector('[data-testid="product-item"]', timeout=5000)
        
        # Select first product
        first_product = page.locator('[data-testid="product-item"]').first
        first_product.click()
        
        # Set quantity
        quantity_input = page.locator('input[name="quantity"]')
        quantity_input.fill("1")
        
        # Add notes
        notes_field = page.locator('textarea[name="notes"]')
        notes_field.fill(test_data["order"]["notes"])
        
        # Submit order
        submit_btn = page.locator('button[type="submit"]:has-text("Создать заказ")')
        expect(submit_btn).to_be_enabled()
        submit_btn.click()
        
        # Wait for success message
        success_message = page.locator('[role="alert"].success')
        expect(success_message).to_be_visible(timeout=5000)
        expect(success_message).to_contain_text("Заказ успешно создан")
        
        # Should redirect to order details
        page.wait_for_url(lambda url: "/orders/" in url, timeout=5000)
        
        # Verify order details are displayed
        order_status = page.locator('[data-testid="order-status"]')
        expect(order_status).to_contain_text("Новый")
        
        customer_info = page.locator('[data-testid="customer-info"]')
        expect(customer_info).to_contain_text(test_data["customer"]["name"])
        expect(customer_info).to_contain_text(test_data["customer"]["phone"])
    
    def test_update_order_status(self, authenticated_page: Page, api_client, test_config):
        """Test order status workflow transitions."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Create order via API first
        api_client.login()
        order_response = api_client.create_order({
            "customer_phone": "+77012345678",
            "customer_name": "Test Customer",
            "delivery_address": "Test Address",
            "delivery_date": "2024-12-27T14:00:00",
            "total": 10000,
            "items": [
                {
                    "product_name": "Test Product",
                    "quantity": 1,
                    "price": 10000
                }
            ]
        })
        
        order_id = order_response.json()["id"]
        
        # Navigate to order details
        page.goto(f"{base_url}/orders/{order_id}")
        
        # Check current status is "new"
        status_badge = page.locator('[data-testid="order-status"]')
        expect(status_badge).to_contain_text("Новый")
        
        # Change status to "paid"
        status_dropdown = page.locator('select[name="status"]')
        status_dropdown.select_option("paid")
        
        # Confirm status change
        confirm_btn = page.locator('button:has-text("Подтвердить")')
        confirm_btn.click()
        
        # Wait for status update
        page.wait_for_response(lambda response: f"/api/orders/{order_id}/status" in response.url)
        
        # Verify status changed
        expect(status_badge).to_contain_text("Оплачен")
        
        # Test status progression: paid -> assembled -> delivery -> completed
        status_transitions = [
            ("assembled", "В сборке"),
            ("delivery", "Доставка"),
            ("completed", "Завершен")
        ]
        
        for status_value, status_text in status_transitions:
            status_dropdown.select_option(status_value)
            confirm_btn.click()
            page.wait_for_response(lambda response: f"/api/orders/{order_id}/status" in response.url)
            expect(status_badge).to_contain_text(status_text)
    
    def test_order_list_filtering(self, authenticated_page: Page, api_client, test_config):
        """Test order list filtering and search."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Create multiple orders with different statuses via API
        api_client.login()
        
        orders = [
            {"status": "new", "customer_name": "Клиент 1", "total": 5000},
            {"status": "paid", "customer_name": "Клиент 2", "total": 10000},
            {"status": "assembled", "customer_name": "Клиент 3", "total": 15000},
            {"status": "delivery", "customer_name": "Клиент 4", "total": 20000},
            {"status": "completed", "customer_name": "Клиент 5", "total": 25000},
        ]
        
        for order_data in orders:
            api_client.create_order({
                "customer_phone": "+77012345678",
                "customer_name": order_data["customer_name"],
                "delivery_address": "Test Address",
                "delivery_date": "2024-12-27T14:00:00",
                "total": order_data["total"],
                "status": order_data["status"],
                "items": [{"product_name": "Test", "quantity": 1, "price": order_data["total"]}]
            })
        
        # Navigate to orders page
        page.goto(f"{base_url}/orders")
        
        # Test status filter
        status_filter = page.locator('select[name="status-filter"]')
        status_filter.select_option("paid")
        
        # Wait for filtered results
        page.wait_for_selector('[data-testid="order-row"]', timeout=5000)
        
        # Check that only "paid" orders are shown
        order_rows = page.locator('[data-testid="order-row"]')
        expect(order_rows).to_have_count(1)
        
        # Check order contains correct customer
        expect(order_rows.first).to_contain_text("Клиент 2")
        
        # Test search by customer name
        search_input = page.locator('input[placeholder*="Поиск"]')
        search_input.fill("Клиент 3")
        
        # Wait for search results
        page.wait_for_timeout(500)  # Debounce delay
        
        # Should show only one order
        expect(order_rows).to_have_count(1)
        expect(order_rows.first).to_contain_text("Клиент 3")
        
        # Clear filters
        status_filter.select_option("")
        search_input.clear()
        
        # Should show all orders
        page.wait_for_timeout(500)
        expect(order_rows.count()).to_be_greater_than_or_equal_to(5)
    
    def test_order_tracking_page(self, page: Page, api_client, test_config):
        """Test public order tracking page."""
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Create order via API
        api_client.login()
        order_response = api_client.create_order({
            "customer_phone": "+77012345678",
            "customer_name": "Tracking Test Customer",
            "delivery_address": "ул. Абая 150, кв. 25",
            "delivery_date": "2024-12-27T14:00:00",
            "total": 15000,
            "items": [{"product_name": "Букет роз", "quantity": 1, "price": 15000}]
        })
        
        tracking_token = order_response.json()["tracking_token"]
        
        # Navigate to tracking page (no authentication required)
        page.goto(f"{base_url}/tracking/{tracking_token}")
        
        # Should display order information
        expect(page.locator('h1')).to_contain_text("Отслеживание заказа")
        
        # Check customer info is partially masked
        customer_info = page.locator('[data-testid="tracking-customer"]')
        expect(customer_info).to_contain_text("Tracking Test Customer")
        
        # Phone should be masked
        phone_info = page.locator('[data-testid="tracking-phone"]')
        expect(phone_info).to_contain_text("+7 (***) ***-**-78")
        
        # Address should be partially visible
        address_info = page.locator('[data-testid="tracking-address"]')
        expect(address_info).to_contain_text("ул. Абая")
        
        # Order status should be visible
        status_info = page.locator('[data-testid="tracking-status"]')
        expect(status_info).to_contain_text("Новый")
        
        # Delivery date should be visible
        delivery_info = page.locator('[data-testid="tracking-delivery"]')
        expect(delivery_info).to_contain_text("27.12.2024")
        expect(delivery_info).to_contain_text("14:00-16:00")