// components/ui/button.tsx
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        variant === 'outline' && 'border border-gray-300 text-gray-700 hover:bg-gray-100',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
        size === 'sm' && 'h-8 px-3',
        size === 'default' && 'h-10 px-4',
        size === 'lg' && 'h-12 px-6',
        className
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, type ButtonProps };