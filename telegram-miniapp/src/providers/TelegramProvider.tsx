import { createContext, useContext, ReactNode, useEffect } from 'react'

// Расширяем Window для типов Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        enableClosingConfirmation: () => void
        disableClosingConfirmation: () => void
        isClosingConfirmationEnabled: boolean
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        BackButton: {
          isVisible: boolean
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error?: string) => void) => void
          getItem: (key: string, callback: (error?: string, value?: string) => void) => void
          getItems: (keys: string[], callback: (error?: string, values?: Record<string, string>) => void) => void
          removeItem: (key: string, callback?: (error?: string) => void) => void
          removeItems: (keys: string[], callback?: (error?: string) => void) => void
          getKeys: (callback: (error?: string, keys?: string[]) => void) => void
        }
        initData: string
        initDataUnsafe: {
          query_id?: string
          user?: {
            id: number
            is_bot?: boolean
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
          }
          receiver?: {
            id: number
            is_bot?: boolean
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
          }
          contact?: {
            phone_number: string
            first_name: string
            last_name?: string
            user_id?: number
          }
          chat?: {
            id: number
            type: string
            title?: string
            username?: string
            photo_url?: string
          }
          chat_type?: string
          chat_instance?: string
          start_param?: string
          can_send_after?: number
          auth_date: number
          hash: string
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
          header_bg_color?: string
          accent_text_color?: string
          section_bg_color?: string
          section_header_text_color?: string
          subtitle_text_color?: string
          destructive_text_color?: string
        }
        colorScheme: 'light' | 'dark'
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isExpanded: boolean
        sendData: (data: string) => void
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text?: string
          }>
        }, callback?: (button_id?: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        showScanQrPopup: (params?: { text?: string }, callback?: (text: string) => boolean | void) => void
        closeScanQrPopup: () => void
        readTextFromClipboard: (callback?: (text: string) => void) => void
        requestWriteAccess: (callback?: (granted: boolean) => void) => void
        requestContact: (callback?: (shared: boolean) => void) => void
        onEvent: (eventType: string, callback: () => void) => void
        offEvent: (eventType: string, callback: () => void) => void
        invokeCustomMethod: (method: string, params?: any, callback?: (result: any) => void) => void
        isVersionAtLeast: (version: string) => boolean
        platform: string
        version: string
      }
    }
  }
}

interface TelegramContextValue {
  user: {
    id: number
    firstName: string
    lastName?: string
    username?: string
    languageCode?: string
  } | null
  contact: {
    phoneNumber?: string
    firstName?: string
    lastName?: string
    userId?: number
  } | null
  haptic: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  storage: {
    set: (key: string, value: string) => Promise<void>
    get: (key: string) => Promise<string | null>
    remove: (key: string) => Promise<void>
  }
  requestPhone: () => Promise<string | null>
  webApp: any | null
}

const TelegramContext = createContext<TelegramContextValue | null>(null)

export function TelegramProvider({ children }: { children: ReactNode }) {
  const tg = window.Telegram?.WebApp || null
  
  // Инициализация WebApp при монтировании компонента
  useEffect(() => {
    if (tg) {
      // Сообщаем Telegram, что приложение готово
      tg.ready()
      
      // Разворачиваем приложение на весь экран
      tg.expand()
      
      // Настраиваем цвета в соответствии с темой Telegram
      if (tg.themeParams.bg_color) {
        tg.setBackgroundColor(tg.themeParams.bg_color)
      }
      if (tg.themeParams.header_bg_color) {
        tg.setHeaderColor(tg.themeParams.header_bg_color)
      }
      
      // Обработка событий WebApp
      const handleThemeChanged = () => {
        console.log('Theme changed:', tg.colorScheme)
        // Можно добавить логику обновления темы
        if (tg.themeParams.bg_color) {
          tg.setBackgroundColor(tg.themeParams.bg_color)
        }
      }
      
      const handleViewportChanged = () => {
        console.log('Viewport changed:', {
          height: tg.viewportHeight,
          stableHeight: tg.viewportStableHeight,
          isExpanded: tg.isExpanded
        })
      }
      
      // Подписываемся на события
      tg.onEvent('themeChanged', handleThemeChanged)
      tg.onEvent('viewportChanged', handleViewportChanged)
      
      // Логируем информацию для отладки
      console.log('Telegram WebApp initialized:', {
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme,
        viewportHeight: tg.viewportHeight,
        isExpanded: tg.isExpanded,
        initData: tg.initData ? 'present' : 'missing',
        user: tg.initDataUnsafe?.user,
        startParam: tg.initDataUnsafe?.start_param
      })
      
      // Очищаем обработчики при размонтировании
      return () => {
        tg.offEvent('themeChanged', handleThemeChanged)
        tg.offEvent('viewportChanged', handleViewportChanged)
      }
    } else {
      console.warn('Telegram WebApp not available')
    }
  }, [])
  
  const value: TelegramContextValue = {
    user: tg?.initDataUnsafe?.user ? {
      id: tg.initDataUnsafe.user.id,
      firstName: tg.initDataUnsafe.user.first_name,
      lastName: tg.initDataUnsafe.user.last_name,
      username: tg.initDataUnsafe.user.username,
      languageCode: tg.initDataUnsafe.user.language_code,
    } : null,
    contact: tg?.initDataUnsafe?.contact ? {
      phoneNumber: tg.initDataUnsafe.contact.phone_number,
      firstName: tg.initDataUnsafe.contact.first_name,
      lastName: tg.initDataUnsafe.contact.last_name,
      userId: tg.initDataUnsafe.contact.user_id,
    } : null,
    haptic: {
      impactOccurred: (style) => {
        tg?.HapticFeedback?.impactOccurred?.(style)
      },
      notificationOccurred: (type) => {
        tg?.HapticFeedback?.notificationOccurred?.(type)
      },
      selectionChanged: () => {
        tg?.HapticFeedback?.selectionChanged?.()
      },
    },
    storage: {
      set: async (key, value) => {
        return new Promise((resolve) => {
          if (tg?.CloudStorage) {
            tg.CloudStorage.setItem(key, value, () => resolve())
          } else {
            localStorage.setItem(key, value)
            resolve()
          }
        })
      },
      get: async (key) => {
        return new Promise((resolve) => {
          if (tg?.CloudStorage) {
            tg.CloudStorage.getItem(key, (error, value) => {
              resolve(error ? null : value || null)
            })
          } else {
            resolve(localStorage.getItem(key))
          }
        })
      },
      remove: async (key) => {
        return new Promise((resolve) => {
          if (tg?.CloudStorage) {
            tg.CloudStorage.removeItem(key, () => resolve())
          } else {
            localStorage.removeItem(key)
            resolve()
          }
        })
      },
    },
    requestPhone: async () => {
      return new Promise((resolve) => {
        if (tg?.requestContact) {
          tg.requestContact((shared: boolean) => {
            if (shared) {
              // После успешного получения контакта, он будет доступен в initDataUnsafe.contact
              // Но нам нужно будет получить его через событие
              const handleContactReceived = () => {
                const contact = tg.initDataUnsafe?.contact
                if (contact?.phone_number) {
                  resolve(contact.phone_number)
                } else {
                  resolve(null)
                }
              }
              
              // Добавляем небольшую задержку чтобы данные обновились
              setTimeout(handleContactReceived, 100)
            } else {
              resolve(null)
            }
          })
        } else {
          resolve(null)
        }
      })
    },
    webApp: tg,
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider')
  }
  return context
}