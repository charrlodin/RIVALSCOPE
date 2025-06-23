import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  brutal?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, brutal = true, ...props }, ref) => {
    return (
      <input
        className={cn(
          'w-full px-4 py-3 font-mono text-base focus:outline-none transition-all duration-200',
          brutal && 'border-4 border-black shadow-brutal-sm focus:shadow-brutal',
          'bg-white placeholder:text-gray-500 focus:bg-brutalist-yellow',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;