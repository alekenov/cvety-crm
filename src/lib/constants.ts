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

// Form width constants based on FORM_STANDARDS.md
export const FORM_WIDTHS = {
  // Text inputs
  PHONE: 'max-w-[200px]',
  SHORT_ID: 'max-w-[150px]',
  EMAIL: 'max-w-sm',
  NAME: 'max-w-sm',
  COMPANY_NAME: 'max-w-md',
  SHORT_TEXT: 'max-w-md',
  SEARCH: 'max-w-md',
  URL: 'max-w-lg',
  
  // Date & Time
  DATE_PICKER: 'max-w-xs',
  TIME_SELECT: 'max-w-[120px]',
  DATE_RANGE: 'max-w-sm',
  
  // Numbers & Currency
  CURRENCY: 'max-w-[150px]',
  QUANTITY: 'max-w-[100px]',
  PERCENTAGE: 'max-w-[100px]',
  LARGE_NUMBER: 'max-w-[200px]',
  
  // Textareas
  ADDRESS: 'max-w-xl',
  COMMENT: 'max-w-xl',
  DESCRIPTION: 'max-w-2xl',
  IMPORT_DATA: 'max-w-2xl',
  
  // Select dropdowns
  STATUS: 'max-w-[200px]',
  CURRENCY_SELECT: 'max-w-[150px]',
  LOCATION: 'max-w-xs',
  PRODUCT_SELECT: 'max-w-sm',
  
  // Form containers
  FORM_FULL: 'max-w-4xl',
  FORM_SECTION: 'max-w-2xl',
  FORM_INLINE: 'max-w-xl',
  FORM_DIALOG: 'max-w-lg',
} as const

// Responsive button classes
export const BUTTON_CLASSES = {
  ACTION: 'w-full md:w-auto md:max-w-sm',
  FULL_MOBILE: 'w-full md:w-auto',
  PREVIEW: 'max-w-sm',
} as const

// Common input class combinations
export const INPUT_CLASSES = {
  PHONE_RESPONSIVE: 'w-full md:max-w-[200px]',
  NAME_RESPONSIVE: 'w-full md:max-w-sm',
  EMAIL_RESPONSIVE: 'w-full md:max-w-sm',
  SEARCH_RESPONSIVE: 'w-full md:max-w-md',
} as const