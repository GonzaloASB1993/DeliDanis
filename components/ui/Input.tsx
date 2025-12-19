import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dark mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-border bg-white text-dark',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-200',
            'placeholder:text-dark-light/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-primary ring-2 ring-primary/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-primary">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-dark-light">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
