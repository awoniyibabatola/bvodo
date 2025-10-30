'use client';

import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import PageTransition from '@/components/PageTransition';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>bvodo - Corporate Travel Made Simple</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Streamline your organization's travel booking with bvodo. Manage flights, hotels, budgets, and approvals effortlessly." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={dmSans.className}>
        <PageTransition />
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
