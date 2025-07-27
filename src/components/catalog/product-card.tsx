import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onView?: (product: Product) => void
  className?: string
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onView,
  className 
}: ProductCardProps) {
  const discountPercentage = product.salePrice 
    ? Math.round((1 - product.salePrice / product.retailPrice) * 100)
    : 0

  const categoryLabels = {
    bouquet: "Букет",
    composition: "Композиция",
    potted: "Горшечное",
    other: "Другое"
  }

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
      <div className="relative aspect-square bg-muted">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.isPopular && (
            <Badge variant="default" className="shadow-sm">
              Популярный
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="secondary" className="shadow-sm">
              Новинка
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="shadow-sm">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        {!product.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="outline" className="bg-background">
              Неактивен
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight line-clamp-2">
              {product.name}
            </h3>
          </div>
          
          <Badge variant="outline" className="text-xs">
            {categoryLabels[product.category]}
          </Badge>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-lg font-semibold">
                    {product.salePrice.toLocaleString()} ₸
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {product.retailPrice.toLocaleString()} ₸
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold">
                  {product.retailPrice.toLocaleString()} ₸
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Себестоимость: {product.costPrice.toLocaleString()} ₸
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {onView && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView(product)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Просмотр
          </Button>
        )}
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Изменить
          </Button>
        )}
        {onDelete && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(product)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}