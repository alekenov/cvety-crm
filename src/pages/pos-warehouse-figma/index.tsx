import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { ProductSearch } from "@/pos-warehouse-figma/ProductSearch";
import { ProductTable } from "@/pos-warehouse-figma/ProductTable";
import { InventoryPage } from "@/pos-warehouse-figma/InventoryPage";
import { ProductDetailPage } from "@/pos-warehouse-figma/ProductDetailPage";
import { DeliveryPage } from "@/pos-warehouse-figma/DeliveryPage";
import { Button } from "@/components/ui/button";
import { Package, ClipboardList } from "lucide-react";
import { toast } from "sonner";

// Import Figma styles
import "@/pos-warehouse-figma/styles/globals.css";

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
  sku?: string;
  batchCode?: string;
  farm?: string;
  supplier?: string;
}

interface ProductHistoryEntry {
  id: string;
  date: string;
  type: "receipt" | "sale" | "writeoff" | "order" | "adjustment";
  quantity: number;
  description: string;
  orderId?: string;
}

export function POSWarehouseFigmaPage() {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"warehouse" | "inventory" | "detail" | "delivery">(
    productId ? "detail" : "warehouse"
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(productId || null);
  const queryClient = useQueryClient();

  // Sync URL parameters with local state
  useEffect(() => {
    if (location.pathname === "/warehouse/inventory") {
      setCurrentView("inventory");
      setSelectedProductId(null);
    } else if (location.pathname === "/warehouse/in") {
      setCurrentView("delivery");
      setSelectedProductId(null);
    } else if (productId) {
      setSelectedProductId(productId);
      setCurrentView("detail");
    } else {
      setSelectedProductId(null);
      setCurrentView("warehouse");
    }
  }, [productId, location.pathname]);

  // Load products from API
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["warehouse-products-figma"],
    queryFn: async () => {
      const response = await api.get("/warehouse/", {
        params: { limit: 100 }
      });
      return response.data.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.variety || item.product?.name || item.name || "Без названия",
        quantity: item.quantity || item.qty || 0,
        price: item.price || item.product?.price || 0,
        category: item.product?.category || "Другое",
        minQuantity: item.min_quantity || 15,
        deliveryDate: item.delivery_date || item.last_updated || new Date().toISOString(),
        costPrice: item.cost || item.product?.cost_price,
        discount: 0,
        history: []
      }));
    }
  });

  // Load single product for detail view
  const { data: singleProduct, isLoading: isLoadingSingleProduct } = useQuery({
    queryKey: ["warehouse-product", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await api.get(`/warehouse/${selectedProductId}`);
      return {
        id: response.data.id.toString(),
        name: response.data.variety || response.data.name || "Без названия",
        quantity: response.data.qty || 0,
        price: response.data.price || 0,
        category: "Другое", // Set default category
        minQuantity: 15,
        deliveryDate: response.data.delivery_date || response.data.created_at || new Date().toISOString(),
        costPrice: response.data.cost || 0,
        discount: 0,
        sku: response.data.sku,
        batchCode: response.data.batch_code,
        farm: response.data.farm,
        supplier: response.data.supplier,
        history: []
      };
    },
    enabled: !!selectedProductId && currentView === "detail"
  });

  // Update product quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await api.patch(`/warehouse/${id}`, { quantity: quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-products-figma"] });
      toast.success("Количество обновлено");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка обновления количества");
    }
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const handleProductClick = (productId: string) => {
    navigate(`/warehouse/${productId}`);
  };

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ id: productId, quantity: newQuantity });
  };

  const handleProductUpdate = async (productId: string, updates: Partial<Product>) => {
    try {
      const updateData: any = {};
      
      if (updates.price !== undefined) {
        updateData.price = updates.price;
      }
      if (updates.minQuantity !== undefined) {
        updateData.min_quantity = updates.minQuantity;
      }
      if (updates.costPrice !== undefined) {
        updateData.cost = updates.costPrice;
      }
      if (updates.discount !== undefined) {
        // For now, we don't have a discount field in the backend
        // This would need to be added to the warehouse model
        console.log("Discount update not implemented in backend yet:", updates.discount);
      }
      
      await api.patch(`/warehouse/${productId}`, updateData);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["warehouse-products-figma"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-product", productId] });
      
      toast.success("Товар обновлен");
    } catch (error: any) {
      console.error("Product update error:", error.response?.data);
      toast.error("Ошибка обновления товара");
    }
  };

  // Load product movements history
  const { data: productMovements = [] } = useQuery({
    queryKey: ["warehouse-movements", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const response = await api.get(`/warehouse/${selectedProductId}/movements`);
      const movements = response.data.items || [];
      
      // Convert movements to history format
      return movements.map((m: any) => ({
        id: m.id.toString(),
        date: m.created_at,
        type: m.type === 'in' ? 'receipt' : m.type === 'out' ? 'sale' : 'adjustment',
        quantity: m.quantity,
        description: m.description || m.reference_type || 'Движение товара'
      }));
    },
    enabled: !!selectedProductId && currentView === "detail"
  });

  // Show inventory page
  if (currentView === "inventory") {
    return (
      <InventoryPage
        products={products}
        onUpdateProducts={async (updatedProducts) => {
          // Bulk update for inventory
          const changedProducts = updatedProducts.filter((p, index) => {
            const original = products[index];
            return original && p.quantity !== original.quantity;
          });

          if (changedProducts.length === 0) {
            toast.info("Нет изменений для сохранения");
            return;
          }

          try {
            // Update each changed product
            const updatePromises = changedProducts.map(async (product) => {
              const original = products.find(p => p.id === product.id);
              const difference = product.quantity - (original?.quantity || 0);
              
              if (difference !== 0) {
                // Use adjust-stock endpoint for inventory adjustments
                return api.post(`/warehouse/${product.id}/adjust-stock`, {
                  adjustment: difference,
                  reason: `Инвентаризация: корректировка с ${original?.quantity || 0} на ${product.quantity}`,
                  created_by: "inventory_system"
                });
              }
            });

            await Promise.all(updatePromises.filter(Boolean));
            
            queryClient.invalidateQueries({ queryKey: ["warehouse-products-figma"] });
            toast.success(`Инвентаризация завершена. Обновлено товаров: ${changedProducts.length}`);
            navigate("/warehouse");
          } catch (error: any) {
            console.error("Inventory error:", error.response?.data);
            toast.error("Ошибка при проведении инвентаризации");
          }
        }}
        onBack={() => navigate("/warehouse")}
      />
    );
  }

  // Show product detail page
  if (currentView === "detail" && selectedProductId) {
    if (isLoadingSingleProduct) {
      return (
        <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto flex items-center justify-center">
          <div>Загрузка...</div>
        </div>
      );
    }
    
    if (singleProduct) {
      const productWithHistory = { ...singleProduct, history: productMovements };
      
      return (
        <ProductDetailPage
          product={productWithHistory}
          onUpdateProduct={handleProductUpdate}
          onBack={() => navigate("/warehouse")}
        />
      );
    }
    
    // Product not found
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto flex items-center justify-center">
        <div>Товар не найден</div>
      </div>
    );
  }

  // Show delivery page
  if (currentView === "delivery") {
    return (
      <DeliveryPage
        products={products}
        onUpdateProducts={async (updatedProducts) => {
          // For delivery page, updatedProducts contains the delivery items
          console.log("Delivery products:", updatedProducts);
          
          // Filter only items with quantity > 0
          const itemsToDeliver = updatedProducts.filter(p => p.quantity > 0);
          
          if (itemsToDeliver.length > 0) {
            // Format positions according to API schema
            const positions = itemsToDeliver.map(p => ({
              variety: p.name,
              height_cm: 50, // Default height for flowers
              qty: p.quantity,
              cost_per_stem: p.costPrice || p.price || 0
            }));
            
            try {
              const response = await api.post("/warehouse/deliveries", {
                supplier: "Поставщик",
                farm: "Ферма",
                delivery_date: new Date().toISOString(),
                currency: "KZT",
                rate: 1.0,
                comment: "Поставка из POS Склад",
                positions: positions
              });
              
              queryClient.invalidateQueries({ queryKey: ["warehouse-products-figma"] });
              toast.success("Поставка создана успешно");
              navigate("/warehouse");
            } catch (error: any) {
              console.error("Delivery error:", error.response?.data);
              let errorMessage = "Ошибка создания поставки";
              
              // Handle specific error types
              if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                  if (detail.includes('UNIQUE constraint failed')) {
                    errorMessage = "Ошибка создания партии товара. Попробуйте еще раз.";
                  } else if (detail.includes('required field')) {
                    errorMessage = "Не все обязательные поля заполнены";
                  } else if (detail.includes('Invalid')) {
                    errorMessage = "Проверьте правильность введенных данных";
                  } else {
                    errorMessage = detail;
                  }
                }
              } else if (error.response?.status === 400) {
                errorMessage = "Проверьте правильность заполнения полей";
              } else if (error.response?.status === 500) {
                errorMessage = "Ошибка сервера. Попробуйте позже.";
              }
              
              toast.error(errorMessage);
            }
          }
        }}
        onBack={() => navigate("/warehouse")}
      />
    );
  }

  // Main warehouse view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Склад</h1>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/warehouse/in")}
              className="hidden sm:inline-flex h-9"
            >
              <Package className="h-4 w-4 mr-2" />
              Приёмка товара
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/warehouse/inventory")}
              className="hidden sm:inline-flex h-9"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Инвентаризация
            </Button>
            {/* Mobile buttons - larger and more obvious */}
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate("/warehouse/in")}
              className="sm:hidden h-10 w-10"
              title="Приёмка товара"
            >
              <Package className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/warehouse/inventory")}
              className="sm:hidden h-10 w-10"
              title="Инвентаризация"
            >
              <ClipboardList className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4">
          <ProductSearch
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Products Table */}
        <div>
          <ProductTable
            products={filteredProducts}
            isLoading={isLoading}
            onUpdateQuantity={handleQuantityUpdate}
            onUpdateProduct={handleProductUpdate}
            onShowProductDetail={handleProductClick}
          />
        </div>
      </div>
    </div>
  );
}