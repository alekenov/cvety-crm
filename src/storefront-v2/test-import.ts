// Test file to verify exports
import { Product, CartItem, OrderStatus, AddonProduct } from './types';

console.log('Types imported successfully');

const testProduct: Product = {
  id: 1,
  image: 'test',
  price: '100',
  title: 'Test',
  delivery: 'Test'
};

const testCartItem: CartItem = {
  ...testProduct,
  quantity: 1
};

export { testProduct, testCartItem };