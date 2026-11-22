'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';

export interface TransactionItem {
  productId?: number | null;
  name: string;
  category?: string;
  sambal?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  time: string;
  date: string;
  rawCreatedAt?: string;
  isToday?: boolean;
  cashier: string;
  terminal: string;
  itemsSummary: string;
  items?: TransactionItem[];
  sambalSummary?: string;
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
  isLoading: boolean;
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
  todayStats: TransactionStats;
}

function isDateToday(rawDate?: string): boolean {
  if (!rawDate) return true;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Data awal fallback sesuai transaksi autentik PrekDuaDara
const initialTransactions: Transaction[] = [
  {
    id: '#TRX-001',
    time: '14:28:19',
    date: 'Hari ini',
    isToday: true,
    cashier: 'Rian Pratama',
    terminal: 'Pos-01 (Rian)',
    itemsSummary: '2x Ayam Geprek Bakar + Es Teh',
    totalItems: 2,
    subtotal: 36000,
    diskon: 0,
    total: 36000,
    paymentMethod: 'QRIS',
    status: 'Berhasil',
    branch: 'Gerai Pusat',
    orderType: 'Dine-In',
    addons: '+ Sambal Cobek Bakar Lv 2',
    relativeTime: '12 Menit Lalu',
  },
  {
    id: '#TRX-002',
    time: '14:21:05',
    date: 'Hari ini',
    isToday: true,
    cashier: 'Siti Rahma',
    terminal: 'Pos-02 (Siti)',
    itemsSummary: '1x Ayam Geprek Biasa + Es Teh',
    totalItems: 1,
    subtotal: 17000,
    diskon: 0,
    total: 17000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
    branch: 'Gerai Pusat',
    orderType: 'Takeaway',
    addons: '+ Sambal Uleg Asli Lv 1',
    relativeTime: '19 Menit Lalu',
  },
  {
    id: '#TRX-003',
    time: '14:10:44',
    date: 'Hari ini',
    isToday: true,
    cashier: 'Rian Pratama',
    terminal: 'Pos-01 (Rian)',
    itemsSummary: '3x Ayam Geprek Bakar + Es Teh',
    totalItems: 3,
    subtotal: 54000,
    diskon: 0,
    total: 54000,
    paymentMethod: 'QRIS',
    status: 'Berhasil',
    branch: 'Gerai Pusat',
    orderType: 'Dine-In',
    addons: '+ Sambal Cobek Bakar Lv 3',
    relativeTime: '30 Menit Lalu',
  },
  {
    id: '#TRX-004',
    time: '13:55:12',
    date: 'Hari ini',
    isToday: true,
    cashier: 'Budi Santoso',
    terminal: 'Pos-03 (Budi)',
    itemsSummary: '2x Ayam Geprek Biasa + Es Teh',
    totalItems: 2,
    subtotal: 34000,
    diskon: 0,
    total: 34000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
    branch: 'Gerai Pusat',
    orderType: 'Dine-In',
    addons: '+ Sambal Uleg Asli Lv 2',
    relativeTime: '45 Menit Lalu',
  },
  {
    id: '#TRX-005',
    time: '13:42:00',
    date: 'Hari ini',
    isToday: true,
    cashier: 'Siti Rahma',
    terminal: 'Pos-02 (Siti)',
    itemsSummary: '1x Ayam Geprek Bakar + Es Teh',
    totalItems: 1,
    subtotal: 18000,
    diskon: 0,
    total: 18000,
    paymentMethod: 'Tunai',
    status: 'Berhasil',
    branch: 'Gerai Pusat',
    orderType: 'Dine-In',
    addons: '+ Sambal Cobek Bakar Lv 1',
    relativeTime: '58 Menit Lalu',
  },
];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ambil transaksi real-time dari database MariaDB
  const fetchTransactionsFromBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          const mapped: Transaction[] = json.data.map((tx: any) => {
            let terminalName = 'Pos-01 (Rian)';
            if (tx.cashier && tx.cashier.toLowerCase().includes('siti')) {
              terminalName = 'Pos-02 (Siti)';
            } else if (tx.cashier && tx.cashier.toLowerCase().includes('budi')) {
              terminalName = 'Pos-03 (Budi)';
            }

            const isQris = String(tx.paymentMethod).toLowerCase().includes('qris');
            const isToday = isDateToday(tx.created_at);
            const dateStr = tx.created_at
              ? (isToday
                  ? 'Hari ini'
                  : new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
              : 'Hari ini';

            // Parse array rincian item (termasuk field sambal) dari backend
            let parsedItems: TransactionItem[] = [];
            try {
              const rawItems =
                typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items;
              if (Array.isArray(rawItems)) {
                parsedItems = rawItems
                  .filter((it: any) => it && (it.name || it.product_name))
                  .map((it: any) => ({
                    productId: it.productId ? Number(it.productId) : null,
                    name: String(it.name || it.product_name || 'Menu'),
                    category: it.category ? String(it.category) : undefined,
                    sambal:
                      typeof it.sambal === 'string' && it.sambal.trim() !== ''
                        ? it.sambal.trim()
                        : null,
                    price: Number(it.price) || 0,
                    quantity: Number(it.quantity) || 1,
                    subtotal:
                      Number(it.subtotal) ||
                      (Number(it.price) || 0) * (Number(it.quantity) || 1),
                  }));
              }
            } catch {
              parsedItems = [];
            }

            const sambalList = Array.from(
              new Set(
                parsedItems
                  .map((it) => it.sambal)
                  .filter((s): s is string => Boolean(s))
              )
            );
            const topLevelSambal =
              typeof tx.sambal === 'string' && tx.sambal.trim() !== ''
                ? tx.sambal.trim()
                : null;
            if (sambalList.length === 0 && topLevelSambal) {
              sambalList.push(topLevelSambal);
            }
            const sambalSummary = sambalList.join(', ');

            const builtItemsSummary =
              parsedItems.length > 0
                ? parsedItems
                    .map((it) =>
                      it.sambal
                        ? `${it.quantity}x ${it.name} (${it.sambal})`
                        : `${it.quantity}x ${it.name}`
                    )
                    .join(', ')
                : tx.itemsSummary
                  ? topLevelSambal &&
                    !String(tx.itemsSummary)
                      .toLowerCase()
                      .includes(topLevelSambal.toLowerCase())
                    ? `${tx.itemsSummary} (${topLevelSambal})`
                    : String(tx.itemsSummary)
                  : 'Ayam Geprek Bakar + Es Teh';

            return {
              id: tx.id.startsWith('#') ? tx.id : `#${tx.id}`,
              time: tx.time ? (tx.time.includes(':') ? tx.time : `${tx.time}:00`) : '12:00:00',
              date: dateStr,
              rawCreatedAt: tx.created_at,
              isToday,
              cashier: tx.cashier || 'Kasir PrekDuaDara',
              terminal: terminalName,
              itemsSummary: builtItemsSummary,
              items: parsedItems,
              sambalSummary: sambalSummary || undefined,
              totalItems: Number(tx.totalItems) || 1,
              subtotal: Number(tx.total) || 0,
              diskon: 0,
              total: Number(tx.total) || 0,
              paymentMethod: isQris ? 'QRIS' : 'Tunai',
              status: 'Berhasil',
              branch: 'Gerai Pusat',
              orderType: 'Dine-In',
              addons: sambalSummary
                ? `Sambal: ${sambalSummary}`
                : `Dilayani oleh ${tx.cashier || 'Kasir'}`,
              relativeTime: 'Tersimpan di DB',
            };
          });
          setTransactions(mapped);
        } else {
          setTransactions([]);
        }
      }
    } catch {
      // Fallback tetap kosong jika server offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactionsFromBackend();
    const interval = setInterval(fetchTransactionsFromBackend, 15000);
    return () => clearInterval(interval);
  }, [fetchTransactionsFromBackend]);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('Semua');
  const [filterTerminal, setFilterTerminal] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPayment('Semua');
    setFilterTerminal('Semua');
    setFilterStatus('Semua');
  };

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'time' | 'date'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const idStr = `#TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullTx: Transaction = {
      ...newTx,
      id: idStr,
      time: timeStr,
      date: 'Hari ini',
      rawCreatedAt: now.toISOString(),
      isToday: true,
    };

    setTransactions((prev) => [fullTx, ...prev]);
  };

  const addSimulatedTransaction = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const idStr = `#TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const simTx: Transaction = {
      id: idStr,
      time: timeStr,
      date: 'Hari ini',
      rawCreatedAt: now.toISOString(),
      isToday: true,
      cashier: 'Rian Pratama',
      terminal: 'Pos-01 (Rian)',
      itemsSummary: '1x Ayam Geprek Bakar + Es Teh',
      totalItems: 1,
      subtotal: 18000,
      diskon: 0,
      total: 18000,
      paymentMethod: 'QRIS',
      status: 'Berhasil',
      branch: 'Gerai Pusat',
      orderType: 'Dine-In',
      addons: '+ Sambal Cobek Bakar Lv 2',
      relativeTime: 'Baru saja',
    };

    setTransactions((prev) => [simTx, ...prev]);
  };

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        searchQuery === '' ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cashier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPayment =
        filterPayment === 'Semua' ||
        (filterPayment === 'Tunai' && tx.paymentMethod === 'Tunai') ||
        (filterPayment === 'QRIS' && tx.paymentMethod === 'QRIS');

      const matchTerminal =
        filterTerminal === 'Semua' ||
        tx.terminal.toLowerCase().includes(filterTerminal.toLowerCase()) ||
        tx.cashier.toLowerCase().includes(filterTerminal.toLowerCase());

      const matchStatus =
        filterStatus === 'Semua' || tx.status === filterStatus;

      return matchSearch && matchPayment && matchTerminal && matchStatus;
    });
  }, [transactions, searchQuery, filterPayment, filterTerminal, filterStatus]);

  // Statistik Otomatis Hari Ini (Reset ke 0 saat berganti hari)
  const todayStats = useMemo(() => {
    let totalCount = 0;
    let totalOmset = 0;
    let tunaiCount = 0;
    let tunaiOmset = 0;
    let qrisCount = 0;
    let qrisOmset = 0;
    let successCount = 0;

    transactions.forEach((tx) => {
      if (tx.isToday) {
        totalCount++;
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

  // Statistik Otomatis Semua Riwayat
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
        isLoading,
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
        todayStats,
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
