import { useState } from "react"
import { format } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Phone,
  MoreHorizontal,
  Check,
  X,
  Key,
  UserCheck,
  AlertCircle,
  Loader2,
  Search
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { PageFilters } from "@/components/ui/page-filters"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { FormShell } from "@/components/ui/form-shell"
import { FORM_WIDTHS, BUTTON_CLASSES } from "@/lib/constants"

import type { User, UserRole, UserPermissions, UserCreate } from "@/lib/types"
import { usersApi } from "@/lib/api"

// Role names mapping
const roleNames: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  florist: "Флорист",
  courier: "Курьер"
}

// Permission names mapping
const permissionNames: Record<keyof UserPermissions, string> = {
  orders: "Заказы",
  warehouse: "Склад",
  customers: "Клиенты",
  production: "Производство",
  settings: "Настройки",
  users: "Пользователи"
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>()
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermissions>({
    orders: false,
    warehouse: false,
    customers: false,
    production: false,
    settings: false,
    users: false
  })
  
  const [newUser, setNewUser] = useState<UserCreate>({
    name: "",
    email: "",
    phone: "",
    role: "manager",
    isActive: true
  })

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', searchQuery, selectedRole],
    queryFn: async () => {
      const response = await usersApi.getAll({
        search: searchQuery || undefined,
        role: selectedRole || undefined
      });
      console.log('API Response:', response);
      console.log('Users data:', response?.items);
      return response;
    }
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success("Пользователь добавлен")
      setIsAddUserDialogOpen(false)
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "manager",
        isActive: true
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка при добавлении пользователя")
    }
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      usersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success("Пользователь обновлен")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка при обновлении пользователя")
    }
  })

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: UserPermissions }) => 
      usersApi.updatePermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success("Права доступа обновлены")
      setIsPermissionsDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка при обновлении прав доступа")
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success("Пользователь удален")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка при удалении пользователя")
    }
  })

  const handleAddUser = () => {
    // Format phone to +7XXXXXXXXXX
    const formattedPhone = newUser.phone.replace(/\D/g, '')
    const phoneFormatted = formattedPhone.startsWith('7') 
      ? `+${formattedPhone}` 
      : `+7${formattedPhone}`

    createUserMutation.mutate({
      ...newUser,
      phone: phoneFormatted
    })
  }

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      updates: { isActive: !user.isActive }
    })
  }

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user)
    // Use default permissions if user doesn't have permissions property
    const defaultPermissions: UserPermissions = {
      orders: false,
      warehouse: false,
      customers: false,
      production: false,
      settings: false,
      users: false
    }
    setSelectedPermissions(user.permissions || defaultPermissions)
    setIsPermissionsDialogOpen(true)
  }

  const handleUpdatePermissions = () => {
    if (!selectedUser) return
    
    updatePermissionsMutation.mutate({
      id: selectedUser.id,
      permissions: selectedPermissions
    })
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm("Вы уверены, что хотите удалить пользователя?")) {
      deleteUserMutation.mutate(userId)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 1) return numbers
    if (numbers.length <= 4) return `+${numbers}`
    if (numbers.length <= 7) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4)}`
    if (numbers.length <= 10) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`
    return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`
  }

  const filteredUsers = usersData?.items || []

  return (
    <FormShell maxWidth="6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
            <p className="text-muted-foreground">
              Управление доступом сотрудников к системе
            </p>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className={BUTTON_CLASSES.FULL_MOBILE}>
                <UserPlus className="mr-2 h-4 w-4" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новый пользователь</DialogTitle>
                <DialogDescription>
                  Добавьте нового сотрудника в систему
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">ФИО</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    className={FORM_WIDTHS.NAME}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email || ""}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ivan@cvety.kz"
                    className={FORM_WIDTHS.EMAIL}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formatPhone(newUser.phone)}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+7 (700) 123-45-67"
                    className={FORM_WIDTHS.PHONE}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Роль</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger id="role" className={FORM_WIDTHS.SHORT_TEXT}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleNames).map(([value, name]) => (
                        <SelectItem key={value} value={value}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.phone || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Добавить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени, email или телефону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedRole || "all"}
                onValueChange={(value) => setSelectedRole(value === "all" ? undefined : value as UserRole)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  {Object.entries(roleNames).map(([value, name]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Пользователи не найдены</p>
              <p className="text-sm text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left font-medium">Пользователь</th>
                      <th className="p-4 text-left font-medium">Контакты</th>
                      <th className="p-4 text-left font-medium">Роль</th>
                      <th className="p-4 text-left font-medium">Статус</th>
                      <th className="p-4 text-left font-medium">Дата создания</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4">
                        <div className="font-medium">{user.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                          {user.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          <Shield className="mr-1 h-3 w-3" />
                          {roleNames[user.role]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleUserStatus(user)}
                          disabled={user.role === 'admin' || updateUserMutation.isPending}
                        />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(user.createdAt, "dd.MM.yyyy")}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenPermissions(user)}
                              disabled={user.role === 'admin'}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Права доступа
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === 'admin'}
                              className="text-destructive"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Права доступа</DialogTitle>
              <DialogDescription>
                Настройте права доступа для {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(permissionNames).map(([key, name]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{name}</h4>
                      <Switch
                        checked={selectedPermissions[key as keyof UserPermissions]}
                        onCheckedChange={(checked) => 
                          setSelectedPermissions(prev => ({
                            ...prev,
                            [key]: checked
                          }))
                        }
                      />
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPermissionsDialogOpen(false)
                  setSelectedUser(null)
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpdatePermissions}
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Администраторы имеют полный доступ ко всем разделам системы. 
            Права других пользователей настраиваются индивидуально.
          </AlertDescription>
        </Alert>
      </div>
    </FormShell>
  )
}