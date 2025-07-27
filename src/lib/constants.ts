import type { OrderStatus, IssueType } from './types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  paid: 'Оплачен',
  assembled: 'Собран',
  delivery: 'Доставка',
  self_pickup: 'Самовывоз',
  issue: 'Проблема'
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  new: 'info',
  paid: 'success',
  assembled: 'success',
  delivery: 'default',
  self_pickup: 'default',
  issue: 'destructive'
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  wrong_address: 'Неверный адрес',
  recipient_unavailable: 'Получатель недоступен',
  quality_issue: 'Проблема с качеством',
  wrong_order: 'Неверный заказ',
  delivery_delay: 'Задержка доставки',
  other: 'Другое'
}

export const VARIETIES = [
  'Роза',
  'Тюльпан',
  'Хризантема',
  'Лилия',
  'Гербера',
  'Пион',
  'Орхидея',
  'Гвоздика',
  'Ирис',
  'Фрезия'
] as const

export const FARMS = [
  'Эквадор Розы',
  'Голландия Флауэрс',
  'Кения Блум',
  'Колумбия Петалс',
  'Местная ферма'
] as const

export const SUPPLIERS = [
  'ООО "ЦветОпт"',
  'ИП Иванов',
  'Flower Direct',
  'Bloom Trading',
  'Местный поставщик'
] as const

export const HEIGHTS = [40, 50, 60, 70, 80, 90, 100] as const

export const CURRENCIES = ['KZT', 'USD', 'EUR'] as const

export const DATE_FORMAT = 'dd.MM.yyyy'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm'

export const PHONE_REGEX = /^\+?[78]\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/

export const DEFAULT_CURRENCY = 'KZT'
export const DEFAULT_MARKUP_PERCENT = 100