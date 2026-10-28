'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

export interface Transaction {
  id: string;
  time: string;
  date: string;
  cashier: string;
  terminal: string;
  itemsSummary: string;
  totalItems: number;
  subtotal: number;
  diskon: number;
  total: number;
  paymentMethod: 'Tunai' | 'QRIS';
  status: 'Berhasil' | 'Batal';
}

interface TransactionStats {
  totalCount: number;
  totalOmset: number;
  successCount: number;
  successRate: string;
  tunaiCount: number;
  tunaiOmset: number;
  qrisCount: number;
  qrisOmset: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterPayment: string;
  setFilterPayment: (p: string) => void;
  filterTerminal: string;
  setFilterTerminal: (t: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  resetFilters: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'time' | 'date'>) => void;
  stats: TransactionStats;
}

// Data awal mock sesuai transaksi PrekDuaDara
const initialTransactions: Transaction[] = [
  {
    id: '#TRX-202410-0192',
    time: '14:28:19',
    date: 'Hari ini',
    cashier: 'Rian Pratama',
    terminal: 'Kasir Pos-01',
    itemsSummary: '2x Ayam Geprek Bakar + Es Teh',
    totalItems: 2,
    subtotal: 36000,
    diskon: 0,
    total: 36000,
    paymentMethod: 'QRIS',
    status: 'Berhasil',
  },
  {
    id: '#TRX-202410-0191',
    time: '14:21:05',
    date: 'Hari ini',
    cashier: 'Siti Rahma',
    terminal: 'Kasir Pos-02',
    itemsSummary: '1x Ayam Geprek Biasa + Es Teh',
    totalItems: 1,
    subtotal: 17000,
    diskon: 0,
    total: 17000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
  },
  {
    id: '#TRX-202410-0190',
    time: '14:10:44',
    date: 'Hari ini',
    cashier: 'Rian Pratama',
    terminal: 'Kasir Pos-01',
    itemsSummary: '3x Ayam Geprek Bakar + Es Teh',
    totalItems: 3,
    subtotal: 54000,
    diskon: 0,
    total: 54000,
    paymentMethod: 'QRIS',
    status: 'Berhasil',
  },
  {
    id: '#TRX-202410-0189',
    time: '13:55:12',
    date: 'Hari ini',
    cashier: 'Budi Santoso',
    terminal: 'Kasir Pos-03',
    itemsSummary: '2x Ayam Geprek Biasa + Es Teh',
    totalItems: 2,
    subtotal: 34000,
    diskon: 0,
    total: 34000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
  },
  {
    id: '#TRX-202410-0188',
    time: '13:42:00',
    date: 'Hari ini',
    cashier: 'Siti Rahma',
    terminal: 'Kasir Pos-02',
    itemsSummary: '1x Ayam Geprek Bakar + Es Teh',
    totalItems: 1,
    subtotal: 18000,
    diskon: 0,
    total: 18000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
  },
];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  // State Utama: Daftar transaksi
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('Semua');
  const [filterTerminal, setFilterTerminal] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Reset semua filter
  const resetFilters = () => {
    setSearchQuery('');
    setFilterPayment('Semua');
    setFilterTerminal('Semua');
    setFilterStatus('Semua');
  };

  // Tambah Transaksi Baru (Dapat dipanggil dari modal order web)
  const addTransaction = (newTx: Omit<Transaction, 'id' | 'time' | 'date'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const idStr = `#TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullTx: Transaction = {
      ...newTx,
      id: idStr,
      time: timeStr,
      date: 'Hari ini',
    };

    setTransactions((prev) => [fullTx, ...prev]);
  };

  // Computed State: Filtered Transactions (Real-time reactivity)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Pencarian ID, Kasir, atau Item
      const matchSearch =
        searchQuery === '' ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cashier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter Metode Pembayaran
      const matchPayment =
        filterPayment === 'Semua' ||
        (filterPayment === 'Tunai' && tx.paymentMethod === 'Tunai') ||
        (filterPayment === 'QRIS' && tx.paymentMethod === 'QRIS');

      // Filter Terminal
      const matchTerminal =
        filterTerminal === 'Semua' || tx.terminal.includes(filterTerminal);

      // Filter Status
      const matchStatus =
        filterStatus === 'Semua' || tx.status === filterStatus;

      return matchSearch && matchPayment && matchTerminal && matchStatus;
    });
  }, [transactions, searchQuery, filterPayment, filterTerminal, filterStatus]);

  // Computed State: Statistik Transaksi Otomatis
  const stats = useMemo(() => {
    const totalCount = transactions.length;
    let totalOmset = 0;
    let tunaiCount = 0;
    let tunaiOmset = 0;
    let qrisCount = 0;
    let qrisOmset = 0;
    let successCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'Berhasil') {
        successCount++;
        totalOmset += tx.total;

        if (tx.paymentMethod === 'Tunai') {
          tunaiCount++;
          tunaiOmset += tx.total;
        } else if (tx.paymentMethod === 'QRIS') {
          qrisCount++;
          qrisOmset += tx.total;
        }
      }
    });

    const successRate =
      totalCount > 0 ? `${((successCount / totalCount) * 100).toFixed(1)}%` : '100%';

    return {
      totalCount,
      totalOmset,
      successCount,
      successRate,
      tunaiCount,
      tunaiOmset,
      qrisCount,
      qrisOmset,
    };
  }, [transactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        filteredTransactions,
        searchQuery,
        setSearchQuery,
        filterPayment,
        setFilterPayment,
        filterTerminal,
        setFilterTerminal,
        filterStatus,
        setFilterStatus,
        resetFilters,
        addTransaction,
        stats,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextType {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
