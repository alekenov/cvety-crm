import React from 'react';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
}

interface CardsViewProps {
  products: Product[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export function CardsView({ products, onUpdateQuantity }: CardsViewProps) {
  return (
    <>
      {/* Products Grid - 3 columns on mobile, responsive on larger screens */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
          <p className="text-muted-foreground">
            Попробуйте изменить условия поиска или фильтры
          </p>
        </div>
      )}
    </>
  );
}