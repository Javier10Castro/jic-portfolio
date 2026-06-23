'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  function validate(): boolean {
    if (!name.trim()) { setValidationError('Name is required'); return false; }
    if (!email.trim()) { setValidationError('Email is required'); return false; }
    if (password.length < 8) { setValidationError('Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { setValidationError('Passwords do not match'); return false; }
    setValidationError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      router.push('/dashboard');
    } catch {
      // Error handled by store
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">P</div>
        </Link>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Get started with Platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || validationError) && (
            <Alert variant="error">
              <AlertDescription>{validationError || error}</AlertDescription>
            </Alert>
          )}
          <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          <Button type="submit" className="w-full" loading={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
