import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <FileQuestion className="mb-6 h-24 w-24 text-gray-400" />
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Page not found</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <div className="mt-8 flex gap-4">
        <Link href="/"><Button variant="outline">Go Home</Button></Link>
        <Link href="/dashboard"><Button>Dashboard</Button></Link>
      </div>
    </div>
  );
}
