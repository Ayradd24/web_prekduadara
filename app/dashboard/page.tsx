'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import {
  Printer,
  RotateCcw,
  Eye,
  CheckCircle2,
  X,
  ChevronDown,
  User,
} from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  const {
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
  } = useTransactions();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Helper format rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Reset page saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPayment, filterTerminal, filterStatus]);

  // Statistik KPI Ringkasan diambil real-time dari data backend/transaksi
  const dashboardStats = useMemo(() => {
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
      totalCount > 0
        ? `${((successCount / totalCount) * 100).toFixed(1)}%`
        : '100%';

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

  // Transaksi yang difilter
  const displayedTransactions = filteredTransactions;

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(displayedTransactions.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return displayedTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedTransactions, activePage]);

  // Akumulasi total nominal dari transaksi yang sedang difilter
  const displayedTotalNominal = useMemo(() => {
    return displayedTransactions.reduce(
      (acc, tx) => (tx.status === 'Berhasil' ? acc + tx.total : acc),
      0
    );
  }, [displayedTransactions]);

  // Handler Reset seluruh filter
  const handleResetAllFilters = () => {
    resetFilters();
    setCurrentPage(1);
  };

  // Handler Kirim ke Printer Thermal
  const handlePrintReceipt = (id: string) => {
    showToast(`Mengirim struk ${id} ke printer thermal...`);
  };

  // Fungsi Export CSV kompatibel Microsoft Excel (UTF-8 BOM) tanpa Cabang & Diskon
  const handleExportExcel = () => {
    const headers = [
      'ID Transaksi',
      'Waktu',
      'Kasir',
      'Menu/Item',
      'Metode Bayar',
      'Subtotal',
      'Total',
      'Status',
    ];

    const rows = displayedTransactions.map((tx) => [
      tx.id,
      `${tx.time} WIB (${tx.date})`,
      `${tx.cashier} (${tx.terminal})`,
      `${tx.itemsSummary} (${tx.totalItems} item)`,
      tx.paymentMethod,
      formatRupiah(tx.subtotal),
      formatRupiah(tx.total),
      tx.status,
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Transaksi_PrekDuaDara.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Laporan transaksi berhasil diunduh!');
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-gray-900">
      {/* Notifikasi Toast Modern (Pojok Kanan Bawah) */}
      {toastMessage && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 bg-[#2D452B] text-white border border-[#415C3E] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold transition-all">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 size={15} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Preview Struk Kasir Thermal */}
      {selectedTx && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-[#2D452B] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer size={16} className="text-[#F3A712]" />
                <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                  Preview Struk Thermal (80mm)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Kertas Struk Thermal */}
            <div className="p-5 bg-[#FAF8F3]">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs font-mono text-xs text-gray-800">
                {/* Brand Header Struk */}
                <div className="text-center border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="font-black text-sm text-gray-900 tracking-wider">
                    PREKDUADARA
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5 font-sans font-medium">
                    Spesial Ayam Geprek Cobek &amp; Sambal Uleg Asli
                  </div>
                  <div className="text-[11px] text-gray-500 font-sans">
                    Gerai Utama • Telp: 0812-xxxx-xxxx
                  </div>
                </div>

                {/* Metadata Struk */}
                <div className="space-y-1.5 border-b border-dashed border-gray-300 pb-3.5 mb-3.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID Struk:</span>
                    <span className="font-bold text-gray-900">{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedTx.date}, {selectedTx.time} WIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kasir:</span>
                    <span className="font-bold text-gray-800">
                      {selectedTx.cashier}
                    </span>
                  </div>
                </div>

                {/* Ringkasan Item Pesanan (Per Menu Diturunkan ke Bawah) */}
                <div className="border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    RINCIAN PESANAN ({selectedTx.totalItems} ITEM)
                  </div>
                  <div className="space-y-2">
                    {selectedTx.itemsSummary
                      .split(/,\s*(?=\d+x|[A-Z])/g)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="font-bold text-gray-900 text-xs leading-relaxed"
                        >
                          {item.trim()}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Kalkulasi Harga */}
                <div className="space-y-1.5 border-b border-dashed border-gray-300 pb-3.5 mb-3.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(selectedTx.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-gray-900 pt-1">
                    <span>TOTAL AKHIR:</span>
                    <span className="text-[#EA8E18]">
                      {formatRupiah(selectedTx.total)}
                    </span>
                  </div>
                </div>

                {/* Metode & Status */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Metode Bayar:</span>
                    <span className="font-bold text-gray-900">
                      {selectedTx.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status Transaksi:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        selectedTx.status === 'Berhasil'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {selectedTx.status}
                    </span>
                  </div>
                </div>

                {/* Footer Struk */}
                <div className="text-center text-[10px] text-gray-500 font-sans mt-4 pt-3 border-t border-dashed border-gray-200">
                  Matur nuwun sampun mampir! Pedasnya bikin nagih.
                </div>
              </div>
            </div>

            {/* Action Buttons Modal */}
            <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintReceipt(selectedTx.id);
                  setSelectedTx(null);
                }}
                className="px-4 py-2 bg-[#2D452B] hover:bg-[#1E3A1C] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR NAVIGASI (KIRI) */}
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>

      {/* 2. KONTEN UTAMA (KANAN) */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full print:overflow-visible">
        {/* Header Dashboard: Admin / Owner & Online Sync */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo PrekDuaDara"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-xs shrink-0"
            />
            <div>
              <div className="font-extrabold text-base text-[#EA8E18] tracking-tight leading-tight">
                PrekDuaDara
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight mt-0.5">
                Ringkasan &amp; Daftar Transaksi Kasir
              </div>
            </div>
          </div>

          <div className="print:hidden flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-3.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer size={14} className="shrink-0" />
              <span>Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="h-9 px-3.5 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>📊 Export Excel</span>
            </button>

            {/* Online Sync Pill */}
            <div className="h-9 flex items-center gap-2 px-3.5 bg-[#E8F8F0] border border-[#A7F3D0] text-[#047857] text-xs font-extrabold rounded-full shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
              <span>ONLINE SYNC</span>
            </div>

            {/* User Profile: Admin / Owner */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200 shrink-0">
              <div className="text-right">
                <div className="text-xs font-extrabold text-gray-900 leading-tight whitespace-nowrap">
                  Admin
                </div>
                <div className="text-[11px] text-[#EA8E18] font-bold leading-tight mt-0.5 whitespace-nowrap">
                  Owner
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                <User size={16} />
              </div>
            </div>
          </div>

          <div className="hidden print:block text-right text-xs text-gray-700">
            <div className="font-bold text-gray-900">
              Laporan Transaksi Kasir PrekDuaDara
            </div>
            <div>
              Terminal: {filterTerminal} | Pembayaran: {filterPayment} | Status: {filterStatus}
            </div>
          </div>
        </header>

        {/* 4 KARTU RINGKASAN SERAGAM (REAL-TIME DARI BACKEND MARIADB) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-4 print:gap-3">
          {/* Card 1: Total Transaksi Hari Ini */}
          <div className="bg-white p-5 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Total Transaksi Hari Ini
              </p>
              <h2 className="text-2xl print:text-lg font-black text-gray-900 mt-2 whitespace-nowrap tabular-nums">
                {dashboardStats.totalCount}
              </h2>
              <p className="text-xs text-emerald-700 font-semibold mt-1.5">
                {dashboardStats.tunaiCount} Tunai • {dashboardStats.qrisCount} QRIS
              </p>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 bg-orange-100 border border-orange-200 text-orange-700 rounded-xl flex items-center justify-center text-lg print:text-sm shrink-0">
              📋
            </div>
          </div>

          {/* Card 2: Total Omset Bruto */}
          <div className="bg-white p-5 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Total Omset Bruto
              </p>
              <h2 className="text-2xl print:text-lg font-black text-gray-900 mt-2 whitespace-nowrap tabular-nums">
                {formatRupiah(dashboardStats.totalOmset)}
              </h2>
              <p className="text-xs text-gray-600 font-semibold mt-1.5">
                Tunai: {formatRupiah(dashboardStats.tunaiOmset)} | QRIS: {formatRupiah(dashboardStats.qrisOmset)}
              </p>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center text-lg print:text-sm shrink-0">
              💵
            </div>
          </div>

          {/* Card 3: Pembayaran QRIS Digital */}
          <div className="bg-white p-5 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Pembayaran QRIS Digital
              </p>
              <h2 className="text-2xl print:text-lg font-black text-gray-900 mt-2 whitespace-nowrap tabular-nums">
                {formatRupiah(dashboardStats.qrisOmset)}
              </h2>
              <p className="text-xs text-gray-600 font-semibold mt-1.5">
                {dashboardStats.qrisCount} Transaksi Non-Tunai
              </p>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 bg-amber-100 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-center text-lg print:text-sm shrink-0">
              📱
            </div>
          </div>

          {/* Card 4: Transaksi Berhasil */}
          <div className="bg-white p-5 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Transaksi Berhasil
              </p>
              <h2 className="text-2xl print:text-lg font-black text-gray-900 mt-2 whitespace-nowrap tabular-nums">
                {dashboardStats.successCount}
              </h2>
              <p className="text-xs text-emerald-700 font-semibold mt-1.5">
                {dashboardStats.successRate} success rate
              </p>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center text-lg print:text-sm shrink-0">
              ✅
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI DENGAN LIVE FILTER STATE (TANPA CABANG & DISKON) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 print:p-3 border border-gray-200 shadow-sm print:shadow-none flex-1 flex flex-col gap-4 min-h-[430px] print:min-h-0">
          {/* Filter Bar */}
          <div className="print:hidden flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari ID struk, kasir, atau nama menu..."
              className="flex-1 min-w-[260px] border border-gray-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
            />
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterTerminal}
                onChange={(e) => setFilterTerminal(e.target.value)}
                className="appearance-none w-[150px] shrink-0 truncate bg-white border border-gray-200 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Kasir</option>
                <option value="Rian">Rian Pratama</option>
                <option value="Siti">Siti Rahma</option>
                <option value="Budi">Budi Santoso</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-gray-700"
              />
            </div>
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-gray-200 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Pembayaran</option>
                <option value="Tunai">Tunai (Cash)</option>
                <option value="QRIS">QRIS</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-gray-700"
              />
            </div>
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-gray-200 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Status</option>
                <option value="Berhasil">Berhasil</option>
                <option value="Batal">Batal</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-gray-700"
              />
            </div>
            <button
              type="button"
              onClick={handleResetAllFilters}
              title="Reset Filter"
              aria-label="Reset Filter"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto print:overflow-visible flex-1">
            <table className="w-full min-w-full print:text-[9px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold uppercase text-[11px] print:text-[9px] tracking-wider">
                  <th className="py-2.5 pl-3.5 pr-2 w-[100px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    ID STRUK
                  </th>
                  <th className="py-2.5 px-2 w-[95px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    WAKTU
                  </th>
                  <th className="py-2.5 px-2 w-[115px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    KASIR
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[170px] print:px-1.5 print:py-2 text-left">
                    RINGKASAN ITEM
                  </th>
                  <th className="py-2.5 px-2 w-[90px] text-right whitespace-nowrap print:px-1.5 print:py-2">
                    SUBTOTAL
                  </th>
                  <th className="py-2.5 px-2 w-[95px] text-right whitespace-nowrap print:px-1.5 print:py-2">
                    TOTAL AKHIR
                  </th>
                  <th className="py-2.5 px-2 w-[75px] text-center whitespace-nowrap print:px-1.5 print:py-2">
                    METODE
                  </th>
                  <th className="py-2.5 px-2 w-[80px] text-center whitespace-nowrap print:px-1.5 print:py-2">
                    STATUS
                  </th>
                  <th className="py-2.5 pl-2 pr-3.5 w-[70px] text-center whitespace-nowrap print:hidden">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-[280px] text-center text-gray-500 font-medium align-middle">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 pl-3.5 pr-2 text-left font-extrabold text-gray-900 whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-3 px-2 text-left whitespace-nowrap">
                        <div className="font-bold text-gray-900">{tx.time} WIB</div>
                        <div className="text-[11px] text-gray-500 font-medium">{tx.date}</div>
                      </td>
                      <td className="py-3 px-2 text-left whitespace-nowrap">
                        <div className="font-bold text-gray-900">{tx.cashier}</div>
                      </td>
                      <td className="py-3 px-2.5 text-left">
                        <div className="font-bold text-gray-900 truncate max-w-[240px]" title={tx.itemsSummary}>
                          {tx.itemsSummary}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          {tx.totalItems} item total
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-700 whitespace-nowrap tabular-nums">
                        {formatRupiah(tx.subtotal)}
                      </td>
                      <td className="py-3 px-2 text-right font-extrabold text-gray-900 whitespace-nowrap tabular-nums">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border ${
                            tx.paymentMethod === 'QRIS'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border ${
                            tx.status === 'Berhasil'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-3.5 text-center whitespace-nowrap print:hidden">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(tx.id)}
                            className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer transition"
                            title="Cetak Struk"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer transition"
                            title="Lihat Detail"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {displayedTransactions.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50/90 font-extrabold text-gray-900">
                    <td
                      colSpan={5}
                      className="py-2.5 pl-3.5 pr-2 text-left text-xs uppercase tracking-wider text-gray-700"
                    >
                      Total Rekapitulasi ({displayedTransactions.length} transaksi)
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-[#EA8E18] whitespace-nowrap tabular-nums">
                      {formatRupiah(displayedTotalNominal)}
                    </td>
                    <td
                      colSpan={2}
                      className="py-2.5 px-2 text-center text-[11px] font-bold text-emerald-700 whitespace-nowrap"
                    >
                      Transaksi Selesai
                    </td>
                    <td className="py-2.5 pl-2 pr-3.5 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="print:hidden pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 font-medium">
            <div>
              Menampilkan{' '}
              <strong className="text-gray-900 font-extrabold">
                {paginatedTransactions.length}
              </strong>{' '}
              dari{' '}
              <strong className="text-gray-900 font-extrabold">
                {displayedTransactions.length}
              </strong>{' '}
              transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-extrabold transition cursor-pointer ${
                    activePage === page
                      ? 'bg-[#1E3A1C] text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER SYSTEM DENGAN SINKRONISASI OTOMATIS */}
        <footer className="print:hidden bg-white rounded-2xl px-6 py-3.5 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-700 font-semibold">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full object-cover shrink-0" />
            <span><strong>Sistem Analitik Bisnis PrekDuaDara</strong> &copy; 2025. Seluruh Hak Cipta Dilindungi.</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>Sinkronisasi Otomatis Terakhir: <strong>14:28 WIB</strong></span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Cloud POS Terkoneksi
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
