'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <AlertTriangle className="mb-6 h-24 w-24 text-red-400" />
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">500</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Something went wrong</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <Button className="mt-8" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
