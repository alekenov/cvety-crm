import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Package, TruckIcon, AlertTriangle, RotateCcw, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Movement {
  id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  description: string;
  created_at: string;
  created_by: string;
  qty_before: number;
  qty_after: number;
  reference_type?: string;
  reference_id?: string;
}

interface MovementHistoryProps {
  productId: string;
  productName: string;
}

const movementIcons = {
  in: { icon: ArrowDownRight, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  out: { icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  adjustment: { icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' }
};

const movementTypeLabels = {
  in: 'Приход',
  out: 'Расход',
  adjustment: 'Корректировка'
};

export function MovementHistory({ productId, productName }: MovementHistoryProps) {
  const { data: movements, isLoading, error } = useQuery({
    queryKey: ['warehouse-movements', productId],
    queryFn: async () => {
      const response = await api.get(`/warehouse/${productId}/movements`, {
        params: { limit: 50 }
      });
      return response.data.items as Movement[];
    },
    enabled: !!productId
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">История движений</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">История движений</h3>
        <p className="text-muted-foreground">Ошибка загрузки истории</p>
      </Card>
    );
  }

  if (!movements || movements.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">История движений</h3>
        <p className="text-muted-foreground">Нет истории движений для этого товара</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">История движений</h3>
        <p className="text-sm text-muted-foreground">{productName}</p>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {movements.map((movement) => {
            const config = movementIcons[movement.type];
            const Icon = config.icon;
            const isPositive = movement.quantity > 0;
            
            return (
              <div
                key={movement.id}
                className={`p-4 rounded-lg border ${config.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={movement.type === 'in' ? 'default' : movement.type === 'out' ? 'destructive' : 'secondary'}>
                          {movementTypeLabels[movement.type]}
                        </Badge>
                        <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{movement.quantity} шт.
                        </span>
                      </div>
                      <p className="text-sm font-medium">{movement.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(movement.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                        <span>•</span>
                        <span>{movement.created_by}</span>
                      </div>
                      {movement.reference_type && movement.reference_id && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {movement.reference_type === 'order' && (
                            <span>Заказ #{movement.reference_id}</span>
                          )}
                          {movement.reference_type === 'supply' && (
                            <span>Поставка #{movement.reference_id}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Остаток</div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">{movement.qty_before}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold">{movement.qty_after}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}