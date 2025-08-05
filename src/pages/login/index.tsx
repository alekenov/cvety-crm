import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormShell } from "@/components/ui/form-shell"
import { FORM_WIDTHS, BUTTON_CLASSES } from "@/lib/constants"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { authApi } from "@/lib/api"

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 1) return numbers
    if (numbers.length <= 4) return `+${numbers}`
    if (numbers.length <= 7) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4)}`
    if (numbers.length <= 10) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`
    return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\s/g, '')
      const response = await authApi.requestOtp(cleanPhone)
      
      if (response.delivery_method === 'debug' && response.otp) {
        setError(`Тестовый режим: Ваш код ${response.otp}`)
      }
      
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке кода')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\s/g, '')
      const response = await authApi.verifyOtp(cleanPhone, otp)
      
      localStorage.setItem('authToken', response.access_token)
      navigate(returnUrl)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <FormShell maxWidth="md" className="w-full">
        <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🌸 Cvety.kz</CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Войдите в систему управления' : 'Введите код из Telegram'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 701 123 45 67"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  disabled={loading}
                  autoComplete="tel"
                  className={FORM_WIDTHS.PHONE}
                />
                <p className="text-sm text-muted-foreground">
                  Для получения кода подтверждения, сначала напишите боту{' '}
                  <a 
                    href="https://t.me/lekenbot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @lekenbot
                  </a>{' '}
                  ваш номер телефона
                </p>
              </div>

              {error && (
                <Alert variant={error.includes('Тестовый режим') ? 'default' : 'destructive'}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className={BUTTON_CLASSES.ACTION} disabled={loading || phone.length < 11}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Получить код'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Код подтверждения</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={FORM_WIDTHS.SHORT_ID}
                />
                <p className="text-sm text-muted-foreground">
                  Код отправлен в Telegram на номер {phone}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button type="submit" className={BUTTON_CLASSES.ACTION} disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    'Войти'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={BUTTON_CLASSES.ACTION}
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError('')
                  }}
                  disabled={loading}
                >
                  Изменить номер
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        </Card>
      </FormShell>
    </div>
  )
}