import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular' | 'text'
  width?: string | number
  height?: string | number
  lines?: number
  animation?: 'pulse' | 'wave' | 'none'
}

function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  lines = 1,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-muted"
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-wave",
    none: ""
  }
  
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded-sm"
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              animationClasses[animation],
              variantClasses[variant],
              index === lines - 1 && "w-3/4" // Last line is shorter
            )}
            style={{
              width: index === lines - 1 ? '75%' : width || '100%',
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

export { Skeleton }