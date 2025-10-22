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
      <head>
        <title>bvodo - Corporate Travel Made Simple</title>
        <meta name="description" content="Streamline your organization's travel booking with bvodo. Manage flights, hotels, budgets, and approvals effortlessly." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <PageTransition />
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
