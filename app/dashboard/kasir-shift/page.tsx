'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export interface KasirItem {
  id: string; // cashier_code, misal: '#KSR-001'
  dbId?: number;
  name: string; // 'Rian', 'Siti', 'Budi'
  roleTitle: string; // 'Kasir'
  shift: string; // 'Shift Pagi (08:00 - 12:00)', 'Shift Siang (12:00 - 17:00)', 'Shift Malam (17:00 - 22:00)'
  shiftMain: 'Shift Pagi' | 'Shift Siang' | 'Shift Malam' | 'Off / Libur';
  shiftHours: string; // '08:00 - 12:00', '12:00 - 17:00', '17:00 - 22:00'
  statusLive: 'Aktif Melayani' | 'Standby / Rehat' | 'Selesai Shift / Off';
  isActive: boolean;
  avatarColor: string;
  initials: string;
  createdAt?: string;
}

// Data Default (Sesuai persis dengan database MariaDB prekduadara_db tabel `kasir`)
const INITIAL_KASIR: KasirItem[] = [
  {
    id: '#KSR-001',
    dbId: 1,
    name: 'Rian',
    roleTitle: 'Kasir',
    shift: 'Shift Pagi (08:00 - 12:00)',
    shiftMain: 'Shift Pagi',
    shiftHours: '08:00 - 12:00',
    statusLive: 'Aktif Melayani',
    isActive: true,
    avatarColor: 'bg-amber-100 text-amber-800 border-amber-300',
    initials: 'RN',
  },
  {
    id: '#KSR-002',
    dbId: 2,
    name: 'Siti',
    roleTitle: 'Kasir',
    shift: 'Shift Siang (12:00 - 17:00)',
    shiftMain: 'Shift Siang',
    shiftHours: '12:00 - 17:00',
    statusLive: 'Standby / Rehat',
    isActive: true,
    avatarColor: 'bg-orange-100 text-orange-800 border-orange-300',
    initials: 'ST',
  },
  {
    id: '#KSR-003',
    dbId: 3,
    name: 'Budi',
    roleTitle: 'Kasir',
    shift: 'Shift Malam (17:00 - 22:00)',
    shiftMain: 'Shift Malam',
    shiftHours: '17:00 - 22:00',
    statusLive: 'Standby / Rehat',
    isActive: true,
    avatarColor: 'bg-slate-100 text-slate-700 border-slate-300',
    initials: 'BD',
  },
];

export default function KasirShiftPage() {
  const [kasirList, setKasirList] = useState<KasirItem[]>(INITIAL_KASIR);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('Semua');
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // State Form Kasir
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Kasir');
  const [formId, setFormId] = useState('#KSR-004');
  const [formShift, setFormShift] = useState<'Pagi' | 'Siang' | 'Malam'>('Pagi');
  const [formIsActive, setFormIsActive] = useState(true);

  // Active Drawer State (Menggunakan kasir aktif dari database: Rian #KSR-001)
  const [drawerData, setDrawerData] = useState({
    counter: 'Counter #01',
    operator: 'Rian (#KSR-001)',
    shiftInfo: 'Shift Pagi (08:00 - 12:00) • Login 07:54 WIB • Modal Awal Rp 500.000',
    totalSales: 3842500,
    totalNotes: 94,
    isOpen: true,
  });

  const showAlert = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Helper format inisial
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Helper parse shift database string
  const parseShift = (shiftStr?: string) => {
    let shiftMain: 'Shift Pagi' | 'Shift Siang' | 'Shift Malam' | 'Off / Libur' = 'Shift Pagi';
    let shiftHours = '08:00 - 12:00';

    if (!shiftStr) return { shiftMain, shiftHours };

    if (shiftStr.toLowerCase().includes('siang')) {
      shiftMain = 'Shift Siang';
      shiftHours = '12:00 - 17:00';
    } else if (shiftStr.toLowerCase().includes('malam')) {
      shiftMain = 'Shift Malam';
      shiftHours = '17:00 - 22:00';
    } else if (shiftStr.toLowerCase().includes('off') || shiftStr.toLowerCase().includes('libur')) {
      shiftMain = 'Off / Libur';
      shiftHours = 'Jadwal Libur';
    }

    return { shiftMain, shiftHours };
  };

  // 1. FETCH DATA DARI API BACKEND MARIADB
  const loadCashiersFromDB = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/cashiers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const avatarBgs = [
          'bg-amber-100 text-amber-800 border-amber-300',
          'bg-orange-100 text-orange-800 border-orange-300',
          'bg-slate-100 text-slate-700 border-slate-300',
          'bg-blue-100 text-blue-800 border-blue-300',
        ];

        const mapped: KasirItem[] = json.data.map((c: any, idx: number) => {
          const { shiftMain, shiftHours } = parseShift(c.shift);
          return {
            id: c.id, // cashier_code (#KSR-001)
            dbId: c.dbId,
            name: c.name,
            roleTitle: c.roleTitle || 'Kasir',
            shift: c.shift || 'Shift Pagi (08:00 - 12:00)',
            shiftMain,
            shiftHours,
            statusLive: c.statusLive || 'Aktif Melayani',
            isActive: Boolean(c.isActive),
            avatarColor: avatarBgs[idx % avatarBgs.length],
            initials: getInitials(c.name),
            createdAt: c.createdAt,
          };
        });

        setKasirList(mapped);

        // Update kasir aktif pada drawer jika ada kasir yang aktif
        const activeOne = mapped.find((item) => item.statusLive === 'Aktif Melayani' && item.isActive);
        if (activeOne) {
          setDrawerData((prev) => ({
            ...prev,
            operator: `${activeOne.name} (${activeOne.id})`,
            shiftInfo: `${activeOne.shift} • Login Aktif • Modal Awal Rp 500.000`,
          }));
        }
      }
    } catch {
      // Jika backend belum aktif, tetap gunakan INITIAL_KASIR
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashiersFromDB();
  }, [loadCashiersFromDB]);

  // 2. TOGGLE STATUS AKSES KASIR (Sinkron ke Database)
  const handleToggleActive = async (id: string) => {
    const targetKasir = kasirList.find((c) => c.id === id);
    const nextActive = !targetKasir?.isActive;

    // Optimistic Update di UI
    setKasirList((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            isActive: nextActive,
            statusLive: nextActive
              ? c.shiftMain === 'Off / Libur'
                ? 'Standby / Rehat'
                : 'Aktif Melayani'
              : 'Selesai Shift / Off',
          };
        }
        return c;
      })
    );

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('prek_auth_token') : null;
      await fetch(`http://localhost:5000/api/cashiers/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Tetap terupdate di UI
    }

    showAlert('Status hak akses kasir berhasil diperbarui!', 'success');
  };

  // 3. EDIT KASIR
  const handleStartEdit = (kasir: KasirItem) => {
    setEditingId(kasir.id);
    setFormName(kasir.name);
    setFormRole(kasir.roleTitle || 'Kasir');
    setFormId(kasir.id);
    if (kasir.shift.includes('Siang')) setFormShift('Siang');
    else if (kasir.shift.includes('Malam')) setFormShift('Malam');
    else setFormShift('Pagi');
    setFormIsActive(kasir.isActive);

    showAlert(`Mengedit data: ${kasir.name}`, 'info');
  };

  // 4. RESET FORM
  const handleResetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormRole('Kasir');
    const nextNum = kasirList.length + 1;
    setFormId(`#KSR-${String(nextNum).padStart(3, '0')}`);
    setFormShift('Pagi');
    setFormIsActive(true);
  };

  // 5. SIMPAN KASIR (POST / PUT ke Database)
  const handleSaveKasir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showAlert('Nama kasir wajib diisi!', 'warning');
      return;
    }

    const shiftMap: Record<string, { label: string; main: 'Shift Pagi' | 'Shift Siang' | 'Shift Malam'; hours: string }> = {
      Pagi: { label: 'Shift Pagi (08:00 - 12:00)', main: 'Shift Pagi', hours: '08:00 - 12:00' },
      Siang: { label: 'Shift Siang (12:00 - 17:00)', main: 'Shift Siang', hours: '12:00 - 17:00' },
      Malam: { label: 'Shift Malam (17:00 - 22:00)', main: 'Shift Malam', hours: '17:00 - 22:00' },
    };

    const chosen = shiftMap[formShift] || shiftMap.Pagi;
    const statusLive = !formIsActive
      ? 'Selesai Shift / Off'
      : chosen.main === 'Shift Pagi'
        ? 'Aktif Melayani'
        : 'Standby / Rehat';

    const token = typeof window !== 'undefined' ? localStorage.getItem('prek_auth_token') : null;

    if (editingId) {
      // Update di State Lokal
      setKasirList((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
              ...item,
              name: formName.trim(),
              roleTitle: formRole,
              shift: chosen.label,
              shiftMain: chosen.main,
              shiftHours: chosen.hours,
              statusLive: statusLive as any,
              isActive: formIsActive,
              initials: getInitials(formName),
            }
            : item
        )
      );

      // Kirim Update ke Backend jika token ada
      try {
        await fetch(`http://localhost:5000/api/cashiers/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: formName.trim(),
            role_title: formRole,
            shift: chosen.label,
            status_live: statusLive,
          }),
        });
      } catch { }

      showAlert(`Data kasir ${formName} berhasil diperbarui!`, 'success');
    } else {
      // Tambah Baru di State Lokal
      const newCode = formId || `#KSR-${String(kasirList.length + 1).padStart(3, '0')}`;
      const newKasir: KasirItem = {
        id: newCode,
        name: formName.trim(),
        roleTitle: formRole || 'Kasir',
        shift: chosen.label,
        shiftMain: chosen.main,
        shiftHours: chosen.hours,
        statusLive: statusLive as any,
        isActive: formIsActive,
        avatarColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        initials: getInitials(formName),
      };

      setKasirList((prev) => [newKasir, ...prev]);

      // Kirim POST ke Backend
      try {
        const res = await fetch('http://localhost:5000/api/cashiers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: formName.trim(),
            shift: chosen.label,
          }),
        });
        const resJson = await res.json();
        if (resJson.success) {
          loadCashiersFromDB();
        }
      } catch { }

      showAlert(`Kasir baru ${formName} berhasil didaftarkan!`, 'success');
    }

    handleResetForm();
  };

  // 6. HAPUS KASIR (DELETE ke Database)
  const handleDeleteKasir = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus data kasir "${name}" (${id}) dari database?`)) return;

    // Optimistic Delete
    setKasirList((prev) => prev.filter((c) => c.id !== id));
    showAlert(`Kasir ${name} telah dihapus.`, 'info');
    if (editingId === id) handleResetForm();

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('prek_auth_token') : null;
      await fetch(`http://localhost:5000/api/cashiers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch { }
  };

  // 7. GANTI OPERATOR LACI
  const handleGantiOperator = () => {
    const onlineCashiers = kasirList.filter((c) => c.isActive);
    if (onlineCashiers.length === 0) {
      showAlert('Tidak ada kasir aktif yang dapat menggantikan.', 'warning');
      return;
    }
    const currentName = drawerData.operator.split(' (')[0];
    const candidate = onlineCashiers.find((c) => c.name !== currentName) || onlineCashiers[0];
    setDrawerData((prev) => ({
      ...prev,
      operator: `${candidate.name} (${candidate.id})`,
      shiftInfo: `${candidate.shift} • Login Baru • Modal Awal Rp 500.000`,
    }));
    showAlert(`Operator laci dialihkan ke ${candidate.name}!`, 'success');
  };

  // 8. TUTUP SHIFT PAKSA
  const handleTutupShift = () => {
    if (
      confirm(
        `TUTUP SHIFT PAKSA COUNTER #01?\n\nOperator: ${drawerData.operator}\nTotal Penjualan: Rp ${drawerData.totalSales.toLocaleString(
          'id-ID'
        )}\nTotal Nota: ${drawerData.totalNotes}\n\nStruk rekap 'Shift X-Report' akan otomatis dicetak.`
      )
    ) {
      setDrawerData((prev) => ({
        ...prev,
        isOpen: false,
      }));
      showAlert('Shift Counter #01 berhasil ditutup dan struk rekap dicetak.', 'success');
    }
  };

  // Filter Data Berdasarkan Pencarian & Shift
  const filteredKasir = kasirList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shift.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedShiftFilter === 'Semua') return matchesSearch;
    if (selectedShiftFilter === 'Pagi') return matchesSearch && item.shift.includes('Pagi');
    if (selectedShiftFilter === 'Siang') return matchesSearch && item.shift.includes('Siang');
    if (selectedShiftFilter === 'Malam') return matchesSearch && item.shift.includes('Malam');
    return matchesSearch;
  });

  // Metrik Ringkasan Berdasarkan Data Tabel `kasir`
  const totalKasir = kasirList.length;
  const kasirOnline = kasirList.filter((c) => c.statusLive === 'Aktif Melayani' && c.isActive).length;
  const kasirStandby = kasirList.filter((c) => c.statusLive === 'Standby / Rehat' && c.isActive).length;
  const kasirOff = kasirList.filter((c) => !c.isActive || c.statusLive === 'Selesai Shift / Off').length;

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start">
      {/* 1. SIDEBAR KIRI */}
      <Sidebar />

      {/* 2. AREA KONTEN UTAMA */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* Toast Notifikasi */}
        {alertMsg && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-bounce ${alertMsg.type === 'success'
                ? 'bg-[#1E562F]'
                : alertMsg.type === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
          >
            <span className="text-lg">
              {alertMsg.type === 'success' ? '✓' : alertMsg.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* TOP NAVBAR HEADER */}
        <header className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA8E18] to-[#F59E0B] flex items-center justify-center text-white font-black text-xl shadow-sm">
              🍗
            </div>
            <div>
              <div className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2">
                PrekDuaDara
              </div>
              <div className="text-[11px] text-gray-400 font-medium">
                Pengaturan Staf &amp; Kasir Restoran
              </div>
            </div>
          </div>

          {/* Cabang & Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Cabang Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Cabang Sudirman Utama</span>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Dashboard POS
              </Link>
              <Link
                href="/dashboard/transaksi"
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Riwayat Transaksi
              </Link>
              <button
                type="button"
                onClick={() => showAlert('Fitur Shift & Laci siap digunakan', 'info')}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Shift &amp; Laci
              </button>
              <div className="px-3.5 py-1.5 bg-[#EA8E18] text-white font-bold rounded-lg shadow-sm">
                Pengaturan Kasir
              </div>
            </nav>
          </div>

          {/* Sync & User Profile */}
          <div className="flex items-center gap-3">
            {/* Online Sync Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ONLINE SYNC (MARIADB)</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900 leading-tight">Rian Pratama</div>
                <div className="text-[10px] text-amber-700 font-medium">Supervisor Kasir</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE & ACTION ROW */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Pengaturan &amp; Manajemen Kasir
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                DATABASE KASIR
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px] font-semibold">
                Tabel `kasir` • Cabang #01
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kelola data kasir dari database MariaDB (tabel `kasir`), pantau status shift, dan atur hak akses akun secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Filter Shift Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filter Shift: {selectedShiftFilter}</span>
                <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showShiftDropdown && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 text-xs">
                  {[
                    { key: 'Semua', label: 'Semua Shift' },
                    { key: 'Pagi', label: 'Shift Pagi (08:00 - 12:00)' },
                    { key: 'Siang', label: 'Shift Siang (12:00 - 17:00)' },
                    { key: 'Malam', label: 'Shift Malam (17:00 - 22:00)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSelectedShiftFilter(opt.key);
                        setShowShiftDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 font-medium ${selectedShiftFilter === opt.key ? 'text-[#EA8E18] font-bold bg-amber-50' : 'text-gray-700'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Refresh dari Database */}
            <button
              type="button"
              onClick={loadCashiersFromDB}
              title="Refresh Data dari Database"
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition shadow-sm cursor-pointer"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#EA8E18]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            {/* Tambah Kasir Baru Button */}
            <button
              type="button"
              onClick={() => {
                handleResetForm();
                const formElem = document.getElementById('form-kasir-container');
                formElem?.scrollIntoView({ behavior: 'smooth' });
                showAlert('Silakan isi form di sebelah kanan untuk menambahkan staf kasir', 'info');
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#EA8E18] to-[#F59E0B] hover:from-[#d67e10] hover:to-[#ea8e18] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>+ Tambah Kasir Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY STAT CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Kasir */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                TOTAL KASIR TERDAFTAR
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#EA8E18] flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{totalKasir}</span>
              <span className="text-xs font-semibold text-gray-500">Staf Kasir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-2 border-t border-gray-50">
              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Tersimpan di tabel `kasir`</span>
            </div>
          </div>

          {/* Card 2: Sedang Bertugas */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                SEDANG BERTUGAS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Live
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{kasirOnline}</span>
              <span className="text-xs font-semibold text-gray-500">Kasir Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pt-2 border-t border-gray-50">
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span>Status: Aktif Melayani</span>
            </div>
          </div>

          {/* Card 3: Standby / Istirahat */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                STANDBY / ISTIRAHAT
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#EA8E18] flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{kasirStandby}</span>
              <span className="text-xs font-semibold text-gray-500">Kasir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pt-2 border-t border-gray-50">
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Pergantian shift berikutnya</span>
            </div>
          </div>

          {/* Card 4: Off / Libur / Cuti */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                OFF / NON-AKTIF
              </span>
              <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{kasirOff}</span>
              <span className="text-xs font-semibold text-gray-500">Kasir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium pt-2 border-t border-gray-50">
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Hak akses akun tertahan</span>
            </div>
          </div>
        </section>

        {/* ACTIVE CASH DRAWER BANNER */}
        <section className="bg-[#FFFDF7] rounded-2xl p-4 sm:p-5 border border-[#FDE68A] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          {/* Sisi Kiri: Operator & Counter Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0.01" />
                <path d="M12 15h0.01" />
                <path d="M17 15h0.01" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  LACI KASIR AKTIF SAAT INI
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {drawerData.counter}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
                {drawerData.operator}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {drawerData.shiftInfo}
              </p>
            </div>
          </div>

          {/* Sisi Tengah: Metrik Shift */}
          <div className="flex items-center gap-6 sm:gap-10 border-y lg:border-y-0 lg:border-x border-[#FDE68A] py-3 lg:py-0 lg:px-8">
            <div>
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                TOTAL PENJUALAN SHIFT
              </div>
              <div className="text-lg sm:text-xl font-black text-[#B45309]">
                Rp {drawerData.totalSales.toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                TRANSAKSI SELESAI
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900">
                {drawerData.totalNotes} Nota
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-2.5 sm:self-end lg:self-center">
            <button
              type="button"
              onClick={handleGantiOperator}
              className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5" />
                <path d="M4 20L21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l6 6" />
                <path d="M4 4l5 5" />
              </svg>
              <span>Ganti Operator Laci</span>
            </button>
            <button
              type="button"
              onClick={handleTutupShift}
              className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
              <span>Tutup Shift Paksa</span>
            </button>
          </div>
        </section>

        {/* 2-COLUMN MAIN CONTENT: LEFT (TABLE) & RIGHT (FORM & HARDWARE) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* KOLOM KIRI: TABEL DAFTAR KASIR (~68% = 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
              {/* Header Tabel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Daftar Staf Kasir POS
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    {filteredKasir.length} Terdata
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari nama atau ID kasir..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#EA8E18]/40 focus:border-[#EA8E18]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Sinkron dengan Database `kasir` */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 pr-3">STAF KASIR</th>
                      <th className="pb-3 px-3">PERAN</th>
                      <th className="pb-3 px-3">SHIFT TERJADWAL</th>
                      <th className="pb-3 px-3">STATUS LIVE</th>
                      <th className="pb-3 px-3 text-center">AKSES AKTIF</th>
                      <th className="pb-3 pl-3 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredKasir.map((kasir) => (
                      <tr key={kasir.id} className="hover:bg-gray-50/70 transition group">
                        {/* 1. Staf Kasir (Avatar, Nama, ID/cashier_code) */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border ${kasir.avatarColor} shrink-0`}
                            >
                              {kasir.initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-gray-900 text-xs sm:text-sm">
                                {kasir.name}
                              </div>
                              <div className="text-[11px] text-gray-400 font-medium">
                                {kasir.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Peran (role_title) */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            {kasir.roleTitle || 'Kasir'}
                          </span>
                        </td>

                        {/* 3. Shift Terjadwal (shift) */}
                        <td className="py-3.5 px-3">
                          <div>
                            <div
                              className={`font-bold text-xs ${kasir.shift.includes('Pagi')
                                  ? 'text-amber-800'
                                  : kasir.shift.includes('Siang')
                                    ? 'text-orange-700'
                                    : kasir.shift.includes('Malam')
                                      ? 'text-slate-800'
                                      : 'text-rose-700'
                                }`}
                            >
                              {kasir.shiftMain}
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">
                              {kasir.shiftHours}
                            </div>
                          </div>
                        </td>

                        {/* 4. Status Live (status_live) */}
                        <td className="py-3.5 px-3">
                          {kasir.statusLive === 'Aktif Melayani' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktif Melayani
                            </span>
                          ) : kasir.statusLive === 'Standby / Rehat' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Standby / Rehat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium border border-gray-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                              Selesai Shift / Off
                            </span>
                          )}
                        </td>

                        {/* 5. Akses Aktif (is_active) Toggle Switch */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            title="Nyalakan / Matikan Hak Akses Kasir"
                            onClick={() => handleToggleActive(kasir.id)}
                            className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${kasir.isActive ? 'bg-[#1E562F]' : 'bg-gray-300'
                              }`}
                          >
                            <span
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${kasir.isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </td>

                        {/* 6. Aksi (Edit & Delete) */}
                        <td className="py-3.5 pl-3 text-right">
                          <div className="inline-flex items-center gap-1.5 text-gray-400">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(kasir)}
                              title="Edit Data Kasir"
                              className="p-1.5 hover:text-[#EA8E18] hover:bg-amber-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKasir(kasir.id, kasir.name)}
                              title="Hapus Kasir"
                              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredKasir.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          {isLoading ? 'Memuat data dari database...' : 'Tidak ada data kasir yang sesuai.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Catatan Bawah Tabel */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-100 gap-2 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Perubahan saklar status kasir tersinkron otomatis ke database MariaDB &amp; Flutter POS.</span>
                </div>
                <div>Halaman 1 dari 1</div>
              </div>
            </div>

            {/* BOX KEBIJAKAN KEAMANAN POS */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">
                    Kebijakan Keamanan Kasir POS PrekDuaDara
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Setiap pergantian operator wajib cetak struk rekap &apos;Shift X-Report&apos; sebelum serah terima laci tunai.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "SOP PERGANTIAN SHIFT PREKDUADARA:\n\n1. Hitung total uang tunai fisik di dalam laci kasir.\n2. Lakukan klik 'Tutup Shift' atau cetak 'Shift X-Report'.\n3. Cocokkan nominal fisik dengan rekap sistem.\n4. Tanda tangani lembar serah terima bersama supervisor.\n5. Operator baru login menggunakan akun staf masing-masing."
                  )
                }
                className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition whitespace-nowrap shadow-sm cursor-pointer"
              >
                Lihat Panduan SOP
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: FORM KASIR SESUAI DATABASE & HARDWARE (~32% = 4 cols) */}
          <div id="form-kasir-container" className="lg:col-span-4 flex flex-col gap-5">
            {/* CARD 1: FORM KASIR */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
              {/* Header Form */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    Form Kasir
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {editingId ? 'Edit data staf kasir terpilih' : 'Tambah atau perbarui profil staf kasir ke database.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                  Input Cepat
                </span>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSaveKasir} className="flex flex-col gap-3.5">
                {/* 1. Nama Lengkap Kasir */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    NAMA KASIR *
                  </label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rian, Siti, Budi..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EA8E18]/40 focus:border-[#EA8E18]"
                    />
                  </div>
                </div>

                {/* 2. Peran / role_title */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    PERAN (ROLE TITLE) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EA8E18]/40 focus:border-[#EA8E18]"
                    />
                  </div>
                </div>

                {/* 3. ID Kasir (cashier_code) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    KODE KASIR (CASHIER CODE) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      #
                    </span>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EA8E18]/40 focus:border-[#EA8E18]"
                    />
                  </div>
                </div>

                {/* 4. Shift Kerja Reguler (Sesuai database MariaDB) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    SHIFT KERJA REGULER (DATABASE)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormShift('Pagi')}
                      className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${formShift === 'Pagi'
                          ? 'bg-gradient-to-r from-[#EA8E18] to-[#F59E0B] text-white border-transparent shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="font-black text-xs">Pagi</span>
                      <span className={`text-[9px] ${formShift === 'Pagi' ? 'text-amber-100' : 'text-gray-400'}`}>
                        08:00-12:00
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormShift('Siang')}
                      className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${formShift === 'Siang'
                          ? 'bg-gradient-to-r from-[#EA8E18] to-[#F59E0B] text-white border-transparent shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="font-black text-xs">Siang</span>
                      <span className={`text-[9px] ${formShift === 'Siang' ? 'text-amber-100' : 'text-gray-400'}`}>
                        12:00-17:00
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormShift('Malam')}
                      className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${formShift === 'Malam'
                          ? 'bg-gradient-to-r from-[#EA8E18] to-[#F59E0B] text-white border-transparent shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="font-black text-xs">Malam</span>
                      <span className={`text-[9px] ${formShift === 'Malam' ? 'text-amber-100' : 'text-gray-400'}`}>
                        17:00-22:00
                      </span>
                    </button>
                  </div>
                </div>

                {/* 5. Status Akun Kasir Aktif (is_active) Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mt-1">
                  <div>
                    <div className="text-xs font-extrabold text-gray-800">
                      Status Akun Kasir Aktif (is_active)
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Kasir dapat login ke sistem kasir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${formIsActive ? 'bg-[#1E562F]' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formIsActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 mt-1">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Batal / Bersihkan
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-3 bg-[#1E562F] hover:bg-[#164223] text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Simpan Kasir</span>
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: KONEKSI HARDWARE KASIR */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                  KONEKSI HARDWARE KASIR
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Normal
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                {/* Printer Thermal */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>Printer Thermal Struk #01</span>
                  </div>
                  <span className="font-bold text-gray-900">Ready</span>
                </div>

                {/* Cash Drawer */}
                <div className="flex items-center justify-between py-1 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M7 15h0.01" />
                      <path d="M12 15h0.01" />
                      <path d="M17 15h0.01" />
                      <path d="M2 10h20" />
                    </svg>
                    <span>Cash Drawer RJ11</span>
                  </div>
                  <span className="font-bold text-gray-900">Tersambung</span>
                </div>

                {/* Barcode / QRIS Scanner */}
                <div className="flex items-center justify-between py-1 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                    </svg>
                    <span>Barcode / QRIS Scanner</span>
                  </div>
                  <span className="font-bold text-gray-900">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SYSTEM */}
        <footer className="pt-2 pb-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#EA8E18]">PrekDuaDara POS v2.4</span>
            <span>•</span>
            <span>Terminal Counter #02</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              MariaDB `prekduadara_db` Terhubung
            </span>
          </div>
          <div>
            &copy; 2024 PrekDuaDara Quick-Service Culinary. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
