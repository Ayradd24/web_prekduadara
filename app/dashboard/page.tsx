'use client';

import React, { useState, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import { Printer, RotateCcw, Eye, CheckCircle2, X, ChevronDown } from 'lucide-react';

const BRANCH_OPTIONS = [
  'Semua Cabang',
  'Cabang Sudirman Utama',
  'Cabang Tebet Eco Park',
  'Cabang Dago Heritage',
];

const getTransactionBranch = (tx: Transaction): string => {
  if (tx.branch) return tx.branch;
  if (tx.terminal.includes('Pos-02')) return 'Cabang Tebet Eco Park';
  if (tx.terminal.includes('Pos-03')) return 'Cabang Dago Heritage';
  return 'Cabang Sudirman Utama';
};

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

  const [selectedBranch, setSelectedBranch] = useState<string>('Semua Cabang');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
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

  // Helper format rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Gabungkan filter Cabang dengan hasil filter pencarian, terminal, pembayaran, dan status
  const displayedTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      const txBranch = getTransactionBranch(tx);
      return selectedBranch === 'Semua Cabang' || txBranch === selectedBranch;
    });
  }, [filteredTransactions, selectedBranch]);

  // Statistik KPI Ringkasan yang menyesuaikan Cabang yang dipilih
  const branchStats = useMemo(() => {
    const branchSource =
      selectedBranch === 'Semua Cabang'
        ? transactions
        : transactions.filter(
            (tx) => getTransactionBranch(tx) === selectedBranch
          );

    const totalCount = branchSource.length;
    let totalOmset = 0;
    let tunaiCount = 0;
    let tunaiOmset = 0;
    let qrisCount = 0;
    let qrisOmset = 0;
    let successCount = 0;

    branchSource.forEach((tx) => {
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
  }, [transactions, selectedBranch]);

  // Akumulasi total nominal dari transaksi yang sedang ditampilkan (status Berhasil)
  const displayedTotalNominal = useMemo(() => {
    return displayedTransactions.reduce(
      (acc, tx) => (tx.status === 'Berhasil' ? acc + tx.total : acc),
      0
    );
  }, [displayedTransactions]);

  // Handler Reset seluruh filter termasuk Cabang
  const handleResetAllFilters = () => {
    setSelectedBranch('Semua Cabang');
    resetFilters();
  };

  // Handler Kirim ke Printer Thermal
  const handlePrintReceipt = (id: string) => {
    showToast(`Mengirim struk ${id} ke printer thermal...`);
  };

  // Fungsi Export CSV kompatibel Microsoft Excel (UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      'ID Transaksi',
      'Waktu',
      'Cabang',
      'Kasir',
      'Menu/Item',
      'Metode Bayar',
      'Total',
      'Status',
    ];

    const rows = displayedTransactions.map((tx) => [
      tx.id,
      `${tx.time} WIB (${tx.date})`,
      getTransactionBranch(tx),
      `${tx.cashier} (${tx.terminal})`,
      `${tx.itemsSummary} (${tx.totalItems} item)`,
      tx.paymentMethod,
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
    const branchSlug =
      selectedBranch === 'Semua Cabang'
        ? 'Semua_Cabang'
        : selectedBranch.replace(/\s+/g, '_');
    link.setAttribute(
      'download',
      `Laporan_Transaksi_PrekDuaDara_${branchSlug}.csv`
    );
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
                    {getTransactionBranch(selectedTx)} • Telp: 0812-xxxx-xxxx
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
                    <span className="text-gray-500">Kasir / Terminal:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedTx.cashier} ({selectedTx.terminal})
                    </span>
                  </div>
                </div>

                {/* Ringkasan Item */}
                <div className="border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    RINCIAN PESANAN ({selectedTx.totalItems} ITEM)
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-gray-900 leading-snug">
                      {selectedTx.itemsSummary}
                    </span>
                    <span className="font-bold text-gray-900 shrink-0">
                      {formatRupiah(selectedTx.subtotal)}
                    </span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diskon:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedTx.diskon === 0
                        ? 'Rp 0'
                        : `- ${formatRupiah(selectedTx.diskon)}`}
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
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden print:overflow-visible max-w-full">
        {/* Header Dashboard */}
        <header className="bg-white rounded-2xl px-5 py-3.5 shadow-sm print:shadow-none print:min-h-0 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

          <div className="print:hidden flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer transition"
            >
              🖨️ Cetak Laporan
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 cursor-pointer transition"
            >
              📊 Export Excel
            </button>
          </div>

          <div className="hidden print:block text-right text-xs text-gray-700">
            <div className="font-bold text-gray-900">
              Laporan Transaksi • {selectedBranch}
            </div>
            <div>
              Terminal: {filterTerminal} | Pembayaran: {filterPayment} | Status: {filterStatus}
            </div>
          </div>
        </header>

        {/* 3 KARTU RINGKASAN (REAL-TIME DARI STATE & CABANG) */}
        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
          <div className="bg-white p-5 sm:p-6 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Total Transaksi Hari Ini
              </p>
              <h2 className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900 mt-1.5">
                {branchStats.totalCount}
              </h2>
              <p className="text-xs text-emerald-700 font-bold mt-1.5">
                {branchStats.tunaiCount} Tunai • {branchStats.qrisCount} QRIS
              </p>
            </div>
            <div className="w-12 h-12 print:w-8 print:h-8 bg-orange-100 border border-orange-200 text-orange-700 rounded-2xl flex items-center justify-center text-xl print:text-sm shrink-0">
              📋
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Total Omset Bruto
              </p>
              <h2 className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900 mt-1.5">
                {formatRupiah(branchStats.totalOmset)}
              </h2>
              <p className="text-xs text-gray-600 font-semibold mt-1.5">
                Tunai: {formatRupiah(branchStats.tunaiOmset)} | QRIS: {formatRupiah(branchStats.qrisOmset)}
              </p>
            </div>
            <div className="w-12 h-12 print:w-8 print:h-8 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-xl print:text-sm shrink-0">
              💵
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 print:p-3.5 print:break-inside-avoid print:shadow-none print:min-h-0 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Transaksi Berhasil
              </p>
              <h2 className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900 mt-1.5">
                {branchStats.successCount}
              </h2>
              <p className="text-xs text-emerald-700 font-bold mt-1.5">
                {branchStats.successRate} success rate
              </p>
            </div>
            <div className="w-12 h-12 print:w-8 print:h-8 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-xl print:text-sm shrink-0">
              ✅
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI DENGAN LIVE FILTER STATE */}
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
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-gray-200 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-gray-700"
              />
            </div>
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterTerminal}
                onChange={(e) => setFilterTerminal(e.target.value)}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-gray-200 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Terminal</option>
                <option value="Pos-01">Pos-01 (Rian)</option>
                <option value="Pos-02">Pos-02 (Siti)</option>
                <option value="Pos-03">Pos-03 (Budi)</option>
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
            <table className="table-fixed w-[1340px] print:table-auto print:w-full print:text-[9px] text-left border-collapse text-xs sm:text-sm">
              <colgroup>
                <col className="w-[155px] print:w-auto" />
                <col className="w-[125px] print:w-auto" />
                <col className="w-[185px] print:w-auto" />
                <col className="w-[150px] print:w-auto" />
                <col className="w-[230px] print:w-auto" />
                <col className="w-[105px] print:w-auto" />
                <col className="w-[85px] print:w-auto" />
                <col className="w-[115px] print:w-auto" />
                <col className="w-[95px] print:w-auto" />
                <col className="w-[100px] print:w-auto" />
                <col className="w-[95px] print:w-auto" />
              </colgroup>
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold uppercase text-xs print:text-[9px] tracking-wider">
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                    ID STRUK
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                    WAKTU
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                    CABANG
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                    KASIR / TERMINAL
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                    RINGKASAN ITEM
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-right whitespace-nowrap print:whitespace-normal">
                    SUBTOTAL
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-right whitespace-nowrap print:whitespace-normal">
                    DISKON
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-right whitespace-nowrap print:whitespace-normal">
                    TOTAL AKHIR
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal">
                    METODE
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal">
                    STATUS
                  </th>
                  <th className="py-3.5 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal print:hidden">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="h-[280px] text-center text-gray-500 font-medium align-middle">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-left font-extrabold text-gray-900 whitespace-nowrap print:whitespace-normal">
                        {tx.id}
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                        <div className="font-bold text-gray-900">{tx.time} WIB</div>
                        <div className="text-xs print:text-[9px] text-gray-500 font-medium">{tx.date}</div>
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-left font-bold text-gray-900 whitespace-nowrap print:whitespace-normal">
                        {getTransactionBranch(tx)}
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-left whitespace-nowrap print:whitespace-normal">
                        <div className="font-bold text-gray-900">{tx.cashier}</div>
                        <div className="text-xs print:text-[9px] text-gray-500 font-medium">{tx.terminal}</div>
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-left print:whitespace-normal">
                        <div className="font-bold text-gray-900">{tx.itemsSummary}</div>
                        <div className="text-xs print:text-[9px] text-emerald-700 font-bold mt-0.5">
                          {tx.totalItems} item total
                        </div>
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-right font-semibold text-gray-700 whitespace-nowrap print:whitespace-normal">
                        {formatRupiah(tx.subtotal)}
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-right text-gray-500 font-medium whitespace-nowrap print:whitespace-normal">
                        {tx.diskon === 0 ? 'Rp 0' : formatRupiah(tx.diskon)}
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-right font-extrabold text-gray-900 whitespace-nowrap print:whitespace-normal">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal">
                        <span
                          className={`inline-block font-extrabold text-xs print:text-[9px] px-3 py-1 print:px-1.5 print:py-0.5 rounded-lg border ${
                            tx.paymentMethod === 'QRIS'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal">
                        <span
                          className={`inline-block font-extrabold text-xs print:text-[9px] px-3 py-1 print:px-1.5 print:py-0.5 rounded-lg border ${
                            tx.status === 'Berhasil'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 print:px-1.5 print:py-2 text-center whitespace-nowrap print:whitespace-normal print:hidden">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(tx.id)}
                            className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer transition"
                            title="Cetak Struk"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
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
              {displayedTransactions.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50/90 font-extrabold text-gray-900">
                    <td
                      colSpan={7}
                      className="py-3.5 px-4 print:px-1.5 print:py-2 text-left text-xs print:text-[9px] uppercase tracking-wider text-gray-700"
                    >
                      Total Rekapitulasi ({displayedTransactions.length} transaksi)
                    </td>
                    <td className="py-3.5 px-4 print:px-1.5 print:py-2 text-right font-black text-[#EA8E18] whitespace-nowrap print:whitespace-normal">
                      {formatRupiah(displayedTotalNominal)}
                    </td>
                    <td
                      colSpan={2}
                      className="py-3.5 px-4 print:px-1.5 print:py-2 text-center text-[11px] print:text-[8px] font-bold text-emerald-700"
                    >
                      Transaksi Berhasil
                    </td>
                    <td className="py-3.5 px-4 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Footer Khusus Dokumen Cetak */}
        <div className="hidden print:flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-200">
          <span>Sistem Kasir &amp; Analitik POS PrekDuaDara • Dicetak otomatis</span>
          <span>
            Total Data Tercetak: {displayedTransactions.length} Transaksi ({selectedBranch})
          </span>
        </div>
      </main>
    </div>
  );
}
