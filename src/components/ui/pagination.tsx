// components/ui/pagination.tsx
'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import type { ButtonProps } from './button'
import { cn } from '@/lib/utils'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
)
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
)
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  )
)
PaginationItem.displayName = 'PaginationItem'

interface PaginationButtonProps extends ButtonProps {
  isActive?: boolean
}

const PaginationButton = ({
  className,
  isActive,
  size = 'sm',
  ...props
}: PaginationButtonProps) => (
  <Button
    aria-current={isActive ? 'page' : undefined}
    variant={isActive ? 'outline' : 'ghost'}
    size={size}
    className={cn(
      'h-8 w-8 p-0',
      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
      className
    )}
    {...props}
  />
)

const PaginationPrevious = ({
  className,
  disabled,
  ...props
}: PaginationButtonProps) => (
  <PaginationButton
    aria-label="Go to previous page"
    disabled={disabled}
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Previous</span>
  </PaginationButton>
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({
  className,
  disabled,
  ...props
}: PaginationButtonProps) => (
  <PaginationButton
    aria-label="Go to next page"
    disabled={disabled}
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span className="sr-only">Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
)
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    •••
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}