import { useState } from "react"
import { format } from "date-fns"
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
  AlertCircle
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

import type { SystemUser, UserRole } from "@/lib/types"

// Mock roles
const mockRoles: UserRole[] = [
  {
    id: "admin",
    name: "Администратор",
    permissions: [
      "orders.view", "orders.create", "orders.edit", "orders.delete",
      "customers.view", "customers.create", "customers.edit", "customers.delete",
      "warehouse.view", "warehouse.edit",
      "production.view", "production.edit",
      "settings.view", "settings.edit",
      "users.view", "users.create", "users.edit", "users.delete"
    ]
  },
  {
    id: "manager",
    name: "Менеджер",
    permissions: [
      "orders.view", "orders.create", "orders.edit",
      "customers.view", "customers.create", "customers.edit",
      "warehouse.view",
      "production.view"
    ]
  },
  {
    id: "florist",
    name: "Флорист",
    permissions: [
      "production.view", "production.edit",
      "warehouse.view"
    ]
  }
]

// Mock users
const mockUsers: SystemUser[] = [
  {
    id: "1",
    name: "Айгуль Администратор",
    email: "admin@cvety.kz",
    phone: "+7 (701) 111-11-11",
    role: mockRoles[0],
    isActive: true,
    createdAt: new Date("2023-01-01"),
    lastLoginAt: new Date("2024-01-26T08:00:00")
  },
  {
    id: "2",
    name: "Марина Флорист",
    email: "marina@cvety.kz",
    phone: "+7 (702) 222-22-22",
    role: mockRoles[2],
    isActive: true,
    createdAt: new Date("2023-03-15"),
    lastLoginAt: new Date("2024-01-26T09:00:00")
  },
  {
    id: "3",
    name: "Самат Менеджер",
    email: "samat@cvety.kz",
    phone: "+7 (703) 333-33-33",
    role: mockRoles[1],
    isActive: false,
    createdAt: new Date("2023-06-01"),
    lastLoginAt: new Date("2024-01-20T15:00:00")
  }
]

// Available permissions
const allPermissions = [
  { group: "Заказы", permissions: [
    { id: "orders.view", name: "Просмотр заказов" },
    { id: "orders.create", name: "Создание заказов" },
    { id: "orders.edit", name: "Редактирование заказов" },
    { id: "orders.delete", name: "Удаление заказов" }
  ]},
  { group: "Клиенты", permissions: [
    { id: "customers.view", name: "Просмотр клиентов" },
    { id: "customers.create", name: "Добавление клиентов" },
    { id: "customers.edit", name: "Редактирование клиентов" },
    { id: "customers.delete", name: "Удаление клиентов" }
  ]},
  { group: "Склад", permissions: [
    { id: "warehouse.view", name: "Просмотр склада" },
    { id: "warehouse.edit", name: "Управление складом" }
  ]},
  { group: "Производство", permissions: [
    { id: "production.view", name: "Просмотр заданий" },
    { id: "production.edit", name: "Управление заданиями" }
  ]},
  { group: "Настройки", permissions: [
    { id: "settings.view", name: "Просмотр настроек" },
    { id: "settings.edit", name: "Изменение настроек" }
  ]},
  { group: "Пользователи", permissions: [
    { id: "users.view", name: "Просмотр пользователей" },
    { id: "users.create", name: "Добавление пользователей" },
    { id: "users.edit", name: "Редактирование пользователей" },
    { id: "users.delete", name: "Удаление пользователей" }
  ]}
]

export function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(mockUsers)
  const [roles] = useState<UserRole[]>(mockRoles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: ""
  })

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query)) ||
      user.role.name.toLowerCase().includes(query)
    )
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.roleId) {
      toast.error("Заполните все обязательные поля")
      return
    }

    const role = roles.find(r => r.id === newUser.roleId)
    if (!role) return

    const user: SystemUser = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: role,
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: undefined
    }

    setUsers([...users, user])
    toast.success("Пользователь добавлен")
    setIsAddUserDialogOpen(false)
    setNewUser({ name: "", email: "", phone: "", roleId: "" })
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ))
    toast.success("Статус пользователя изменен")
  }

  const handleResetPassword = (user: SystemUser) => {
    toast.success(`Ссылка для сброса пароля отправлена на ${user.email}`)
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
    toast.success("Пользователь удален")
  }

  const handleEditRole = (role: UserRole) => {
    setSelectedRole(role)
    setRolePermissions(role.permissions)
    setIsEditRoleDialogOpen(true)
  }

  const handleTogglePermission = (permissionId: string) => {
    if (rolePermissions.includes(permissionId)) {
      setRolePermissions(rolePermissions.filter(p => p !== permissionId))
    } else {
      setRolePermissions([...rolePermissions, permissionId])
    }
  }

  const handleSaveRole = () => {
    if (!selectedRole) return

    // In real app, save to backend
    toast.success("Права роли обновлены")
    setIsEditRoleDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление пользователями</h1>
          <p className="text-muted-foreground">
            Управление доступом и правами пользователей
          </p>
        </div>
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пользователь</DialogTitle>
              <DialogDescription>
                Добавьте нового пользователя в систему
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">ФИО *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Роль *</Label>
                <Select 
                  value={newUser.roleId} 
                  onValueChange={(value) => setNewUser({ ...newUser, roleId: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddUser}>
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <PageFilters
        config={{
          searchPlaceholder: "Поиск пользователей по имени, email, телефону или роли",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery
        }}
      />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Пользователи системы</CardTitle>
          <CardDescription>
            Все пользователи с доступом к CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredUsers}
            columns={[
              {
                key: 'name',
                label: 'Пользователь',
                render: (value, user) => (
                  <div>
                    <div className="font-medium">{value as string}</div>
                    <div className="text-sm text-muted-foreground">
                      Добавлен {format(user.createdAt, "dd.MM.yyyy")}
                    </div>
                  </div>
                ),
                priority: 0
              },
              {
                key: 'role',
                label: 'Роль',
                render: (value) => (
                  <Badge variant="secondary">
                    {(value as any).name}
                  </Badge>
                ),
                priority: 1
              },
              {
                key: 'isActive',
                label: 'Статус',
                render: (value) => (
                  <Badge variant={value ? "default" : "secondary"}>
                    {value ? (
                      <><Check className="mr-1 h-3 w-3" /> Активен</>
                    ) : (
                      <><X className="mr-1 h-3 w-3" /> Заблокирован</>
                    )}
                  </Badge>
                ),
                priority: 2
              },
              {
                key: 'lastLoginAt',
                label: 'Последний вход',
                render: (value) => (
                  <div className="text-sm text-muted-foreground">
                    {value 
                      ? format(value as Date, "dd.MM.yyyy HH:mm")
                      : "Не входил"
                    }
                  </div>
                ),
                hideOnMobile: true
              },
              {
                key: 'email',
                label: 'Контакты',
                render: (value, user) => (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      {value as string}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                ),
                hideOnMobile: true
              }
            ]}
            mobileCardTitle={(user) => user.name}
            mobileCardSubtitle={(user) => (user.role as any).name}
            mobileCardActions={(user) => (
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
                    onClick={() => handleToggleUserStatus(user.id)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {user.isActive ? "Заблокировать" : "Разблокировать"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleResetPassword(user)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Сбросить пароль
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Удалить пользователя
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </CardContent>
      </Card>

      {/* Roles Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Роли и права доступа
          </CardTitle>
          <CardDescription>
            Настройка прав доступа для разных ролей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{role.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {role.permissions.length} разрешений
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRole(role)}
                >
                  Настроить права
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          При добавлении нового пользователя на указанный email будет отправлена ссылка для установки пароля.
        </AlertDescription>
      </Alert>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Настройка прав: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Выберите разрешения для этой роли
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {allPermissions.map(group => (
                <div key={group.group}>
                  <h4 className="font-medium mb-3">{group.group}</h4>
                  <div className="space-y-2">
                    {group.permissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={rolePermissions.includes(permission.id)}
                          onCheckedChange={() => handleTogglePermission(permission.id)}
                        />
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveRole}>
              Сохранить права
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}