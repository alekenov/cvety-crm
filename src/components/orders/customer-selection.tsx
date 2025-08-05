import { useState } from "react"
import { Search, Plus, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Customer } from "@/lib/types"
import { FORM_WIDTHS } from "@/lib/constants"

interface CustomerSelectionProps {
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
}

// Mock customers
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Айгерим Сатпаева",
    phone: "+7 (707) 123-45-67",
    ordersCount: 5,
    totalSpent: 125000,
    lastOrderDate: new Date("2024-01-20"),
    createdAt: new Date("2023-12-01")
  },
  {
    id: "2",
    name: "Самат Нурпеисов",
    phone: "+7 (777) 890-12-34",
    ordersCount: 3,
    totalSpent: 75000,
    lastOrderDate: new Date("2024-01-15"),
    createdAt: new Date("2023-11-15")
  },
  {
    id: "3",
    name: "Динара Касымова",
    phone: "+7 (701) 555-44-33",
    ordersCount: 8,
    totalSpent: 200000,
    lastOrderDate: new Date("2024-01-22"),
    createdAt: new Date("2023-10-01")
  }
]

export function CustomerSelection({ selectedCustomer, onSelectCustomer }: CustomerSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: ""
  })

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.phone.includes(searchQuery) ||
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateCustomer = () => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: newCustomerData.name,
      phone: newCustomerData.phone,
      ordersCount: 0,
      totalSpent: 0,
      createdAt: new Date()
    }
    onSelectCustomer(newCustomer)
    setShowNewCustomerDialog(false)
    setNewCustomerData({ name: "", phone: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 md:flex-none">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по телефону или имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-8 ${FORM_WIDTHS.SEARCH}`}
          />
        </div>
        <Button onClick={() => setShowNewCustomerDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый клиент
        </Button>
      </div>

      {searchQuery && filteredCustomers.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <RadioGroup value={selectedCustomer?.id} onValueChange={(id) => {
            const customer = filteredCustomers.find(c => c.id === id)
            if (customer) onSelectCustomer(customer)
          }}>
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex items-start space-x-2 p-3 rounded-lg hover:bg-accent">
                  <RadioGroupItem value={customer.id} id={customer.id} className="mt-1" />
                  <Label htmlFor={customer.id} className="flex-1 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Заказов: {customer.ordersCount}</p>
                        <p className="text-muted-foreground">Сумма: {customer.totalSpent.toLocaleString()} ₸</p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </ScrollArea>
      )}

      {selectedCustomer && (
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className={FORM_WIDTHS.FORM_DIALOG}>
          <DialogHeader>
            <DialogTitle>Новый клиент</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                placeholder="Введите имя клиента"
                className={FORM_WIDTHS.NAME}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                placeholder="+7 (___) ___-__-__"
                className={FORM_WIDTHS.PHONE}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCustomer} disabled={!newCustomerData.name || !newCustomerData.phone}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}