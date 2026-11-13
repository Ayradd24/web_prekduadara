"use client";

import React, { useState, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { useTransactions } from "@/context/TransactionContext";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Printer,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";

interface RecentOrderRow {
  id: string;
  time: string;
  relativeTime: string;
  mainMenu: string;
  addons: string;
  portions: number;
  branch: string;
  cashier: string;
  terminal: string;
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
    cashier: "Rian Pratama",
    terminal: "Kasir Pos-01",
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
    cashier: "Siti Rahma",
    terminal: "Kasir Pos-02",
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
    cashier: "Budi Santoso",
    terminal: "Kasir Pos-03",
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
    cashier: "Rian Pratama",
    terminal: "Kasir Pos-01",
    paymentBadge: "GrabFood POS",
    orderType: "Ojol Delivery",
    total: 175000,
  },
  {
    id: "#GPRK-8837",
    time: "12:52:10 WIB",
    relativeTime: "34 Menit Lalu",
    mainMenu: "Ayam Geprek Sambal Bawang Original (Lv 1)",
    addons: "+ Nasi Putih Pulen, Kerupuk Kaleng",
    portions: 1,
    branch: "Cabang Tebet Eco Park",
    cashier: "Siti Rahma",
    terminal: "Kasir Pos-02",
    paymentBadge: "Tunai / Cash",
    orderType: "Dine-In",
    total: 28000,
  },
  {
    id: "#GPRK-8836",
    time: "12:44:55 WIB",
    relativeTime: "41 Menit Lalu",
    mainMenu: "Paket Geprek Bakar Madu Pedas (Lv 4)",
    addons: "+ 2 Es Teh Manis Jumbo, Terong Crispy",
    portions: 2,
    branch: "Cabang Sudirman Utama",
    cashier: "Rian Pratama",
    terminal: "Kasir Pos-01",
    paymentBadge: "QRIS Dinamis",
    orderType: "Dine-In",
    total: 68000,
  },
  {
    id: "#GPRK-8835",
    time: "12:38:12 WIB",
    relativeTime: "48 Menit Lalu",
    mainMenu: "Ayam Geprek Keju Melt Mozarella (Lv 3)",
    addons: "+ Kulit Ayam Crispy, Es Lemon Tea",
    portions: 2,
    branch: "Cabang Dago Heritage",
    cashier: "Budi Santoso",
    terminal: "Kasir Pos-03",
    paymentBadge: "GrabFood POS",
    orderType: "Ojol Delivery",
    total: 79000,
  },
  {
    id: "#GPRK-8834",
    time: "12:29:40 WIB",
    relativeTime: "56 Menit Lalu",
    mainMenu: "Paket Hemat Komplit Geprek + Tahu/Tempe (Lv 2)",
    addons: "+ Nasi Tambah, Es Teh Tawar",
    portions: 3,
    branch: "Cabang Tebet Eco Park",
    cashier: "Siti Rahma",
    terminal: "Kasir Pos-02",
    paymentBadge: "QRIS Dinamis",
    orderType: "Takeaway",
    total: 84000,
  },
  {
    id: "#GPRK-8833",
    time: "12:18:05 WIB",
    relativeTime: "1 Jam Lalu",
    mainMenu: "Geprek Sambal Matah Bali Segar (Lv 3)",
    addons: "+ Pete Goreng, Es Jeruk Murni",
    portions: 2,
    branch: "Cabang Sudirman Utama",
    cashier: "Rian Pratama",
    terminal: "Kasir Pos-01",
    paymentBadge: "Tunai / Cash",
    orderType: "Dine-In",
    total: 62000,
  },
  {
    id: "#GPRK-8832",
    time: "12:09:22 WIB",
    relativeTime: "1 Jam Lalu",
    mainMenu: "Paket Kantor 4 Porsi Geprek Sambal Korek (Lv 4)",
    addons: "+ 4 Es Teh Manis Jumbo, Kol Goreng",
    portions: 4,
    branch: "Cabang Dago Heritage",
    cashier: "Budi Santoso",
    terminal: "Kasir Pos-03",
    paymentBadge: "GrabFood POS",
    orderType: "Ojol Delivery",
    total: 142000,
  },
  {
    id: "#GPRK-8831",
    time: "11:58:49 WIB",
    relativeTime: "1 Jam Lalu",
    mainMenu: "Ayam Geprek Sambal Bawang Original (Lv 2)",
    addons: "+ Tempe Crispy, Air Mineral Dingin",
    portions: 1,
    branch: "Cabang Sudirman Utama",
    cashier: "Rian Pratama",
    terminal: "Kasir Pos-01",
    paymentBadge: "Tunai / Cash",
    orderType: "Takeaway",
    total: 31000,
  },
  {
    id: "#GPRK-8830",
    time: "11:45:10 WIB",
    relativeTime: "2 Jam Lalu",
    mainMenu: "Paket Double Geprek Sambal Ijo Padang (Lv 3)",
    addons: "+ 2 Nasi Uduk Wangi, 2 Es Teh Jumbo",
    portions: 2,
    branch: "Cabang Tebet Eco Park",
    cashier: "Siti Rahma",
    terminal: "Kasir Pos-02",
    paymentBadge: "QRIS Dinamis",
    orderType: "Dine-In",
    total: 66000,
  },
];

const BRANCH_OPTIONS = [
  "Semua Cabang",
  "Cabang Sudirman Utama",
  "Cabang Tebet Eco Park",
  "Cabang Dago Heritage",
];

interface PeriodMetrics {
  periodBadge: string;
  omzetTitle: string;
  omzetValue: string;
  omzetGrowth: string;
  omzetTarget: string;
  omzetAchieved: string;
  porsiValue: string;
  porsiNumber: number;
  porsiGrowth: string;
  porsiAvg: string;
  aovValue: string;
  aovGrowth: string;
  totalTx: string;
  cabaiKg: string;
  categories: {
    color: string;
    stroke: string;
    name: string;
    pct: string;
    qty: number;
    dashArray: string;
    dashOffset: string;
  }[];
}

const PERIOD_METRICS_MAP: Record<string, PeriodMetrics> = {
  "Hari Ini": {
    periodBadge: "Hari Ini",
    omzetTitle: "TOTAL OMZET HARI INI",
    omzetValue: "Rp 5.420.000",
    omzetGrowth: "+14,2%",
    omzetTarget: "Target: Rp 4,8 Juta",
    omzetAchieved: "112% Tercapai",
    porsiValue: "228",
    porsiNumber: 228,
    porsiGrowth: "+9,5%",
    porsiAvg: "Target harian: 200 Porsi",
    aovValue: "Rp 39.200",
    aovGrowth: "+4,1%",
    totalTx: "138",
    cabaiKg: "6,8 Kg Rawit Merah",
    categories: [
      {
        color: "bg-[#DC2626]",
        stroke: "#DC2626",
        name: "Geprek Sambal Bawang Original",
        pct: "38%",
        qty: 87,
        dashArray: "105.05 276.46",
        dashOffset: "0",
      },
      {
        color: "bg-[#EA580C]",
        stroke: "#EA580C",
        name: "Geprek Sambal Korek Merah",
        pct: "24%",
        qty: 55,
        dashArray: "66.35 276.46",
        dashOffset: "-105.05",
      },
      {
        color: "bg-[#F59E0B]",
        stroke: "#F59E0B",
        name: "Geprek Keju Melt Mozarella",
        pct: "16%",
        qty: 36,
        dashArray: "44.23 276.46",
        dashOffset: "-171.4",
      },
      {
        color: "bg-[#1E562F]",
        stroke: "#1E562F",
        name: "Paket Hemat Komplit + Tempe/Tahu",
        pct: "14%",
        qty: 32,
        dashArray: "38.7 276.46",
        dashOffset: "-215.63",
      },
      {
        color: "bg-[#10B981]",
        stroke: "#10B981",
        name: "Es Teh Jumbo & Minuman Dingin",
        pct: "8%",
        qty: 18,
        dashArray: "22.13 276.46",
        dashOffset: "-254.33",
      },
    ],
  },
  "7 Hari": {
    periodBadge: "7 Hari Terakhir",
    omzetTitle: "TOTAL OMZET 7 HARI",
    omzetValue: "Rp 36.840.000",
    omzetGrowth: "+16,8%",
    omzetTarget: "Target: Rp 32 Juta",
    omzetAchieved: "115% Tercapai",
    porsiValue: "1.560",
    porsiNumber: 1560,
    porsiGrowth: "+11,4%",
    porsiAvg: "Rata-rata/hari: 223 Porsi",
    aovValue: "Rp 38.900",
    aovGrowth: "+5,2%",
    totalTx: "947",
    cabaiKg: "45 Kg Rawit Merah",
    categories: [
      {
        color: "bg-[#DC2626]",
        stroke: "#DC2626",
        name: "Geprek Sambal Bawang Original",
        pct: "38%",
        qty: 593,
        dashArray: "105.05 276.46",
        dashOffset: "0",
      },
      {
        color: "bg-[#EA580C]",
        stroke: "#EA580C",
        name: "Geprek Sambal Korek Merah",
        pct: "24%",
        qty: 374,
        dashArray: "66.35 276.46",
        dashOffset: "-105.05",
      },
      {
        color: "bg-[#F59E0B]",
        stroke: "#F59E0B",
        name: "Geprek Keju Melt Mozarella",
        pct: "16%",
        qty: 250,
        dashArray: "44.23 276.46",
        dashOffset: "-171.4",
      },
      {
        color: "bg-[#1E562F]",
        stroke: "#1E562F",
        name: "Paket Hemat Komplit + Tempe/Tahu",
        pct: "14%",
        qty: 218,
        dashArray: "38.7 276.46",
        dashOffset: "-215.63",
      },
      {
        color: "bg-[#10B981]",
        stroke: "#10B981",
        name: "Es Teh Jumbo & Minuman Dingin",
        pct: "8%",
        qty: 125,
        dashArray: "22.13 276.46",
        dashOffset: "-254.33",
      },
    ],
  },
  "Bulan Ini": {
    periodBadge: "Bulan Ini",
    omzetTitle: "TOTAL OMZET BULAN INI",
    omzetValue: "Rp 148.520.000",
    omzetGrowth: "+18,4%",
    omzetTarget: "Target: Rp 135 Juta",
    omzetAchieved: "110% Tercapai",
    porsiValue: "6.420",
    porsiNumber: 6420,
    porsiGrowth: "+12,1%",
    porsiAvg: "Rata-rata/hari: 214 Porsi",
    aovValue: "Rp 38.500",
    aovGrowth: "+5,6%",
    totalTx: "3.857",
    cabaiKg: "184 Kg Rawit Merah",
    categories: [
      {
        color: "bg-[#DC2626]",
        stroke: "#DC2626",
        name: "Geprek Sambal Bawang Original",
        pct: "38%",
        qty: 2440,
        dashArray: "105.05 276.46",
        dashOffset: "0",
      },
      {
        color: "bg-[#EA580C]",
        stroke: "#EA580C",
        name: "Geprek Sambal Korek Merah",
        pct: "24%",
        qty: 1540,
        dashArray: "66.35 276.46",
        dashOffset: "-105.05",
      },
      {
        color: "bg-[#F59E0B]",
        stroke: "#F59E0B",
        name: "Geprek Keju Melt Mozarella",
        pct: "16%",
        qty: 1027,
        dashArray: "44.23 276.46",
        dashOffset: "-171.4",
      },
      {
        color: "bg-[#1E562F]",
        stroke: "#1E562F",
        name: "Paket Hemat Komplit + Tempe/Tahu",
        pct: "14%",
        qty: 898,
        dashArray: "38.7 276.46",
        dashOffset: "-215.63",
      },
      {
        color: "bg-[#10B981]",
        stroke: "#10B981",
        name: "Es Teh Jumbo & Minuman Dingin",
        pct: "8%",
        qty: 515,
        dashArray: "22.13 276.46",
        dashOffset: "-254.33",
      },
    ],
  },
  Kuartal: {
    periodBadge: "Kuartal Ini (Q4)",
    omzetTitle: "TOTAL OMZET KUARTAL",
    omzetValue: "Rp 432.900.000",
    omzetGrowth: "+22,7%",
    omzetTarget: "Target: Rp 400 Juta",
    omzetAchieved: "108% Tercapai",
    porsiValue: "18.950",
    porsiNumber: 18950,
    porsiGrowth: "+15,3%",
    porsiAvg: "Rata-rata/hari: 210 Porsi",
    aovValue: "Rp 39.100",
    aovGrowth: "+6,4%",
    totalTx: "11.072",
    cabaiKg: "542 Kg Rawit Merah",
    categories: [
      {
        color: "bg-[#DC2626]",
        stroke: "#DC2626",
        name: "Geprek Sambal Bawang Original",
        pct: "38%",
        qty: 7201,
        dashArray: "105.05 276.46",
        dashOffset: "0",
      },
      {
        color: "bg-[#EA580C]",
        stroke: "#EA580C",
        name: "Geprek Sambal Korek Merah",
        pct: "24%",
        qty: 4548,
        dashArray: "66.35 276.46",
        dashOffset: "-105.05",
      },
      {
        color: "bg-[#F59E0B]",
        stroke: "#F59E0B",
        name: "Geprek Keju Melt Mozarella",
        pct: "16%",
        qty: 3032,
        dashArray: "44.23 276.46",
        dashOffset: "-171.4",
      },
      {
        color: "bg-[#1E562F]",
        stroke: "#1E562F",
        name: "Paket Hemat Komplit + Tempe/Tahu",
        pct: "14%",
        qty: 2653,
        dashArray: "38.7 276.46",
        dashOffset: "-215.63",
      },
      {
        color: "bg-[#10B981]",
        stroke: "#10B981",
        name: "Es Teh Jumbo & Minuman Dingin",
        pct: "8%",
        qty: 1516,
        dashArray: "22.13 276.46",
        dashOffset: "-254.33",
      },
    ],
  },
  Kustom: {
    periodBadge: "Rentang Kustom",
    omzetTitle: "TOTAL OMZET KUSTOM",
    omzetValue: "Rp 68.450.000",
    omzetGrowth: "+19,1%",
    omzetTarget: "Target: Rp 60 Juta",
    omzetAchieved: "114% Tercapai",
    porsiValue: "2.940",
    porsiNumber: 2940,
    porsiGrowth: "+13,0%",
    porsiAvg: "Rata-rata/hari: 226 Porsi",
    aovValue: "Rp 38.750",
    aovGrowth: "+5,9%",
    totalTx: "1.766",
    cabaiKg: "84 Kg Rawit Merah",
    categories: [
      {
        color: "bg-[#DC2626]",
        stroke: "#DC2626",
        name: "Geprek Sambal Bawang Original",
        pct: "38%",
        qty: 1117,
        dashArray: "105.05 276.46",
        dashOffset: "0",
      },
      {
        color: "bg-[#EA580C]",
        stroke: "#EA580C",
        name: "Geprek Sambal Korek Merah",
        pct: "24%",
        qty: 706,
        dashArray: "66.35 276.46",
        dashOffset: "-105.05",
      },
      {
        color: "bg-[#F59E0B]",
        stroke: "#F59E0B",
        name: "Geprek Keju Melt Mozarella",
        pct: "16%",
        qty: 470,
        dashArray: "44.23 276.46",
        dashOffset: "-171.4",
      },
      {
        color: "bg-[#1E562F]",
        stroke: "#1E562F",
        name: "Paket Hemat Komplit + Tempe/Tahu",
        pct: "14%",
        qty: 412,
        dashArray: "38.7 276.46",
        dashOffset: "-215.63",
      },
      {
        color: "bg-[#10B981]",
        stroke: "#10B981",
        name: "Es Teh Jumbo & Minuman Dingin",
        pct: "8%",
        qty: 235,
        dashArray: "22.13 276.46",
        dashOffset: "-254.33",
      },
    ],
  },
};

const HOURLY_CHART_DATA = [
  { x: 60, t: "09:00", omzetY: 190, porsiY: 192, omzetLabel: "Rp 1,2 Jt", porsi: 45, highlight: "" },
  { x: 114, t: "10:00", omzetY: 182, porsiY: 186, omzetLabel: "Rp 2,8 Jt", porsi: 92, highlight: "" },
  { x: 168, t: "11:00", omzetY: 158, porsiY: 166, omzetLabel: "Rp 6,4 Jt", porsi: 210, highlight: "" },
  { x: 222, t: "12:00", omzetY: 86, porsiY: 102, omzetLabel: "Rp 13,8 Jt", porsi: 490, highlight: "amber" },
  { x: 276, t: "13:00", omzetY: 62, porsiY: 78, omzetLabel: "Rp 16,1 Jt", porsi: 580, highlight: "amber" },
  { x: 330, t: "14:00", omzetY: 130, porsiY: 142, omzetLabel: "Rp 8,5 Jt", porsi: 310, highlight: "" },
  { x: 384, t: "15:00", omzetY: 152, porsiY: 162, omzetLabel: "Rp 5,9 Jt", porsi: 195, highlight: "" },
  { x: 438, t: "17:00", omzetY: 118, porsiY: 132, omzetLabel: "Rp 9,6 Jt", porsi: 340, highlight: "" },
  { x: 492, t: "18:00", omzetY: 78, porsiY: 92, omzetLabel: "Rp 14,5 Jt", porsi: 525, highlight: "red" },
  { x: 546, t: "19:00", omzetY: 46, porsiY: 60, omzetLabel: "Rp 17,4 Jt", porsi: 640, highlight: "red" },
  { x: 600, t: "20:00", omzetY: 94, porsiY: 108, omzetLabel: "Rp 12,2 Jt", porsi: 430, highlight: "" },
  { x: 654, t: "21:00", omzetY: 162, porsiY: 170, omzetLabel: "Rp 4,8 Jt", porsi: 165, highlight: "" },
  { x: 708, t: "22:00", omzetY: 188, porsiY: 191, omzetLabel: "Rp 1,6 Jt", porsi: 58, highlight: "" },
];

const HEATMAP_SLOTS = [
  "10:00 - 12:00",
  "12:00 - 14:00 (Siang)",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 21:00 (Malam)",
  "21:00 - 22:00",
];

const HEATMAP_DATA = [
  {
    day: "Senin",
    slots: [
      { val: 12, level: "low", occ: 22 },
      { val: 78, level: "high", occ: 76 },
      { val: 24, level: "mild", occ: 35 },
      { val: 28, level: "mild", occ: 38 },
      { val: 58, level: "medium", occ: 62 },
      { val: 14, level: "low", occ: 24 },
    ],
  },
  {
    day: "Selasa",
    slots: [
      { val: 15, level: "low", occ: 25 },
      { val: 82, level: "high", occ: 80 },
      { val: 21, level: "mild", occ: 32 },
      { val: 30, level: "mild", occ: 41 },
      { val: 64, level: "medium", occ: 67 },
      { val: 12, level: "low", occ: 20 },
    ],
  },
  {
    day: "Rabu",
    slots: [
      { val: 14, level: "low", occ: 24 },
      { val: 85, level: "high", occ: 82 },
      { val: 25, level: "mild", occ: 36 },
      { val: 33, level: "mild", occ: 44 },
      { val: 61, level: "medium", occ: 65 },
      { val: 16, level: "low", occ: 27 },
    ],
  },
  {
    day: "Kamis",
    slots: [
      { val: 18, level: "mild", occ: 29 },
      { val: 88, level: "high", occ: 85 },
      { val: 27, level: "mild", occ: 39 },
      { val: 42, level: "medium", occ: 51 },
      { val: 68, level: "medium", occ: 71 },
      { val: 19, level: "low", occ: 30 },
    ],
  },
  {
    day: "Jumat",
    slots: [
      { val: 26, level: "mild", occ: 37 },
      { val: 96, level: "very_high", occ: 90 },
      { val: 31, level: "mild", occ: 42 },
      { val: 48, level: "medium", occ: 56 },
      { val: 92, level: "high", occ: 87 },
      { val: 29, level: "mild", occ: 40 },
    ],
  },
  {
    day: "Sabtu",
    slots: [
      { val: 38, level: "medium", occ: 49 },
      { val: 104, level: "very_high", occ: 92 },
      { val: 45, level: "medium", occ: 54 },
      { val: 56, level: "medium", occ: 61 },
      { val: 120, level: "peak", occ: 94 },
      { val: 41, level: "medium", occ: 50 },
    ],
  },
  {
    day: "Minggu",
    slots: [
      { val: 42, level: "medium", occ: 52 },
      { val: 110, level: "very_high", occ: 93 },
      { val: 48, level: "medium", occ: 56 },
      { val: 52, level: "medium", occ: 59 },
      { val: 115, level: "peak", occ: 93 },
      { val: 32, level: "mild", occ: 43 },
    ],
  },
];

const ITEMS_PER_PAGE = 5;

export default function TransaksiPage() {
  // Tetap pertahankan state & context transaksi sesuai aturan .cursorrules
  const {
    transactions,
    filteredTransactions,
    stats,
    searchQuery,
    setSearchQuery,
    filterPayment,
    setFilterPayment,
  } = useTransactions();

  // State Kontrol Header (Cabang, Periode, Rentang Kustom, Sync POS)
  const [selectedBranch, setSelectedBranch] = useState<string>("Semua Cabang");
  const [showBranchMenu, setShowBranchMenu] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Bulan Ini");
  const [customStartDate, setCustomStartDate] = useState<string>("2026-11-01");
  const [customEndDate, setCustomEndDate] = useState<string>("2026-11-13");
  const [lastSyncTime, setLastSyncTime] = useState<string>("13:25 WIB");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // State Interaktivitas Grafik & Heatmap
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number>(9); // Default 19:00 (Peak 2)
  const [hoveredCategoryIdx, setHoveredCategoryIdx] = useState<number | null>(
    null
  );
  const [hoveredHeatmap, setHoveredHeatmap] = useState<{
    day: string;
    slotLabel: string;
    val: number;
    occ: number;
  } | null>(null);

  // State Tabel, Filter, Pagination & Modal Detail Struk
  const [activePage, setActivePage] = useState<number>(1);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [selectedOrderModal, setSelectedOrderModal] =
    useState<RecentOrderRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  const formatRupiah = (val: number) => "Rp " + val.toLocaleString("id-ID");

  // Data KPI & Donut Chart dinamis mengikuti tab periode
  const activeMetrics =
    PERIOD_METRICS_MAP[selectedPeriod] || PERIOD_METRICS_MAP["Bulan Ini"];

  // Handler Tombol Sync POS: Live
  const handleSyncPos = () => {
    setIsSyncing(true);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes} WIB`;

    setTimeout(() => {
      setLastSyncTime(formattedTime);
      setIsSyncing(false);
      showToast(
        `Sinkronisasi POS berhasil! Data diperbarui pada ${formattedTime}.`
      );
    }, 500);
  };

  // Handler Terapkan Rentang Tanggal Kustom
  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      showToast("Pilih tanggal mulai dan selesai terlebih dahulu!");
      return;
    }
    showToast(
      `Filter periode kustom (${customStartDate} s/d ${customEndDate}) berhasil diterapkan!`
    );
  };

  // Gabungkan transaksi baru dari context dengan 12 rincian transaksi default
  const allCombinedOrders = useMemo(() => {
    const initialIds = new Set([
      "#TRX-202410-0192",
      "#TRX-202410-0191",
      "#TRX-202410-0190",
      "#TRX-202410-0189",
      "#TRX-202410-0188",
    ]);
    const sourceTx =
      transactions && transactions.length > 0
        ? transactions
        : filteredTransactions;
    const extraFromContext: RecentOrderRow[] = sourceTx
      .filter((tx) => !initialIds.has(tx.id))
      .map((tx) => ({
        id: tx.id.replace("#TRX-", "#GPRK-"),
        time: `${tx.time} WIB`,
        relativeTime: "Baru Saja",
        mainMenu: tx.itemsSummary,
        addons: `+ ${tx.cashier} (${tx.terminal})`,
        portions: tx.totalItems,
        branch: "Cabang Sudirman Utama",
        cashier: tx.cashier,
        terminal: tx.terminal,
        paymentBadge:
          tx.paymentMethod === "QRIS" ? "QRIS Dinamis" : "Tunai / Cash",
        orderType: "Dine-In",
        total: tx.total,
      }));

    return [...extraFromContext, ...DEFAULT_RECENT_ORDERS];
  }, [transactions, filteredTransactions]);

  // Filter berdasarkan Cabang yang sedang dipilih
  const branchFilteredOrders = useMemo(() => {
    if (selectedBranch === "Semua Cabang") return allCombinedOrders;
    return allCombinedOrders.filter((row) => row.branch === selectedBranch);
  }, [allCombinedOrders, selectedBranch]);

  // Hitung jumlah metode bayar secara akurat dari data cabang yang sedang aktif
  const paymentCounts = useMemo(() => {
    const total = branchFilteredOrders.length;
    const tunai = branchFilteredOrders.filter(
      (r) => r.paymentBadge === "Tunai / Cash"
    ).length;
    const qris = branchFilteredOrders.filter(
      (r) => r.paymentBadge === "QRIS Dinamis"
    ).length;
    const grab = branchFilteredOrders.filter(
      (r) => r.paymentBadge === "GrabFood POS"
    ).length;
    return { total, tunai, qris, grab };
  }, [branchFilteredOrders]);

  // Filter akhir berdasarkan pencarian dan metode pembayaran
  const displayOrders = useMemo(() => {
    return branchFilteredOrders.filter((row) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        q === "" ||
        row.id.toLowerCase().includes(q) ||
        row.mainMenu.toLowerCase().includes(q) ||
        row.addons.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q) ||
        row.cashier.toLowerCase().includes(q);

      const matchPay =
        filterPayment === "Semua" ||
        (filterPayment === "Tunai" && row.paymentBadge === "Tunai / Cash") ||
        (filterPayment === "QRIS" && row.paymentBadge === "QRIS Dinamis") ||
        (filterPayment === "GrabFood POS" &&
          row.paymentBadge === "GrabFood POS");

      return matchQuery && matchPay;
    });
  }, [branchFilteredOrders, searchQuery, filterPayment]);

  // Pagination: Slice 5 baris per halaman
  const totalPages = Math.max(
    1,
    Math.ceil(displayOrders.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(activePage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [displayOrders, currentPage]);

  // Fungsi Export CSV kompatibel Microsoft Excel (UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      "ID Transaksi",
      "Waktu",
      "Kasir & Cabang",
      "Menu/Item",
      "Metode Bayar",
      "Total",
      "Status",
    ];

    const rows = displayOrders.map((order) => [
      order.id,
      `${order.time} (${order.relativeTime})`,
      `${order.cashier} - ${order.branch}`,
      `${order.mainMenu} (${order.addons})`,
      `${order.paymentBadge} - ${order.orderType}`,
      formatRupiah(order.total),
      "Berhasil",
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Laporan_Transaksi_PrekDuaDara.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Laporan transaksi berhasil diunduh!");
  };

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

  const activeHourPoint =
    HOURLY_CHART_DATA[hoveredHourIdx] || HOURLY_CHART_DATA[9];
  const tooltipX = Math.min(Math.max(activeHourPoint.x - 68, 48), 595);
  const tooltipY = Math.max(activeHourPoint.omzetY - 38, 4);

  const activeDonutCategory =
    hoveredCategoryIdx !== null
      ? activeMetrics.categories[hoveredCategoryIdx]
      : null;

  return (
    <div className="min-h-screen bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-gray-900">
      {/* Notifikasi Toast Modern (Pojok Kanan Bawah) */}
      {toastMessage && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 bg-[#2D452B] text-white border border-[#415C3E] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold transition-all">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 size={15} />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Detail Struk Transaksi */}
      {selectedOrderModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-[#2D452B] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer size={16} className="text-[#F59E0B]" />
                <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                  Detail Struk Transaksi POS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Isi Struk Thermal */}
            <div className="p-5 bg-[#FAF8F3]">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs font-mono text-xs text-gray-800">
                <div className="text-center border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="font-black text-sm text-[#EA8E18] tracking-wider">
                    PREKDUADARA
                  </div>
                  <div className="text-[11px] text-gray-700 font-sans font-bold mt-0.5">
                    {selectedOrderModal.branch}
                  </div>
                  <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                    Restoran Spesialis Ayam Geprek Cobek &amp; Sambal Uleg Asli
                  </div>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-bold text-gray-900">
                      {selectedOrderModal.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu Transaksi:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedOrderModal.time} (
                      {selectedOrderModal.relativeTime})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kasir / Terminal:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedOrderModal.cashier} •{" "}
                      {selectedOrderModal.terminal}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipe Pesanan:</span>
                    <span className="font-bold text-gray-900">
                      {selectedOrderModal.orderType}
                    </span>
                  </div>
                </div>

                {/* Rincian Menu & Add-ons */}
                <div className="border-b border-dashed border-gray-300 pb-3.5 mb-3.5">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Rincian Menu &amp; Add-Ons
                  </div>
                  <div className="font-bold text-gray-900 leading-snug">
                    {selectedOrderModal.mainMenu}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    {selectedOrderModal.addons}
                  </div>
                  <div className="text-[11px] font-bold text-[#D97706] mt-1.5">
                    Jumlah: {selectedOrderModal.portions} Porsi
                  </div>
                </div>

                {/* Total & Metode Bayar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-black text-gray-900">
                    <span>TOTAL TRANSAKSI</span>
                    <span className="text-[#1E3A1C]">
                      {formatRupiah(selectedOrderModal.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Metode Pembayaran:</span>
                    <span className="font-bold px-2 py-0.5 rounded bg-amber-50 text-[#B45309] border border-amber-200">
                      {selectedOrderModal.paymentBadge}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status Transaksi:</span>
                    <span className="font-bold text-emerald-700">
                      ✓ Lunas / Berhasil
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(
                    `Mencetak ulang struk ${selectedOrderModal.id} ke printer kasir...`
                  );
                  setSelectedOrderModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#EA8E18] hover:bg-[#d67f12] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Ulang Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR KIRI (FIXED & PATEN, DISEMBUNYIKAN SAAT PRINT PDF) */}
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>

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

          {/* Right Controls: Branch, Period Tabs, Sync & Export (Disembunyikan saat Print PDF) */}
          <div className="print:hidden flex flex-col items-start sm:items-end gap-2.5 w-full xl:w-auto">
            {/* Row 1: Branch Selector + Period Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Interactive Branch Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBranchMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-100 transition cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{selectedBranch}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {showBranchMenu && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs">
                    {BRANCH_OPTIONS.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          setSelectedBranch(branch);
                          setShowBranchMenu(false);
                          setActivePage(1);
                          showToast(`Menampilkan data untuk: ${branch}`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-amber-50/60 transition cursor-pointer ${
                          selectedBranch === branch
                            ? "font-extrabold text-[#EA8E18] bg-amber-50/40"
                            : "font-semibold text-gray-700"
                        }`}
                      >
                        <Store size={13} className="shrink-0" />
                        <span>{branch}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period Switcher Tabs */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                {["Hari Ini", "7 Hari", "Bulan Ini", "Kuartal"].map(
                  (period) => (
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
                  )
                )}
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

            {/* Custom Date Range Picker Row (Muncul saat tab Kustom dipilih) */}
            {selectedPeriod === "Kustom" && (
              <div className="flex flex-wrap items-center gap-2 bg-amber-50/70 border border-amber-200 px-3 py-2 rounded-xl text-xs">
                <span className="font-bold text-gray-700">Rentang:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-semibold text-gray-800 focus:outline-none focus:border-[#EA8E18]"
                />
                <span className="text-gray-500 font-bold">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-semibold text-gray-800 focus:outline-none focus:border-[#EA8E18]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-3 py-1 bg-[#EA8E18] hover:bg-[#d67f12] text-white font-extrabold rounded-lg transition cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            )}

            {/* Row 2: Sync POS + Excel + Export PDF */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSyncPos}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold transition cursor-pointer"
                title="Klik untuk sinkronisasi manual dengan mesin kasir POS"
              >
                <RefreshCw
                  size={13}
                  className={`text-emerald-600 ${
                    isSyncing ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncing ? "Syncing POS..." : "Sync POS: Live"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
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

        {/* 4 KPI SUMMARY CARDS (DINAMIS MENGIKUTI PERIODE) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL OMZET */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                {activeMetrics.omzetTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                {activeMetrics.omzetGrowth}
              </span>
            </div>

            <div className="my-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {activeMetrics.omzetValue}
              </h2>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                {activeMetrics.omzetTarget}
              </span>
              <span className="font-extrabold text-[#D97706]">
                {activeMetrics.omzetAchieved}
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
                {activeMetrics.porsiGrowth}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {activeMetrics.porsiValue}
              </h2>
              <span className="text-xs sm:text-sm font-bold text-gray-500">
                Porsi Ayam
              </span>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                {activeMetrics.porsiAvg}
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
                {activeMetrics.aovGrowth}
              </span>
            </div>

            <div className="my-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {activeMetrics.aovValue}
              </h2>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Total Transaksi: {activeMetrics.totalTx}
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
                  Arahkan kursor atau klik pada titik jam (09:00 - 22:00 WIB)
                  untuk melihat detail omzet &amp; porsi
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

            {/* SVG Line / Area Chart (Interactive Hover/Click per Jam) */}
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
                      <stop
                        offset="100%"
                        stopColor="#F59E0B"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                    <linearGradient
                      id="peak1Grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.7" />
                      <stop
                        offset="100%"
                        stopColor="#FEF3C7"
                        stopOpacity="0.05"
                      />
                    </linearGradient>
                    <linearGradient
                      id="peak2Grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#FEE2E2" stopOpacity="0.7" />
                      <stop
                        offset="100%"
                        stopColor="#FEE2E2"
                        stopOpacity="0.05"
                      />
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

                  {/* Peak 2 Badge: PEAK 2: MAKAN MALAM */}
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

                  {/* Garis Panduan Vertikal Dinamis Mengikuti Titik Aktif */}
                  <line
                    x1={activeHourPoint.x}
                    y1={35}
                    x2={activeHourPoint.x}
                    y2={195}
                    stroke="#1F2937"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />

                  {/* Titik-titik Data Interaktif & Area Hover Setiap Jam */}
                  {HOURLY_CHART_DATA.map((pt, idx) => {
                    const isActive = idx === hoveredHourIdx;
                    return (
                      <g
                        key={pt.t}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredHourIdx(idx)}
                        onClick={() => setHoveredHourIdx(idx)}
                      >
                        {/* Titik Omzet */}
                        <circle
                          cx={pt.x}
                          cy={pt.omzetY}
                          r={isActive ? 5.5 : 3.5}
                          fill="#FFFFFF"
                          stroke="#F59E0B"
                          strokeWidth={isActive ? "3" : "2"}
                        />
                        {/* Titik Porsi */}
                        <circle
                          cx={pt.x}
                          cy={pt.porsiY}
                          r={isActive ? 5 : 3}
                          fill="#DC2626"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        {/* Label Jam X-Axis */}
                        <text
                          x={pt.x}
                          y="220"
                          textAnchor="middle"
                          className={`text-[11px] ${
                            isActive
                              ? "fill-gray-950 font-black underline"
                              : pt.highlight === "amber"
                                ? "fill-[#B45309] font-black"
                                : pt.highlight === "red"
                                  ? "fill-[#DC2626] font-black"
                                  : "fill-gray-600 font-semibold"
                          }`}
                        >
                          {pt.t}
                        </text>
                        {/* Hitbox Kolom Transparan agar mudah di-hover */}
                        <rect
                          x={pt.x - 25}
                          y="25"
                          width="50"
                          height="205"
                          fill="transparent"
                        />
                      </g>
                    );
                  })}

                  {/* Kotak Tooltip Dinamis */}
                  <g
                    transform={`translate(${tooltipX}, ${tooltipY})`}
                    className="pointer-events-none"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="136"
                      height="24"
                      rx="5"
                      fill="#1F2937"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <text
                      x="68"
                      y="15.5"
                      textAnchor="middle"
                      className="fill-white text-[9.5px] font-extrabold"
                    >
                      {activeHourPoint.omzetLabel} • {activeHourPoint.porsi}{" "}
                      Porsi ({activeHourPoint.t})
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>
                  Jam dipilih:{" "}
                  <strong className="text-gray-900 font-extrabold">
                    {activeHourPoint.t} WIB
                  </strong>{" "}
                  ({activeHourPoint.omzetLabel} • {activeHourPoint.porsi} Porsi
                  Terjual)
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
                {activeMetrics.periodBadge}
              </span>
            </div>

            {/* Interactive Donut Chart */}
            <div
              className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center"
              onMouseLeave={() => setHoveredCategoryIdx(null)}
            >
              <svg
                viewBox="0 0 120 120"
                className="w-full h-full -rotate-90 transform"
              >
                {activeMetrics.categories.map((cat, idx) => {
                  const isHovered = hoveredCategoryIdx === idx;
                  const isDimmed =
                    hoveredCategoryIdx !== null && hoveredCategoryIdx !== idx;
                  return (
                    <circle
                      key={cat.name}
                      cx="60"
                      cy="60"
                      r="44"
                      fill="transparent"
                      stroke={cat.stroke}
                      strokeWidth={isHovered ? "21" : "18"}
                      strokeDasharray={cat.dashArray}
                      strokeDashoffset={cat.dashOffset}
                      className={`cursor-pointer transition-all duration-200 ${
                        isDimmed ? "opacity-35" : "opacity-100"
                      }`}
                      onMouseEnter={() => setHoveredCategoryIdx(idx)}
                      onClick={() =>
                        setHoveredCategoryIdx(
                          hoveredCategoryIdx === idx ? null : idx
                        )
                      }
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <span className="text-[11px] text-gray-500 font-bold truncate max-w-[115px]">
                  {activeDonutCategory
                    ? activeDonutCategory.pct + " Kontribusi"
                    : "Total Terjual"}
                </span>
                <span className="text-2xl font-black text-gray-900 leading-tight">
                  {activeDonutCategory
                    ? activeDonutCategory.qty.toLocaleString("id-ID")
                    : activeMetrics.porsiValue}
                </span>
                <span className="text-[10px] font-extrabold text-[#DC2626] uppercase tracking-wider">
                  PORSI
                </span>
              </div>
            </div>

            {/* Category Breakdown List (Interactive Hover) */}
            <div
              className="space-y-1.5 text-xs"
              onMouseLeave={() => setHoveredCategoryIdx(null)}
            >
              {activeMetrics.categories.map((item, idx) => {
                const isSelected = hoveredCategoryIdx === idx;
                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredCategoryIdx(idx)}
                    onClick={() =>
                      setHoveredCategoryIdx(
                        hoveredCategoryIdx === idx ? null : idx
                      )
                    }
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? "bg-amber-50 border border-amber-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-3 h-3 rounded-full ${item.color} shrink-0`}
                      ></span>
                      <span
                        className={`text-xs truncate ${
                          isSelected
                            ? "text-gray-950 font-extrabold"
                            : "text-gray-800 font-semibold"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="text-xs shrink-0">
                      <strong className="text-gray-900 font-extrabold">
                        {item.pct}
                      </strong>{" "}
                      <span className="text-gray-500 font-medium">
                        ({item.qty.toLocaleString("id-ID")})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 mt-4 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">
                Cabai Terpakai:{" "}
                <strong className="text-[#DC2626] font-extrabold">
                  {activeMetrics.cabaiKg}
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
                <span className="leading-tight">Dine-In (Makan Sini)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                <span className="leading-tight">GrabFood / GoFood</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#EA580C] shrink-0"></span>
                <span className="leading-tight">Takeaway (Bungkus)</span>
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
                  {hoveredHeatmap ? (
                    <span className="text-gray-900 font-bold">
                      Detail {hoveredHeatmap.day} ({hoveredHeatmap.slotLabel}):{" "}
                      <span className="text-[#DC2626] font-extrabold">
                        Rata-rata {hoveredHeatmap.val} Struk
                      </span>{" "}
                      • Okupansi Meja{" "}
                      <span className="text-[#1E562F] font-extrabold">
                        {hoveredHeatmap.occ}%
                      </span>
                    </span>
                  ) : (
                    "Arahkan kursor pada kotak angka untuk melihat rata-rata struk & okupansi meja"
                  )}
                </p>
              </div>

              {/* Scale Legend */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold shrink-0">
                <span>Rendah</span>
                <span className="w-3.5 h-3.5 rounded-xs bg-gray-100 border border-gray-300"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#A7F3D0]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#FBBF24]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#DC2626]"></span>
                <span>Sangat Ramai</span>
              </div>
            </div>

            {/* Heatmap Grid Table */}
            <div
              className="overflow-x-auto"
              onMouseLeave={() => setHoveredHeatmap(null)}
            >
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
                        {row.slots.map((slot, idx) => {
                          const isCellHovered =
                            hoveredHeatmap?.day === row.day &&
                            hoveredHeatmap?.slotLabel === HEATMAP_SLOTS[idx];
                          return (
                            <td key={idx} className="p-0">
                              <div
                                onMouseEnter={() =>
                                  setHoveredHeatmap({
                                    day: row.day,
                                    slotLabel: HEATMAP_SLOTS[idx],
                                    val: slot.val,
                                    occ: slot.occ,
                                  })
                                }
                                className={`py-2 px-2.5 rounded-lg text-xs sm:text-sm cursor-pointer transition-transform ${getHeatmapCellStyle(
                                  slot.level
                                )} ${
                                  isCellHovered
                                    ? "ring-2 ring-gray-900 scale-105"
                                    : ""
                                }`}
                              >
                                {slot.val}
                              </div>
                            </td>
                          );
                        })}
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
                Klik pada baris transaksi untuk melihat detail struk POS •
                Sinkronisasi otomatis ({stats.totalCount} log kasir aktif)
              </p>
            </div>

            <div className="print:hidden flex items-center gap-2.5 relative">
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActivePage(1);
                  }}
                  placeholder="Cari Order ID / Menu / Cabang..."
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
                <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-52 text-xs sm:text-sm">
                  {[
                    {
                      key: "Semua",
                      label: `Semua Metode (${paymentCounts.total})`,
                    },
                    {
                      key: "Tunai",
                      label: `Tunai / Cash (${paymentCounts.tunai})`,
                    },
                    {
                      key: "QRIS",
                      label: `QRIS Dinamis (${paymentCounts.qris})`,
                    },
                    {
                      key: "GrabFood POS",
                      label: `GrabFood POS (${paymentCounts.grab})`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setFilterPayment(opt.key);
                        setShowFilterMenu(false);
                        setActivePage(1);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 cursor-pointer ${
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

          {/* Table (Lebar kolom proporsional tanpa table-fixed sempit agar tidak bertabrakan/terpotong) */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Order ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    Waktu Transaksi
                  </th>
                  <th className="py-3.5 px-4 min-w-[250px]">
                    Menu Utama Dipesan
                  </th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">
                    Porsi
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    Cabang Outlet
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    Tipe &amp; Metode Bayar
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">
                    Total Transaksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderModal(order)}
                    title="Klik untuk melihat detail struk transaksi"
                    className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-extrabold text-[#D97706] whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">
                        {order.time}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {order.relativeTime}
                      </div>
                    </td>
                    <td className="py-4 px-4">
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
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">
                        {order.branch}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">
                        Kasir: {order.cashier}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                            order.paymentBadge === "QRIS Dinamis"
                              ? "bg-blue-50 text-blue-800 border border-blue-300"
                              : order.paymentBadge === "Tunai / Cash"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                : "bg-purple-50 text-purple-800 border border-purple-300"
                          }`}
                        >
                          {order.paymentBadge}
                        </span>
                        <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">
                          {order.orderType}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                      {formatRupiah(order.total)}
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      Tidak ada rincian transaksi yang cocok dengan filter
                      pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Row (Disembunyikan saat Print PDF) */}
          <div className="print:hidden pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 font-medium">
            <div>
              Menampilkan{" "}
              <strong className="text-gray-900 font-extrabold">
                {paginatedOrders.length}
              </strong>{" "}
              dari{" "}
              <strong className="text-gray-900 font-extrabold">
                {displayOrders.length}
              </strong>{" "}
              transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    className={`w-8 h-8 rounded-lg font-extrabold transition cursor-pointer ${
                      currentPage === page
                        ? "bg-[#1E3A1C] text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setActivePage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
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
              © 2026. Seluruh Hak Cipta Dilindungi.
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Sinkronisasi Otomatis Terakhir:{" "}
              <strong className="text-gray-900 font-extrabold">
                {lastSyncTime}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {selectedBranch === "Semua Cabang"
                ? "Semua Cabang Terkoneksi"
                : `${selectedBranch} Terkoneksi`}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
