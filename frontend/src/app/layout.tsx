'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import PageTransition from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PageTransition />
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
