import { createContext, useContext, useId, forwardRef, useState, useEffect } from "react"
import type { ComponentProps, ReactNode } from "react"
import { Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VARIETIES, HEIGHTS } from "@/lib/constants"

interface FlowerAutocompleteProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function FlowerAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Выберите цветок..." 
}: FlowerAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Создаем список всех возможных комбинаций
  const flowerOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = []
    VARIETIES.forEach(variety => {
      HEIGHTS.forEach(height => {
        options.push({
          value: `${variety}-${height}`,
          label: `${variety} ${height}см`
        })
      })
    })
    return options
  }, [])

  // Получаем последние использованные комбинации из localStorage
  const recentFlowers = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('recentFlowers')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  // Фильтруем опции по поисковому запросу
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return flowerOptions
    const search = searchValue.toLowerCase()
    return flowerOptions.filter(option => 
      option.label.toLowerCase().includes(search)
    )
  }, [searchValue, flowerOptions])

  // Проверяем, можно ли добавить новую комбинацию
  const canAddNew = React.useMemo(() => {
    if (!searchValue || searchValue.length < 3) return false
    // Проверяем, не существует ли уже такая комбинация
    return !filteredOptions.some(option => 
      option.label.toLowerCase() === searchValue.toLowerCase()
    )
  }, [searchValue, filteredOptions])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    
    // Сохраняем в историю
    try {
      const stored = localStorage.getItem('recentFlowers') || '[]'
      const recent = JSON.parse(stored)
      const updated = [selectedValue, ...recent.filter((v: string) => v !== selectedValue)].slice(0, 5)
      localStorage.setItem('recentFlowers', JSON.stringify(updated))
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }

  const handleAddNew = () => {
    // Парсим введенный текст
    const parts = searchValue.trim().split(/\s+/)
    if (parts.length < 2) return

    const variety = parts.slice(0, -1).join(' ')
    const heightStr = parts[parts.length - 1]
    const height = parseInt(heightStr)

    if (isNaN(height)) return

    const newValue = `${variety}-${height}`
    handleSelect(newValue)
  }

  const displayValue = React.useMemo(() => {
    if (!value) return ""
    const option = flowerOptions.find(opt => opt.value === value)
    return option?.label || value
  }, [value, flowerOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Поиск или введите новый..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {canAddNew ? (
                <div className="p-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleAddNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить "{searchValue}"
                  </Button>
                </div>
              ) : (
                "Ничего не найдено"
              )}
            </CommandEmpty>
            
            {recentFlowers.length > 0 && (
              <CommandGroup heading="Недавно использованные">
                {recentFlowers.slice(0, 3).map((flower: string) => {
                  const option = flowerOptions.find(opt => opt.value === flower)
                  if (!option) return null
                  return (
                    <CommandItem
                      key={flower}
                      value={option.label}
                      onSelect={() => handleSelect(flower)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === flower ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            <CommandGroup heading="Все варианты">
              {filteredOptions.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}