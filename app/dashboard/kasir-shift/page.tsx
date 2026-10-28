'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface KasirItem {
  id: string;
  dbId?: number;
  name: string;
  roleTitle: string;
  shift: string;
  shiftDetail?: string;
  statusLive: 'Aktif Melayani' | 'Standby / Rehat' | 'Selesai Shift / Off';
  isActive: boolean;
}

const INITIAL_KASIR: KasirItem[] = [
  {
    id: '#KSR-001',
    name: 'Rian',
    roleTitle: 'Kasir',
    shift: 'Shift Pagi',
    shiftDetail: '08:00 - 12:00 WIB',
    statusLive: 'Aktif Melayani',
    isActive: true,
  },
  {
    id: '#KSR-002',
    name: 'Siti',
    roleTitle: 'Kasir',
    shift: 'Shift Siang',
    shiftDetail: '12:00 - 17:00 WIB',
    statusLive: 'Standby / Rehat',
    isActive: true,
  },
  {
    id: '#KSR-003',
    name: 'Budi',
    roleTitle: 'Kasir',
    shift: 'Shift Malam',
    shiftDetail: '17:00 - 22:00 WIB',
    statusLive: 'Standby / Rehat',
    isActive: true,
  },
];

export default function KasirShiftPage() {
  const [kasirList, setKasirList] = useState<KasirItem[]>(INITIAL_KASIR);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShift, setNewShift] = useState('Shift Pagi');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Fetch dari backend MariaDB jika server aktif
  useEffect(() => {
    async function loadKasir() {
      try {
        const res = await fetch('http://localhost:5000/api/cashiers');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: KasirItem[] = json.data.map((item: any) => {
            let shiftMain = 'Shift Pagi';
            let shiftDetail = '08:00 - 12:00 WIB';
            if (item.shift?.includes('Siang')) {
              shiftMain = 'Shift Siang';
              shiftDetail = '12:00 - 17:00 WIB';
            } else if (item.shift?.includes('Malam')) {
              shiftMain = 'Shift Malam';
              shiftDetail = '17:00 - 22:00 WIB';
            } else if (item.shift?.includes('Off') || item.shift?.includes('Libur')) {
              shiftMain = 'Off / Libur';
              shiftDetail = 'Jadwal Libur';
            }
            return {
              id: item.id,
              dbId: item.dbId,
              name: item.name,
              roleTitle: 'Kasir',
              shift: shiftMain,
              shiftDetail: shiftDetail,
              statusLive: item.statusLive || 'Aktif Melayani',
              isActive: item.isActive ?? true,
            };
          });
          setKasirList(mapped);
        }
      } catch (err) {
        // Gunakan initial state jika backend belum dinyalakan
      }
    }
    loadKasir();
  }, []);

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Toggle saklar akses aktif
  const toggleActive = async (id: string) => {
    setKasirList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    try {
      const token = localStorage.getItem('prek_auth_token');
      await fetch(`http://localhost:5000/api/cashiers/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Tetap terupdate di UI
    }
    showAlert('Status akses kasir berhasil diperbarui!');
  };

  // Tambah kasir baru (hanya menulis nama kasir dan shift)
  const handleAddKasir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextNumber = kasirList.length + 1;
    const newId = `#KSR-${String(nextNumber).padStart(3, '0')}`;
    const detailMap: Record<string, string> = {
      'Shift Pagi': '08:00 - 12:00 WIB',
      'Shift Siang': '12:00 - 17:00 WIB',
      'Shift Malam': '17:00 - 22:00 WIB',
      'Off / Libur': 'Jadwal Libur',
    };

    const newEntry: KasirItem = {
      id: newId,
      name: newName.trim(),
      roleTitle: 'Kasir',
      shift: newShift,
      shiftDetail: detailMap[newShift] || '08:00 - 12:00 WIB',
      statusLive: newShift === 'Off / Libur' ? 'Selesai Shift / Off' : 'Standby / Rehat',
      isActive: newShift !== 'Off / Libur',
    };

    setKasirList([newEntry, ...kasirList]);
    setNewName('');
    setIsModalOpen(false);

    try {
      const token = localStorage.getItem('prek_auth_token');
      await fetch('http://localhost:5000/api/cashiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newEntry.name,
          shift: `${newEntry.shift} (${newEntry.shiftDetail})`,
        }),
      });
    } catch {
      // Tetap terupdate di UI
    }

    showAlert(`Kasir baru '${newEntry.name}' berhasil ditambahkan!`);
  };

  // Hapus kasir
  const handleDeleteKasir = async (id: string, name: string) => {
    if (!confirm(`Hapus kasir ${name} dari daftar?`)) return;
    setKasirList((prev) => prev.filter((c) => c.id !== id));
    try {
      const token = localStorage.getItem('prek_auth_token');
      await fetch(`http://localhost:5000/api/cashiers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore
    }
    showAlert(`Kasir ${name} berhasil dihapus.`);
  };

  // Filter pencarian berdasarkan nama atau kode kasir
  const filtered = kasirList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ambil inisial nama untuk avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Toast Notifikasi */}
        {alertMsg && (
          <div className="fixed top-6 right-6 z-50 bg-[#26492C] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold animate-bounce">
            <span>✅</span>
            <span>{alertMsg}</span>
          </div>
        )}

        {/* Card Header & Tabel Kasir */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
          {/* Header Row: Title + Badge + Search + Tombol Tambah */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Daftar Staf Kasir POS
              </h1>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {kasirList.length} Terdata
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Cari nama kasir..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F7B733]/50 focus:border-[#F7B733]"
                />
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#26492C] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#1e3b23] transition flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                <span>+</span> Tambah Kasir
              </button>
            </div>
          </div>

          {/* Table Staf Kasir (Tanpa kolom Mesin POS) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">STAF KASIR</th>
                  <th className="pb-3 px-4">PERAN</th>
                  <th className="pb-3 px-4">SHIFT TERJADWAL</th>
                  <th className="pb-3 px-4">STATUS LIVE</th>
                  <th className="pb-3 px-4 text-center">AKSES AKTIF</th>
                  <th className="pb-3 pl-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((kasir, idx) => {
                  const initials = getInitials(kasir.name);
                  const avatarBgs = [
                    'bg-amber-100 text-amber-800',
                    'bg-orange-100 text-orange-800',
                    'bg-slate-100 text-slate-700',
                    'bg-blue-100 text-blue-800',
                  ];
                  const avatarColor = avatarBgs[idx % avatarBgs.length];

                  return (
                    <tr key={kasir.id} className="hover:bg-gray-50/60 transition group">
                      {/* 1. Staf Kasir Info */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {kasir.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {kasir.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Peran (Kasir) */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                          Kasir
                        </span>
                      </td>

                      {/* 3. Shift Terjadwal */}
                      <td className="py-4 px-4">
                        <div>
                          <div
                            className={`font-semibold text-xs ${
                              kasir.shift.includes('Pagi')
                                ? 'text-amber-800'
                                : kasir.shift.includes('Siang')
                                ? 'text-orange-700'
                                : kasir.shift.includes('Malam')
                                ? 'text-slate-800'
                                : 'text-rose-600'
                            }`}
                          >
                            {kasir.shift}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {kasir.shiftDetail}
                          </div>
                        </div>
                      </td>

                      {/* 4. Status Live */}
                      <td className="py-4 px-4">
                        {kasir.statusLive === 'Aktif Melayani' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aktif Melayani
                          </span>
                        ) : kasir.statusLive === 'Standby / Rehat' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Standby / Rehat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            Selesai Shift / Off
                          </span>
                        )}
                      </td>

                      {/* 5. Akses Aktif Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(kasir.id)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 mx-auto ${
                            kasir.isActive ? 'bg-[#26492C]' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                              kasir.isActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 pl-4 text-right">
                        <div className="inline-flex items-center gap-2 text-gray-400">
                          <button
                            title="Edit Data Kasir"
                            className="p-1.5 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          >
                            ✏️
                          </button>
                          <button
                            title="Reset PIN Kasir"
                            className="p-1.5 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          >
                            🔢
                          </button>
                          <button
                            title="Hapus Kasir"
                            onClick={() => handleDeleteKasir(kasir.id, kasir.name)}
                            className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Note & Sinkronisasi */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100 gap-2">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <span>✅</span>
              <span>
                Perubahan saklar status kasir tersinkron otomatis ke aplikasi kasir.
              </span>
            </div>
            <div>Halaman 1 dari 1</div>
          </div>
        </div>

        {/* Card Bawah: Kebijakan Shift Kasir PrekDuaDara */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Manajemen Shift Kasir PrekDuaDara
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Kasir bertugas: Rian (Shift Pagi), Siti (Shift Siang), Budi (Shift Malam).
              </p>
            </div>
          </div>
          <button
            onClick={() => alert('Jadwal Shift PrekDuaDara:\n1. Rian (Shift Pagi: 08:00 - 12:00 WIB)\n2. Siti (Shift Siang: 12:00 - 17:00 WIB)\n3. Budi (Shift Malam: 17:00 - 22:00 WIB)')}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Lihat Jadwal Shift
          </button>
        </div>
      </main>

      {/* Modal Tambah Kasir Baru (Hanya Menulis Nama & Shift) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>👤</span> Tambah Kasir Baru
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKasir} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Kasir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian, Siti, Budi..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F7B733]/50 focus:border-[#F7B733]"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Cukup tuliskan nama kasir saja.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jadwal Shift Kerja
                </label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F7B733]/50"
                >
                  <option value="Shift Pagi">Shift Pagi (08:00 - 12:00 WIB)</option>
                  <option value="Shift Siang">Shift Siang (12:00 - 17:00 WIB)</option>
                  <option value="Shift Malam">Shift Malam (17:00 - 22:00 WIB)</option>
                  <option value="Off / Libur">Off / Libur (Non-aktif)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#26492C] text-white rounded-xl text-xs font-semibold hover:bg-[#1e3b23] shadow-sm"
                >
                  Simpan Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
