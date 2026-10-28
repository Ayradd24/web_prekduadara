'use client';

import Sidebar from '@/components/Sidebar';
import { useStok } from '@/context/StokContext';

export default function StokPage() {
  const { stokList, updateStok, restockItem } = useStok();

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Management Stok Inventaris</h1>
              <p className="text-xs text-gray-500 mt-1">
                Kelola stok bahan baku, cabai, dan bumbu PrekDuaDara secara real-time
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const name = prompt('Nama bahan baku baru:');
              if (name) restockItem('STK-01', 5);
            }}
            className="px-4 py-2 bg-[#1E6F38] text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all cursor-pointer shadow-sm"
          >
            + Tambah Inventaris
          </button>
        </div>

        {/* Tabel Stok Interaktif dari State */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">KODE ITEM</th>
                  <th className="py-3 px-3">NAMA BAHAN</th>
                  <th className="py-3 px-3">KATEGORI</th>
                  <th className="py-3 px-3">SISA STOK</th>
                  <th className="py-3 px-3">MIN. STOK</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-center">AKSI RESTOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {stokList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-gray-900">{item.id}</td>
                    <td className="py-3.5 px-3 font-semibold text-gray-800">{item.name}</td>
                    <td className="py-3.5 px-3">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[10px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-base text-gray-900">
                      {item.stock} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${
                          item.status === 'Aman'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Menipis'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center space-x-2">
                      <button
                        onClick={() => updateStok(item.id, Math.max(0, item.stock - 1))}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold cursor-pointer"
                        title="Kurangi 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => restockItem(item.id, 5)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                        title="Restock +5"
                      >
                        +5 {item.unit}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
