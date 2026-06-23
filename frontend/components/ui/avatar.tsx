import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = '', fallback, size = 'md', className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700',
          sizeMap[size],
          className
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {fallback || <User className="h-1/2 w-1/2" />}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
