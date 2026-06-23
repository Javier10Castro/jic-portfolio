'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { api } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setIsLoading(true);
    setError('');
    try {
      await api.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We&apos;ve sent password reset instructions to {email}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/login"><Button variant="outline">Back to Sign In</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">P</div>
        </Link>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you reset instructions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (<Alert variant="error"><AlertDescription>{error}</AlertDescription></Alert>)}
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Button type="submit" className="w-full" loading={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Back to Sign In</Link>
      </CardFooter>
    </Card>
  );
}
