import { useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Phone,
  Calendar,
  User,
  Filter,
  Plus,
  Timer,
  Play,
  Pause
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { FloristTask, TaskStatus } from "@/lib/types"

// Mock data
const mockTasks: FloristTask[] = [
  {
    id: "1",
    orderId: "1001",
    orderNumber: "#1001",
    customerName: "Айгерим Сатпаева",
    customerPhone: "+7 (707) 123-45-67",
    products: "Букет из 25 красных роз (60см)",
    status: "in_progress",
    priority: "high",
    requiredBy: new Date("2024-01-26T14:00:00"),
    assignedTo: "Марина",
    assignedAt: new Date("2024-01-26T09:00:00"),
    notes: "Клиент просил добавить больше зелени"
  },
  {
    id: "2",
    orderId: "1002",
    orderNumber: "#1002",
    customerName: "Самат Нурпеисов",
    customerPhone: "+7 (777) 890-12-34",
    products: "Композиция в корзине: пионы, розы, эустома",
    status: "pending",
    priority: "medium",
    requiredBy: new Date("2024-01-26T16:00:00"),
    notes: "Корпоративный заказ. Нужна лента с логотипом."
  },
  {
    id: "3",
    orderId: "999",
    orderNumber: "#999",
    customerName: "Динара Касымова",
    customerPhone: "+7 (701) 555-44-33",
    products: "Букет из тюльпанов (51 шт)",
    status: "completed",
    priority: "high",
    requiredBy: new Date("2024-01-26T10:00:00"),
    assignedTo: "Алия",
    assignedAt: new Date("2024-01-26T08:00:00"),
    completedAt: new Date("2024-01-26T09:45:00")
  },
  {
    id: "4",
    orderId: "1003",
    orderNumber: "#1003",
    customerName: "Нурлан Темирбаев",
    customerPhone: "+7 (708) 222-33-44",
    products: "Микс букет: розы + альстромерии",
    status: "pending",
    priority: "low",
    requiredBy: new Date("2024-01-26T18:00:00")
  }
]

const florists = ["Марина", "Алия", "Светлана", "Гульнара"]

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Ожидает", icon: Clock, color: "text-yellow-600" },
  in_progress: { label: "В работе", icon: Timer, color: "text-blue-600" },
  completed: { label: "Готово", icon: CheckCircle2, color: "text-green-600" }
}

const priorityConfig = {
  high: { label: "Высокий", color: "destructive" as const },
  medium: { label: "Средний", color: "secondary" as const },
  low: { label: "Низкий", color: "outline" as const }
}

export function ProductionPage() {
  const [tasks, setTasks] = useState<FloristTask[]>(mockTasks)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterFlorist, setFilterFlorist] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<FloristTask | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({
    florist: "",
    notes: ""
  })

  const handleAssignTask = () => {
    if (!selectedTask || !assignForm.florist) {
      toast.error("Выберите флориста")
      return
    }

    setTasks(tasks.map(task => 
      task.id === selectedTask.id 
        ? {
            ...task,
            status: "in_progress" as TaskStatus,
            assignedTo: assignForm.florist,
            assignedAt: new Date(),
            notes: assignForm.notes || task.notes
          }
        : task
    ))

    toast.success(`Задание назначено флористу ${assignForm.florist}`)
    setIsAssignDialogOpen(false)
    setAssignForm({ florist: "", notes: "" })
    setSelectedTask(null)
  }

  const handleStartTask = (task: FloristTask) => {
    setTasks(tasks.map(t => 
      t.id === task.id 
        ? { ...t, status: "in_progress" as TaskStatus, assignedAt: new Date() }
        : t
    ))
    toast.success("Работа над заданием начата")
  }

  const handleCompleteTask = (task: FloristTask) => {
    setTasks(tasks.map(t => 
      t.id === task.id 
        ? { ...t, status: "completed" as TaskStatus, completedAt: new Date() }
        : t
    ))
    toast.success("Задание выполнено")
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterFlorist !== "all" && task.assignedTo !== filterFlorist) return false
    return true
  })

  const getTasksByStatus = (status: TaskStatus) => 
    filteredTasks.filter(task => task.status === status)

  const getTimeUntilDeadline = (deadline: Date) => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff < 0) return "Просрочено"
    if (hours > 0) return `${hours}ч ${minutes}м`
    return `${minutes}м`
  }

  const TaskCard = ({ task }: { task: FloristTask }) => {
    const StatusIcon = statusConfig[task.status].icon
    const isOverdue = new Date() > task.requiredBy && task.status !== "completed"

    return (
      <Card className={isOverdue ? "border-destructive" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{task.orderNumber}</CardTitle>
                <Badge variant={priorityConfig[task.priority].color}>
                  {priorityConfig[task.priority].label}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {task.customerName}
              </CardDescription>
            </div>
            <StatusIcon className={`h-5 w-5 ${statusConfig[task.status].color}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="font-medium">{task.products}</p>
            {task.notes && (
              <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span>{task.customerPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>
                До {format(task.requiredBy, "HH:mm", { locale: ru })}
                {isOverdue && <span className="text-destructive ml-1">(Просрочено)</span>}
              </span>
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>Флорист: {task.assignedTo}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {task.status === "in_progress" && task.assignedAt && (
                <span>В работе: {getTimeUntilDeadline(task.requiredBy)}</span>
              )}
              {task.status === "completed" && task.completedAt && (
                <span>Готово в {format(task.completedAt, "HH:mm")}</span>
              )}
            </div>

            <div className="flex gap-1">
              {task.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTask(task)
                    setIsAssignDialogOpen(true)
                  }}
                >
                  <User className="h-3 w-3 mr-1" />
                  Назначить
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCompleteTask(task)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Готово
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Задания флористам</h1>
          <p className="text-muted-foreground">
            Управление производством букетов
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterFlorist} onValueChange={setFilterFlorist}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все флористы</SelectItem>
              {florists.map(florist => (
                <SelectItem key={florist} value={florist}>
                  {florist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTasksByStatus("pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTasksByStatus("in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено сегодня</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTasksByStatus("completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredTasks.filter(t => 
                new Date() > t.requiredBy && t.status !== "completed"
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Boards */}
      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">Все задания</TabsTrigger>
          <TabsTrigger value="pending">Ожидают</TabsTrigger>
          <TabsTrigger value="in_progress">В работе</TabsTrigger>
          <TabsTrigger value="completed">Выполнено</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Pending Column */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ожидают ({getTasksByStatus("pending").length})
              </h3>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {getTasksByStatus("pending").map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* In Progress Column */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Timer className="h-4 w-4" />
                В работе ({getTasksByStatus("in_progress").length})
              </h3>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {getTasksByStatus("in_progress").map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Completed Column */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Выполнено ({getTasksByStatus("completed").length})
              </h3>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {getTasksByStatus("completed").map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getTasksByStatus("pending").map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getTasksByStatus("in_progress").map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getTasksByStatus("completed").map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить задание</DialogTitle>
            <DialogDescription>
              Выберите флориста для выполнения задания {selectedTask?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="florist">Флорист</Label>
              <Select 
                value={assignForm.florist} 
                onValueChange={(value) => setAssignForm({ ...assignForm, florist: value })}
              >
                <SelectTrigger id="florist">
                  <SelectValue placeholder="Выберите флориста" />
                </SelectTrigger>
                <SelectContent>
                  {florists.map(florist => (
                    <SelectItem key={florist} value={florist}>
                      {florist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Дополнительные инструкции для флориста..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAssignTask}>
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}