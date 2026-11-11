'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { useTransactions } from '@/context/TransactionContext';
import { Printer, RotateCcw, Eye } from 'lucide-react';

export default function DashboardPage() {
  const {
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
    stats,
  } = useTransactions();

  // Helper format rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-gray-900">
      {/* 1. SIDEBAR NAVIGASI (KIRI) */}
      <Sidebar />

      {/* 2. KONTEN UTAMA (KANAN) */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* Header Dashboard */}
        <header className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo PrekDuaDara"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0"
            />
            <div>
              <div className="font-extrabold text-base text-[#EA8E18] tracking-tight leading-tight">
                PrekDuaDara
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight">
                Daftar Transaksi Kasir
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer transition"
            >
              🖨️ Cetak Laporan
            </button>
            <button
              onClick={() => alert('Fitur Export Excel terhubung ke data transaksi!')}
              className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 cursor-pointer transition"
            >
              📊 Export Excel
            </button>
          </div>
        </header>

        {/* 3 KARTU RINGKASAN (REAL-TIME DARI STATE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Total Transaksi Hari Ini
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1.5">
                {stats.totalCount}
              </h2>
              <p className="text-xs text-emerald-700 font-bold mt-1.5">
                {stats.tunaiCount} Tunai • {stats.qrisCount} QRIS
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 border border-orange-200 text-orange-700 rounded-2xl flex items-center justify-center text-xl shrink-0">
              📋
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Total Omset Bruto
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1.5">
                {formatRupiah(stats.totalOmset)}
              </h2>
              <p className="text-xs text-gray-600 font-semibold mt-1.5">
                Tunai: {formatRupiah(stats.tunaiOmset)} | QRIS: {formatRupiah(stats.qrisOmset)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-xl shrink-0">
              💵
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Transaksi Berhasil
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1.5">
                {stats.successCount}
              </h2>
              <p className="text-xs text-emerald-700 font-bold mt-1.5">
                {stats.successRate} success rate
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-xl shrink-0">
              ✅
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI DENGAN LIVE FILTER STATE */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm flex-1 flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari ID struk, kasir, atau nama menu..."
              className="flex-1 min-w-[220px] border border-gray-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
            />
            <select
              value={filterTerminal}
              onChange={(e) => setFilterTerminal(e.target.value)}
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 bg-white cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              <option value="Semua">Semua Terminal</option>
              <option value="Pos-01">Pos-01 (Rian)</option>
              <option value="Pos-02">Pos-02 (Siti)</option>
              <option value="Pos-03">Pos-03 (Budi)</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 bg-white cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              <option value="Semua">Semua Pembayaran</option>
              <option value="Tunai">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 bg-white cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              <option value="Semua">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Batal">Batal</option>
            </select>
            <button
              onClick={resetFilters}
              className="px-3.5 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold uppercase text-xs tracking-wider">
                  <th className="py-3.5 px-3 whitespace-nowrap">ID STRUK</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">WAKTU</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">KASIR / TERMINAL</th>
                  <th className="py-3.5 px-3 min-w-[220px]">RINGKASAN ITEM</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">SUBTOTAL</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">DISKON</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">TOTAL AKHIR</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">METODE</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-gray-500 font-medium">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{tx.time} WIB</div>
                        <div className="text-xs text-gray-500 font-medium">{tx.date}</div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{tx.cashier}</div>
                        <div className="text-xs text-gray-500 font-medium">{tx.terminal}</div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-gray-900">{tx.itemsSummary}</div>
                        <div className="text-xs text-emerald-700 font-bold mt-0.5">
                          {tx.totalItems} item total
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                        {formatRupiah(tx.subtotal)}
                      </td>
                      <td className="py-4 px-3 text-right text-gray-500 font-medium whitespace-nowrap">
                        {tx.diskon === 0 ? 'Rp 0' : formatRupiah(tx.diskon)}
                      </td>
                      <td className="py-4 px-3 text-right font-extrabold text-gray-900 whitespace-nowrap">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-extrabold text-xs px-3 py-1 rounded-lg border ${
                            tx.paymentMethod === 'QRIS'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-extrabold text-xs px-3 py-1 rounded-lg border ${
                            tx.status === 'Berhasil'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => alert(`Struk ${tx.id} dicetak`)}
                            className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer transition"
                            title="Cetak Struk"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => alert(`Detail transaksi ${tx.id}`)}
                            className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer transition"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
