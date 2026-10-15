'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    name: 'Ringkasan / Dashboard',
    href: '/dashboard',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
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
        className="w-5 h-5 shrink-0"
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
    name: 'Management stok',
    href: '/dashboard/stok',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
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
    name: 'Management kasir & shift',
    href: '/dashboard/kasir-shift',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
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
        className="w-5 h-5 shrink-0"
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

  return (
    <aside className="w-64 lg:w-72 bg-[#2D4F2A] rounded-2xl p-4 flex flex-col gap-3 text-white shrink-0 hidden md:flex select-none shadow-lg">
      {/* Header Navigasi */}
      <div className="bg-[#5C7D55] text-white py-3 px-4 rounded-xl text-center font-bold text-sm tracking-wide shadow-sm">
        Navigasi Utama
      </div>

      {/* Menu Navigasi dengan 3 State Sesuai Figma */}
      <nav className="flex flex-col gap-2.5 mt-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`py-3 px-4 rounded-xl text-left text-sm flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                isActive
                  ? /* Kolom Kanan: Saat Dipencet / Terpilih (Active/Pressed - Olive Gold Kalem) */
                    'bg-gradient-to-b from-[#BAA66D] via-[#A18F57] to-[#887844] text-[#17371C] font-black shadow-inner scale-[0.99] border border-[#7D6B38]/50'
                  : /* Kolom Kiri: Saat Idle / Default (Oranye Emas Cerah) */
                    /* Kolom Tengah: Saat Diarahkan (Hover - Champagne Emas Berkilau) */
                    'bg-gradient-to-r from-[#FF9E00] to-[#FB8C00] text-[#143419] font-bold shadow-md hover:bg-gradient-to-b hover:from-[#FFE38F] hover:via-[#F9C354] hover:to-[#EAA824] hover:text-[#123017] hover:shadow-lg hover:scale-[1.01] active:bg-gradient-to-b active:from-[#BAA66D] active:via-[#A18F57] active:to-[#887844] active:scale-[0.98]'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
