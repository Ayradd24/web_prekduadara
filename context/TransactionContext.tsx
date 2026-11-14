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
  branch?: string;
  orderType?: 'Dine-In' | 'Takeaway' | 'Ojol Delivery';
  addons?: string;
  relativeTime?: string;
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
  addSimulatedTransaction: () => void;
  stats: TransactionStats;
}

// Data awal mock sesuai transaksi PrekDuaDara (Single Source of Truth untuk Ringkasan & Transaksi)
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
    branch: 'Cabang Sudirman Utama',
    orderType: 'Dine-In',
    addons: '+ Sambal Korek Lv 3, Lalapan Segar',
    relativeTime: '12 Menit Lalu',
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
    branch: 'Cabang Tebet Eco Park',
    orderType: 'Takeaway',
    addons: '+ Sambal Bawang Lv 2, Kerupuk Kaleng',
    relativeTime: '19 Menit Lalu',
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
    branch: 'Cabang Sudirman Utama',
    orderType: 'Ojol Delivery',
    addons: '+ Tahu/Tempe Crispy, Sambal Pisah',
    relativeTime: '30 Menit Lalu',
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
    branch: 'Cabang Dago Heritage',
    orderType: 'Dine-In',
    addons: '+ Sambal Bawang Original Lv 4',
    relativeTime: '45 Menit Lalu',
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
    branch: 'Cabang Tebet Eco Park',
    orderType: 'Dine-In',
    addons: '+ Sambal Matah Segar, Nasi Pulen',
    relativeTime: '58 Menit Lalu',
  },
];

const SIMULATED_CASHIERS = [
  {
    cashier: 'Rian Pratama',
    terminal: 'Kasir Pos-01',
    branch: 'Cabang Sudirman Utama',
  },
  {
    cashier: 'Siti Rahma',
    terminal: 'Kasir Pos-02',
    branch: 'Cabang Tebet Eco Park',
  },
  {
    cashier: 'Budi Santoso',
    terminal: 'Kasir Pos-03',
    branch: 'Cabang Dago Heritage',
  },
];

const SIMULATED_MENUS = [
  {
    itemsSummary: '1x Ayam Geprek Bakar + Es Teh',
    addons: '+ Sambal Korek Lv 3, Lalapan Segar',
    orderType: 'Dine-In' as const,
    totalItems: 1,
    subtotal: 18000,
    diskon: 0,
    total: 18000,
  },
  {
    itemsSummary: '2x Ayam Geprek Biasa + Es Teh',
    addons: '+ Sambal Bawang Lv 2, Tahu Crispy',
    orderType: 'Takeaway' as const,
    totalItems: 2,
    subtotal: 34000,
    diskon: 0,
    total: 34000,
  },
  {
    itemsSummary: '2x Ayam Geprek Bakar + Es Teh',
    addons: '+ Sambal Korek Lv 4, Tempe Mendoan',
    orderType: 'Dine-In' as const,
    totalItems: 2,
    subtotal: 36000,
    diskon: 0,
    total: 36000,
  },
  {
    itemsSummary: '1x Paket Geprek Mozarella + Es Jeruk',
    addons: '+ Kulit Ayam Crispy, Sambal Pisah',
    orderType: 'Ojol Delivery' as const,
    totalItems: 1,
    subtotal: 25000,
    diskon: 0,
    total: 25000,
  },
  {
    itemsSummary: '3x Ayam Geprek Sambal Bawang + Es Teh',
    addons: '+ Kol Goreng, Kerupuk Kaleng',
    orderType: 'Dine-In' as const,
    totalItems: 3,
    subtotal: 51000,
    diskon: 2000,
    total: 49000,
  },
  {
    itemsSummary: '2x Paket Komplit Geprek + Tahu Crispy',
    addons: '+ 2 Es Teh Manis Jumbo, Sambal Uleg',
    orderType: 'Ojol Delivery' as const,
    totalItems: 2,
    subtotal: 42000,
    diskon: 0,
    total: 42000,
  },
];

const resolveBranchFromTerminal = (terminal: string): string => {
  if (terminal.includes('Pos-02')) return 'Cabang Tebet Eco Park';
  if (terminal.includes('Pos-03')) return 'Cabang Dago Heritage';
  return 'Cabang Sudirman Utama';
};

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
      branch: newTx.branch || resolveBranchFromTerminal(newTx.terminal),
      orderType: newTx.orderType || 'Dine-In',
      addons: newTx.addons || '+ Sambal Uleg Asli, Lalapan Segar',
      relativeTime: newTx.relativeTime || 'Baru Saja',
    };

    setTransactions((prev) => [fullTx, ...prev]);
  };

  // Simulasi Order Kasir Baru Secara Realistis
  const addSimulatedTransaction = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const chosenCashier =
      SIMULATED_CASHIERS[Math.floor(Math.random() * SIMULATED_CASHIERS.length)];
    const chosenMenu =
      SIMULATED_MENUS[Math.floor(Math.random() * SIMULATED_MENUS.length)];
    const paymentMethod: 'Tunai' | 'QRIS' = Math.random() > 0.5 ? 'QRIS' : 'Tunai';

    setTransactions((prev) => {
      // Cari nomor urut tertinggi dari format #TRX-202410-XXXX
      let maxSeq = 192;
      prev.forEach((t) => {
        const parts = t.id.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num < 9000 && num > maxSeq) {
          maxSeq = num;
        }
      });

      const nextId = `#TRX-202410-${String(maxSeq + 1).padStart(4, '0')}`;

      const simulatedTx: Transaction = {
        id: nextId,
        time: timeStr,
        date: 'Hari ini',
        cashier: chosenCashier.cashier,
        terminal: chosenCashier.terminal,
        itemsSummary: chosenMenu.itemsSummary,
        totalItems: chosenMenu.totalItems,
        subtotal: chosenMenu.subtotal,
        diskon: chosenMenu.diskon,
        total: chosenMenu.total,
        paymentMethod,
        status: 'Berhasil',
        branch: chosenCashier.branch,
        orderType: chosenMenu.orderType,
        addons: chosenMenu.addons,
        relativeTime: 'Baru Saja',
      };

      return [simulatedTx, ...prev];
    });
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
        addSimulatedTransaction,
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
