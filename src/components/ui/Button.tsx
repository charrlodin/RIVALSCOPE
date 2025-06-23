import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  brutal?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', brutal = true, ...props }, ref) => {
    return (
      <button
        className={cn(
          'font-bold uppercase tracking-wider transition-all duration-200 active:translate-x-1 active:translate-y-1',
          brutal && 'border-4 border-black shadow-brutal active:shadow-none',
          {
            'bg-brutalist-yellow hover:bg-yellow-300 text-black': variant === 'primary',
            'bg-brutalist-pink hover:bg-pink-400 text-black': variant === 'secondary',
            'bg-brutalist-red hover:bg-red-500 text-white': variant === 'danger',
            'bg-transparent hover:bg-black hover:text-white text-black border-black': variant === 'ghost',
          },
          {
            'px-3 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;