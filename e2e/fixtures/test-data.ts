export const testData = {
  // Test user for authentication (works in DEBUG mode)
  testUser: {
    phone: '+77011234567',
    otp: '123456',
    name: 'Тестовый менеджер'
  },

  // Test customers
  customers: {
    regular: {
      phone: '+77019876543',
      name: 'Айгуль Жумабаева',
      email: 'aigul@example.com',
      address: 'пр. Достык 105, офис 310',
      notes: 'Постоянный клиент, предпочитает розы'
    },
    new: {
      phone: '+77077654321',
      name: 'Марат Султанов',
      email: 'marat@example.com',
      address: 'ул. Абая 50, кв. 12',
      notes: 'Новый клиент'
    },
    vip: {
      phone: '+77052223344',
      name: 'Гульнара Байжанова',
      email: 'gulnara@example.com',
      address: 'ул. Аль-Фараби 77, БЦ Esentai Tower',
      notes: 'VIP клиент, важные даты: 8 марта, 15 мая'
    }
  },

  // Test products
  products: {
    roses101: {
      name: '101 роза',
      sku: 'ROSE-101',
      price: 65000,
      category: 'Премиум букеты',
      quantity: 1
    },
    tulips25: {
      name: '25 тюльпанов',
      sku: 'TULIP-25',
      price: 12000,
      category: 'Весенние букеты',
      quantity: 2
    },
    mixedBouquet: {
      name: 'Микс сезонный',
      sku: 'MIX-SEASON',
      price: 25000,
      category: 'Авторские букеты',
      quantity: 1
    }
  },

  // Test orders
  orders: {
    regular: {
      notes: 'Доставить после 14:00, позвонить за час',
      deliveryDate: 'tomorrow',
      deliveryTime: '14:00-16:00',
      paymentMethod: 'cash'
    },
    urgent: {
      notes: 'СРОЧНО! Доставить до 12:00',
      deliveryDate: 'today',
      deliveryTime: '10:00-12:00',
      paymentMethod: 'card'
    },
    pickup: {
      notes: 'Самовывоз, будут после 18:00',
      deliveryDate: 'tomorrow',
      deliveryTime: '18:00-20:00',
      paymentMethod: 'transfer'
    }
  },

  // Test warehouse items
  warehouse: {
    rose: {
      variety: 'Роза Red Naomi',
      heightCm: 60,
      farm: 'Эквадор Premium',
      supplier: 'FlowerImport KZ',
      priceKzt: 500,
      quantity: 500,
      onShowcase: true
    },
    tulip: {
      variety: 'Тюльпан Strong Gold',
      heightCm: 40,
      farm: 'Голландия',
      supplier: 'Dutch Flowers',
      priceKzt: 300,
      quantity: 200,
      onShowcase: true
    }
  },

  // Test delivery for warehouse
  delivery: {
    invoiceNumber: 'INV-2024-001',
    supplier: 'FlowerImport KZ',
    deliveryDate: 'today',
    positions: [
      {
        variety: 'Роза Freedom',
        quantity: 100,
        pricePerUnit: 450,
        currency: 'KZT'
      },
      {
        variety: 'Хризантема Белая',
        quantity: 50,
        pricePerUnit: 250,
        currency: 'KZT'
      }
    ]
  },

  // Test production tasks
  production: {
    task: {
      orderId: null, // Will be set dynamically
      florist: 'Анна Флорист',
      priority: 'high',
      notes: 'Особое внимание к оформлению'
    }
  },

  // Test settings
  settings: {
    company: {
      name: 'Cvety.kz Test',
      phone: '+77011111111',
      address: 'г. Алматы, ул. Тестовая 1',
      email: 'test@cvety.kz'
    },
    user: {
      name: 'Новый менеджер',
      phone: '+77099999999',
      role: 'manager'
    }
  }
};

// Helper to get tomorrow's date
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Helper to get today's date
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper to format phone for display
export const formatPhone = (phone: string): string => {
  // +77011234567 -> +7 (701) 123-45-67
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
  }
  return phone;
};

// Helper to generate tracking token
export const generateTrackingToken = (): string => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};