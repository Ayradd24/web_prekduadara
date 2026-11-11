"use client";

import React, { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { useTransactions } from "@/context/TransactionContext";
import {
  Calendar,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Search,
} from "lucide-react";

interface RecentOrderRow {
  id: string;
  time: string;
  relativeTime: string;
  mainMenu: string;
  addons: string;
  portions: number;
  branch: string;
  paymentBadge: "QRIS Dinamis" | "Tunai / Cash" | "GrabFood POS";
  orderType: "Dine-In" | "Takeaway" | "Ojol Delivery";
  total: number;
}

const DEFAULT_RECENT_ORDERS: RecentOrderRow[] = [
  {
    id: "#GPRK-8841",
    time: "13:14:02 WIB",
    relativeTime: "12 Menit Lalu",
    mainMenu: "Paket Komplit Geprek Sambal Bawang (Lv 3)",
    addons: "+ Es Teh Manis Jumbo, Tahu Crispy",
    portions: 2,
    branch: "Cabang Sudirman Utama",
    paymentBadge: "QRIS Dinamis",
    orderType: "Dine-In",
    total: 64000,
  },
  {
    id: "#GPRK-8840",
    time: "13:11:45 WIB",
    relativeTime: "15 Menit Lalu",
    mainMenu: "Ayam Geprek Melt Mozarella (Lv 2)",
    addons: "+ Nasi Daun Jeruk, Kol Goreng Sambal",
    portions: 3,
    branch: "Cabang Tebet Eco Park",
    paymentBadge: "Tunai / Cash",
    orderType: "Takeaway",
    total: 102000,
  },
  {
    id: "#GPRK-8839",
    time: "13:08:19 WIB",
    relativeTime: "18 Menit Lalu",
    mainMenu: "Geprek Sambal Korek Merah Pedas Mampus (Lv 5)",
    addons: "+ Es Jeruk Peras Murni",
    portions: 1,
    branch: "Cabang Dago Heritage",
    paymentBadge: "QRIS Dinamis",
    orderType: "Dine-In",
    total: 34500,
  },
  {
    id: "#GPRK-8838",
    time: "12:59:30 WIB",
    relativeTime: "27 Menit Lalu",
    mainMenu: "Paket Rombongan Geprek (5 Porsi Ayam + Sambal Uleg)",
    addons: "+ 5 Es Teh Jumbo, Tempe Mendoan",
    portions: 5,
    branch: "Cabang Sudirman Utama",
    paymentBadge: "GrabFood POS",
    orderType: "Ojol Delivery",
    total: 175000,
  },
  {
    id: "#GPRK-8837",
    time: "12:52:10 WIB",
    relativeTime: "34 Menit Lalu",
    mainMenu: "Ayam Geprek Sambal Bawang Original (Lv 1)",
    addons: "Nasi Putih Pulen",
    portions: 1,
    branch: "Cabang Tebet Eco Park",
    paymentBadge: "Tunai / Cash",
    orderType: "Dine-In",
    total: 28000,
  },
];

const HEATMAP_DATA = [
  {
    day: "Senin",
    slots: [
      { val: 12, level: "low" },
      { val: 78, level: "high" },
      { val: 24, level: "mild" },
      { val: 28, level: "mild" },
      { val: 58, level: "medium" },
      { val: 14, level: "low" },
    ],
  },
  {
    day: "Selasa",
    slots: [
      { val: 15, level: "low" },
      { val: 82, level: "high" },
      { val: 21, level: "mild" },
      { val: 30, level: "mild" },
      { val: 64, level: "medium" },
      { val: 12, level: "low" },
    ],
  },
  {
    day: "Rabu",
    slots: [
      { val: 14, level: "low" },
      { val: 85, level: "high" },
      { val: 25, level: "mild" },
      { val: 33, level: "mild" },
      { val: 61, level: "medium" },
      { val: 16, level: "low" },
    ],
  },
  {
    day: "Kamis",
    slots: [
      { val: 18, level: "mild" },
      { val: 88, level: "high" },
      { val: 27, level: "mild" },
      { val: 42, level: "medium" },
      { val: 68, level: "medium" },
      { val: 19, level: "low" },
    ],
  },
  {
    day: "Jumat",
    slots: [
      { val: 26, level: "mild" },
      { val: 96, level: "very_high" },
      { val: 31, level: "mild" },
      { val: 48, level: "medium" },
      { val: 92, level: "high" },
      { val: 29, level: "mild" },
    ],
  },
  {
    day: "Sabtu",
    slots: [
      { val: 38, level: "medium" },
      { val: 104, level: "very_high" },
      { val: 45, level: "medium" },
      { val: 56, level: "medium" },
      { val: 120, level: "peak" },
      { val: 41, level: "medium" },
    ],
  },
  {
    day: "Minggu",
    slots: [
      { val: 42, level: "medium" },
      { val: 110, level: "very_high" },
      { val: 48, level: "medium" },
      { val: 52, level: "medium" },
      { val: 115, level: "peak" },
      { val: 32, level: "mild" },
    ],
  },
];

export default function TransaksiPage() {
  // Tetap pertahankan state & context transaksi sesuai aturan .cursorrules
  const {
    filteredTransactions,
    stats,
    searchQuery,
    setSearchQuery,
    filterPayment,
    setFilterPayment,
  } = useTransactions();

  const [selectedPeriod, setSelectedPeriod] = useState<string>("Bulan Ini");
  const [activePage, setActivePage] = useState<number>(1);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  const formatRupiah = (val: number) => "Rp " + val.toLocaleString("id-ID");

  // Gabungkan transaksi baru dari context dengan rincian default
  const displayOrders = useMemo(() => {
    const extraFromContext: RecentOrderRow[] = filteredTransactions
      .filter(
        (tx) =>
          !tx.id.startsWith("#TRX-202410-019") &&
          !tx.id.startsWith("#TRX-202410-018")
      )
      .map((tx) => ({
        id: tx.id.replace("#TRX-", "#GPRK-"),
        time: `${tx.time} WIB`,
        relativeTime: "Baru Saja",
        mainMenu: tx.itemsSummary,
        addons: `+ ${tx.cashier} (${tx.terminal})`,
        portions: tx.totalItems,
        branch: "Cabang Sudirman Utama",
        paymentBadge:
          tx.paymentMethod === "QRIS" ? "QRIS Dinamis" : "Tunai / Cash",
        orderType: "Dine-In",
        total: tx.total,
      }));

    const combined = [...extraFromContext, ...DEFAULT_RECENT_ORDERS];

    return combined.filter((row) => {
      const matchQuery =
        searchQuery.trim() === "" ||
        row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.mainMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.addons.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.branch.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPay =
        filterPayment === "Semua" ||
        (filterPayment === "Tunai" && row.paymentBadge === "Tunai / Cash") ||
        (filterPayment === "QRIS" && row.paymentBadge === "QRIS Dinamis");

      return matchQuery && matchPay;
    });
  }, [filteredTransactions, searchQuery, filterPayment]);

  const getHeatmapCellStyle = (level: string) => {
    switch (level) {
      case "peak":
        return "bg-[#991B1B] text-white font-black shadow-2xs";
      case "very_high":
        return "bg-[#DC2626] text-white font-extrabold shadow-2xs";
      case "high":
        return "bg-[#EF4444] text-white font-extrabold";
      case "medium":
        return "bg-[#FBBF24] text-gray-950 font-extrabold";
      case "mild":
        return "bg-[#A7F3D0] text-[#064E3B] font-extrabold";
      default:
        return "bg-gray-100 text-gray-700 font-bold border border-gray-200/70";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-gray-900">
      {/* 1. SIDEBAR KIRI (FIXED & PATEN) */}
      <Sidebar />

      {/* 2. KONTEN UTAMA ANALITIK TRANSAKSI & PENJUALAN */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* TOP HEADER BAR */}
        <header className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo PrekDuaDara"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-extrabold text-base text-[#EA8E18] tracking-tight leading-tight">
                  PrekDuaDara
                </div>
                <span className="bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                  POS ANALYTICS
                </span>
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight mt-0.5">
                Restoran Spesialis Ayam Geprek Cobek &amp; Sambal Uleg Asli
              </div>
            </div>
          </div>

          {/* Right Controls: Branch, Period Tabs, Sync & Export */}
          <div className="flex flex-col items-start sm:items-end gap-2.5 w-full xl:w-auto">
            {/* Row 1: Branch Selector + Period Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-100 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Cabang Sudirman Utama</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                {["Hari Ini", "7 Hari", "Bulan Ini", "Kuartal"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      selectedPeriod === period
                        ? "bg-white text-gray-900 font-extrabold shadow-xs"
                        : "text-gray-700 font-semibold hover:text-gray-900"
                    }`}
                  >
                    {period}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("Kustom")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    selectedPeriod === "Kustom"
                      ? "bg-white text-gray-900 font-extrabold shadow-xs"
                      : "text-gray-700 font-semibold hover:text-gray-900"
                  }`}
                >
                  <Calendar size={12} />
                  <span>Kustom</span>
                </button>
              </div>
            </div>

            {/* Row 2: Sync POS + Excel + Export PDF */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sync POS: Live</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert("Mengunduh laporan transaksi dalam format Excel (.xlsx)...")
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-emerald-700" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D92D20] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-extrabold shadow-xs transition cursor-pointer"
              >
                <FileText size={14} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* 4 KPI SUMMARY CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL OMZET BULAN INI */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                TOTAL OMZET BULAN INI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                +18,4%
              </span>
            </div>

            <div className="my-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Rp 148.520.000
              </h2>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Target: Rp 135 Juta
              </span>
              <span className="font-extrabold text-[#D97706]">
                110% Tercapai
              </span>
            </div>
          </div>

          {/* Card 2: PORSI GEPREK TERJUAL */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                PORSI GEPREK TERJUAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                +12,1%
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                6.420
              </h2>
              <span className="text-xs sm:text-sm font-bold text-gray-500">
                Porsi Ayam
              </span>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Rata-rata/hari: 214 Porsi
              </span>
              <span className="font-extrabold text-[#DC2626]">
                Top: Geprek Bawang
              </span>
            </div>
          </div>

          {/* Card 3: RATA-RATA ORDER (AOV) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                RATA-RATA ORDER (AOV)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                +5,6%
              </span>
            </div>

            <div className="my-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Rp 38.500
              </h2>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Total Transaksi: 3.857
              </span>
              <span className="font-extrabold text-gray-800">
                Add-on Es Teh: 88%
              </span>
            </div>
          </div>

          {/* Card 4: JAM PENJUALAN PUNCAK */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                JAM PENJUALAN PUNCAK
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-300 text-xs font-extrabold">
                Rush Hour
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-[#D97706] shrink-0" />
                <span className="text-base sm:text-lg font-black text-gray-900">
                  11:30 - 13:30
                </span>
                <span className="text-xs text-gray-500 font-bold">Siang</span>
              </div>
              <div className="flex items-center gap-1.5 pl-5 mt-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-gray-800">
                  18:00 - 20:30
                </span>
                <span className="text-xs text-gray-500 font-bold">Malam</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Kontribusi Omzet
              </span>
              <span className="font-extrabold text-emerald-700">
                72,8% Harian
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 1: TREN PENJUALAN (LEFT 8 COLS) & KATEGORI MENU TERLARIS (RIGHT 4 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Tren Penjualan & Fluktuasi Porsi */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Tren Penjualan &amp; Fluktuasi Porsi Berdasarkan Waktu
                    Operasional
                  </h3>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-1 pl-5">
                  Analisis kepadatan order per interval jam operasional (09:00 -
                  22:00 WIB)
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-extrabold text-gray-700 shrink-0">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                  Omzet (Juta Rp)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#DC2626]"></span>
                  Porsi Ayam
                </span>
              </div>
            </div>

            {/* SVG Line / Area Chart */}
            <div className="w-full overflow-x-auto my-2">
              <div className="min-w-[600px]">
                <svg
                  viewBox="0 0 740 245"
                  className="w-full h-auto select-none overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="omzetAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient
                      id="peak1Grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient
                      id="peak2Grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#FEE2E2" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#FEE2E2" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines & Y-Axis Labels */}
                  {[
                    { y: 35, label: "20 Jt" },
                    { y: 75, label: "15 Jt" },
                    { y: 115, label: "10 Jt" },
                    { y: 155, label: "5 Jt" },
                    { y: 195, label: "0" },
                  ].map((row) => (
                    <g key={row.label}>
                      <text
                        x="36"
                        y={row.y + 4}
                        textAnchor="end"
                        className="fill-gray-600 text-[11px] font-bold"
                      >
                        {row.label}
                      </text>
                      <line
                        x1="48"
                        y1={row.y}
                        x2="715"
                        y2={row.y}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                    </g>
                  ))}

                  {/* Shaded Peak Highlight Bands */}
                  <rect
                    x="200"
                    y="35"
                    width="90"
                    height="160"
                    fill="url(#peak1Grad)"
                    rx="4"
                  />
                  <rect
                    x="468"
                    y="35"
                    width="115"
                    height="160"
                    fill="url(#peak2Grad)"
                    rx="4"
                  />

                  {/* Area under Omzet curve */}
                  <path
                    d="M 60 190 L 114 182 L 168 158 L 222 86 L 276 62 L 330 130 L 384 152 L 438 118 L 492 78 L 546 46 L 600 94 L 654 162 L 708 188 L 708 195 L 60 195 Z"
                    fill="url(#omzetAreaGrad)"
                  />

                  {/* Orange Line: Omzet (Juta Rp) */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="60,190 114,182 168,158 222,86 276,62 330,130 384,152 438,118 492,78 546,46 600,94 654,162 708,188"
                  />

                  {/* Red Line: Porsi Ayam */}
                  <polyline
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="60,192 114,186 168,166 222,102 276,78 330,142 384,162 438,132 492,92 546,60 600,108 654,170 708,191"
                  />

                  {/* Peak 1 Badge: PEAK 1: MAKAN SIANG */}
                  <g transform="translate(200, 32)">
                    <rect
                      x="0"
                      y="0"
                      width="108"
                      height="18"
                      rx="4"
                      fill="#FFFBEB"
                      stroke="#F59E0B"
                    />
                    <text
                      x="54"
                      y="12.5"
                      textAnchor="middle"
                      className="fill-[#B45309] text-[9.5px] font-extrabold"
                    >
                      PEAK 1: MAKAN SIANG
                    </text>
                  </g>

                  {/* Peak 1 Data Dots */}
                  <circle
                    cx="276"
                    cy="62"
                    r="4.5"
                    fill="#FFFFFF"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                  />
                  <circle cx="276" cy="78" r="4" fill="#DC2626" />

                  {/* Peak 2 Tooltip & Badge */}
                  <g transform="translate(488, 8)">
                    <rect
                      x="0"
                      y="0"
                      width="106"
                      height="20"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#1F2937"
                      strokeWidth="1.5"
                    />
                    <text
                      x="53"
                      y="13.5"
                      textAnchor="middle"
                      className="fill-gray-900 text-[10px] font-extrabold"
                    >
                      Rp 17,4 Jt (19:00)
                    </text>
                  </g>
                  <g transform="translate(486, 31)">
                    <rect
                      x="0"
                      y="0"
                      width="110"
                      height="17"
                      rx="4"
                      fill="#FEF2F2"
                      stroke="#EF4444"
                    />
                    <text
                      x="55"
                      y="11.5"
                      textAnchor="middle"
                      className="fill-[#DC2626] text-[9.5px] font-extrabold"
                    >
                      PEAK 2: MAKAN MALAM
                    </text>
                  </g>

                  {/* Peak 2 Data Dots */}
                  <circle
                    cx="546"
                    cy="46"
                    r="5"
                    fill="#FFFFFF"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="546"
                    cy="60"
                    r="4.5"
                    fill="#DC2626"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* X-Axis Hour Labels */}
                  {[
                    { x: 60, t: "09:00", highlight: "" },
                    { x: 114, t: "10:00", highlight: "" },
                    { x: 168, t: "11:00", highlight: "" },
                    { x: 222, t: "12:00", highlight: "amber" },
                    { x: 276, t: "13:00", highlight: "amber" },
                    { x: 330, t: "14:00", highlight: "" },
                    { x: 384, t: "15:00", highlight: "" },
                    { x: 438, t: "17:00", highlight: "" },
                    { x: 492, t: "18:00", highlight: "red" },
                    { x: 546, t: "19:00", highlight: "red" },
                    { x: 600, t: "20:00", highlight: "" },
                    { x: 654, t: "21:00", highlight: "" },
                    { x: 708, t: "22:00", highlight: "" },
                  ].map((item) => (
                    <text
                      key={item.t}
                      x={item.x}
                      y="220"
                      textAnchor="middle"
                      className={`text-[11px] ${
                        item.highlight === "amber"
                          ? "fill-[#B45309] font-black"
                          : item.highlight === "red"
                            ? "fill-[#DC2626] font-black"
                            : "fill-gray-600 font-semibold"
                      }`}
                    >
                      {item.t}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>
                  Lonjakan tertinggi:{" "}
                  <strong className="text-gray-900 font-extrabold">
                    Jam Makan Siang Kantoran
                  </strong>{" "}
                  &amp;{" "}
                  <strong className="text-gray-900 font-extrabold">
                    Makan Malam Keluarga
                  </strong>
                </span>
              </div>
              <div>
                Waktu Penyiapan Sambal Rata-rata:{" "}
                <strong className="text-gray-900 font-extrabold">
                  4,2 Menit
                </strong>
              </div>
            </div>
          </div>

          {/* Right Card: Kategori Menu Terlaris */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#DC2626] shrink-0"></span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Kategori Menu Terlaris
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                Bulan Ini
              </span>
            </div>

            {/* Donut Chart */}
            <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="w-full h-full -rotate-90 transform"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#DC2626"
                  strokeWidth="18"
                  strokeDasharray="105.05 276.46"
                  strokeDashoffset="0"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#EA580C"
                  strokeWidth="18"
                  strokeDasharray="66.35 276.46"
                  strokeDashoffset="-105.05"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="18"
                  strokeDasharray="44.23 276.46"
                  strokeDashoffset="-171.4"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#1E562F"
                  strokeWidth="18"
                  strokeDasharray="38.7 276.46"
                  strokeDashoffset="-215.63"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="18"
                  strokeDasharray="22.13 276.46"
                  strokeDashoffset="-254.33"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-gray-500 font-bold">
                  Total Terjual
                </span>
                <span className="text-2xl font-black text-gray-900 leading-tight">
                  6.420
                </span>
                <span className="text-[10px] font-extrabold text-[#DC2626] uppercase tracking-wider">
                  PORSI
                </span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="space-y-2.5 text-xs">
              {[
                {
                  color: "bg-[#DC2626]",
                  name: "Geprek Sambal Bawang Original",
                  pct: "38%",
                  qty: "(2.440)",
                },
                {
                  color: "bg-[#EA580C]",
                  name: "Geprek Sambal Korek Merah",
                  pct: "24%",
                  qty: "(1.540)",
                },
                {
                  color: "bg-[#F59E0B]",
                  name: "Geprek Keju Melt Mozarella",
                  pct: "16%",
                  qty: "(1.027)",
                },
                {
                  color: "bg-[#1E562F]",
                  name: "Paket Hemat Komplit + Tempe/Tahu",
                  pct: "14%",
                  qty: "(898)",
                },
                {
                  color: "bg-[#10B981]",
                  name: "Es Teh Jumbo & Minuman Dingin",
                  pct: "8%",
                  qty: "(515)",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full ${item.color} shrink-0`}
                    ></span>
                    <span className="text-xs text-gray-800 font-semibold truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs shrink-0">
                    <strong className="text-gray-900 font-extrabold">
                      {item.pct}
                    </strong>{" "}
                    <span className="text-gray-500 font-medium">{item.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 mt-4 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">
                Cabai Terpakai:{" "}
                <strong className="text-[#DC2626] font-extrabold">
                  184 Kg Rawit Merah
                </strong>
              </span>
              <span className="text-gray-600 font-medium">
                Level Pedas:{" "}
                <strong className="text-[#D97706] font-extrabold">
                  Level 3
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 2: KOMPARASI WEEKDAY VS WEEKEND (LEFT 5 COLS) & HEATMAP ORDER (RIGHT 7 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Komparasi Penjualan Hari Kerja vs Weekend */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Komparasi Penjualan Hari Kerja vs Weekend
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Rata-rata penjualan harian (Senin-Kamis vs Jumat-Minggu)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold shrink-0">
                Weekend +42%
              </span>
            </div>

            <div className="space-y-5">
              {/* Bar 1: Hari Kerja */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                    Hari Kerja (Senin - Kamis)
                  </span>
                  <span className="font-black text-gray-900">
                    Rp 18.250.000{" "}
                    <span className="text-xs font-semibold text-gray-500">
                      / hari
                    </span>
                  </span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
                  <div
                    className="bg-[#1E562F] h-full"
                    style={{ width: "48%" }}
                  />
                  <div
                    className="bg-[#F59E0B] h-full"
                    style={{ width: "37%" }}
                  />
                  <div
                    className="bg-[#EA580C] h-full"
                    style={{ width: "15%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-gray-900 font-extrabold">
                      185 Porsi
                    </strong>
                  </span>
                  <span>Dominan: Dine-In Karyawan</span>
                </div>
              </div>

              {/* Bar 2: Akhir Pekan */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                    Akhir Pekan (Jumat - Minggu)
                  </span>
                  <span className="font-black text-[#DC2626]">
                    Rp 25.920.000{" "}
                    <span className="text-xs font-semibold text-gray-500">
                      / hari
                    </span>
                  </span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
                  <div
                    className="bg-[#1E562F] h-full"
                    style={{ width: "42%" }}
                  />
                  <div
                    className="bg-[#F59E0B] h-full"
                    style={{ width: "43%" }}
                  />
                  <div
                    className="bg-[#EA580C] h-full"
                    style={{ width: "15%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-gray-900 font-extrabold">
                      268 Porsi
                    </strong>
                  </span>
                  <span>Dominan: Dine-In Keluarga &amp; Komunitas</span>
                </div>
              </div>
            </div>

            {/* Channel Legend */}
            <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-gray-200 text-xs text-gray-700 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#1E562F] shrink-0"></span>
                <span className="leading-tight">
                  Dine-In (Makan Sini)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                <span className="leading-tight">
                  GrabFood / GoFood
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#EA580C] shrink-0"></span>
                <span className="leading-tight">
                  Takeaway (Bungkus)
                </span>
              </div>
            </div>

            {/* Insight Callout Box */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#1E562F]">
                <Info size={15} className="text-emerald-700 shrink-0" />
                <span>Insight Pengadaan Stok:</span>
              </div>
              <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed">
                Persediaan fillet ayam potong dan stok cabai rawit disarankan
                ditambah{" "}
                <strong className="text-gray-900 font-extrabold">
                  35% pada hari Kamis malam
                </strong>{" "}
                untuk mengantisipasi demand akhir pekan.
              </p>
            </div>
          </div>

          {/* Right Card: Heatmap Kepadatan Order */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Heatmap Kepadatan Order (Hari vs Jam)
                  </h3>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-1 pl-5">
                  Frekuensi transaksi kasir dan meja terisi secara real-time
                </p>
              </div>

              {/* Scale Legend */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                <span>Rendah</span>
                <span className="w-3.5 h-3.5 rounded-xs bg-gray-100 border border-gray-300"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#A7F3D0]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#FBBF24]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#DC2626]"></span>
                <span>Sangat Ramai</span>
              </div>
            </div>

            {/* Heatmap Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1.5 text-center text-xs sm:text-sm">
                <thead>
                  <tr className="text-xs text-gray-600 font-extrabold">
                    <th className="text-left py-1.5 px-2">Hari</th>
                    <th className="py-1.5 px-2">10-12</th>
                    <th className="py-1.5 px-2 text-[#DC2626]">
                      12-14 (Siang)
                    </th>
                    <th className="py-1.5 px-2">14-16</th>
                    <th className="py-1.5 px-2">16-18</th>
                    <th className="py-1.5 px-2 text-[#B45309]">
                      18-21 (Malam)
                    </th>
                    <th className="py-1.5 px-2">21-22</th>
                  </tr>
                </thead>
                <tbody>
                  {HEATMAP_DATA.map((row) => {
                    const isWeekend =
                      row.day === "Sabtu" || row.day === "Minggu";
                    return (
                      <tr key={row.day}>
                        <td
                          className={`text-left py-1.5 px-2 text-xs sm:text-sm ${
                            isWeekend
                              ? "font-black text-[#DC2626]"
                              : "font-extrabold text-gray-800"
                          }`}
                        >
                          {row.day}
                        </td>
                        {row.slots.map((slot, idx) => (
                          <td key={idx} className="p-0">
                            <div
                              className={`py-2 px-2.5 rounded-lg text-xs sm:text-sm ${getHeatmapCellStyle(
                                slot.level
                              )}`}
                            >
                              {slot.val}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 mt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 font-medium">
              <span className="italic">
                *Angka dalam kotak menunjukkan rata-rata jumlah struk transaksi
              </span>
              <span className="text-gray-700">
                Kapasitas Maksimal Meja:{" "}
                <strong className="text-gray-900 font-extrabold">
                  94% terisi saat Sabtu Malam
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* BOTTOM TABLE: RINCIAN TRANSAKSI PENJUALAN TERKINI BERDASARKAN WAKTU */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-5">
          {/* Header & Search/Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900">
                  Rincian Transaksi Penjualan Terkini Berdasarkan Waktu
                </h3>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1 pl-5">
                Memperbarui secara otomatis dengan sinkronisasi mesin kasir POS
              </p>
            </div>

            <div className="flex items-center gap-2.5 relative">
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Order ID / Menu..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <Filter size={14} className="text-gray-600" />
                <span>
                  Filter{filterPayment !== "Semua" ? `: ${filterPayment}` : ""}
                </span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-48 text-xs sm:text-sm">
                  {[
                    { key: "Semua", label: `Semua Metode (${stats.totalCount})` },
                    { key: "Tunai", label: `Tunai / Cash (${stats.tunaiCount})` },
                    { key: "QRIS", label: `QRIS Dinamis (${stats.qrisCount})` },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setFilterPayment(opt.key);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 ${
                        filterPayment === opt.key
                          ? "font-extrabold text-[#1E562F] bg-emerald-50"
                          : "font-semibold text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-3 whitespace-nowrap">Order ID</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">
                    Waktu Transaksi
                  </th>
                  <th className="py-3.5 px-3 min-w-[240px]">
                    Menu Utama Dipesan
                  </th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">
                    Porsi
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">
                    Cabang Outlet
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">
                    Tipe &amp; Metode Bayar
                  </th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">
                    Total Transaksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {displayOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="py-4 px-3 font-extrabold text-[#D97706] whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900">
                        {order.time}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {order.relativeTime}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-extrabold text-gray-900">
                        {order.mainMenu}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">
                        {order.addons}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center font-black text-gray-900 whitespace-nowrap">
                      {order.portions}
                    </td>
                    <td className="py-4 px-3 text-gray-700 font-semibold whitespace-nowrap">
                      {order.branch}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            order.paymentBadge === "QRIS Dinamis"
                              ? "bg-blue-50 text-blue-800 border border-blue-300"
                              : order.paymentBadge === "Tunai / Cash"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                : "bg-purple-50 text-purple-800 border border-purple-300"
                          }`}
                        >
                          {order.paymentBadge}
                        </span>
                        <span className="text-xs text-gray-600 font-semibold">
                          {order.orderType}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right font-black text-gray-900 whitespace-nowrap">
                      {formatRupiah(order.total)}
                    </td>
                  </tr>
                ))}

                {displayOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      Tidak ada rincian transaksi yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Row */}
          <div className="pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 font-medium">
            <div>
              Menampilkan{" "}
              <strong className="text-gray-900 font-extrabold">
                {displayOrders.length}
              </strong>{" "}
              dari <strong className="text-gray-900 font-extrabold">3.857</strong>{" "}
              transaksi bulan ini
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
              >
                Sebelumnya
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setActivePage(page)}
                  className={`w-8 h-8 rounded-lg font-extrabold transition cursor-pointer ${
                    activePage === page
                      ? "bg-[#1E3A1C] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActivePage((p) => Math.min(3, p + 1))}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </section>

        {/* SYSTEM FOOTER BAR */}
        <footer className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 font-medium gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-5 h-5 rounded-full object-contain"
            />
            <span>
              <strong className="text-gray-900 font-extrabold">
                Sistem Analitik Bisnis PrekDuaDara
              </strong>{" "}
              © 2025. Seluruh Hak Cipta Dilindungi.
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Sinkronisasi Otomatis Terakhir:{" "}
              <strong className="text-gray-900 font-extrabold">
                13:25 WIB
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Semua Cabang Terkoneksi
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
