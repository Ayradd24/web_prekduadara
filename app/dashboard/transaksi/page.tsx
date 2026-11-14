"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  date: string;
  relativeTime: string;
  mainMenu: string;
  addons: string;
  portions: number;
  branch: string;
  cashier: string;
  terminal: string;
  paymentMethod: "Tunai" | "QRIS";
  paymentBadge: "QRIS Dinamis" | "Tunai / Cash";
  orderType: "Dine-In" | "Takeaway" | "Ojol Delivery";
  subtotal: number;
  diskon: number;
  total: number;
  status: "Berhasil" | "Batal";
}

const resolveBranchFromTerminal = (terminal: string): string => {
  if (terminal.includes("Pos-02")) return "Cabang Tebet Eco Park";
  if (terminal.includes("Pos-03")) return "Cabang Dago Heritage";
  return "Cabang Sudirman Utama";
};

const getSystemDateInfo = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const firstDayOfMonthStr = `${yyyy}-${mm}-01`;
  const daysElapsedInMonth = Math.max(1, now.getDate());
  return { todayStr, firstDayOfMonthStr, daysElapsedInMonth };
};

const BRANCH_OPTIONS = [
  "Semua Cabang",
  "Cabang Sudirman Utama",
  "Cabang Tebet Eco Park",
  "Cabang Dago Heritage",
];

interface BranchProfile {
  scale: number;
  aovMultiplier: number;
  growthBonus: number;
  rushLunchTime: string;
  rushLunchTag: string;
  rushDinnerTime: string;
  rushDinnerTag: string;
  rushContribution: string;
  prepTime: string;
  topMenuLabel: string;
  addonRate: string;
  spicyLevel: string;
  baseWeekendPct: number;
  weekdayOmzetBase: number;
  weekdayPorsiBase: number;
  weekdayDominant: string;
  weekdaySplit: [number, number, number]; // [DineIn, Ojol, Takeaway]
  weekendDominant: string;
  weekendSplit: [number, number, number];
  stockInsightBoost: string;
  heatmapMaxCap: string;
  categoryShares: [number, number, number, number, number];
  hourlyCurveWeights: number[]; // 13 jam operasional (09:00 - 22:00)
  heatmapSlotWeights: [number, number, number, number, number, number];
  heatmapWeekendBoost: number;
}

const BRANCH_PROFILES: Record<string, BranchProfile> = {
  "Semua Cabang": {
    scale: 1.0,
    aovMultiplier: 1.0,
    growthBonus: 0,
    rushLunchTime: "11:30 - 13:30",
    rushLunchTag: "Siang",
    rushDinnerTime: "18:00 - 20:30",
    rushDinnerTag: "Malam",
    rushContribution: "72,8% Harian",
    prepTime: "4,2 Menit",
    topMenuLabel: "Top: Geprek Bawang",
    addonRate: "Add-on Es Teh: 88%",
    spicyLevel: "Level 3",
    baseWeekendPct: 42,
    weekdayOmzetBase: 18250000,
    weekdayPorsiBase: 185,
    weekdayDominant: "Dominan: Dine-In Karyawan",
    weekdaySplit: [48, 37, 15],
    weekendDominant: "Dominan: Dine-In Keluarga & Komunitas",
    weekendSplit: [42, 43, 15],
    stockInsightBoost: "35% pada hari Kamis malam",
    heatmapMaxCap: "94% terisi saat Sabtu Malam",
    categoryShares: [38, 24, 16, 14, 8],
    hourlyCurveWeights: [
      1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    ],
    heatmapSlotWeights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    heatmapWeekendBoost: 1.0,
  },
  "Cabang Sudirman Utama": {
    scale: 0.42,
    aovMultiplier: 1.04,
    growthBonus: 1.4,
    rushLunchTime: "11:30 - 13:30",
    rushLunchTag: "Siang (Peak)",
    rushDinnerTime: "17:30 - 19:30",
    rushDinnerTag: "Pulang Kantor",
    rushContribution: "78,4% Harian",
    prepTime: "3,8 Menit",
    topMenuLabel: "Top: Paket Komplit",
    addonRate: "Add-on Es Teh: 92%",
    spicyLevel: "Level 3",
    baseWeekendPct: 26,
    weekdayOmzetBase: 8450000,
    weekdayPorsiBase: 86,
    weekdayDominant: "Dominan: Dine-In Kantoran & Rombongan",
    weekdaySplit: [56, 30, 14],
    weekendDominant: "Dominan: Dine-In & Takeaway Sore",
    weekendSplit: [48, 36, 16],
    stockInsightBoost: "30% pada hari Senin & Kamis pagi",
    heatmapMaxCap: "96% terisi saat Jumat Siang",
    categoryShares: [41, 21, 14, 16, 8],
    hourlyCurveWeights: [
      1.15, 1.2, 1.28, 1.35, 1.38, 1.15, 0.95, 0.9, 0.88, 0.82, 0.78, 0.72,
      0.68,
    ],
    heatmapSlotWeights: [1.18, 1.34, 1.05, 0.92, 0.82, 0.72],
    heatmapWeekendBoost: 0.84,
  },
  "Cabang Tebet Eco Park": {
    scale: 0.33,
    aovMultiplier: 0.98,
    growthBonus: 0.6,
    rushLunchTime: "12:00 - 14:00",
    rushLunchTag: "Siang",
    rushDinnerTime: "18:30 - 20:30",
    rushDinnerTag: "Malam (Peak)",
    rushContribution: "71,2% Harian",
    prepTime: "4,3 Menit",
    topMenuLabel: "Top: Geprek Mozarella",
    addonRate: "Add-on Es Teh: 86%",
    spicyLevel: "Level 4",
    baseWeekendPct: 45,
    weekdayOmzetBase: 5720000,
    weekdayPorsiBase: 58,
    weekdayDominant: "Dominan: GrabFood / GoFood & Dine-In",
    weekdaySplit: [40, 45, 15],
    weekendDominant: "Dominan: Komunitas & Ojol Malam",
    weekendSplit: [38, 48, 14],
    stockInsightBoost: "40% pada hari Jumat pagi",
    heatmapMaxCap: "92% terisi saat Sabtu Malam",
    categoryShares: [34, 24, 21, 13, 8],
    hourlyCurveWeights: [
      0.85, 0.9, 0.95, 0.92, 0.94, 1.0, 1.05, 1.14, 1.22, 1.28, 1.2, 1.1, 1.05,
    ],
    heatmapSlotWeights: [0.86, 0.92, 1.0, 1.08, 1.22, 1.1],
    heatmapWeekendBoost: 1.06,
  },
  "Cabang Dago Heritage": {
    scale: 0.25,
    aovMultiplier: 0.96,
    growthBonus: 2.1,
    rushLunchTime: "12:00 - 14:00",
    rushLunchTag: "Siang",
    rushDinnerTime: "18:00 - 21:00",
    rushDinnerTag: "Malam (Peak)",
    rushContribution: "74,5% Harian",
    prepTime: "4,5 Menit",
    topMenuLabel: "Top: Sambal Korek Lv 5",
    addonRate: "Add-on Es Teh: 84%",
    spicyLevel: "Level 5",
    baseWeekendPct: 64,
    weekdayOmzetBase: 4080000,
    weekdayPorsiBase: 41,
    weekdayDominant: "Dominan: Mahasiswa & Takeaway",
    weekdaySplit: [44, 38, 18],
    weekendDominant: "Dominan: Wisatawan & Keluarga Akhir Pekan",
    weekendSplit: [50, 34, 16],
    stockInsightBoost: "50% pada hari Jumat sore",
    heatmapMaxCap: "95% terisi saat Sabtu & Minggu Malam",
    categoryShares: [35, 28, 17, 12, 8],
    hourlyCurveWeights: [
      0.75, 0.8, 0.86, 0.84, 0.86, 0.96, 1.08, 1.18, 1.28, 1.36, 1.3, 1.2, 1.14,
    ],
    heatmapSlotWeights: [0.78, 0.85, 0.96, 1.12, 1.28, 1.18],
    heatmapWeekendBoost: 1.18,
  },
};

interface BasePeriodConfig {
  periodBadge: string;
  omzetTitle: string;
  baseOmzet: number;
  baseTarget: number;
  baseOmzetGrowth: number;
  basePorsi: number;
  basePorsiGrowth: number;
  baseDailyPorsi: number;
  isDailyPeriod?: boolean;
  baseAov: number;
  baseAovGrowth: number;
  baseTotalTx: number;
  baseCabaiKg: number;
  chartPeriodScale: number;
  comparisonMultiplier: number;
  weekendPeriodPct: number;
}

const buildDayBasedPeriodConfig = (
  days: number,
  periodBadge: string,
  omzetTitle: string
): BasePeriodConfig => ({
  periodBadge,
  omzetTitle,
  baseOmzet: Math.round(5265000 * days),
  baseTarget: Math.round(4615000 * days),
  baseOmzetGrowth: 18.4,
  basePorsi: Math.round(226 * days),
  basePorsiGrowth: 12.1,
  baseDailyPorsi: 226,
  baseAov: 38750,
  baseAovGrowth: 5.6,
  baseTotalTx: Math.round(136 * days),
  baseCabaiKg: Number((6.46 * days).toFixed(1)),
  chartPeriodScale: Number((days / 28.2).toFixed(4)),
  comparisonMultiplier: 1.0,
  weekendPeriodPct: 42,
});

const BASE_PERIOD_MAP: Record<string, BasePeriodConfig> = {
  "Hari Ini": {
    periodBadge: "Hari Ini",
    omzetTitle: "TOTAL OMZET HARI INI",
    baseOmzet: 5420000,
    baseTarget: 4800000,
    baseOmzetGrowth: 14.2,
    basePorsi: 228,
    basePorsiGrowth: 9.5,
    baseDailyPorsi: 200,
    isDailyPeriod: true,
    baseAov: 39200,
    baseAovGrowth: 4.1,
    baseTotalTx: 138,
    baseCabaiKg: 6.8,
    chartPeriodScale: 0.038,
    comparisonMultiplier: 0.96,
    weekendPeriodPct: 38,
  },
  "7 Hari": {
    periodBadge: "7 Hari",
    omzetTitle: "TOTAL OMZET 7 HARI",
    baseOmzet: 36840000,
    baseTarget: 32000000,
    baseOmzetGrowth: 16.8,
    basePorsi: 1560,
    basePorsiGrowth: 11.4,
    baseDailyPorsi: 223,
    baseAov: 38900,
    baseAovGrowth: 5.2,
    baseTotalTx: 947,
    baseCabaiKg: 45,
    chartPeriodScale: 0.25,
    comparisonMultiplier: 1.02,
    weekendPeriodPct: 40,
  },
  Kuartal: {
    periodBadge: "Kuartal Ini",
    omzetTitle: "TOTAL OMZET KUARTAL",
    baseOmzet: 432900000,
    baseTarget: 400000000,
    baseOmzetGrowth: 22.7,
    basePorsi: 18950,
    basePorsiGrowth: 15.3,
    baseDailyPorsi: 210,
    baseAov: 39100,
    baseAovGrowth: 6.4,
    baseTotalTx: 11072,
    baseCabaiKg: 542,
    chartPeriodScale: 2.9,
    comparisonMultiplier: 1.04,
    weekendPeriodPct: 46,
  },
};

const CATEGORY_META = [
  {
    color: "bg-[#DC2626]",
    stroke: "#DC2626",
    name: "Geprek Sambal Bawang Original",
  },
  {
    color: "bg-[#EA580C]",
    stroke: "#EA580C",
    name: "Geprek Sambal Korek Merah",
  },
  {
    color: "bg-[#F59E0B]",
    stroke: "#F59E0B",
    name: "Geprek Keju Melt Mozarella",
  },
  {
    color: "bg-[#1E562F]",
    stroke: "#1E562F",
    name: "Paket Hemat Komplit + Tempe/Tahu",
  },
  {
    color: "bg-[#10B981]",
    stroke: "#10B981",
    name: "Es Teh Jumbo & Minuman Dingin",
  },
];

const BASE_HOURLY_POINTS = [
  { x: 60, t: "09:00", baseOmzetJt: 1.2, basePorsi: 45, highlight: "" },
  { x: 114, t: "10:00", baseOmzetJt: 2.8, basePorsi: 92, highlight: "" },
  { x: 168, t: "11:00", baseOmzetJt: 6.4, basePorsi: 210, highlight: "" },
  { x: 222, t: "12:00", baseOmzetJt: 13.8, basePorsi: 490, highlight: "amber" },
  { x: 276, t: "13:00", baseOmzetJt: 16.1, basePorsi: 580, highlight: "amber" },
  { x: 330, t: "14:00", baseOmzetJt: 8.5, basePorsi: 310, highlight: "" },
  { x: 384, t: "15:00", baseOmzetJt: 5.9, basePorsi: 195, highlight: "" },
  { x: 438, t: "17:00", baseOmzetJt: 9.6, basePorsi: 340, highlight: "" },
  { x: 492, t: "18:00", baseOmzetJt: 14.5, basePorsi: 525, highlight: "red" },
  { x: 546, t: "19:00", baseOmzetJt: 17.4, basePorsi: 640, highlight: "red" },
  { x: 600, t: "20:00", baseOmzetJt: 12.2, basePorsi: 430, highlight: "" },
  { x: 654, t: "21:00", baseOmzetJt: 4.8, basePorsi: 165, highlight: "" },
  { x: 708, t: "22:00", baseOmzetJt: 1.6, basePorsi: 58, highlight: "" },
];

const HEATMAP_SLOTS = [
  "10:00 - 12:00",
  "12:00 - 14:00 (Siang)",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 21:00 (Malam)",
  "21:00 - 22:00",
];

const BASE_HEATMAP_DATA = [
  {
    day: "Senin",
    slots: [
      { val: 12, occ: 22 },
      { val: 78, occ: 76 },
      { val: 24, occ: 35 },
      { val: 28, occ: 38 },
      { val: 58, occ: 62 },
      { val: 14, occ: 24 },
    ],
  },
  {
    day: "Selasa",
    slots: [
      { val: 15, occ: 25 },
      { val: 82, occ: 80 },
      { val: 21, occ: 32 },
      { val: 30, occ: 41 },
      { val: 64, occ: 67 },
      { val: 12, occ: 20 },
    ],
  },
  {
    day: "Rabu",
    slots: [
      { val: 14, occ: 24 },
      { val: 85, occ: 82 },
      { val: 25, occ: 36 },
      { val: 33, occ: 44 },
      { val: 61, occ: 65 },
      { val: 16, occ: 27 },
    ],
  },
  {
    day: "Kamis",
    slots: [
      { val: 18, occ: 29 },
      { val: 88, occ: 85 },
      { val: 27, occ: 39 },
      { val: 42, occ: 51 },
      { val: 68, occ: 71 },
      { val: 19, occ: 30 },
    ],
  },
  {
    day: "Jumat",
    slots: [
      { val: 26, occ: 37 },
      { val: 96, occ: 90 },
      { val: 31, occ: 42 },
      { val: 48, occ: 56 },
      { val: 92, occ: 87 },
      { val: 29, occ: 40 },
    ],
  },
  {
    day: "Sabtu",
    slots: [
      { val: 38, occ: 49 },
      { val: 104, occ: 92 },
      { val: 45, occ: 54 },
      { val: 56, occ: 61 },
      { val: 120, occ: 94 },
      { val: 41, occ: 50 },
    ],
  },
  {
    day: "Minggu",
    slots: [
      { val: 42, occ: 52 },
      { val: 110, occ: 93 },
      { val: 48, occ: 56 },
      { val: 52, occ: 59 },
      { val: 115, occ: 93 },
      { val: 32, occ: 43 },
    ],
  },
];

const ITEMS_PER_PAGE = 5;

const formatShortRupiah = (jtVal: number): string => {
  if (jtVal >= 1) {
    return `Rp ${jtVal.toFixed(1).replace(".", ",")} Jt`;
  }
  const rbVal = Math.max(50, Math.round(jtVal * 1000));
  return `Rp ${rbVal} Rb`;
};

const formatTargetRupiah = (val: number): string => {
  const juta = val / 1000000;
  if (juta >= 10) {
    return `Target: Rp ${Math.round(juta)} Juta`;
  }
  return `Target: Rp ${juta.toFixed(1).replace(".", ",")} Juta`;
};

export default function TransaksiPage() {
  // Tetap pertahankan state & context transaksi sesuai aturan .cursorrules
  const {
    transactions,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    filterPayment,
    setFilterPayment,
  } = useTransactions();

  const { todayStr, firstDayOfMonthStr, daysElapsedInMonth } = useMemo(
    () => getSystemDateInfo(),
    []
  );

  // State Kontrol Header (Cabang, Periode, Rentang Kustom, Sync POS)
  const [selectedBranch, setSelectedBranch] = useState<string>("Semua Cabang");
  const [showBranchMenu, setShowBranchMenu] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Bulan Ini");
  const [customStartDate, setCustomStartDate] =
    useState<string>(firstDayOfMonthStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [appliedCustomRange, setAppliedCustomRange] = useState<{
    start: string;
    end: string;
  }>({
    start: firstDayOfMonthStr,
    end: todayStr,
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>("--:-- WIB");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // State Interaktivitas Grafik & Heatmap
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number>(9); // Default 19:00
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
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setLastSyncTime(`${hours}:${minutes} WIB`);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(target)
      ) {
        setShowBranchMenu(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target)
      ) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Single Source of Truth: Ambil seluruh daftar transaksi langsung dari TransactionContext
  const allCombinedOrders = useMemo<RecentOrderRow[]>(() => {
    const sourceTx =
      transactions && transactions.length > 0
        ? transactions
        : filteredTransactions;
    return sourceTx.map((tx) => ({
      id: tx.id,
      time: tx.time.includes("WIB") ? tx.time : `${tx.time} WIB`,
      date: tx.date,
      relativeTime: tx.relativeTime || tx.date || "Hari ini",
      mainMenu: tx.itemsSummary,
      addons: tx.addons || `+ Sambal Uleg Asli (${tx.terminal})`,
      portions: tx.totalItems,
      branch: tx.branch || resolveBranchFromTerminal(tx.terminal),
      cashier: tx.cashier,
      terminal: tx.terminal,
      paymentMethod: tx.paymentMethod,
      paymentBadge:
        tx.paymentMethod === "QRIS" ? "QRIS Dinamis" : "Tunai / Cash",
      orderType: tx.orderType || "Dine-In",
      subtotal: tx.subtotal,
      diskon: tx.diskon,
      total: tx.total,
      status: tx.status,
    }));
  }, [transactions, filteredTransactions]);

  // Filter berdasarkan Cabang yang sedang dipilih
  const branchFilteredOrders = useMemo(() => {
    if (selectedBranch === "Semua Cabang") return allCombinedOrders;
    return allCombinedOrders.filter((row) => row.branch === selectedBranch);
  }, [allCombinedOrders, selectedBranch]);

  // Akumulasi kontribusi aktual dari transaksi aktif di TransactionContext sesuai cabang
  const liveBranchContextTotals = useMemo(() => {
    let omzet = 0;
    let porsi = 0;
    let txCount = 0;
    branchFilteredOrders.forEach((row) => {
      if (row.status === "Berhasil") {
        omzet += row.total;
        porsi += row.portions;
        txCount += 1;
      }
    });
    return { omzet, porsi, txCount };
  }, [branchFilteredOrders]);

  // Hitung jumlah hari inklusif pada rentang tanggal Kustom yang telah diterapkan
  const customDays = useMemo(() => {
    const [sY, sM, sD] = appliedCustomRange.start.split("-").map(Number);
    const [eY, eM, eD] = appliedCustomRange.end.split("-").map(Number);
    if (!sY || !sM || !sD || !eY || !eM || !eD) {
      return daysElapsedInMonth;
    }
    const startUtc = Date.UTC(sY, sM - 1, sD);
    const endUtc = Date.UTC(eY, eM - 1, eD);
    if (endUtc < startUtc) {
      return daysElapsedInMonth;
    }
    return Math.max(
      1,
      Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1
    );
  }, [appliedCustomRange, daysElapsedInMonth]);

  // 1. KALKULASI DINAMIS SELURUH 8 KARTU ANALITIK, GRAFIK, & HEATMAP (selectedBranch + selectedPeriod + customDays)
  const branchProfile =
    BRANCH_PROFILES[selectedBranch] || BRANCH_PROFILES["Semua Cabang"];
  const basePeriod = useMemo<BasePeriodConfig>(() => {
    if (selectedPeriod === "Bulan Ini") {
      return buildDayBasedPeriodConfig(
        daysElapsedInMonth,
        "Bulan Ini",
        "TOTAL OMZET BULAN INI"
      );
    }
    if (selectedPeriod === "Kustom") {
      return buildDayBasedPeriodConfig(
        customDays,
        `${customDays} Hari (Kustom)`,
        "TOTAL OMZET KUSTOM"
      );
    }
    return (
      BASE_PERIOD_MAP[selectedPeriod] ||
      buildDayBasedPeriodConfig(
        daysElapsedInMonth,
        "Bulan Ini",
        "TOTAL OMZET BULAN INI"
      )
    );
  }, [selectedPeriod, daysElapsedInMonth, customDays]);

  const activeMetrics = useMemo(() => {
    const scaledOmzet =
      Math.round((basePeriod.baseOmzet * branchProfile.scale) / 10000) *
        10000 +
      liveBranchContextTotals.omzet;
    const scaledTarget =
      Math.round((basePeriod.baseTarget * branchProfile.scale) / 100000) *
      100000;
    const achievedPct = Math.round((scaledOmzet / scaledTarget) * 100);
    const omzetGrowth = (
      basePeriod.baseOmzetGrowth + branchProfile.growthBonus
    )
      .toFixed(1)
      .replace(".", ",");

    const scaledPorsi =
      Math.max(10, Math.round(basePeriod.basePorsi * branchProfile.scale)) +
      liveBranchContextTotals.porsi;
    const porsiGrowth = (
      basePeriod.basePorsiGrowth +
      branchProfile.growthBonus * 0.7
    )
      .toFixed(1)
      .replace(".", ",");
    const scaledDailyPorsi = Math.max(
      5,
      Math.round(basePeriod.baseDailyPorsi * branchProfile.scale)
    );

    const scaledAov =
      Math.round((basePeriod.baseAov * branchProfile.aovMultiplier) / 100) *
      100;
    const aovGrowth = (
      basePeriod.baseAovGrowth +
      branchProfile.growthBonus * 0.3
    )
      .toFixed(1)
      .replace(".", ",");
    const scaledTx =
      Math.max(5, Math.round(basePeriod.baseTotalTx * branchProfile.scale)) +
      liveBranchContextTotals.txCount;

    const rawCabai = basePeriod.baseCabaiKg * branchProfile.scale;
    const cabaiFormatted =
      rawCabai < 20
        ? rawCabai.toFixed(1).replace(".", ",")
        : Math.round(rawCabai).toLocaleString("id-ID");

    // Donut Chart Circumference (r = 44 => 2 * PI * 44 = 276.46)
    const circumference = 276.46;
    let cumulativeArc = 0;
    let allocatedQty = 0;

    const categories = CATEGORY_META.map((meta, idx) => {
      const share = branchProfile.categoryShares[idx];
      const arcLen = Number(((share / 100) * circumference).toFixed(2));
      const dashOffset =
        idx === 0 ? "0" : `-${cumulativeArc.toFixed(2)}`;
      cumulativeArc += arcLen;

      const qty =
        idx === CATEGORY_META.length - 1
          ? Math.max(1, scaledPorsi - allocatedQty)
          : Math.round((scaledPorsi * share) / 100);
      allocatedQty += qty;

      return {
        ...meta,
        pct: `${share}%`,
        qty,
        dashArray: `${arcLen} ${circumference}`,
        dashOffset,
      };
    });

    return {
      periodBadge: basePeriod.periodBadge,
      omzetTitle: basePeriod.omzetTitle,
      omzetValue: formatRupiah(scaledOmzet),
      omzetGrowth: `+${omzetGrowth}%`,
      omzetTarget: formatTargetRupiah(scaledTarget),
      omzetAchieved: `${achievedPct}% Tercapai`,
      porsiValue: scaledPorsi.toLocaleString("id-ID"),
      porsiNumber: scaledPorsi,
      porsiGrowth: `+${porsiGrowth}%`,
      porsiAvg: basePeriod.isDailyPeriod
        ? `Target harian: ${scaledDailyPorsi} Porsi`
        : `Rata-rata/hari: ${scaledDailyPorsi} Porsi`,
      aovValue: formatRupiah(scaledAov),
      aovGrowth: `+${aovGrowth}%`,
      totalTx: scaledTx.toLocaleString("id-ID"),
      cabaiKg: `${cabaiFormatted} Kg Rawit Merah`,
      categories,
    };
  }, [basePeriod, branchProfile, liveBranchContextTotals]);

  // 1B. KALKULASI DINAMIS KOMPARASI HARI KERJA VS WEEKEND (selectedBranch + selectedPeriod + basePeriod)
  const comparisonData = useMemo(() => {
    const profile =
      BRANCH_PROFILES[selectedBranch] || BRANCH_PROFILES["Semua Cabang"];

    // Kombinasikan rasio pertumbuhan akhir pekan cabang (basis +42%) dengan faktor periode
    const targetGrowthRatio =
      (profile.baseWeekendPct / 42) * (basePeriod.weekendPeriodPct / 100);

    const weekdayDailyOmzet =
      Math.round(
        (profile.weekdayOmzetBase * basePeriod.comparisonMultiplier) / 10000
      ) * 10000;
    const weekendDailyOmzet =
      Math.round((weekdayDailyOmzet * (1 + targetGrowthRatio)) / 10000) * 10000;

    // Hitung persentase pertumbuhan akhir pekan langsung dari selisih nominal rata-rata harian
    const weekendGrowthPct = Math.round(
      ((weekendDailyOmzet - weekdayDailyOmzet) / weekdayDailyOmzet) * 100
    );

    const weekdayDailyPorsi = Math.max(
      10,
      Math.round(profile.weekdayPorsiBase * basePeriod.comparisonMultiplier)
    );
    const weekendDailyPorsi = Math.max(
      12,
      Math.round(weekdayDailyPorsi * (1 + weekendGrowthPct / 100))
    );

    return {
      weekdayDailyOmzet,
      weekendDailyOmzet,
      weekdayOmzet: formatRupiah(weekdayDailyOmzet),
      weekendOmzet: formatRupiah(weekendDailyOmzet),
      weekendGrowthPct,
      weekdayPorsi: weekdayDailyPorsi,
      weekendPorsi: weekendDailyPorsi,
      weekdayDominant: profile.weekdayDominant,
      weekendDominant: profile.weekendDominant,
      weekdaySplit: profile.weekdaySplit,
      weekendSplit: profile.weekendSplit,
      stockInsightBoost: profile.stockInsightBoost,
    };
  }, [selectedBranch, selectedPeriod, basePeriod]);

  // 2. KALKULASI DINAMIS GRAFIK TREN PENJUALAN & FLUKTUASI PORSI (SVG CHART)
  const dynamicHourlyChart = useMemo(() => {
    const rawValues = BASE_HOURLY_POINTS.map((pt, idx) => {
      const weight = branchProfile.hourlyCurveWeights[idx] ?? 1.0;
      const omzetJt =
        pt.baseOmzetJt *
        branchProfile.scale *
        weight *
        basePeriod.chartPeriodScale;
      const porsi = Math.max(
        2,
        Math.round(
          pt.basePorsi *
            branchProfile.scale *
            weight *
            basePeriod.chartPeriodScale
        )
      );
      return {
        ...pt,
        omzetJt,
        porsi,
        shapeScore: pt.baseOmzetJt * weight,
      };
    });

    const maxShape = Math.max(...rawValues.map((r) => r.shapeScore), 1);
    const maxOmzetVal = Math.max(...rawValues.map((r) => r.omzetJt), 0.2);

    const points = rawValues.map((r) => {
      // Koordinat Y antara 46 (puncak) dan 190 (dasar)
      const normalized = r.shapeScore / maxShape;
      const omzetY = Math.round(192 - normalized * 146);
      const porsiY = Math.min(193, omzetY + 13);
      return {
        x: r.x,
        t: r.t,
        omzetY,
        porsiY,
        omzetLabel: formatShortRupiah(r.omzetJt),
        porsi: r.porsi,
        highlight: r.highlight,
      };
    });

    const omzetPolyline = points.map((p) => `${p.x},${p.omzetY}`).join(" ");
    const porsiPolyline = points.map((p) => `${p.x},${p.porsiY}`).join(" ");
    const omzetAreaPath =
      `M ${points.map((p) => `${p.x} ${p.omzetY}`).join(" L ")} L 708 195 L 60 195 Z`;

    // Label Y-Axis dinamis sesuai skala cabang & periode
    const yAxisTop = Math.max(0.4, Math.ceil(maxOmzetVal * 1.15 * 10) / 10);
    const yAxisLabels = [1, 0.75, 0.5, 0.25, 0].map((ratio, i) => {
      const yPos = 35 + i * 40;
      if (ratio === 0) return { y: yPos, label: "0" };
      const val = yAxisTop * ratio;
      const label =
        val >= 10
          ? `${Math.round(val)} Jt`
          : val >= 1
            ? `${val.toFixed(1).replace(".", ",")} Jt`
            : `${Math.round(val * 1000)} Rb`;
      return { y: yPos, label };
    });

    return {
      points,
      omzetPolyline,
      porsiPolyline,
      omzetAreaPath,
      yAxisLabels,
    };
  }, [branchProfile, basePeriod]);

  // 3. KALKULASI DINAMIS HEATMAP KEPADATAN ORDER PER CABANG & PERIODE
  const dynamicHeatmap = useMemo(() => {
    const periodFactor =
      selectedPeriod === "Hari Ini"
        ? 0.92
        : selectedPeriod === "7 Hari"
          ? 0.98
          : selectedPeriod === "Kuartal"
            ? 1.05
            : 1.0;

    const rawRows = BASE_HEATMAP_DATA.map((row) => {
      const isWeekend =
        row.day === "Jumat" || row.day === "Sabtu" || row.day === "Minggu";
      const dayFactor = isWeekend ? branchProfile.heatmapWeekendBoost : 1.0;

      const slots = row.slots.map((slot, sIdx) => {
        const slotWeight = branchProfile.heatmapSlotWeights[sIdx] ?? 1.0;
        const scaledVal = Math.max(
          3,
          Math.round(
            slot.val *
              branchProfile.scale *
              slotWeight *
              dayFactor *
              periodFactor
          )
        );
        const scaledOcc = Math.min(
          98,
          Math.max(
            15,
            Math.round(slot.occ * Math.pow(slotWeight * dayFactor, 0.35))
          )
        );
        return { val: scaledVal, occ: scaledOcc };
      });

      return { day: row.day, slots };
    });

    const maxVal = Math.max(
      ...rawRows.flatMap((r) => r.slots.map((s) => s.val)),
      1
    );

    return rawRows.map((row) => ({
      day: row.day,
      slots: row.slots.map((s) => {
        const ratio = s.val / maxVal;
        const level =
          ratio >= 0.9
            ? "peak"
            : ratio >= 0.75
              ? "very_high"
              : ratio >= 0.58
                ? "high"
                : ratio >= 0.34
                  ? "medium"
                  : ratio >= 0.18
                    ? "mild"
                    : "low";
        return { ...s, level };
      }),
    }));
  }, [branchProfile, selectedPeriod]);

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
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    if (startDate > endDate) {
      showToast("Tanggal mulai tidak boleh melewati tanggal selesai!");
      return;
    }
    setAppliedCustomRange({ start: customStartDate, end: customEndDate });
    const [sY, sM, sD] = customStartDate.split("-").map(Number);
    const [eY, eM, eD] = customEndDate.split("-").map(Number);
    const daysCount = Math.max(
      1,
      Math.round(
        (Date.UTC(eY, eM - 1, eD) - Date.UTC(sY, sM - 1, sD)) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
    showToast(
      `Filter periode kustom (${customStartDate} s/d ${customEndDate} • ${daysCount} Hari) berhasil diterapkan!`
    );
  };

  // Hitung jumlah metode bayar secara akurat dari data cabang yang sedang aktif
  const paymentCounts = useMemo(() => {
    const total = branchFilteredOrders.length;
    const tunai = branchFilteredOrders.filter(
      (r) => r.paymentMethod === "Tunai"
    ).length;
    const qris = branchFilteredOrders.filter(
      (r) => r.paymentMethod === "QRIS"
    ).length;
    const grab = branchFilteredOrders.filter(
      (r) => r.orderType === "Ojol Delivery"
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
        (filterPayment === "Tunai" && row.paymentMethod === "Tunai") ||
        (filterPayment === "QRIS" && row.paymentMethod === "QRIS") ||
        (filterPayment === "GrabFood POS" && row.orderType === "Ojol Delivery");

      return matchQuery && matchPay;
    });
  }, [branchFilteredOrders, searchQuery, filterPayment]);

  // Pagination: Slice 5 baris per halaman & batasi maksimal 5 tombol halaman
  const totalPages = Math.max(
    1,
    Math.ceil(displayOrders.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(activePage, totalPages);
  const visiblePages = useMemo(() => {
    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const endPage = Math.min(totalPages, startPage + 4);
    const pages: number[] = [];
    for (let p = startPage; p <= endPage; p += 1) {
      pages.push(p);
    }
    return pages;
  }, [currentPage, totalPages]);
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
      order.status,
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
    dynamicHourlyChart.points[hoveredHourIdx] || dynamicHourlyChart.points[9];
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
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(selectedOrderModal.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diskon:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedOrderModal.diskon === 0
                        ? "Rp 0"
                        : `- ${formatRupiah(selectedOrderModal.diskon)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-1">
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
                      ✓ {selectedOrderModal.status}
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
              <div className="relative" ref={branchDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowBranchMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-100 transition cursor-pointer"
                >
                  <Store size={14} className="text-[#EA8E18] shrink-0" />
                  <span className="whitespace-nowrap">{selectedBranch}</span>
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
                          showToast(`Menampilkan analitik & transaksi: ${branch}`);
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
                  max={customEndDate || todayStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-semibold text-gray-800 focus:outline-none focus:border-[#EA8E18]"
                />
                <span className="text-gray-500 font-bold">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={todayStr}
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

          {/* Info Cabang & Periode Khusus Saat Print PDF */}
          <div className="hidden print:flex flex-col items-end text-right text-xs text-gray-700">
            <div className="font-extrabold text-gray-900">
              {selectedBranch} • Periode: {activeMetrics.periodBadge}
            </div>
            <div>Dicetak dari Sistem POS PrekDuaDara ({lastSyncTime})</div>
          </div>
        </header>

        {/* 4 KPI SUMMARY CARDS (DINAMIS MENGIKUTI CABANG & PERIODE) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL OMZET */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
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
                {branchProfile.topMenuLabel}
              </span>
            </div>
          </div>

          {/* Card 3: RATA-RATA ORDER (AOV) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
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
                {branchProfile.addonRate}
              </span>
            </div>
          </div>

          {/* Card 4: JAM PENJUALAN PUNCAK */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                JAM PENJUALAN PUNCAK
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-300 text-xs font-extrabold whitespace-nowrap shrink-0">
                Jam Sibuk
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-[#D97706] shrink-0" />
                <span className="text-base sm:text-lg font-black text-gray-900">
                  {branchProfile.rushLunchTime}
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  {branchProfile.rushLunchTag}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-5 mt-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-gray-800">
                  {branchProfile.rushDinnerTime}
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  {branchProfile.rushDinnerTag}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">
                Kontribusi Omzet
              </span>
              <span className="font-extrabold text-emerald-700">
                {branchProfile.rushContribution}
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 1: TREN PENJUALAN (LEFT 8 COLS) & KATEGORI MENU TERLARIS (RIGHT 4 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Tren Penjualan & Fluktuasi Porsi */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
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
                  Arahkan kursor atau klik pada titik jam (09:00 - 22:00 WIB) •{" "}
                  <strong className="text-gray-800">{selectedBranch}</strong> (
                  {activeMetrics.periodBadge})
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-extrabold text-gray-700 shrink-0">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                  Omzet (Rp)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#DC2626]"></span>
                  Porsi Ayam
                </span>
              </div>
            </div>

            {/* SVG Line / Area Chart (Interactive & Dynamic per Cabang/Periode) */}
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

                  {/* Horizontal Grid Lines & Dynamic Y-Axis Labels */}
                  {dynamicHourlyChart.yAxisLabels.map((row) => (
                    <g key={row.y}>
                      <text
                        x="40"
                        y={row.y + 4}
                        textAnchor="end"
                        className="fill-gray-600 text-[10.5px] font-bold"
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

                  {/* Dynamic Area under Omzet curve */}
                  <path
                    d={dynamicHourlyChart.omzetAreaPath}
                    fill="url(#omzetAreaGrad)"
                  />

                  {/* Dynamic Orange Line: Omzet */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={dynamicHourlyChart.omzetPolyline}
                  />

                  {/* Dynamic Red Line: Porsi Ayam */}
                  <polyline
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={dynamicHourlyChart.porsiPolyline}
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
                  {dynamicHourlyChart.points.map((pt, idx) => {
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
                      width="142"
                      height="24"
                      rx="5"
                      fill="#1F2937"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <text
                      x="71"
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
                  {branchProfile.prepTime}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Card: Kategori Menu Terlaris */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#DC2626] shrink-0"></span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Kategori Menu Terlaris
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold whitespace-nowrap shrink-0">
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
                  {branchProfile.spicyLevel}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 2: KOMPARASI WEEKDAY VS WEEKEND (LEFT 5 COLS) & HEATMAP ORDER (RIGHT 7 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Komparasi Penjualan Hari Kerja vs Weekend */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between gap-5 print:break-inside-avoid">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Komparasi Penjualan Hari Kerja vs Weekend
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Rata-rata penjualan harian • {selectedBranch} (
                  {activeMetrics.periodBadge})
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold whitespace-nowrap shrink-0">
                {`Weekend +${comparisonData.weekendGrowthPct}%`}
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
                    {comparisonData.weekdayOmzet}{" "}
                    <span className="text-xs font-semibold text-gray-500">
                      / hari
                    </span>
                  </span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
                  <div
                    className="bg-[#1E562F] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekdaySplit[0]}%` }}
                  />
                  <div
                    className="bg-[#F59E0B] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekdaySplit[1]}%` }}
                  />
                  <div
                    className="bg-[#EA580C] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekdaySplit[2]}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-gray-900 font-extrabold">
                      {comparisonData.weekdayPorsi} Porsi
                    </strong>
                  </span>
                  <span>{comparisonData.weekdayDominant}</span>
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
                    {comparisonData.weekendOmzet}{" "}
                    <span className="text-xs font-semibold text-gray-500">
                      / hari
                    </span>
                  </span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
                  <div
                    className="bg-[#1E562F] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekendSplit[0]}%` }}
                  />
                  <div
                    className="bg-[#F59E0B] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekendSplit[1]}%` }}
                  />
                  <div
                    className="bg-[#EA580C] h-full transition-all duration-300"
                    style={{ width: `${comparisonData.weekendSplit[2]}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-gray-900 font-extrabold">
                      {comparisonData.weekendPorsi} Porsi
                    </strong>
                  </span>
                  <span>{comparisonData.weekendDominant}</span>
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
                <span>Insight Pengadaan Stok ({selectedBranch}):</span>
              </div>
              <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed">
                Persediaan fillet ayam potong dan stok cabai rawit disarankan
                ditambah{" "}
                <strong className="text-gray-900 font-extrabold">
                  {comparisonData.stockInsightBoost}
                </strong>{" "}
                untuk mengantisipasi lonjakan permintaan.
              </p>
            </div>
          </div>

          {/* Right Card: Heatmap Kepadatan Order */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between print:break-inside-avoid">
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
                    `Frekuensi struk & okupansi meja (${selectedBranch} • ${activeMetrics.periodBadge})`
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
                  {dynamicHeatmap.map((row) => {
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
                  {branchProfile.heatmapMaxCap}
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
                Sinkronisasi otomatis ({branchFilteredOrders.length} log kasir
                aktif)
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

              <div className="relative" ref={filterDropdownRef}>
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
          </div>

          {/* Table (Lebar kolom proporsional tanpa table-fixed sempit agar tidak bertabrakan/terpotong) */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] print:min-w-0 print:w-full print:text-[10px] text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-600 font-extrabold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                    Order ID
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                    Waktu Transaksi
                  </th>
                  <th className="py-3.5 px-4 min-w-[250px] print:min-w-0 print:px-2 print:py-2 print:whitespace-normal">
                    Menu Utama Dipesan
                  </th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                    Porsi
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                    Cabang Outlet
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                    Tipe &amp; Metode Bayar
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
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
                    <td className="py-4 px-4 font-extrabold text-[#D97706] whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                      <div>{order.id}</div>
                      {order.status === "Batal" && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                          Batal
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                      <div className="font-bold text-gray-900">
                        {order.time}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {order.relativeTime}
                      </div>
                    </td>
                    <td className="py-4 px-4 print:px-2 print:py-2 print:whitespace-normal">
                      <div className="font-extrabold text-gray-900">
                        {order.mainMenu}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">
                        {order.addons}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center font-black text-gray-900 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                      {order.portions}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
                      <div className="font-semibold text-gray-800">
                        {order.branch}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">
                        Kasir: {order.cashier}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
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
                    <td className="py-4 px-4 text-right font-black text-gray-900 whitespace-nowrap print:px-2 print:py-2 print:whitespace-normal">
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
              {visiblePages.map((page) => (
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
              ))}
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
