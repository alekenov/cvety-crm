import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const paymentMethods = [
  {
    id: 'kaspi',
    name: 'Kaspi Pay',
    description: 'Оплата через приложение Kaspi.kz',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">K</span>
      </div>
    ),
    logos: ['visa', 'mastercard'],
  },
  {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    ),
    logos: ['visa', 'mastercard'],
  },
  {
    id: 'cash',
    name: 'Наличными курьеру',
    description: 'Оплата при получении',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    ),
  },
];

const PaymentLogos = {
  visa: (
    <svg className="h-8 w-auto" viewBox="0 0 48 16" fill="none">
      <rect width="48" height="16" rx="4" fill="#F6F6F6"/>
      <path d="M20.57 6.17l-1.08 6.65h-1.73l1.08-6.65h1.73zm7.89 4.29l.69-1.88.4 1.88h-1.09zm2.35 2.36h1.6l-1.4-6.65h-1.48c-.33 0-.61.19-.74.49l-2.59 6.16h1.81l.36-.99h2.21l.21.99h.02zm-5.78-2.17c.01-1.75-2.44-1.85-2.42-2.63 0-.24.23-.49.73-.56.25-.03.93-.05 1.7.3l.3-1.41c-.41-.15-1.04-.3-1.76-.3-1.86 0-3.17 1-3.18 2.43-.01 1.06.94 1.65 1.65 2 .73.36 1.28.59 1.28.91-.01.49-.77.71-1.48.72-.66.01-1.04-.18-1.35-.32l-.3 1.42c.31.14.88.26 1.47.27 1.88 0 3.35-1.03 3.36-2.83zm-8-4.49l-2.91 6.65h-1.83l-1.43-5.48c-.09-.34-.16-.47-.43-.61-.44-.24-1.16-.46-1.79-.6l.04-.19h3.09c.39 0 .75.26.84.71l.77 4.08 1.89-4.79h1.76z" fill="#172B85"/>
    </svg>
  ),
  mastercard: (
    <svg className="h-8 w-auto" viewBox="0 0 48 16" fill="none">
      <rect width="48" height="16" rx="4" fill="#F6F6F6"/>
      <circle cx="19" cy="8" r="5" fill="#EB001B"/>
      <circle cx="29" cy="8" r="5" fill="#F79E1B"/>
      <path d="M24 11.5c1.15-.92 1.9-2.13 1.9-3.5S25.15 5.42 24 4.5c-1.15.92-1.9 2.13-1.9 3.5s.75 2.58 1.9 3.5z" fill="#FF5F00"/>
    </svg>
  ),
};

export function PaymentMethods({ value, onChange, className }: PaymentMethodsProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className={cn("space-y-3", className)}>
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={cn(
            "relative flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-gray-300",
            value === method.id ? "border-primary bg-primary/5" : "border-gray-200"
          )}
        >
          <RadioGroupItem
            value={method.id}
            id={method.id}
            className="mt-1"
          />
          <Label
            htmlFor={method.id}
            className="flex-1 ml-3 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {method.icon}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{method.name}</p>
                  {method.logos && (
                    <div className="flex items-center gap-2">
                      {method.logos.map((logo) => (
                        <div key={logo}>{PaymentLogos[logo as keyof typeof PaymentLogos]}</div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {method.description}
                </p>
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}