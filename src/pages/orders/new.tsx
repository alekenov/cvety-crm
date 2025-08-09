import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { CustomerSelection } from "@/components/orders/customer-selection"
import { ProductSelection } from "@/components/orders/product-selection"
import { DeliveryOptions } from "@/components/orders/delivery-options"
import { PaymentOptions, type PaymentMethod } from "@/components/orders/payment-options"
import { Progress } from "@/components/ui/progress"
import { useIsMobile } from "@/hooks/use-media-query"
import type { Customer, OrderItem, DeliveryMethod } from "@/lib/types"

export function NewOrderPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [deliveryInfo, setDeliveryInfo] = useState<{
    method: DeliveryMethod
    date?: Date
    timeFrom?: string
    timeTo?: string
    address?: string
    recipientName?: string
    recipientPhone?: string
    comment?: string
  }>({ method: 'delivery' })
  const [paymentInfo, setPaymentInfo] = useState<{
    method: PaymentMethod
    isPaid?: boolean
  }>({ method: 'kaspi' })

  const steps = [
    { number: 1, title: 'Клиент' },
    { number: 2, title: 'Товары' },
    { number: 3, title: 'Доставка' },
    { number: 4, title: 'Оплата' }
  ]

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
    const deliveryFee = deliveryInfo.method === 'delivery' ? 1500 : 0
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    }
  }

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return selectedCustomer !== null
      case 2:
        return orderItems.length > 0
      case 3:
        return deliveryInfo.date && deliveryInfo.timeFrom && 
          (deliveryInfo.method === 'self_pickup' || 
           (deliveryInfo.address && deliveryInfo.recipientPhone))
      case 4:
        return true
      default:
        return false
    }
  }

  const handleCreateOrder = async () => {
    try {
      if (!selectedCustomer) {
        toast.error('Выберите клиента')
        return
      }
      
      if (orderItems.length === 0) {
        toast.error('Добавьте товары в заказ')
        return
      }
      
      if (!deliveryInfo.date) {
        toast.error('Выберите дату доставки')
        return
      }
      
      // Format delivery window
      const deliveryWindow = deliveryInfo.timeFrom && deliveryInfo.timeTo ? {
        from: `${deliveryInfo.date.toISOString().split('T')[0]}T${deliveryInfo.timeFrom}:00`,
        to: `${deliveryInfo.date.toISOString().split('T')[0]}T${deliveryInfo.timeTo}:00`
      } : undefined
      
      // Import ordersApi
      const { ordersApi } = await import('@/lib/api')
      
      const orderData = {
        customerPhone: selectedCustomer.phone,
        recipientPhone: deliveryInfo.recipientPhone || selectedCustomer.phone,
        recipientName: deliveryInfo.recipientName || selectedCustomer.name,
        address: deliveryInfo.address,
        deliveryMethod: deliveryInfo.method,
        deliveryWindow,
        comment: deliveryInfo.comment,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
      
      const newOrder = await ordersApi.create(orderData)
      const totals = calculateTotals()
      toast.success(`Заказ #${newOrder.id} на сумму ${totals.total.toLocaleString()} ₸ успешно создан!`)
      navigate('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Ошибка при создании заказа')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Новый заказ</h1>
            <p className="text-sm text-muted-foreground" data-testid="step-indicator">Шаг {step} из 4</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={(step / 4) * 100} className="h-2" data-testid="progress-bar" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((s) => (
              <span 
                key={s.number} 
                className={s.number <= step ? 'text-primary font-medium' : ''}
              >
                {s.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${isMobile ? '' : 'lg:grid-cols-3'}`}>
        <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-2'}`}>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Выбор клиента</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSelection
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  data-testid="customer-selection"
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Товары</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSelection
                  orderItems={orderItems}
                  onUpdateItems={setOrderItems}
                  data-testid="product-selection"
                />
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Доставка</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryOptions
                  deliveryInfo={deliveryInfo}
                  onUpdateDelivery={setDeliveryInfo}
                  data-testid="delivery-options"
                />
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Оплата</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentOptions
                  paymentInfo={paymentInfo}
                  onUpdatePayment={setPaymentInfo}
                  data-testid="payment-options"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              data-testid="prev-step-button"
            >
              Назад
            </Button>
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                data-testid="next-step-button"
              >
                Далее
              </Button>
            ) : (
              <Button 
                onClick={handleCreateOrder}
                disabled={!canProceedToNextStep()}
                data-testid="create-order-button"
              >
                Создать заказ
              </Button>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Сводка заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Клиент</p>
                    <p className="font-medium">
                      {selectedCustomer ? selectedCustomer.name : 'Не выбран'}
                    </p>
                    {selectedCustomer && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Товары</p>
                    <p className="font-medium">{orderItems.length} позиций</p>
                    {orderItems.map(item => (
                      <p key={item.productId} className="text-sm text-muted-foreground">
                        {item.product?.name} × {item.quantity}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Доставка</p>
                    <p className="font-medium">
                      {deliveryInfo.method === 'delivery' ? 'Курьером' : 'Самовывоз'}
                    </p>
                    {deliveryInfo.date && (
                      <p className="text-sm text-muted-foreground">
                        {deliveryInfo.date.toLocaleDateString('ru-RU')}
                        {deliveryInfo.timeFrom && ` ${deliveryInfo.timeFrom}-${deliveryInfo.timeTo}`}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Оплата</p>
                    <p className="font-medium">
                      {paymentInfo.method === 'kaspi' && 'Kaspi Pay'}
                      {paymentInfo.method === 'cash' && 'Наличными'}
                      {paymentInfo.method === 'transfer' && 'Перевод'}
                      {paymentInfo.method === 'qr' && 'QR код'}
                    </p>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Товары</span>
                      <span>{calculateTotals().subtotal.toLocaleString()} ₸</span>
                    </div>
                    {deliveryInfo.method === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Доставка</span>
                        <span>{calculateTotals().deliveryFee.toLocaleString()} ₸</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Итого</span>
                      <span className="text-xl">{calculateTotals().total.toLocaleString()} ₸</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}