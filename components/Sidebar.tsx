'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    name: 'Ringkasan / Dashboard',
    href: '/dashboard',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    name: 'Transaksi & Penjualan',
    href: '/dashboard/transaksi',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    name: 'Manajemen Menu',
    href: '/dashboard/menu',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  {
    name: 'Manajemen Stok',
    href: '/dashboard/stok',
    badge: 'AI',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="5" rx="1.5" />
        <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
        <path d="M10 13h4" />
      </svg>
    ),
  },
  {
    name: 'Manajemen Kasir & Shift',
    href: '/dashboard/kasir-shift',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="8" cy="11" r="2.5" />
        <path d="M13 9h4" />
        <path d="M13 13h4" />
        <path d="M6 17a3 3 0 0 1 4.5 0" />
      </svg>
    ),
  },
  {
    name: 'Pengaturan Toko',
    href: '/dashboard/pengaturan',
    icon: (
      <svg
        width={18}
        height={18}
        className="w-[18px] h-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpenPathname, setMobileOpenPathname] = useState<string | null>(
    null
  );
  const isMobileOpen = mobileOpenPathname === pathname;

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpenPathname(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-2.5 mt-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`h-11 px-3 rounded-xl text-left text-sm font-bold flex items-center gap-2 transition-colors duration-150 cursor-pointer border ${
              isActive
                ? /* Kolom Kanan: Saat Dipencet / Terpilih (Active/Pressed - Olive Gold Kalem) */
                  'bg-gradient-to-b from-[#BAA66D] via-[#A18F57] to-[#887844] text-[#17371C] shadow-inner border-[#7D6B38]/50'
                : /* Kolom Kiri: Saat Idle / Default (Oranye Emas Cerah) */
                  /* Kolom Tengah: Saat Diarahkan (Hover - Champagne Emas Berkilau) */
                  'bg-gradient-to-r from-[#FF9E00] to-[#FB8C00] text-[#143419] shadow-md border-transparent hover:bg-gradient-to-b hover:from-[#FFE38F] hover:via-[#F9C354] hover:to-[#EAA824] hover:text-[#123017] hover:shadow-lg active:bg-gradient-to-b active:from-[#BAA66D] active:via-[#A18F57] active:to-[#887844]'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate flex-1">{item.name}</span>
            {item.badge && (
              <span
                title="Dilengkapi AI Agent"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide whitespace-nowrap shrink-0 border shadow-2xs ${
                  isActive
                    ? 'bg-[#17371C] text-[#FFE38F] border-[#17371C]/60'
                    : 'bg-[#2D452B] text-[#FFE38F] border-[#1E3A1C]/40'
                }`}
              >
                <Sparkles size={10} className="shrink-0 text-[#F3A712]" />
                <span>{item.badge}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserFooter = () => (
    <div className="mt-auto pt-3 border-t border-[#466642] flex flex-col gap-2">
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-8 h-8 rounded-full bg-[#E57E25] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">
            {user?.name || 'Admin PrekDuaDara'}
          </p>
          <p className="text-[10px] text-emerald-200 truncate">
            {user?.role || 'Owner'} • {user?.email || 'admin@gmail.com'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="w-full mt-1 py-2 px-3 bg-[#1E3A1C] hover:bg-red-700 text-red-200 hover:text-white rounded-xl text-xs font-bold transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
      >
        <span>🚪</span>
        <span>Logout Sistem</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Tombol Menu Hamburger Mobile (md:hidden) */}
      <button
        type="button"
        onClick={() => setMobileOpenPathname(pathname)}
        aria-label="Buka menu navigasi"
        className="md:hidden print:hidden fixed bottom-5 left-5 z-40 h-11 px-4 rounded-full bg-[#2D4F2A] hover:bg-[#1E3A1C] text-white border border-[#F3A712]/60 shadow-xl flex items-center gap-2 text-xs font-extrabold cursor-pointer transition-colors"
      >
        <Menu size={18} className="text-[#F3A712] shrink-0" />
        <span>Menu</span>
      </button>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex"
          onClick={() => setMobileOpenPathname(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi Utama"
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-[#2D4F2A] p-4 flex flex-col gap-3 text-white shadow-2xl overflow-y-auto select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#5C7D55] text-white h-11 px-4 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-sm">
                Navigasi Utama
              </div>
              <button
                type="button"
                onClick={() => setMobileOpenPathname(null)}
                aria-label="Tutup menu navigasi"
                className="w-11 h-11 rounded-xl bg-[#1E3A1C] hover:bg-[#17371C] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {renderNavLinks(() => setMobileOpenPathname(null))}
            {renderUserFooter()}
          </aside>
        </div>
      )}

      {/* Spacer statis agar konten utama di sebelah kanan tetap memiliki ruang yang presisi */}
      <div
        className="w-64 lg:w-72 shrink-0 hidden md:block print:hidden"
        aria-hidden="true"
      />

      {/* Sidebar Fixed: Paten di posisi kiri layar, tidak goyah saat di-scroll maupun pindah halaman */}
      <aside className="fixed top-4 bottom-4 left-4 sm:top-6 sm:bottom-6 sm:left-6 z-40 w-64 lg:w-72 bg-[#2D4F2A] rounded-2xl p-4 flex flex-col gap-3 text-white shrink-0 hidden md:flex print:hidden select-none shadow-lg overflow-y-auto">
        {/* Header Navigasi */}
        <div className="bg-[#5C7D55] text-white h-11 px-4 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-sm">
          Navigasi Utama
        </div>

        {/* Menu Navigasi dengan 3 State Sesuai Figma */}
        {renderNavLinks()}

        {/* User Info & Logout Button dari AuthContext (Global State) */}
        {renderUserFooter()}
      </aside>
    </>
  );
}
