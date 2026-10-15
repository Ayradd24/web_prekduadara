export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      
      {/* 1. SIDEBAR NAVIGASI (KIRI) */}
      <aside className="w-64 bg-[#2D4F2A] rounded-2xl p-4 flex flex-col gap-3 text-white shrink-0 hidden md:flex">
        <div className="bg-[#1E3F20] py-3 px-4 rounded-xl text-center font-bold text-sm">
          Navigasi Utama
        </div>

        <nav className="flex flex-col gap-2 mt-2">
          <button className="bg-[#EAA800] text-gray-900 font-bold py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 shadow-md cursor-default">
            <span>📊</span> Ringkasan / Dashboard
          </button>
          <button className="bg-[#EAA800] text-gray-900 font-bold py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 shadow-md cursor-default">
            <span>🧾</span> Transaksi & Penjualan
          </button>
          <button className="bg-[#EAA800] text-gray-900 font-bold py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 shadow-md cursor-default">
            <span>📦</span> Management Stok
          </button>
          <button className="bg-[#EAA800] text-gray-900 font-bold py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 shadow-md cursor-default">
            <span>👥</span> Management Kasir & Shift
          </button>
          <button className="bg-[#EAA800] text-gray-900 font-bold py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 shadow-md cursor-default">
            <span>⚙️</span> Pengaturan Toko
          </button>
        </nav>
      </aside>

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
            <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50">
              🖨️ Cetak Laporan
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100">
              📊 Export Excel
            </button>
            <button className="px-3 py-2 bg-[#FC4A1A] text-white rounded-lg text-xs font-bold hover:bg-orange-600 shadow-sm">
              + Order Baru (F1)
            </button>
          </div>
        </div>

        {/* 3 KARTU RINGKASAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Transaksi Hari Ini</p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">184</h2>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">↑ +14% vs kemarin</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">
              📋
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Omset Bruto</p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Rp 4.850.000</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-1">Setelah potongan & diskon</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
              💵
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transaksi Berhasil</p>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">178</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-1">96.7% success rate</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
              ✅
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input 
              type="text" 
              placeholder="🔍 Cari ID struk, kasir, item..." 
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800"
            />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white">
              <option>Hari ini (24 Okt 2024)</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white">
              <option>Semua Kasir / Terminal</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white">
              <option>Semua Status</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white">
              <option>Metode Pembayaran</option>
            </select>
            <button className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1">Reset</button>
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
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-bold text-gray-900">#TRX-202410-0192</td>
                  <td className="py-3 px-2">14:28:19<br/><span className="text-[10px] text-gray-400">Hari ini</span></td>
                  <td className="py-3 px-2 font-medium">Rian Pratama<br/><span className="text-[10px] text-gray-400">Kasir Pos-01</span></td>
                  <td className="py-3 px-2">2x Ayam Geprek Bakar + Es Teh<br/><span className="text-[10px] text-emerald-600 font-semibold">3 items total</span></td>
                  <td className="py-3 px-2">53.000</td>
                  <td className="py-3 px-2 text-gray-400">0</td>
                  <td className="py-3 px-2 font-bold text-gray-900">Rp 58.500</td>
                  <td className="py-3 px-2"><span className="bg-emerald-100 text-emerald-800 font-semibold text-[10px] px-2 py-1 rounded">QRIS (Gopay)</span></td>
                  <td className="py-3 px-2"><span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded border border-emerald-200">Berhasil</span></td>
                  <td className="py-3 px-2 text-center text-gray-400 space-x-1">📄 🖨️ 👁️</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-bold text-gray-900">#TRX-202410-0191</td>
                  <td className="py-3 px-2">14:21:05<br/><span className="text-[10px] text-gray-400">Hari ini</span></td>
                  <td className="py-3 px-2 font-medium">Siti Rahma<br/><span className="text-[10px] text-gray-400">Kasir Pos-02</span></td>
                  <td className="py-3 px-2">1x Ayam Geprek Biasa + Es Teh<br/><span className="text-[10px] text-emerald-600 font-semibold">2 items total</span></td>
                  <td className="py-3 px-2">35.000</td>
                  <td className="py-3 px-2 text-gray-400">0</td>
                  <td className="py-3 px-2 font-bold text-gray-900">Rp 38.500</td>
                  <td className="py-3 px-2"><span className="bg-blue-100 text-blue-800 font-semibold text-[10px] px-2 py-1 rounded">Tunai (Cash)</span></td>
                  <td className="py-3 px-2"><span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded border border-emerald-200">Berhasil</span></td>
                  <td className="py-3 px-2 text-center text-gray-400 space-x-1">📄 🖨️ 👁️</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}