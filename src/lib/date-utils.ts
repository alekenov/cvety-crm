export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Сегодня
  if (diffDays === 0 && d.getDate() === now.getDate()) {
    return `Сегодня, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Вчера
  if (diffDays === 1 || (diffDays === 0 && d.getDate() === now.getDate() - 1)) {
    return `Вчера, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // В пределах текущего года - не показываем год
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Для прошлых лет показываем год
  return d.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  
  // Сегодня
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  
  // В пределах текущего года
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit'
    })
  }
  
  // Для прошлых лет
  return d.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit',
    year: '2-digit'
  })
}