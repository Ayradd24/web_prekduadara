'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';

export interface StokItem {
  id: string;
  name: string;
  category: 'Bahan Baku' | 'Bumbu & Sambal' | 'Minuman';
  stock: number;
  unit: string;
  minStock: number;
  status: 'Aman' | 'Menipis' | 'Habis';
}

interface StokContextType {
  stokList: StokItem[];
  updateStok: (id: string, newStock: number) => Promise<void>;
  restockItem: (id: string, amount: number) => Promise<void>;
  fetchStocks: () => Promise<void>;
}

const initialStok: StokItem[] = [
  {
    id: '1',
    name: 'Ayam Potong Segar',
    category: 'Bahan Baku',
    stock: 29,
    unit: 'kg',
    minStock: 10,
    status: 'Aman',
  },
  {
    id: '2',
    name: 'Minyak Goreng Sawit',
    category: 'Bahan Baku',
    stock: 5,
    unit: 'liter',
    minStock: 8,
    status: 'Menipis',
  },
  {
    id: '3',
    name: 'Cabai Rawit Merah',
    category: 'Bumbu & Sambal',
    stock: 2,
    unit: 'kg',
    minStock: 5,
    status: 'Menipis',
  },
  {
    id: '4',
    name: 'Beras Ramos',
    category: 'Bahan Baku',
    stock: 50,
    unit: 'kg',
    minStock: 20,
    status: 'Aman',
  },
  {
    id: '5',
    name: 'Tepung Bumbu Crispy',
    category: 'Bahan Baku',
    stock: 15,
    unit: 'kg',
    minStock: 5,
    status: 'Aman',
  },
];

const StokContext = createContext<StokContextType | undefined>(undefined);

export function StokProvider({ children }: { children: React.ReactNode }) {
  const [stokList, setStokList] = useState<StokItem[]>(initialStok);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stocks`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: StokItem[] = json.data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            category: item.name.toLowerCase().includes('cabai')
              ? 'Bumbu & Sambal'
              : item.name.toLowerCase().includes('teh')
              ? 'Minuman'
              : 'Bahan Baku',
            stock: Number(item.stock),
            unit: item.unit || 'kg',
            minStock: Number(item.minStock) || 10,
            status:
              item.status === 'Kritis' || item.status === 'Menipis'
                ? 'Menipis'
                : item.stock <= 0
                ? 'Habis'
                : 'Aman',
          }));
          setStokList(mapped);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat stok dari backend:', e);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    const timer = setInterval(fetchStocks, 15000);
    return () => clearInterval(timer);
  }, [fetchStocks]);

  const updateStok = async (id: string, newStock: number) => {
    // Optimistic UI update
    setStokList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const status =
            newStock <= 0 ? 'Habis' : newStock <= item.minStock ? 'Menipis' : 'Aman';
          return { ...item, stock: newStock, status };
        }
        return item;
      })
    );

    try {
      const current = stokList.find((s) => s.id === id);
      if (current) {
        const diff = newStock - current.stock;
        const action = diff >= 0 ? 'add' : 'subtract';
        await fetch(`${API_BASE_URL}/api/stocks/${id}`, {
          method: 'PATCH',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ amount: Math.abs(diff), action }),
        });
      }
    } catch (e) {
      console.warn('Gagal sinkron update stok ke backend:', e);
    }
  };

  const restockItem = async (id: string, amount: number) => {
    setStokList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = item.stock + amount;
          const status =
            newStock <= 0 ? 'Habis' : newStock <= item.minStock ? 'Menipis' : 'Aman';
          return { ...item, stock: newStock, status };
        }
        return item;
      })
    );

    try {
      await fetch(`${API_BASE_URL}/api/stocks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount, action: 'add' }),
      });
    } catch (e) {
      console.warn('Gagal kirim restock ke backend:', e);
    }
  };

  return (
    <StokContext.Provider value={{ stokList, updateStok, restockItem, fetchStocks }}>
      {children}
    </StokContext.Provider>
  );
}

export function useStok(): StokContextType {
  const context = useContext(StokContext);
  if (!context) {
    throw new Error('useStok must be used within a StokProvider');
  }
  return context;
}
