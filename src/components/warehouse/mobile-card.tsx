import { Card } from "@/components/ui/card"
import type { WarehouseItem } from "@/lib/types"

interface WarehouseMobileCardProps {
  item: WarehouseItem
  onClick?: () => void
}

export function WarehouseMobileCard({ item, onClick }: WarehouseMobileCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStockStatusColor = (qty: number, reservedQty: number): string => {
    const available = qty - reservedQty
    if (available <= 15) return "text-destructive"
    if (available <= 30) return "text-orange-500"
    return ""
  }

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors p-4"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Placeholder для изображения */}
        <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
        
        {/* Информация о товаре */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate">
            {item.variety} {item.heightCm}см
          </h3>
          
          <div className="flex items-end justify-between mt-3">
            <div className={`font-medium ${getStockStatusColor(item.qty, item.reservedQty)}`}>
              {item.qty} шт
              {item.reservedQty > 0 && (
                <span className="text-xs text-muted-foreground block">
                  Резерв: {item.reservedQty} шт
                </span>
              )}
            </div>
            
            <div className="text-lg font-semibold">
              {formatCurrency(item.price)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}