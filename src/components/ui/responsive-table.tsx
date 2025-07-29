import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface ResponsiveTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    label: string
    className?: string
    render?: (value: T[keyof T], item: T) => React.ReactNode
    hideOnMobile?: boolean
    priority?: number // для сортировки в мобильной карточке
  }[]
  onRowClick?: (item: T) => void
  mobileCardTitle?: (item: T) => string
  mobileCardSubtitle?: (item: T) => string
  mobileCardActions?: (item: T) => React.ReactNode
  className?: string
}

export function ResponsiveTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardActions,
  className
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null)

  const visibleColumns = columns.filter(col => !isMobile || !col.hideOnMobile)
  const mobileColumns = columns
    .filter(col => !col.hideOnMobile)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))

  if (isMobile) {
    return (
      <>
        <div className={cn("space-y-3", className)}>
          {data.map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onRowClick ? onRowClick(item) : setSelectedItem(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {mobileCardTitle ? mobileCardTitle(item) : String(item[columns[0].key])}
                    </CardTitle>
                    {mobileCardSubtitle && (
                      <p className="text-sm text-muted-foreground">
                        {mobileCardSubtitle(item)}
                      </p>
                    )}
                  </div>
                  {mobileCardActions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {mobileCardActions(item)}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {mobileColumns.slice(0, 3).map(column => {
                    const value = item[column.key]
                    const rendered = column.render ? column.render(value, item) : String(value)
                    
                    return (
                      <div key={String(column.key)} className="flex justify-between items-start">
                        <span className="text-muted-foreground font-medium min-w-0 flex-shrink-0">
                          {column.label}:
                        </span>
                        <div className="font-medium text-right ml-2 min-w-0 flex-1">
                          {rendered}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            {selectedItem && (
              <>
                <SheetHeader>
                  <SheetTitle>
                    {mobileCardTitle ? mobileCardTitle(selectedItem) : "Подробности"}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {columns.map(column => {
                    const value = selectedItem[column.key]
                    const rendered = column.render ? column.render(value, selectedItem) : String(value)
                    
                    return (
                      <div key={String(column.key)} className="space-y-1">
                        <dt className="text-sm text-muted-foreground">{column.label}</dt>
                        <dd className="text-sm font-medium">{rendered}</dd>
                      </div>
                    )
                  })}
                  {onRowClick && (
                    <Button 
                      className="w-full mt-6"
                      onClick={() => {
                        onRowClick(selectedItem)
                        setSelectedItem(null)
                      }}
                    >
                      Открыть
                    </Button>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {visibleColumns.map(column => (
              <th 
                key={String(column.key)}
                className={cn(
                  "h-10 px-2 text-left align-middle font-medium text-foreground",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((item) => (
            <tr 
              key={item.id}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {visibleColumns.map(column => {
                const value = item[column.key]
                const rendered = column.render ? column.render(value, item) : String(value)
                
                return (
                  <td 
                    key={String(column.key)}
                    className={cn("p-2 align-middle", column.className)}
                  >
                    {rendered}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}