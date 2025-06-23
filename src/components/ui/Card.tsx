import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  brutal?: boolean;
  color?: 'yellow' | 'pink' | 'cyan' | 'green' | 'white';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, brutal = true, color = 'white', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'p-6',
          brutal && 'border-4 border-black shadow-brutal',
          {
            'bg-brutalist-yellow text-black': color === 'yellow',
            'bg-brutalist-pink text-black': color === 'pink',
            'bg-brutalist-cyan text-black': color === 'cyan',
            'bg-brutalist-green text-black': color === 'green',
            'bg-white text-black': color === 'white',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;