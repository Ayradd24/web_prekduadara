'use client';

import React, { createContext, useContext, useState } from 'react';

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
  updateStok: (id: string, newStock: number) => void;
  restockItem: (id: string, amount: number) => void;
}

const initialStok: StokItem[] = [
  {
    id: 'STK-01',
    name: 'Daging Ayam Segar',
    category: 'Bahan Baku',
    stock: 45,
    unit: 'Kg',
    minStock: 15,
    status: 'Aman',
  },
  {
    id: 'STK-02',
    name: 'Cabai Rawit Merah (Sambal Geprek)',
    category: 'Bumbu & Sambal',
    stock: 8,
    unit: 'Kg',
    minStock: 10,
    status: 'Menipis',
  },
  {
    id: 'STK-03',
    name: 'Beras Premium',
    category: 'Bahan Baku',
    stock: 120,
    unit: 'Kg',
    minStock: 30,
    status: 'Aman',
  },
  {
    id: 'STK-04',
    name: 'Minyak Goreng',
    category: 'Bahan Baku',
    stock: 24,
    unit: 'Liter',
    minStock: 10,
    status: 'Aman',
  },
  {
    id: 'STK-05',
    name: 'Bungkus Teh & Gula',
    category: 'Minuman',
    stock: 15,
    unit: 'Pak',
    minStock: 5,
    status: 'Aman',
  },
];

const StokContext = createContext<StokContextType | undefined>(undefined);

export function StokProvider({ children }: { children: React.ReactNode }) {
  const [stokList, setStokList] = useState<StokItem[]>(initialStok);

  const updateStok = (id: string, newStock: number) => {
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
  };

  const restockItem = (id: string, amount: number) => {
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
  };

  return (
    <StokContext.Provider value={{ stokList, updateStok, restockItem }}>
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
