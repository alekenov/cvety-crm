import { request, APIRequestContext } from '@playwright/test';
import { testData } from '../fixtures/test-data';

export class APIHelper {
  private context: APIRequestContext;
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = process.env.E2E_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  /**
   * Initialize API context
   */
  async init() {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Login and get JWT token
   */
  async login(phone: string = testData.testUser.phone, otp: string = testData.testUser.otp) {
    // Request OTP
    await this.context.post('/api/auth/request-otp', {
      data: { phone }
    });

    // Verify OTP and get token
    const response = await this.context.post('/api/auth/verify-otp', {
      data: { phone, otp_code: otp }
    });

    const data = await response.json();
    this.token = data.access_token;
    
    // Update context with auth header
    await this.context.dispose();
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
    });

    return this.token;
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: any) {
    const response = await this.context.post('/api/orders/', {
      data: orderData
    });
    return await response.json();
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string) {
    const response = await this.context.get(`/api/orders/${orderId}`);
    return await response.json();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    const response = await this.context.patch(`/api/orders/${orderId}/status`, {
      data: { status, notes }
    });
    return await response.json();
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData: any) {
    const response = await this.context.post('/api/customers/', {
      data: customerData
    });
    return await response.json();
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string) {
    const response = await this.context.get(`/api/customers/${customerId}`);
    return await response.json();
  }

  /**
   * Create warehouse item
   */
  async createWarehouseItem(itemData: any) {
    const response = await this.context.post('/api/warehouse/', {
      data: itemData
    });
    return await response.json();
  }

  /**
   * Create delivery
   */
  async createDelivery(deliveryData: any) {
    const response = await this.context.post('/api/warehouse/deliveries', {
      data: deliveryData
    });
    return await response.json();
  }

  /**
   * Get products list
   */
  async getProducts() {
    const response = await this.context.get('/api/products/');
    return await response.json();
  }

  /**
   * Create product
   */
  async createProduct(productData: any) {
    const response = await this.context.post('/api/products/', {
      data: productData
    });
    return await response.json();
  }

  /**
   * Create production task
   */
  async createProductionTask(taskData: any) {
    const response = await this.context.post('/api/production/tasks', {
      data: taskData
    });
    return await response.json();
  }

  /**
   * Get production tasks
   */
  async getProductionTasks() {
    const response = await this.context.get('/api/production/tasks');
    return await response.json();
  }

  /**
   * Check health endpoint
   */
  async checkHealth() {
    const response = await this.context.get('/health');
    return response.ok();
  }

  /**
   * Clean up
   */
  async dispose() {
    await this.context.dispose();
  }

  /**
   * Create test data for E2E tests
   */
  async setupTestData() {
    // Login first
    await this.login();

    // Create test products
    const products = [];
    for (const key in testData.products) {
      const product = testData.products[key];
      const created = await this.createProduct({
        name: product.name,
        sku: product.sku,
        price: product.price,
        category: product.category,
        available: true
      });
      products.push(created);
    }

    // Create test customers
    const customers = [];
    for (const key in testData.customers) {
      const customer = testData.customers[key];
      const created = await this.createCustomer({
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        addresses: [{
          address: customer.address,
          is_primary: true
        }],
        notes: customer.notes
      });
      customers.push(created);
    }

    // Create test warehouse items
    const warehouseItems = [];
    for (const key in testData.warehouse) {
      const item = testData.warehouse[key];
      const created = await this.createWarehouseItem({
        variety: item.variety,
        height_cm: item.heightCm,
        farm: item.farm,
        supplier: item.supplier,
        price_kzt: item.priceKzt,
        quantity: item.quantity,
        on_showcase: item.onShowcase
      });
      warehouseItems.push(created);
    }

    return {
      products,
      customers,
      warehouseItems
    };
  }
}