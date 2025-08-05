import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, className, ...props }: PhoneInputProps) {
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '')
    
    // Limit to 11 digits (7 + 10 digits for Kazakhstan)
    const limited = digits.slice(0, 11)
    
    // Format according to +7 (XXX) XXX-XX-XX
    if (limited.length === 0) return ''
    if (limited.length === 1 && limited[0] === '7') return '+7'
    if (limited.length === 1) return '+7 ' + limited
    
    let formatted = ''
    if (limited.startsWith('7')) {
      formatted = '+' + limited
    } else {
      formatted = '+7' + limited
    }
    
    // Remove the country code for formatting
    const withoutCountry = formatted.slice(2)
    
    if (withoutCountry.length > 0) {
      formatted = '+7 '
      
      // Area code
      if (withoutCountry.length <= 3) {
        formatted += `(${withoutCountry}`
      } else {
        formatted += `(${withoutCountry.slice(0, 3)}) `
        
        // First part
        if (withoutCountry.length <= 6) {
          formatted += withoutCountry.slice(3)
        } else {
          formatted += withoutCountry.slice(3, 6)
          
          // Second part
          if (withoutCountry.length <= 8) {
            formatted += `-${withoutCountry.slice(6)}`
          } else {
            formatted += `-${withoutCountry.slice(6, 8)}`
            
            // Third part
            if (withoutCountry.length > 8) {
              formatted += `-${withoutCountry.slice(8, 10)}`
            }
          }
        }
      }
    }
    
    return formatted
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    onChange(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to work naturally
    if (e.key === 'Backspace' && value.endsWith(' ') || value.endsWith('(')) {
      e.preventDefault()
      const newValue = value.slice(0, -1)
      onChange(formatPhoneNumber(newValue))
    }
  }

  return (
    <Input
      {...props}
      type="tel"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="+7 (___) ___-__-__"
      className={cn("font-mono h-9", className)}
      maxLength={18} // +7 (XXX) XXX-XX-XX
    />
  )
}