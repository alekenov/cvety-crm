import { useState } from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AddressEditorProps {
  address: string | null
  onSave: (address: string) => void
  onCancel: () => void
}

export function AddressEditor({ address, onSave, onCancel }: AddressEditorProps) {
  const [newAddress, setNewAddress] = useState(address || "")

  const handleSave = () => {
    if (newAddress.trim()) {
      onSave(newAddress.trim())
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={newAddress}
        onChange={(e) => setNewAddress(e.target.value)}
        placeholder="Введите адрес доставки"
        className="min-h-[60px]"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={!newAddress.trim()}>
          <Check className="mr-1 h-4 w-4" />
          Сохранить
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          Отмена
        </Button>
      </div>
    </div>
  )
}