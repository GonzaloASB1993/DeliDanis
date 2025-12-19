import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const hasFlexClass = className?.includes('flex-1')

    return (
      <div className={cn('w-full', hasFlexClass && 'flex flex-col')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-dark mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={props.rows}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-border bg-white text-dark',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-200',
            'placeholder:text-dark-light/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none',
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

Textarea.displayName = 'Textarea'
