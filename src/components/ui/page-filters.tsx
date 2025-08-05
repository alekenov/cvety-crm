import React from "react"
import { Search, Filter, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export interface FilterOption {
  value: string
  label: string
}

export interface PageFilterConfig {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  
  // Basic select filters
  selectFilters?: Array<{
    value: string
    onChange: (value: string) => void
    placeholder: string
    options: FilterOption[]
    width?: string // e.g., "w-[200px]"
  }>
  
  // Date range filter
  dateRange?: {
    from?: Date
    to?: Date
    onChange: (range: { from?: Date; to?: Date }) => void
    placeholder?: string
  }
  
  // Advanced filters dropdown
  advancedFilters?: {
    trigger: React.ReactNode
    content: React.ReactNode
  }
  
  // View mode toggles
  viewModes?: Array<{
    value: string
    icon: React.ReactNode
    active: boolean
    onClick: () => void
  }>
  
  // Custom actions (e.g., export, add buttons)
  actions?: React.ReactNode
}

interface PageFiltersProps {
  config: PageFilterConfig
  className?: string
}

export function PageFilters({ config, className = "" }: PageFiltersProps) {
  const {
    searchPlaceholder = "Поиск...",
    searchValue = "",
    onSearchChange,
    selectFilters = [],
    dateRange,
    advancedFilters,
    viewModes = [],
    actions
  } = config

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search Row */}
      {onSearchChange && (
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Filters Row */}
      {(selectFilters.length > 0 || dateRange || advancedFilters || viewModes.length > 0 || actions) && (
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* Select Filters */}
          {selectFilters.map((filter, index) => (
            <Select
              key={index}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className={`w-full ${filter.width || 'sm:w-[200px]'}`}>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Date Range Filter */}
          {dateRange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd.MM.yy")} -{" "}
                        {format(dateRange.to, "dd.MM.yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd.MM.yy")
                    )
                  ) : (
                    <span>{dateRange.placeholder || "Выберите даты"}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    dateRange.onChange({ 
                      from: range?.from, 
                      to: range?.to 
                    })
                  }}
                  numberOfMonths={1}
                  className="sm:hidden"
                />
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    dateRange.onChange({ 
                      from: range?.from, 
                      to: range?.to 
                    })
                  }}
                  numberOfMonths={2}
                  className="hidden sm:block"
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Advanced Filters */}
          {advancedFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Фильтры
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {advancedFilters.content}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Custom Actions */}
          {actions && (
            <div className="flex gap-2 sm:ml-auto">
              {actions}
            </div>
          )}

          {/* View Mode Toggles */}
          {viewModes.length > 0 && (
            <div className="flex gap-2 sm:ml-auto">
              {viewModes.map((mode, index) => (
                <Button
                  key={index}
                  variant={mode.active ? "default" : "outline"}
                  size="icon"
                  onClick={mode.onClick}
                  className="flex-1 sm:flex-none"
                >
                  {mode.icon}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to create filter options from arrays
export function createFilterOptions(items: string[], allLabel: string = "Все"): FilterOption[] {
  return [
    { value: "all", label: allLabel },
    ...items.map(item => ({ value: item, label: item }))
  ]
}

// Helper function to create filter options from key-value objects
export function createFilterOptionsFromObject(
  obj: Record<string, string>, 
  allLabel: string = "Все"
): FilterOption[] {
  return [
    { value: "all", label: allLabel },
    ...Object.entries(obj).map(([value, label]) => ({ value, label }))
  ]
}