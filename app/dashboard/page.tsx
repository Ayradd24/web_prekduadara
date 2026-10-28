'use client';

import Sidebar from '@/components/Sidebar';
import { useTransactions } from '@/context/TransactionContext';

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
    addTransaction,
    stats,
  } = useTransactions();

  // Helper format rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Handler demo tambah order baru (menguji reactivity state)
  const handleDemoOrder = () => {
    const isBakar = Math.random() > 0.5;
    const price = isBakar ? 18000 : 17000;
    const isTunai = Math.random() > 0.5;

    addTransaction({
      cashier: 'Rian Pratama',
      terminal: 'Kasir Pos-01',
      itemsSummary: isBakar
        ? '1x Ayam Geprek Bakar + Es Teh'
        : '1x Ayam Geprek Biasa + Es Teh',
      totalItems: 1,
      subtotal: price,
      diskon: 0,
      total: price,
      paymentMethod: isTunai ? 'Tunai' : 'QRIS',
      status: 'Berhasil',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      {/* 1. SIDEBAR NAVIGASI (KIRI) */}
      <Sidebar />

      {/* 2. KONTEN UTAMA (KANAN) */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header Dashboard */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Daftar Transaksi Kasir</h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                Kasir Aktif (3 Terminal)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kelola dan pantau seluruh riwayat transaksi POS kasir secara real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
            >
              🖨️ Cetak Laporan
            </button>
            <button
              onClick={() => alert('Fitur Export Excel terhubung ke data transaksi!')}
              className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
            >
              📊 Export Excel
            </button>
            <button
              onClick={handleDemoOrder}
              className="px-3 py-2 bg-[#FC4A1A] text-white rounded-lg text-xs font-bold hover:bg-orange-600 shadow-sm cursor-pointer transition-all"
            >
              + Order Baru (F1)
            </button>
          </div>
        </div>

        {/* 3 KARTU RINGKASAN (REAL-TIME DARI STATE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Total Transaksi Hari Ini
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                {stats.totalCount}
              </h2>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {stats.tunaiCount} Tunai • {stats.qrisCount} QRIS
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">
              📋
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Total Omset Bruto
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                {formatRupiah(stats.totalOmset)}
              </h2>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                Tunai: {formatRupiah(stats.tunaiOmset)} | QRIS: {formatRupiah(stats.qrisOmset)}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
              💵
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Transaksi Berhasil
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                {stats.successCount}
              </h2>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {stats.successRate} success rate
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
              ✅
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI DENGAN LIVE FILTER STATE */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari ID struk, kasir, item..."
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={filterTerminal}
              onChange={(e) => setFilterTerminal(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white"
            >
              <option value="Semua">Semua Terminal</option>
              <option value="Pos-01">Pos-01 (Rian)</option>
              <option value="Pos-02">Pos-02 (Siti)</option>
              <option value="Pos-03">Pos-03 (Budi)</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white"
            >
              <option value="Semua">Semua Pembayaran</option>
              <option value="Tunai">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white"
            >
              <option value="Semua">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Batal">Batal</option>
            </select>
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">ID STRUK</th>
                  <th className="py-3 px-2">WAKTU</th>
                  <th className="py-3 px-2">KASIR / TERMINAL</th>
                  <th className="py-3 px-2">RINGKASAN ITEM</th>
                  <th className="py-3 px-2">SUBTOTAL</th>
                  <th className="py-3 px-2">DISKON</th>
                  <th className="py-3 px-2">TOTAL AKHIR</th>
                  <th className="py-3 px-2">METODE</th>
                  <th className="py-3 px-2">STATUS</th>
                  <th className="py-3 px-2 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 font-bold text-gray-900">{tx.id}</td>
                      <td className="py-3 px-2">
                        {tx.time}
                        <br />
                        <span className="text-[10px] text-gray-400">{tx.date}</span>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {tx.cashier}
                        <br />
                        <span className="text-[10px] text-gray-400">{tx.terminal}</span>
                      </td>
                      <td className="py-3 px-2">
                        {tx.itemsSummary}
                        <br />
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {tx.totalItems} item total
                        </span>
                      </td>
                      <td className="py-3 px-2">{formatRupiah(tx.subtotal)}</td>
                      <td className="py-3 px-2 text-gray-400">{tx.diskon}</td>
                      <td className="py-3 px-2 font-bold text-gray-900">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-semibold text-[10px] px-2 py-1 rounded ${
                            tx.paymentMethod === 'QRIS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-bold text-[10px] px-2 py-1 rounded border ${
                            tx.status === 'Berhasil'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-gray-400 space-x-1">
                        <button
                          onClick={() => alert(`Struk ${tx.id} dicetak`)}
                          className="hover:text-gray-900 cursor-pointer"
                          title="Cetak Struk"
                        >
                          🖨️
                        </button>
                        <button
                          onClick={() => alert(`Detail transaksi ${tx.id}`)}
                          className="hover:text-gray-900 cursor-pointer"
                          title="Lihat Detail"
                        >
                          👁️
                        </button>
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