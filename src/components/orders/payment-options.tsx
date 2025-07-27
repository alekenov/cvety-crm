import { CreditCard, Banknote, Smartphone, QrCode } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export type PaymentMethod = 'kaspi' | 'cash' | 'transfer' | 'qr'

interface PaymentInfo {
  method: PaymentMethod
  isPaid?: boolean
}

interface PaymentOptionsProps {
  paymentInfo: PaymentInfo
  onUpdatePayment: (info: PaymentInfo) => void
}

const paymentMethods = [
  {
    value: 'kaspi' as const,
    label: 'Kaspi Pay',
    description: 'Оплата через приложение Kaspi',
    icon: Smartphone,
    popular: true
  },
  {
    value: 'cash' as const,
    label: 'Наличными',
    description: 'Оплата курьеру при получении',
    icon: Banknote
  },
  {
    value: 'transfer' as const,
    label: 'Перевод на карту',
    description: 'Перевод на карту Halyk или Kaspi Gold',
    icon: CreditCard
  },
  {
    value: 'qr' as const,
    label: 'QR код',
    description: 'Сканировать QR для оплаты',
    icon: QrCode
  }
]

export function PaymentOptions({ paymentInfo, onUpdatePayment }: PaymentOptionsProps) {
  return (
    <div className="space-y-6">
      <RadioGroup
        value={paymentInfo.method}
        onValueChange={(value: PaymentMethod) => 
          onUpdatePayment({ ...paymentInfo, method: value })
        }
      >
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.value} className="relative">
              {method.popular && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Популярно
                  </span>
                </div>
              )}
              <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent">
                <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                <Label htmlFor={method.value} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <method.icon className="h-4 w-4" />
                    <span className="font-medium">{method.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </Label>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>

      {paymentInfo.method === 'kaspi' && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            После создания заказа вам придет push-уведомление в приложении Kaspi 
            для подтверждения оплаты. Убедитесь, что у клиента установлено приложение.
          </AlertDescription>
        </Alert>
      )}

      {paymentInfo.method === 'transfer' && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Реквизиты для перевода:</p>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                <p>Kaspi Gold: 4400 4301 2345 6789</p>
                <p>Halyk Bank: 5522 0420 1234 5678</p>
                <p>Получатель: ИП Cvety.kz</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {paymentInfo.method === 'qr' && (
        <Alert>
          <QrCode className="h-4 w-4" />
          <AlertDescription>
            QR код для оплаты будет доступен после создания заказа. 
            Клиент сможет отсканировать его любым банковским приложением.
          </AlertDescription>
        </Alert>
      )}

      {paymentInfo.method === 'cash' && (
        <Alert>
          <Banknote className="h-4 w-4" />
          <AlertDescription>
            Подготовьте сдачу для клиента. Курьер примет оплату при доставке заказа.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}