import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Platform — AI-Powered Application Development',
    template: '%s | Platform',
  },
  description:
    'Build, deploy, and manage AI-powered applications with our comprehensive platform. Featuring AI Studio, workflow automation, and intelligent deployment.',
  keywords: ['AI', 'platform', 'development', 'deployment', 'workflow', 'studio'],
  openGraph: {
    title: 'Platform — AI-Powered Application Development',
    description:
      'Build, deploy, and manage AI-powered applications with our comprehensive platform.',
    type: 'website',
    siteName: 'Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform — AI-Powered Application Development',
    description:
      'Build, deploy, and manage AI-powered applications with our comprehensive platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
