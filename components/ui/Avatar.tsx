'use client'

import { forwardRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'busy'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

const statusClasses = {
  online: 'bg-success',
  offline: 'bg-dark-light/40',
  busy: 'bg-warning',
}

const statusSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

function getInitials(name?: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name, size = 'md', status, className }, ref) => {
    const [imgError, setImgError] = useState(false)
    const initials = getInitials(name)

    return (
      <div ref={ref} className={cn('relative inline-flex flex-shrink-0', className)}>
        <div
          className={cn(
            'rounded-full overflow-hidden flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          {src && !imgError ? (
            <Image
              src={src}
              alt={alt || name || 'Avatar'}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : initials ? (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center font-medium',
                'bg-primary/20 text-primary',
                sizeClasses[size]
              )}
            >
              {initials}
            </div>
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center',
                'bg-secondary text-dark-light'
              )}
            >
              <svg
                className="w-[60%] h-[60%]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
              statusClasses[status],
              statusSizeClasses[size]
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
