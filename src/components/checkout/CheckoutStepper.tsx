import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface CheckoutStepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function CheckoutStepper({ steps, currentStep, className }: CheckoutStepperProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative">
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="absolute inset-0 flex justify-between items-center px-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isActive = stepNumber === currentStep
            
            return (
              <div
                key={index}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                  "bg-background border-2 shadow-sm",
                  {
                    "border-primary bg-primary text-primary-foreground": isActive,
                    "border-primary bg-primary text-primary-foreground": isCompleted,
                    "border-muted-foreground/30": !isActive && !isCompleted,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Step labels */}
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div
              key={index}
              className={cn(
                "text-xs font-medium transition-colors duration-200",
                {
                  "text-primary": isActive || isCompleted,
                  "text-muted-foreground": !isActive && !isCompleted,
                }
              )}
            >
              <span className="hidden sm:inline">{step}</span>
              <span className="sm:hidden">{stepNumber}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}