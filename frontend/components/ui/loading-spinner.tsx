import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <Loader2 className={cn('animate-spin text-blue-600 dark:text-blue-400', sizeMap[size], className)} />
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
