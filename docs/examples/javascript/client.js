/**
 * Cvety.kz API JavaScript/TypeScript Client
 * Full-featured client for browser and Node.js
 * 
 * Installation:
 *   npm install axios
 * 
 * Usage:
 *   import { CvetyKzAPI } from './client.js';
 *   
 *   const api = new CvetyKzAPI();
 *   await api.authenticate('+77011234567', '123456');
 *   const orders = await api.getOrders({ status: 'paid' });
 */

import axios from 'axios';

/**
 * Cvety.kz API Client
 */
export class CvetyKzAPI {
  /**
   * Initialize API client
   * @param {Object} config - Configuration options
   * @param {string} config.baseURL - API base URL
   * @param {boolean} config.debug - Enable debug logging
   */
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.CVETY_API_URL || 'https://api.cvety.kz';
    this.debug = config.debug || false;
    this.token = null;
    this.tokenExpiresAt = null;
    this.shopId = null;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CvetyKz-JS-Client/1.0'
      }
    });
    
    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      
      if (this.debug) {
        console.log(`[${new Date().toISOString()}] ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    });
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Handle rate limiting
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
          await this.sleep(retryAfter * 1000);
          return this.client.request(error.config);
        }
        
        if (error.response?.status === 401 && this.token) {
          // Token expired - in production, would refresh here
          console.error('Token expired. Please re-authenticate.');
        }
        
        throw error;
      }
    );
  }
  
  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============= Authentication =============
  
  /**
   * Request OTP code
   * @param {string} phone - Phone number in format +7XXXXXXXXXX
   * @returns {Promise<Object>} Response with delivery method
   */
  async requestOTP(phone) {
    const { data } = await this.client.post('/api/auth/request-otp', { phone });
    return data;
  }
  
  /**
   * Authenticate with OTP
   * @param {string} phone - Phone number
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<string>} Access token
   */
  async authenticate(phone, otpCode) {
    const { data } = await this.client.post('/api/auth/verify-otp', {
      phone,
      otp_code: otpCode
    });
    
    this.token = data.access_token;
    this.shopId = data.shop_id;
    this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (this.debug) {
      console.log(`Authenticated successfully. Shop ID: ${this.shopId}`);
    }
    
    return this.token;
  }
  
  /**
   * Get current authenticated shop info
   * @returns {Promise<Object>} Shop information
   */
  async getMe() {
    const { data } = await this.client.get('/api/auth/me');
    return data;
  }
  
  // ============= Orders =============
  
  /**
   * Get orders list
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.search - Search term
   * @param {string} params.dateFrom - Start date ISO string
   * @param {string} params.dateTo - End date ISO string
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Orders list with pagination
   */
  async getOrders(params = {}) {
    const { data } = await this.client.get('/api/orders/', { params });
    return data;
  }
  
  /**
   * Get single order
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    const { data } = await this.client.get(`/api/orders/${orderId}`);
    return data;
  }
  
  /**
   * Create new order
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} Created order
   * 
   * @example
   * const order = await api.createOrder({
   *   customer_phone: '+77011234567',
   *   recipient_name: 'Айгуль',
   *   address: 'пр. Достык 89',
   *   delivery_method: 'delivery',
   *   flower_sum: 25000,
   *   delivery_fee: 2000,
   *   total: 27000
   * });
   */
  async createOrder(orderData) {
    const { data } = await this.client.post('/api/orders/', orderData);
    return data;
  }
  
  /**
   * Create order with items
   * @param {Object} orderData - Order with items
   * @returns {Promise<Object>} Created order
   */
  async createOrderWithItems(orderData) {
    const { data } = await this.client.post('/api/orders/with-items', orderData);
    return data;
  }
  
  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - New status
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status, comment = null) {
    const payload = { status };
    if (comment) payload.comment = comment;
    
    const { data } = await this.client.patch(`/api/orders/${orderId}/status`, payload);
    return data;
  }
  
  /**
   * Report order issue
   * @param {number} orderId - Order ID
   * @param {string} issueType - Issue type
   * @param {string} comment - Issue description
   * @returns {Promise<Object>} Updated order
   */
  async reportIssue(orderId, issueType, comment) {
    const { data } = await this.client.patch(`/api/orders/${orderId}/issue`, {
      issue_type: issueType,
      comment
    });
    return data;
  }
  
  // ============= Products =============
  
  /**
   * Get products catalog
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products list
   */
  async getProducts(params = {}) {
    const { data } = await this.client.get('/api/products/', { params });
    return data;
  }
  
  /**
   * Get single product
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProduct(productId) {
    const { data } = await this.client.get(`/api/products/${productId}`);
    return data;
  }
  
  /**
   * Create new product
   * @param {Object} productData - Product details
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    const { data } = await this.client.post('/api/products/', productData);
    return data;
  }
  
  /**
   * Update product
   * @param {number} productId - Product ID
   * @param {Object} productData - Product updates
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    const { data } = await this.client.put(`/api/products/${productId}`, productData);
    return data;
  }
  
  // ============= Customers =============
  
  /**
   * Get customers list
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Customers list
   */
  async getCustomers(params = {}) {
    const { data } = await this.client.get('/api/customers/', { params });
    return data;
  }
  
  /**
   * Get single customer
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Customer details
   */
  async getCustomer(customerId) {
    const { data } = await this.client.get(`/api/customers/${customerId}`);
    return data;
  }
  
  /**
   * Create new customer
   * @param {Object} customerData - Customer details
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    const { data } = await this.client.post('/api/customers/', customerData);
    return data;
  }
  
  /**
   * Get customer order history
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Customer orders
   */
  async getCustomerOrders(customerId) {
    const { data } = await this.client.get(`/api/customers/${customerId}/orders`);
    return data;
  }
  
  // ============= Tracking =============
  
  /**
   * Track order (public endpoint)
   * @param {string} trackingToken - Tracking token
   * @returns {Promise<Object>} Tracking information
   */
  async trackOrder(trackingToken) {
    // Create new client without auth for public endpoint
    const publicClient = axios.create({ baseURL: this.baseURL });
    const { data } = await publicClient.get(`/api/tracking/${trackingToken}`);
    return data;
  }
  
  // ============= Warehouse =============
  
  /**
   * Get warehouse inventory
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Warehouse items
   */
  async getWarehouseItems(params = {}) {
    const { data } = await this.client.get('/api/warehouse/', { params });
    return data;
  }
  
  /**
   * Create supply delivery
   * @param {Object} deliveryData - Delivery details
   * @returns {Promise<Object>} Created delivery
   */
  async createSupplyDelivery(deliveryData) {
    const { data } = await this.client.post('/api/warehouse/deliveries', deliveryData);
    return data;
  }
  
  // ============= Production =============
  
  /**
   * Get production tasks
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Tasks list
   */
  async getProductionTasks(params = {}) {
    const { data } = await this.client.get('/api/production/tasks/', { params });
    return data;
  }
  
  /**
   * Create production task
   * @param {Object} taskData - Task details
   * @returns {Promise<Object>} Created task
   */
  async createProductionTask(taskData) {
    const { data } = await this.client.post('/api/production/tasks/', taskData);
    return data;
  }
  
  /**
   * Complete production task
   * @param {number} taskId - Task ID
   * @param {Array<string>} photos - Photo URLs
   * @returns {Promise<Object>} Updated task
   */
  async completeTask(taskId, photos = []) {
    const { data } = await this.client.post(`/api/production/tasks/${taskId}/complete`, { photos });
    return data;
  }
  
  // ============= Utilities =============
  
  /**
   * Upload image file
   * @param {File|Blob} file - Image file
   * @returns {Promise<string>} Uploaded image URL
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await this.client.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return data.url;
  }
}

// ============= TypeScript Definitions =============

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} status
 * @property {string} customer_phone
 * @property {string} recipient_name
 * @property {string} address
 * @property {number} total
 * @property {string} tracking_token
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {number} retail_price
 * @property {number} current_price
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Customer
 * @property {number} id
 * @property {string} phone
 * @property {string} name
 * @property {string} email
 * @property {number} orders_count
 * @property {number} total_spent
 */

// ============= Example Usage =============

// Example for Node.js environment
if (typeof window === 'undefined') {
  // Only run in Node.js, not in browser
  
  async function example() {
    const api = new CvetyKzAPI({ debug: true });
    
    try {
      // 1. Authenticate
      console.log('=== Authentication ===');
      await api.authenticate('+77011234567', '123456');
      console.log('Authenticated!');
      
      // 2. Get orders
      console.log('\n=== Getting Orders ===');
      const orders = await api.getOrders({ status: 'paid', limit: 5 });
      console.log(`Found ${orders.total} orders`);
      orders.items.slice(0, 3).forEach(order => {
        console.log(`  Order #${order.id}: ${order.status} - ${order.total} ₸`);
      });
      
      // 3. Create order
      console.log('\n=== Creating Order ===');
      const newOrder = await api.createOrder({
        customer_phone: '+77011234567',
        recipient_name: 'Тест Айгуль',
        recipient_phone: '+77017654321',
        address: 'г. Алматы, пр. Достык 89',
        delivery_method: 'delivery',
        delivery_window: {
          from_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          to_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        },
        flower_sum: 25000,
        delivery_fee: 2000,
        total: 27000,
        comment: 'Тестовый заказ через API'
      });
      console.log(`Created order #${newOrder.id}`);
      console.log(`Tracking: ${newOrder.tracking_token}`);
      
      // 4. Track order
      console.log('\n=== Tracking Order ===');
      const tracking = await api.trackOrder(newOrder.tracking_token);
      console.log(`Status: ${tracking.status}`);
      console.log(`Updated: ${tracking.updated_at}`);
      
      // 5. Get products
      console.log('\n=== Getting Products ===');
      const products = await api.getProducts({ category: 'bouquet', is_popular: true, limit: 5 });
      console.log(`Found ${products.total} products`);
      products.items.slice(0, 3).forEach(product => {
        console.log(`  ${product.name}: ${product.current_price} ₸`);
      });
      
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
    }
  }
  
  // Run example if this file is executed directly
  if (require.main === module) {
    example();
  }
}

// Export for use in other files
export default CvetyKzAPI;