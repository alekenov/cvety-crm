import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Package, TruckIcon, AlertTriangle, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface QuickAdjustmentDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (productId: string, adjustment: number, reason: string) => void;
}

const adjustmentReasons = [
  { value: 'sale', label: 'Продажа наличными', icon: Package, type: 'out' },
  { value: 'damage', label: 'Списание (брак)', icon: AlertTriangle, type: 'out' },
  { value: 'return', label: 'Возврат от клиента', icon: RotateCcw, type: 'in' },
  { value: 'delivery', label: 'Поступление товара', icon: TruckIcon, type: 'in' },
  { value: 'transfer', label: 'Перемещение', icon: ArrowRightLeft, type: 'both' },
  { value: 'other', label: 'Другое', icon: Package, type: 'both' }
];

export function QuickAdjustmentDialog({ product, isOpen, onClose, onAdjust }: QuickAdjustmentDialogProps) {
  const [reason, setReason] = useState('sale');
  const [quantity, setQuantity] = useState(1);
  const [customReason, setCustomReason] = useState('');
  const [operationType, setOperationType] = useState<'in' | 'out'>('out');

  const selectedReasonInfo = adjustmentReasons.find(r => r.value === reason);
  
  // Определяем тип операции на основе выбранной причины
  React.useEffect(() => {
    if (selectedReasonInfo) {
      if (selectedReasonInfo.type === 'in') {
        setOperationType('in');
      } else if (selectedReasonInfo.type === 'out') {
        setOperationType('out');
      }
      // для 'both' оставляем текущий выбор
    }
  }, [reason, selectedReasonInfo]);

  const handleQuickAdjust = (amount: number) => {
    setQuantity(amount);
  };

  const handleSubmit = () => {
    if (!product) return;
    
    const adjustment = operationType === 'in' ? quantity : -quantity;
    const finalReason = reason === 'other' ? customReason : selectedReasonInfo?.label || '';
    
    if (!finalReason) {
      toast.error('Укажите причину корректировки');
      return;
    }

    if (operationType === 'out' && quantity > product.quantity) {
      toast.error('Недостаточно товара на складе');
      return;
    }

    onAdjust(product.id, adjustment, finalReason);
    onClose();
    
    // Сброс формы
    setReason('sale');
    setQuantity(1);
    setCustomReason('');
    setOperationType('out');
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Быстрая корректировка остатков</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Информация о товаре */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              Текущий остаток: <span className="font-semibold">{product.quantity} шт.</span>
            </p>
          </div>

          {/* Тип операции (только для причин типа 'both') */}
          {selectedReasonInfo?.type === 'both' && (
            <div className="space-y-2">
              <Label>Тип операции</Label>
              <RadioGroup value={operationType} onValueChange={(v) => setOperationType(v as 'in' | 'out')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in" id="type-in" />
                  <Label htmlFor="type-in" className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4 text-green-600" />
                    Приход
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="out" id="type-out" />
                  <Label htmlFor="type-out" className="flex items-center gap-2 cursor-pointer">
                    <Minus className="h-4 w-4 text-red-600" />
                    Расход
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Причина корректировки */}
          <div className="space-y-2">
            <Label>Причина корректировки</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {adjustmentReasons.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4" />
                      {r.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Дополнительное описание для "Другое" */}
          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Описание причины</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Укажите причину корректировки..."
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Количество */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                max={operationType === 'out' ? product.quantity : undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(1)}
                >
                  1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(5)}
                >
                  5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(10)}
                >
                  10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(20)}
                >
                  20
                </Button>
              </div>
            </div>
          </div>

          {/* Предпросмотр результата */}
          <div className={`p-3 rounded-lg border-2 ${
            operationType === 'in' 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <p className="text-sm font-medium">
              {operationType === 'in' ? (
                <>
                  <Plus className="inline h-4 w-4 mr-1 text-green-600" />
                  Приход: {quantity} шт.
                </>
              ) : (
                <>
                  <Minus className="inline h-4 w-4 mr-1 text-red-600" />
                  Расход: {quantity} шт.
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Остаток после операции: <span className="font-semibold">
                {operationType === 'in' 
                  ? product.quantity + quantity 
                  : Math.max(0, product.quantity - quantity)} шт.
              </span>
            </p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit}
            className={operationType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {operationType === 'in' ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 mr-1" />
                Списать
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}