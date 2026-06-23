import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className, indicatorClassName, showLabel = false, size = 'md' }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full">
        <div
          ref={ref}
          className={cn(
            'w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
            sizeMap[size],
            className
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              'h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400',
              indicatorClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
