import React, { useState, useMemo } from "react";
import { ProductSearch } from "./ProductSearch";
import { ProductTable } from "./ProductTable";
import { StockSummary } from "./StockSummary";
import { InventoryPage } from "./InventoryPage";
import { ProductDetailPage } from "./ProductDetailPage";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Package,
  ClipboardList,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
  deliveryDate: string;
  costPrice?: number;
  discount?: number;
  history?: ProductHistoryEntry[];
}

interface ProductHistoryEntry {
  id: string;
  date: string;
  type:
    | "receipt"
    | "sale"
    | "writeoff"
    | "order"
    | "adjustment";
  quantity: number;
  description: string;
  orderId?: string;
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Роза красная",
    quantity: 25,
    price: 850,
    category: "Розы",
    minQuantity: 10,
    deliveryDate: "2025-08-10",
    costPrice: 650,
    discount: 0,
    history: [
      {
        id: "1-1",
        date: "2025-08-10",
        type: "receipt",
        quantity: 50,
        description: "Поставка от поставщика",
      },
      {
        id: "1-2",
        date: "2025-08-11",
        type: "sale",
        quantity: -15,
        description: "Продажа розничная",
      },
      {
        id: "1-3",
        date: "2025-08-12",
        type: "order",
        quantity: -10,
        description: "Заказ №33434",
        orderId: "33434",
      },
    ],
  },
  {
    id: "2",
    name: "Роза белая",
    quantity: 8,
    price: 850,
    category: "Розы",
    minQuantity: 10,
    deliveryDate: "2025-08-08",
    costPrice: 650,
    discount: 10,
    history: [
      {
        id: "2-1",
        date: "2025-08-08",
        type: "receipt",
        quantity: 30,
        description: "Поставка от поставщика",
      },
      {
        id: "2-2",
        date: "2025-08-09",
        type: "sale",
        quantity: -12,
        description: "Продажа розничная",
      },
      {
        id: "2-3",
        date: "2025-08-10",
        type: "writeoff",
        quantity: -2,
        description: "Списание: увядшие",
      },
      {
        id: "2-4",
        date: "2025-08-11",
        type: "order",
        quantity: -8,
        description: "Заказ №33421",
        orderId: "33421",
      },
    ],
  },
  {
    id: "3",
    name: "Роза розовая",
    quantity: 0,
    price: 850,
    category: "Розы",
    minQuantity: 10,
    deliveryDate: "2025-08-05",
    costPrice: 650,
    discount: 0,
    history: [
      {
        id: "3-1",
        date: "2025-08-05",
        type: "receipt",
        quantity: 25,
        description: "Поставка от поставщика",
      },
      {
        id: "3-2",
        date: "2025-08-08",
        type: "order",
        quantity: -20,
        description: "Заказ №33410",
        orderId: "33410",
      },
      {
        id: "3-3",
        date: "2025-08-10",
        type: "sale",
        quantity: -5,
        description: "Продажа розничная",
      },
    ],
  },
  {
    id: "4",
    name: "Тюльпан желтый",
    quantity: 45,
    price: 450,
    category: "Тюльпаны",
    minQuantity: 15,
    deliveryDate: "2025-08-12",
    costPrice: 320,
    discount: 0,
    history: [
      {
        id: "4-1",
        date: "2025-08-12",
        type: "receipt",
        quantity: 100,
        description: "Поставка от поставщика",
      },
      {
        id: "4-2",
        date: "2025-08-12",
        type: "order",
        quantity: -35,
        description: "Заказ №33440",
        orderId: "33440",
      },
      {
        id: "4-3",
        date: "2025-08-12",
        type: "sale",
        quantity: -20,
        description: "Продажа розничная",
      },
    ],
  },
  {
    id: "5",
    name: "Тюльпан красный",
    quantity: 12,
    price: 450,
    category: "Тюльпаны",
    minQuantity: 15,
    deliveryDate: "2025-08-11",
    costPrice: 320,
    discount: 5,
    history: [
      {
        id: "5-1",
        date: "2025-08-11",
        type: "receipt",
        quantity: 40,
        description: "Поставка от поставщика",
      },
      {
        id: "5-2",
        date: "2025-08-11",
        type: "sale",
        quantity: -18,
        description: "Продажа розничная",
      },
      {
        id: "5-3",
        date: "2025-08-12",
        type: "order",
        quantity: -10,
        description: "Заказ №33433",
        orderId: "33433",
      },
    ],
  },
  {
    id: "6",
    name: "Лилия белая",
    quantity: 5,
    price: 1200,
    category: "Лилии",
    minQuantity: 8,
    deliveryDate: "2025-08-09",
    costPrice: 900,
    discount: 0,
    history: [
      {
        id: "6-1",
        date: "2025-08-09",
        type: "receipt",
        quantity: 12,
        description: "Поставка от поставщика",
      },
      {
        id: "6-2",
        date: "2025-08-10",
        type: "order",
        quantity: -5,
        description: "Заказ №33425",
        orderId: "33425",
      },
      {
        id: "6-3",
        date: "2025-08-11",
        type: "sale",
        quantity: -2,
        description: "Продажа розничная",
      },
    ],
  },
  {
    id: "7",
    name: "Хризантема",
    quantity: 30,
    price: 680,
    category: "Хризантемы",
    minQuantity: 12,
    deliveryDate: "2025-08-11",
    costPrice: 480,
    discount: 0,
    history: [
      {
        id: "7-1",
        date: "2025-08-11",
        type: "receipt",
        quantity: 50,
        description: "Поставка от поставщика",
      },
      {
        id: "7-2",
        date: "2025-08-11",
        type: "sale",
        quantity: -15,
        description: "Продажа розничная",
      },
      {
        id: "7-3",
        date: "2025-08-12",
        type: "order",
        quantity: -5,
        description: "Заказ №33444",
        orderId: "33444",
      },
    ],
  },
  {
    id: "8",
    name: "Гипсофила",
    quantity: 2,
    price: 560,
    category: "Зелень",
    minQuantity: 5,
    deliveryDate: "2025-08-07",
    costPrice: 380,
    discount: 15,
    history: [
      {
        id: "8-1",
        date: "2025-08-07",
        type: "receipt",
        quantity: 10,
        description: "Поставка от поставщика",
      },
      {
        id: "8-2",
        date: "2025-08-08",
        type: "order",
        quantity: -6,
        description: "Заказ №33415",
        orderId: "33415",
      },
      {
        id: "8-3",
        date: "2025-08-10",
        type: "writeoff",
        quantity: -2,
        description: "Списание: поврежденные",
      },
    ],
  },
  {
    id: "9",
    name: "Эвкалипт",
    quantity: 15,
    price: 510,
    category: "Зелень",
    minQuantity: 8,
    deliveryDate: "2025-08-10",
    costPrice: 350,
    discount: 0,
    history: [
      {
        id: "9-1",
        date: "2025-08-10",
        type: "receipt",
        quantity: 25,
        description: "Поставка от поставщика",
      },
      {
        id: "9-2",
        date: "2025-08-11",
        type: "order",
        quantity: -8,
        description: "Заказ №33430",
        orderId: "33430",
      },
      {
        id: "9-3",
        date: "2025-08-12",
        type: "sale",
        quantity: -2,
        description: "Продажа розничная",
      },
    ],
  },
  {
    id: "10",
    name: "Пионы",
    quantity: 0,
    price: 1700,
    category: "Пионы",
    minQuantity: 6,
    deliveryDate: "2025-08-06",
    costPrice: 1400,
    discount: 20,
    history: [
      {
        id: "10-1",
        date: "2025-08-06",
        type: "receipt",
        quantity: 15,
        description: "Поставка от поставщика",
      },
      {
        id: "10-2",
        date: "2025-08-07",
        type: "order",
        quantity: -10,
        description: "Заказ №33400",
        orderId: "33400",
      },
      {
        id: "10-3",
        date: "2025-08-08",
        type: "sale",
        quantity: -3,
        description: "Продажа розничная",
      },
      {
        id: "10-4",
        date: "2025-08-10",
        type: "writeoff",
        quantity: -2,
        description: "Списание: истек срок",
      },
    ],
  },
  {
    id: "11",
    name: "Гвоздика розовая",
    quantity: 22,
    price: 400,
    category: "Гвоздики",
    minQuantity: 10,
    deliveryDate: "2025-08-12",
    costPrice: 280,
    discount: 0,
    history: [
      {
        id: "11-1",
        date: "2025-08-12",
        type: "receipt",
        quantity: 40,
        description: "Поставка от поставщика",
      },
      {
        id: "11-2",
        date: "2025-08-12",
        type: "order",
        quantity: -12,
        description: "Заказ №33445",
        orderId: "33445",
      },
      {
        id: "11-3",
        date: "2025-08-12",
        type: "sale",
        quantity: -6,
        description: "Продажа розничная",
      },
    ],
  },
  {
    id: "12",
    name: "Альстромерия",
    quantity: 18,
    price: 620,
    category: "Альстромерии",
    minQuantity: 10,
    deliveryDate: "2025-08-09",
    costPrice: 450,
    discount: 0,
    history: [
      {
        id: "12-1",
        date: "2025-08-09",
        type: "receipt",
        quantity: 30,
        description: "Поставка от поставщика",
      },
      {
        id: "12-2",
        date: "2025-08-10",
        type: "order",
        quantity: -10,
        description: "Заказ №33428",
        orderId: "33428",
      },
      {
        id: "12-3",
        date: "2025-08-11",
        type: "sale",
        quantity: -2,
        description: "Продажа розничная",
      },
    ],
  },
];

export default function App() {
  const [products, setProducts] =
    useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState<
    "main" | "inventory" | "product-detail"
  >("main");
  const [selectedProductId, setSelectedProductId] = useState<
    string | null
  >(null);

  const updateQuantity = (id: string, newQuantity: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, quantity: Math.max(0, newQuantity) }
          : product,
      ),
    );
  };

  const updateProduct = (
    id: string,
    updates: Partial<Product>,
  ) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, ...updates }
          : product,
      ),
    );
  };

  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const resetStock = () => {
    setProducts(initialProducts);
  };

  const handleDelivery = () => {
    // TODO: Открыть модальное окно для добавления поставки товаров
    console.log("Поставка");
  };

  const handleInventory = () => {
    setCurrentPage("inventory");
  };

  const handleBackToMain = () => {
    setCurrentPage("main");
    setSelectedProductId(null);
  };

  const handleShowProductDetail = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentPage("product-detail");
  };

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === null ||
        product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Показать страницу инвентаризации
  if (currentPage === "inventory") {
    return (
      <InventoryPage
        products={products}
        onUpdateProducts={updateProducts}
        onBack={handleBackToMain}
      />
    );
  }

  // Показать детальную страницу товара
  if (currentPage === "product-detail" && selectedProductId) {
    const selectedProduct = products.find(
      (p) => p.id === selectedProductId,
    );
    if (selectedProduct) {
      return (
        <ProductDetailPage
          product={selectedProduct}
          onUpdateProduct={updateProduct}
          onBack={handleBackToMain}
        />
      );
    }
  }

  // Основная страница
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-xl">Склад</h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDelivery}
              variant="outline"
              size="sm"
              className="h-12 md:h-10 px-5 md:px-4 text-base"
            >
              <Package className="mr-2 h-5 w-5 md:h-4 md:w-4" />
              Поставка
            </Button>
            <Button
              onClick={handleInventory}
              variant="outline"
              size="sm"
              className="h-12 md:h-10 px-5 md:px-4 text-base"
            >
              <ClipboardList className="mr-2 h-5 w-5 md:h-4 md:w-4" />
              Инвентаризация
            </Button>
            <Button
              onClick={resetStock}
              variant="outline"
              size="sm"
              className="h-12 md:h-10 px-5 md:px-4 text-base"
            >
              <RotateCcw className="mr-2 h-5 w-5 md:h-4 md:w-4" />
              Сброс
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <ProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      </div>

      {/* Product Table */}
      <div className="mb-8">
        <ProductTable
          products={filteredProducts}
          onUpdateQuantity={updateQuantity}
          onUpdateProduct={updateProduct}
          onShowProductDetail={handleShowProductDetail}
        />
      </div>

      {/* Stock Summary */}
      <StockSummary products={products} />
    </div>
  );
}