import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-border', className)}
      {...props}
    />
  )
}
