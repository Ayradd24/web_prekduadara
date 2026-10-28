'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { StokProvider } from '@/context/StokContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TransactionProvider>
        <StokProvider>{children}</StokProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}
