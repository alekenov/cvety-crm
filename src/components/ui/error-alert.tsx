import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Button } from "./button"

interface ErrorAlertProps {
  message?: string
  onRetry?: () => void
}

export function ErrorAlert({ message = "Произошла ошибка", onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="ml-4">
            Повторить
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Компонент для полноэкранной ошибки (как был раньше)
export function ErrorState({ message = "Произошла ошибка", onRetry }: ErrorAlertProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Повторить
        </Button>
      )}
    </div>
  )
}