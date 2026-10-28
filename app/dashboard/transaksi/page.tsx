'use client';

import Sidebar from '@/components/Sidebar';
import { useTransactions } from '@/context/TransactionContext';

export default function TransaksiPage() {
  const { filteredTransactions, stats, searchQuery, setSearchQuery, filterPayment, setFilterPayment } =
    useTransactions();

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧾</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transaksi & Penjualan</h1>
              <p className="text-xs text-gray-500 mt-1">
                Laporan detail seluruh transaksi yang masuk dari kasir (POS)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterPayment('Semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'Semua' ? 'bg-[#1E6F38] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Semua ({stats.totalCount})
            </button>
            <button
              onClick={() => setFilterPayment('Tunai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'Tunai' ? 'bg-[#1E6F38] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Tunai ({stats.tunaiCount})
            </button>
            <button
              onClick={() => setFilterPayment('QRIS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'QRIS' ? 'bg-[#1E6F38] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              QRIS ({stats.qrisCount})
            </button>
          </div>
        </div>

        {/* Tabel Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col">
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Filter transaksi..."
              className="w-full sm:w-80 border border-gray-200 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">NO. STRUK</th>
                  <th className="py-3 px-3">WAKTU</th>
                  <th className="py-3 px-3">KASIR</th>
                  <th className="py-3 px-3">DETAIL MENU</th>
                  <th className="py-3 px-3">TOTAL</th>
                  <th className="py-3 px-3">METODE</th>
                  <th className="py-3 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-3 font-bold text-gray-900">{tx.id}</td>
                    <td className="py-3.5 px-3">{tx.time}</td>
                    <td className="py-3.5 px-3 font-medium">{tx.cashier}</td>
                    <td className="py-3.5 px-3">{tx.itemsSummary}</td>
                    <td className="py-3.5 px-3 font-bold text-gray-900">{formatRupiah(tx.total)}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          tx.paymentMethod === 'QRIS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded border border-emerald-200">
                        {tx.status}
                      </span>
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
