import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { TableSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"

import type { FloristTask, TaskStatus } from "@/lib/types"
import { productionApi } from "@/lib/api"

// Florists data (this could come from API in the future)
const floristsData = [
  { id: 1, name: "Марина" },
  { id: 2, name: "Алия" },
  { id: 3, name: "Светлана" },
  { id: 4, name: "Гульнара" }
]

const florists = floristsData.map(f => f.name)

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
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterFlorist, setFilterFlorist] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<FloristTask | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({
    florist: "",
    notes: ""
  })
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // React Query hooks
  const { 
    data: tasksData, 
    isLoading: tasksLoading, 
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['production-tasks', { status: filterStatus !== 'all' ? filterStatus : undefined }],
    queryFn: () => productionApi.getAllTasks({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      limit: 100
    }),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })

  const { 
    data: queueStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['production-queue-stats'],
    queryFn: () => productionApi.getQueueStats(),
    refetchInterval: 15000, // Refetch every 15 seconds
  })

  // Mutations
  const assignTaskMutation = useMutation({
    mutationFn: ({ taskId, floristId }: { taskId: string; floristId: number }) => 
      productionApi.assignTask(taskId, floristId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-queue-stats'] })
      toast.success(`Задание назначено флористу ${assignForm.florist}`)
      setIsAssignDialogOpen(false)
      setAssignForm({ florist: "", notes: "" })
      setSelectedTask(null)
    },
    onError: () => {
      toast.error("Не удалось назначить задание")
    }
  })

  const startTaskMutation = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes?: string }) => 
      productionApi.startTask(taskId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-queue-stats'] })
      toast.success("Работа над заданием начата")
    },
    onError: () => {
      toast.error("Не удалось начать выполнение задания")
    }
  })

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, params }: { taskId: string; params?: { actualMinutes?: number; floristNotes?: string; resultPhotos?: string[] } }) => 
      productionApi.completeTask(taskId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-queue-stats'] })
      toast.success("Задание выполнено")
    },
    onError: () => {
      toast.error("Не удалось завершить задание")
    }
  })

  const tasks = tasksData?.items || []
  
  // Add status update mutation for drag and drop
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => 
      productionApi.updateTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-queue-stats'] })
      toast.success("Статус задания обновлен")
    },
    onError: () => {
      toast.error("Не удалось обновить статус задания")
    }
  })
  
  // Show loading state
  if (tasksLoading && !tasks.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Задания флористам</h1>
            <p className="text-muted-foreground">
              Управление производством букетов
            </p>
          </div>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  // Show error state
  if (tasksError && !tasks.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Задания флористам</h1>
            <p className="text-muted-foreground">
              Управление производством букетов
            </p>
          </div>
        </div>
        <ErrorState 
          message="Не удалось загрузить задания флористов"
          onRetry={() => refetchTasks()}
        />
      </div>
    )
  }

  const handleAssignTask = () => {
    if (!selectedTask || !assignForm.florist) {
      toast.error("Выберите флориста")
      return
    }

    const florist = floristsData.find(f => f.name === assignForm.florist)
    if (!florist) {
      toast.error("Флорист не найден")
      return
    }

    // Update task with additional notes if provided
    const mutation = assignForm.notes 
      ? productionApi.updateTask(selectedTask.id, { 
          floristId: florist.id, 
          status: 'in_progress' as TaskStatus,
          floristNotes: assignForm.notes 
        })
      : productionApi.assignTask(selectedTask.id, florist.id)

    assignTaskMutation.mutate({
      taskId: selectedTask.id,
      floristId: florist.id
    })
  }

  const handleStartTask = (task: FloristTask) => {
    startTaskMutation.mutate({
      taskId: task.id
    })
  }

  const handleCompleteTask = (task: FloristTask) => {
    completeTaskMutation.mutate({
      taskId: task.id
    })
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: FloristTask) => {
    setDraggedTaskId(task.id)
    e.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task.id,
      currentStatus: task.status
    }))
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDraggedTaskId(null)
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { taskId, currentStatus } = data
    
    if (currentStatus !== targetStatus) {
      updateTaskStatusMutation.mutate({ taskId, status: targetStatus })
    }
  }

  const TaskCard = ({ task }: { task: FloristTask }) => {
    const StatusIcon = statusConfig[task.status].icon
    const isOverdue = new Date() > task.requiredBy && task.status !== "completed"

    const isDragging = draggedTaskId === task.id

    return (
      <Card 
        className={`${isOverdue ? "border-destructive" : ""} ${isDragging ? "opacity-50" : ""} cursor-move transition-opacity`}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
      >
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
                  disabled={assignTaskMutation.isPending}
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
                  disabled={completeTaskMutation.isPending}
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
              {statsLoading ? "..." : (queueStats?.pendingTasks || 0)}
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
              {statsLoading ? "..." : (queueStats?.inProgressTasks || 0)}
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
              {statsLoading ? "..." : (tasks.filter(t => t.status === "completed").length)}
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
              {statsLoading ? "..." : (queueStats?.overdueTasks || 0)}
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
            <div 
              className={`space-y-3 min-h-[600px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                draggedTaskId 
                  ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950" 
                  : "border-transparent hover:border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "pending")}
            >
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
            <div 
              className={`space-y-3 min-h-[600px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                draggedTaskId 
                  ? "border-blue-300 bg-blue-50 dark:bg-blue-950" 
                  : "border-transparent hover:border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "in_progress")}
            >
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
            <div 
              className={`space-y-3 min-h-[600px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                draggedTaskId 
                  ? "border-green-300 bg-green-50 dark:bg-green-950" 
                  : "border-transparent hover:border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "completed")}
            >
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
            <Button 
              onClick={handleAssignTask}
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? "Назначаем..." : "Назначить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}