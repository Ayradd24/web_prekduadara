"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { useTransactions, Transaction } from "@/context/TransactionContext";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  Info,
  Printer,
  RefreshCw,
  RotateCcw,
  User,
  X,
} from "lucide-react";

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
  categoryShares: [number, number]; // [Ayam Geprek Bakar, Ayam Geprek Biasa]
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
    topMenuLabel: "Top: Ayam Geprek Bakar",
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
    categoryShares: [58, 42],
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
    topMenuLabel: "Top: Ayam Geprek Bakar",
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
    categoryShares: [62, 38],
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
    topMenuLabel: "Top: Ayam Geprek Bakar",
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
    categoryShares: [54, 46],
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
    topMenuLabel: "Top: Ayam Geprek Bakar",
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
    categoryShares: [56, 44],
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
    name: "Ayam Geprek Bakar + Es Teh",
  },
  {
    color: "bg-[#EA8E18]",
    stroke: "#EA8E18",
    name: "Ayam Geprek Biasa + Es Teh",
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
    isLoading,
    searchQuery,
    setSearchQuery,
    filterPayment,
    setFilterPayment,
    filterTerminal,
    setFilterTerminal,
    filterStatus,
    setFilterStatus,
    resetFilters,
  } = useTransactions();

  const { todayStr, firstDayOfMonthStr, daysElapsedInMonth } = useMemo(
    () => getSystemDateInfo(),
    []
  );

  // State Kontrol Header (Cabang, Periode, Rentang Kustom, Sync POS)
  const selectedBranch = "Semua Cabang";
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Hari Ini");
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("prekduadara_transaksi_period");
        if (
          saved &&
          ["Hari Ini", "7 Hari", "Bulan Ini", "Kuartal", "Kustom"].includes(saved)
        ) {
          setSelectedPeriod(saved);
        }
      } catch {
        // ignore
      }
      setIsClientReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectPeriod = (period: string) => {
    setSelectedPeriod(period);
    setCurrentPage(1);
    try {
      localStorage.setItem("prekduadara_transaksi_period", period);
    } catch {
      // ignore
    }
  };

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedTransactions = useMemo(() => {
    const now = new Date();
    return filteredTransactions.filter((tx) => {
      // Filter cabang jika bukan 'Semua Cabang'
      if (
        selectedBranch !== "Semua Cabang" &&
        tx.branch &&
        tx.branch !== "Gerai Pusat" &&
        tx.branch !== selectedBranch
      ) {
        return false;
      }

      if (selectedPeriod === "Hari Ini") {
        return tx.isToday;
      }

      if (!tx.rawCreatedAt) return true;
      const txDate = new Date(tx.rawCreatedAt);
      if (isNaN(txDate.getTime())) return true;

      if (selectedPeriod === "7 Hari") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= sevenDaysAgo && txDate <= now;
      }
      if (selectedPeriod === "Bulan Ini") {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }
      if (selectedPeriod === "Kuartal") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const txQuarter = Math.floor(txDate.getMonth() / 3);
        return (
          txDate.getFullYear() === now.getFullYear() &&
          currentQuarter === txQuarter
        );
      }
      if (selectedPeriod === "Kustom") {
        const [sY, sM, sD] = appliedCustomRange.start.split("-").map(Number);
        const [eY, eM, eD] = appliedCustomRange.end.split("-").map(Number);
        if (sY && sM && sD && eY && eM && eD) {
          const start = new Date(sY, sM - 1, sD, 0, 0, 0);
          const end = new Date(eY, eM - 1, eD, 23, 59, 59);
          return txDate >= start && txDate <= end;
        }
      }
      return true;
    });
  }, [filteredTransactions, selectedPeriod, selectedBranch, appliedCustomRange]);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(
    1,
    Math.ceil(displayedTransactions.length / ITEMS_PER_PAGE)
  );
  const activePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return displayedTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedTransactions, activePage]);

  const displayedTotalNominal = useMemo(() => {
    return displayedTransactions.reduce(
      (acc, tx) => (tx.status === "Berhasil" ? acc + tx.total : acc),
      0
    );
  }, [displayedTransactions]);

  const cashierOptions = useMemo(() => {
    const unique = new Set<string>();
    transactions.forEach((tx) => {
      const name = tx.cashier?.trim();
      if (name) unique.add(name);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id-ID"));
  }, [transactions]);

  const handleResetAllFilters = () => {
    resetFilters();
    setCurrentPage(1);
  };

  const handlePrintReceipt = (id: string) => {
    showToast(`Mengirim struk ${id} ke printer thermal...`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setLastSyncTime(`${hours}:${minutes} WIB`);
    }, 0);
    return () => clearTimeout(timer);
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const formatRupiah = (val: number) => "Rp " + val.toLocaleString("id-ID");

  // Filter transaksi sesuai periode dan cabang aktif langsung dari MariaDB
  const periodTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.status !== "Berhasil") return false;

      // Filter cabang jika bukan 'Semua Cabang'
      if (
        selectedBranch !== "Semua Cabang" &&
        tx.branch &&
        tx.branch !== "Gerai Pusat" &&
        tx.branch !== selectedBranch
      ) {
        return false;
      }

      if (selectedPeriod === "Hari Ini") {
        return tx.isToday;
      }

      if (!tx.rawCreatedAt) return true;
      const txDate = new Date(tx.rawCreatedAt);
      if (isNaN(txDate.getTime())) return true;

      if (selectedPeriod === "7 Hari") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= sevenDaysAgo && txDate <= now;
      }
      if (selectedPeriod === "Bulan Ini") {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }
      if (selectedPeriod === "Kuartal") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const txQuarter = Math.floor(txDate.getMonth() / 3);
        return (
          txDate.getFullYear() === now.getFullYear() &&
          currentQuarter === txQuarter
        );
      }
      if (selectedPeriod === "Kustom") {
        const [sY, sM, sD] = appliedCustomRange.start.split("-").map(Number);
        const [eY, eM, eD] = appliedCustomRange.end.split("-").map(Number);
        if (sY && sM && sD && eY && eM && eD) {
          const start = new Date(sY, sM - 1, sD, 0, 0, 0);
          const end = new Date(eY, eM - 1, eD, 23, 59, 59);
          return txDate >= start && txDate <= end;
        }
      }
      return true;
    });
  }, [transactions, selectedPeriod, selectedBranch, appliedCustomRange]);

  // Akumulasi data aktual murni dari database MariaDB
  const liveBranchContextTotals = useMemo(() => {
    let omzet = 0;
    let porsi = 0;
    let txCount = 0;
    let qtyBakar = 0;
    let qtyBiasa = 0;

    periodTransactions.forEach((tx) => {
      omzet += tx.total;
      porsi += tx.totalItems || 1;
      txCount += 1;

      const summary = (tx.itemsSummary || "").toLowerCase();
      if (summary.includes("bakar")) {
        qtyBakar += tx.totalItems || 1;
      } else if (summary.includes("biasa")) {
        qtyBiasa += tx.totalItems || 1;
      } else {
        qtyBakar += Math.ceil((tx.totalItems || 1) / 2);
        qtyBiasa += Math.floor((tx.totalItems || 1) / 2);
      }
    });

    const aov = txCount > 0 ? Math.round(omzet / txCount) : 0;
    return { omzet, porsi, txCount, aov, qtyBakar, qtyBiasa };
  }, [periodTransactions]);

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
    if (!isClientReady || isLoading) {
      return {
        periodBadge: basePeriod.periodBadge,
        omzetTitle: basePeriod.omzetTitle,
        omzetValue: "Rp 0",
        omzetGrowth: "+0,0%",
        omzetTarget: "Target: Rp 0",
        omzetAchieved: "0% Tercapai",
        porsiValue: "0",
        porsiNumber: 0,
        porsiGrowth: "+0,0%",
        porsiAvg: "Target: 0 porsi/hr",
        aovValue: "Rp 0",
        aovGrowth: "+0,0%",
        totalTx: "0",
        cabaiKg: "0 Kg Rawit Merah",
        topMenuLabel: branchProfile.topMenuLabel,
        rushHourLabel: branchProfile.rushLunchTime,
        rushHourTag: branchProfile.rushLunchTag,
        categories: CATEGORY_META.map((meta) => ({
          ...meta,
          pct: "0%",
          qty: 0,
          dashArray: "0 276.46",
          dashOffset: "0",
        })),
      };
    }

    // Ambil data aktual murni dari database MariaDB (tanpa mock base)
    const scaledOmzet = liveBranchContextTotals.omzet;
    const scaledPorsi = liveBranchContextTotals.porsi;
    const scaledTx = liveBranchContextTotals.txCount;
    const scaledAov = liveBranchContextTotals.aov;

    const scaledTarget =
      Math.round((basePeriod.baseTarget * branchProfile.scale) / 100000) *
      100000;
    const achievedPct = scaledTarget > 0 ? Math.round((scaledOmzet / scaledTarget) * 100) : 0;
    const omzetGrowth =
      scaledOmzet > 0
        ? `+${(basePeriod.baseOmzetGrowth + branchProfile.growthBonus).toFixed(1).replace(".", ",")}%`
        : "+0,0%";

    const porsiGrowth =
      scaledPorsi > 0
        ? `+${(basePeriod.basePorsiGrowth + branchProfile.growthBonus * 0.7).toFixed(1).replace(".", ",")}%`
        : "+0,0%";
    const scaledDailyPorsi = Math.max(
      5,
      Math.round(basePeriod.baseDailyPorsi * branchProfile.scale)
    );

    const aovGrowth =
      scaledAov > 0
        ? `+${(basePeriod.baseAovGrowth + branchProfile.growthBonus * 0.3).toFixed(1).replace(".", ",")}%`
        : "+0,0%";

    const rawCabai = Number((scaledPorsi * 0.03).toFixed(1));
    const cabaiFormatted =
      rawCabai < 20
        ? rawCabai.toFixed(1).replace(".", ",")
        : Math.round(rawCabai).toLocaleString("id-ID");

    const totalCategories = liveBranchContextTotals.qtyBakar + liveBranchContextTotals.qtyBiasa;
    const shareBakar = totalCategories > 0 ? Math.round((liveBranchContextTotals.qtyBakar / totalCategories) * 100) : 58;
    const shareBiasa = totalCategories > 0 ? 100 - shareBakar : 42;

    // Donut Chart Circumference (r = 44 => 2 * PI * 44 = 276.46)
    const circumference = 276.46;
    let cumulativeArc = 0;

    const categories = CATEGORY_META.map((meta, idx) => {
      const isBakar = idx === 0;
      const share = isBakar ? shareBakar : shareBiasa;
      const qty = isBakar ? liveBranchContextTotals.qtyBakar : liveBranchContextTotals.qtyBiasa;
      const arcLen = Number(((share / 100) * circumference).toFixed(2));
      const dashOffset = idx === 0 ? "0" : `-${cumulativeArc.toFixed(2)}`;
      cumulativeArc += arcLen;

      return {
        ...meta,
        pct: `${share}%`,
        qty,
        dashArray: `${arcLen} ${circumference}`,
        dashOffset,
      };
    });

    const topMenuLabel =
      totalCategories > 0
        ? (liveBranchContextTotals.qtyBakar >= liveBranchContextTotals.qtyBiasa
            ? "Top: Ayam Geprek Bakar"
            : "Top: Ayam Geprek Biasa")
        : branchProfile.topMenuLabel;

    // Deteksi jam sibuk dari transaksi aktual
    let rushHourLabel = branchProfile.rushLunchTime;
    let rushHourTag = branchProfile.rushLunchTag;
    if (periodTransactions.length > 0) {
      const hourCounts: Record<string, number> = {};
      periodTransactions.forEach((tx) => {
        let h = "12:00";
        if (tx.time && tx.time.includes(":")) {
          h = `${tx.time.split(":")[0].padStart(2, "0")}:00`;
        }
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      let maxH = "";
      let maxC = 0;
      Object.entries(hourCounts).forEach(([h, c]) => {
        if (c > maxC) {
          maxC = c;
          maxH = h;
        }
      });
      if (maxH) {
        const startH = maxH;
        const endHNum = (parseInt(maxH.split(":")[0], 10) + 1) % 24;
        const endH = `${String(endHNum).padStart(2, "0")}:00`;
        rushHourLabel = `${startH} - ${endH}`;
        const hInt = parseInt(maxH.split(":")[0], 10);
        if (hInt >= 11 && hInt <= 14) rushHourTag = "Siang (Peak)";
        else if (hInt >= 17 && hInt <= 21) rushHourTag = "Malam (Peak)";
        else if (hInt >= 0 && hInt < 5) rushHourTag = "Dini Hari";
        else rushHourTag = "Sore";
      }
    }

    return {
      periodBadge: basePeriod.periodBadge,
      omzetTitle: basePeriod.omzetTitle,
      omzetValue: formatRupiah(scaledOmzet),
      omzetGrowth,
      omzetTarget: formatTargetRupiah(scaledTarget),
      omzetAchieved: `${achievedPct}% Tercapai`,
      porsiValue: scaledPorsi.toLocaleString("id-ID"),
      porsiNumber: scaledPorsi,
      porsiGrowth,
      porsiAvg: basePeriod.isDailyPeriod
        ? `Target: ${scaledDailyPorsi} porsi/hr`
        : `Rata-rata: ${scaledDailyPorsi} porsi/hr`,
      aovValue: formatRupiah(scaledAov),
      aovGrowth,
      totalTx: scaledTx.toLocaleString("id-ID"),
      cabaiKg: `${cabaiFormatted} Kg Rawit Merah`,
      categories,
      topMenuLabel,
      rushHourLabel,
      rushHourTag,
    };
  }, [basePeriod, branchProfile, liveBranchContextTotals, periodTransactions, isClientReady, isLoading]);

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
  }, [selectedBranch, basePeriod]);

  // 2. KALKULASI DINAMIS GRAFIK TREN PENJUALAN & FLUKTUASI PORSI (SVG CHART)
  const dynamicHourlyChart = useMemo(() => {
    // Kelompokkan data transaksi aktual per jam
    const hourMap: Record<string, { omzet: number; porsi: number }> = {};
    BASE_HOURLY_POINTS.forEach((pt) => {
      hourMap[pt.t] = { omzet: 0, porsi: 0 };
    });

    periodTransactions.forEach((tx) => {
      let hStr = "";
      if (tx.time && tx.time.includes(":")) {
        const parts = tx.time.split(":");
        hStr = `${parts[0].padStart(2, "0")}:00`;
      } else if (tx.rawCreatedAt) {
        const d = new Date(tx.rawCreatedAt);
        if (!isNaN(d.getTime())) {
          hStr = `${String(d.getHours()).padStart(2, "0")}:00`;
        }
      }

      if (hStr && hourMap[hStr]) {
        hourMap[hStr].omzet += tx.total;
        hourMap[hStr].porsi += tx.totalItems || 1;
      } else if (hStr) {
        const hNum = parseInt(hStr.split(":")[0], 10);
        let bestKey = "12:00";
        let minDiff = 999;
        BASE_HOURLY_POINTS.forEach((pt) => {
          const ptH = parseInt(pt.t.split(":")[0], 10);
          const diff = Math.abs(ptH - hNum);
          if (diff < minDiff) {
            minDiff = diff;
            bestKey = pt.t;
          }
        });
        hourMap[bestKey].omzet += tx.total;
        hourMap[bestKey].porsi += tx.totalItems || 1;
      }
    });

    const hasRealData = liveBranchContextTotals.omzet > 0;

    const rawValues = BASE_HOURLY_POINTS.map((pt) => {
      if (hasRealData) {
        const realHour = hourMap[pt.t];
        const omzetJt = Number((realHour.omzet / 1000000).toFixed(4));
        const porsi = realHour.porsi;
        return {
          ...pt,
          omzetJt,
          porsi,
          shapeScore: omzetJt,
        };
      }

      return {
        ...pt,
        omzetJt: 0,
        porsi: 0,
        shapeScore: 0,
      };
    });

    const maxShape = Math.max(...rawValues.map((r) => r.shapeScore), 0.05);
    const maxOmzetVal = Math.max(...rawValues.map((r) => r.omzetJt), 0.05);

    const points = rawValues.map((r) => {
      const normalized = hasRealData ? r.shapeScore / maxShape : 0;
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

    // Label Y-Axis dinamis sesuai omzet aktual database
    const yAxisTop = Math.max(0.1, Math.ceil(maxOmzetVal * 1.15 * 10) / 10);
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
  }, [periodTransactions, liveBranchContextTotals]);

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

  // Fungsi Export CSV kompatibel Microsoft Excel (UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      "ID Struk",
      "Waktu",
      "Kasir",
      "Ringkasan Item",
      "Subtotal",
      "Total Akhir",
      "Metode",
      "Status",
    ];

    const rows = displayedTransactions.map((tx) => [
      tx.id,
      `${tx.date}, ${tx.time} WIB`,
      tx.cashier,
      `${tx.itemsSummary} (${tx.totalItems} item)`,
      formatRupiah(tx.subtotal),
      formatRupiah(tx.total),
      tx.paymentMethod,
      tx.status,
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
    link.setAttribute(
      "download",
      `Laporan_Transaksi_PrekDuaDara_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Laporan transaksi berhasil diunduh!");
  };

  const getHeatmapCellStyle = (level: string) => {
    switch (level) {
      case "peak":
        return "bg-[#991B1B] text-white font-bold shadow-2xs";
      case "very_high":
        return "bg-[#DC2626] text-white font-bold shadow-2xs";
      case "high":
        return "bg-[#EF4444] text-white font-semibold";
      case "medium":
        return "bg-[#FBBF24] text-black font-semibold";
      case "mild":
        return "bg-[#A7F3D0] text-[#064E3B] font-semibold";
      default:
        return "bg-gray-100 text-neutral-950 font-medium border border-neutral-200/70";
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
    <div className="min-h-screen bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-black">
      {/* Notifikasi Toast Modern (Pojok Kanan Bawah) */}
      {toastMessage && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 bg-[#2D452B] text-white border border-[#415C3E] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold transition-all">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 size={15} />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL PREVIEW STRUK THERMAL 80MM */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-[#2D452B] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-[#F3A712]" />
                <h3 className="font-display font-bold text-sm tracking-wide">
                  Preview Struk Thermal (80mm)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Konten Kertas Struk Thermal */}
            <div className="p-5 bg-[#FCFBF7] font-mono text-xs">
              <div className="border border-neutral-300 bg-white p-4 rounded-xl shadow-xs">
                {/* Logo & Judul Struk */}
                <div className="text-center pb-3 border-b border-dashed border-neutral-300 mb-3.5">
                  <div className="font-display font-bold text-base text-black tracking-wide">
                    PREKDUADARA
                  </div>
                  <div className="text-[11px] text-neutral-700 mt-0.5 font-sans font-medium">
                    Spesial Ayam Geprek &amp; Geprek Bakar
                  </div>
                  <div className="text-[11px] text-neutral-700 font-sans font-medium">
                    Gerai Utama • Telp: 0812-xxxx-xxxx
                  </div>
                </div>

                {/* Metadata Struk */}
                <div className="space-y-1.5 border-b border-dashed border-neutral-300 pb-3.5 mb-3.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-800">ID Struk:</span>
                    <span className="font-bold text-black">{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-800">Waktu:</span>
                    <span className="font-semibold text-black">
                      {selectedTx.date}, {selectedTx.time} WIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-800">Kasir:</span>
                    <span className="font-bold text-black">
                      {selectedTx.cashier}
                    </span>
                  </div>
                </div>

                {/* Ringkasan Item Pesanan (Per Menu Diturunkan ke Bawah) */}
                <div className="border-b border-dashed border-neutral-300 pb-3.5 mb-3.5">
                  <div className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    RINCIAN PESANAN ({selectedTx.totalItems} ITEM)
                  </div>
                  <div className="space-y-2">
                    {selectedTx.items && selectedTx.items.length > 0
                      ? selectedTx.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-2 text-xs leading-relaxed"
                          >
                            <div className="font-bold text-black">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              {item.sambal && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[#DC2626] text-[10px] font-sans font-semibold">
                                  🌶️ {item.sambal}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-neutral-950 whitespace-nowrap tabular-nums">
                              {formatRupiah(item.subtotal)}
                            </span>
                          </div>
                        ))
                      : selectedTx.itemsSummary
                          .split(/,\s*(?=\d+x|[A-Z])/g)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="font-bold text-black text-xs leading-relaxed"
                            >
                              {item.trim()}
                            </div>
                          ))}
                  </div>
                </div>

                {/* Kalkulasi Harga */}
                <div className="space-y-1.5 border-b border-dashed border-neutral-300 pb-3.5 mb-3.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-800">Subtotal:</span>
                    <span className="font-semibold text-black">
                      {formatRupiah(selectedTx.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-black pt-1">
                    <span>TOTAL AKHIR:</span>
                    <span className="text-[#EA8E18]">
                      {formatRupiah(selectedTx.total)}
                    </span>
                  </div>
                </div>

                {/* Metode & Status */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-800">Metode Bayar:</span>
                    <span className="font-bold text-black">
                      {selectedTx.paymentMethod}
                    </span>
                  </div>
                  {selectedTx.paymentMethod === "Tunai" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Uang Pelanggan:</span>
                        <span className="font-semibold text-gray-800">
                          {formatRupiah(selectedTx.cashReceived ?? selectedTx.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Kembalian:</span>
                        <span className="font-bold text-emerald-600">
                          {formatRupiah(selectedTx.changeAmount ?? 0)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-800">Status Transaksi:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        selectedTx.status === "Berhasil"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {selectedTx.status}
                    </span>
                  </div>
                </div>

                {/* Footer Struk */}
                <div className="text-center text-[10px] text-neutral-700 font-sans mt-4 pt-3 border-t border-dashed border-neutral-200">
                  Matur nuwun sampun mampir! Pedasnya bikin nagih.
                </div>
              </div>
            </div>

            {/* Action Buttons Modal */}
            <div className="px-5 py-3.5 bg-white border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 border border-neutral-400 hover:bg-gray-50 text-black rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintReceipt(selectedTx.id);
                  setSelectedTx(null);
                }}
                className="px-4 py-2 bg-[#2D452B] hover:bg-[#223520] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Cetak Struk
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
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden print:overflow-visible max-w-full">
        {/* KARTU 1: TOP HEADER BAR (SERAGAM DENGAN SELURUH HALAMAN DASHBOARD) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo PrekDuaDara"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 shadow-xs shrink-0"
            />
            <div>
              <div className="font-display font-bold text-lg text-[#EA8E18] tracking-tight leading-tight">
                PrekDuaDara
              </div>
              <div className="text-xs text-neutral-800 font-medium leading-tight mt-0.5">
                Analitik Transaksi &amp; Penjualan Restoran
              </div>
            </div>
          </div>

          {/* Right Controls: Online Sync & Admin Owner Profile */}
          <div className="print:hidden flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            {/* Online Sync Pill */}
            <div className="h-9 flex items-center gap-2 px-3.5 bg-[#E8F8F0] border border-[#A7F3D0] text-[#047857] text-xs font-semibold rounded-full shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
              <span>ONLINE SYNC</span>
            </div>

            {/* User Profile: Admin / Owner */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200 shrink-0">
              <div className="text-right">
                <div className="text-xs font-semibold text-black leading-tight whitespace-nowrap">
                  Admin
                </div>
                <div className="text-[11px] text-[#EA8E18] font-medium leading-tight mt-0.5 whitespace-nowrap">
                  Owner
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-semibold text-xs flex items-center justify-center shadow-xs shrink-0">
                <User size={16} />
              </div>
            </div>
          </div>

          {/* Info Periode Khusus Saat Print PDF */}
          <div className="hidden print:flex flex-col items-end text-right text-xs text-neutral-950">
            <div className="font-display font-bold text-black">
              PrekDuaDara • Periode: {activeMetrics.periodBadge}
            </div>
            <div>
              Dicetak dari Sistem POS PrekDuaDara (
              <span className="font-mono">{lastSyncTime}</span>)
            </div>
          </div>
        </header>

        {/* KARTU 2: BARIS FILTER PERIODE & EKSPOR (TERPISAH DARI HEADER) */}
        <section className="print:hidden bg-white rounded-2xl px-6 py-4 shadow-sm border border-neutral-200 flex flex-col">
          {/* Baris Atas: Tab Filter Periode (Kiri) & Tombol Aksi Paten (Kanan) */}
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            {/* Period Switcher Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-neutral-200 text-xs">
              {["Hari Ini", "7 Hari", "Bulan Ini", "Kuartal"].map(
                (period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => handleSelectPeriod(period)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      selectedPeriod === period
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-black font-medium hover:text-black"
                    }`}
                  >
                    {period}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => handleSelectPeriod("Kustom")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedPeriod === "Kustom"
                    ? "bg-white text-black font-semibold shadow-xs"
                    : "text-black font-medium hover:text-black"
                }`}
              >
                Kustom
              </button>
            </div>

            {/* Sync POS + Excel + Export PDF (Selalu Paten di Kanan Atas) */}
            <div className="flex items-center gap-2.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleSyncPos}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                title="Klik untuk sinkronisasi manual dengan mesin kasir POS"
              >
                {isSyncing && (
                  <RefreshCw size={13} className="text-emerald-600 animate-spin" />
                )}
                <span>{isSyncing ? "Syncing POS..." : "Sync POS: Live"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-white border border-neutral-400 hover:bg-gray-50 text-black rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Excel
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-[#D92D20] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Baris Bawah: Custom Date Range Picker (Muncul Hanya Saat Tab Kustom Aktif) */}
          {selectedPeriod === "Kustom" && (
            <div className="mt-3.5 pt-3.5 border-t border-neutral-200 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-semibold text-neutral-950">Rentang:</span>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || todayStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 font-medium text-black focus:outline-none focus:border-[#EA8E18]"
                />
                <span className="text-neutral-800 font-medium">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={todayStr}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 font-medium text-black focus:outline-none focus:border-[#EA8E18]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-3 py-1 bg-[#EA8E18] hover:bg-[#d67f12] text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4 KPI SUMMARY CARDS (DINAMIS MENGIKUTI CABANG & PERIODE) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL OMZET */}
          <div className="bg-white rounded-2xl px-4 py-4.5 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider leading-tight">
                {activeMetrics.omzetTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
                {activeMetrics.omzetGrowth}
              </span>
            </div>

            <div className="my-2">
              <h2 className="font-sans text-2xl font-extrabold text-black tracking-tight whitespace-nowrap tabular-nums">
                {activeMetrics.omzetValue}
              </h2>
            </div>

            <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between gap-2 text-[11px] tracking-tight">
              <span className="text-neutral-800 font-medium min-w-0 truncate">
                {activeMetrics.omzetTarget}
              </span>
              <span className="font-semibold text-[#D97706] shrink-0 whitespace-nowrap">
                {activeMetrics.omzetAchieved}
              </span>
            </div>
          </div>

          {/* Card 2: PORSI GEPREK TERJUAL */}
          <div className="bg-white rounded-2xl px-4 py-4.5 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider leading-tight">
                PORSI GEPREK TERJUAL
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
                {activeMetrics.porsiGrowth}
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <h2 className="font-sans text-2xl font-extrabold text-black tracking-tight whitespace-nowrap tabular-nums">
                {activeMetrics.porsiValue}
              </h2>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Porsi Ayam
              </span>
            </div>

            <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between gap-2 text-[11px] tracking-tight">
              <span className="text-neutral-800 font-medium whitespace-nowrap shrink-0">
                {activeMetrics.porsiAvg}
              </span>
              <span
                title={activeMetrics.topMenuLabel}
                className="font-semibold text-[#DC2626] min-w-0 truncate"
              >
                {activeMetrics.topMenuLabel}
              </span>
            </div>
          </div>

          {/* Card 3: RATA-RATA ORDER (AOV) */}
          <div className="bg-white rounded-2xl px-4 py-4.5 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider leading-tight">
                RATA-RATA ORDER (AOV)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
                {activeMetrics.aovGrowth}
              </span>
            </div>

            <div className="my-2">
              <h2 className="font-sans text-2xl font-extrabold text-black tracking-tight whitespace-nowrap tabular-nums">
                {activeMetrics.aovValue}
              </h2>
            </div>

            <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between gap-2 text-[11px] tracking-tight">
              <span className="text-neutral-800 font-medium whitespace-nowrap shrink-0">
                Transaksi: {activeMetrics.totalTx}
              </span>
              <span className="font-semibold text-black min-w-0 truncate">
                {branchProfile.addonRate}
              </span>
            </div>
          </div>

          {/* Card 4: JAM PENJUALAN PUNCAK */}
          <div className="bg-white rounded-2xl px-4 py-4.5 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider leading-tight">
                JAM PENJUALAN PUNCAK
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-300 text-xs font-semibold whitespace-nowrap shrink-0">
                Jam Sibuk
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <h2 className="font-sans text-2xl font-extrabold text-black tracking-tight whitespace-nowrap tabular-nums">
                {activeMetrics.rushHourLabel}
              </h2>
              <span className="text-xs text-neutral-800 font-medium whitespace-nowrap">
                {activeMetrics.rushHourTag}
              </span>
            </div>

            <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between gap-2 text-[11px] tracking-tight">
              <span className="text-neutral-800 font-medium whitespace-nowrap shrink-0">
                Malam: {branchProfile.rushDinnerTime}
              </span>
              <span className="font-semibold text-emerald-700 min-w-0 truncate">
                {branchProfile.rushContribution}
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 1: TREN PENJUALAN (LEFT 8 COLS) & KATEGORI MENU TERLARIS (RIGHT 4 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Tren Penjualan & Fluktuasi Porsi */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                <h3 className="font-display font-bold text-base text-black">
                  Tren Penjualan &amp; Fluktuasi Porsi (09:00 - 22:00 WIB)
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-neutral-950 shrink-0">
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
                        className="fill-neutral-800 text-[10.5px] font-bold"
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
                      className="fill-[#B45309] text-[9.5px] font-bold"
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
                      className="fill-[#DC2626] text-[9.5px] font-bold"
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
                          className={`text-[11px] font-mono ${
                            isActive
                              ? "fill-black font-bold underline"
                              : pt.highlight === "amber"
                                ? "fill-[#B45309] font-bold"
                                : pt.highlight === "red"
                                  ? "fill-[#DC2626] font-bold"
                                  : "fill-neutral-800 font-medium"
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
                      className="fill-white text-[9.5px] font-semibold"
                    >
                      {activeHourPoint.omzetLabel} • {activeHourPoint.porsi}{" "}
                      Porsi ({activeHourPoint.t})
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-800 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>
                  Jam dipilih:{" "}
                  <strong className="font-mono text-black font-bold">
                    {activeHourPoint.t} WIB
                  </strong>{" "}
                  ({activeHourPoint.omzetLabel} • {activeHourPoint.porsi} Porsi
                  Terjual)
                </span>
              </div>
              <div>
                Waktu Penyiapan Sambal Rata-rata:{" "}
                <strong className="text-black font-semibold">
                  {branchProfile.prepTime}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Card: Kategori Menu Terlaris */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#DC2626] shrink-0"></span>
                <h3 className="font-display font-bold text-base text-black">
                  Kategori Menu Terlaris
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
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
                <span className="text-[11px] text-neutral-700 font-medium truncate max-w-[115px]">
                  {activeDonutCategory
                    ? activeDonutCategory.pct + " Kontribusi"
                    : "Total Terjual"}
                </span>
                <span className="text-2xl font-bold text-black leading-tight">
                  {activeDonutCategory
                    ? activeDonutCategory.qty.toLocaleString("id-ID")
                    : activeMetrics.porsiValue}
                </span>
                <span className="text-[10px] font-semibold text-[#DC2626] uppercase tracking-wider">
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
                            ? "text-black font-bold"
                            : "text-black font-semibold"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="text-xs shrink-0">
                      <strong className="text-black font-bold">
                        {item.pct}
                      </strong>{" "}
                      <span className="text-neutral-800 font-medium">
                        ({item.qty.toLocaleString("id-ID")})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="pt-3.5 mt-4 border-t border-neutral-200 flex items-center justify-between text-xs">
              <span className="text-neutral-800 font-medium">
                Cabai Terpakai:{" "}
                <strong className="text-[#DC2626] font-bold">
                  {activeMetrics.cabaiKg}
                </strong>
              </span>
              <span className="text-neutral-800 font-medium">
                Level Pedas:{" "}
                <strong className="text-[#D97706] font-bold">
                  {branchProfile.spicyLevel}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW 2: KOMPARASI WEEKDAY VS WEEKEND (LEFT 5 COLS) & HEATMAP ORDER (RIGHT 7 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card: Komparasi Penjualan Hari Kerja vs Weekend */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col justify-between gap-5 print:break-inside-avoid">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-black">
                Komparasi Hari Kerja vs Weekend
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
                {`Weekend +${comparisonData.weekendGrowthPct}%`}
              </span>
            </div>

            <div className="space-y-5">
              {/* Bar 1: Hari Kerja */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-semibold text-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                    Hari Kerja (Senin - Kamis)
                  </span>
                  <span className="font-bold text-black">
                    {comparisonData.weekdayOmzet}{" "}
                    <span className="text-xs font-medium text-neutral-800">
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
                <div className="flex items-center justify-between text-xs text-neutral-800 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-black font-semibold">
                      {comparisonData.weekdayPorsi} Porsi
                    </strong>
                  </span>
                  <span>{comparisonData.weekdayDominant}</span>
                </div>
              </div>

              {/* Bar 2: Akhir Pekan */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-semibold text-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                    Akhir Pekan (Jumat - Minggu)
                  </span>
                  <span className="font-bold text-[#DC2626]">
                    {comparisonData.weekendOmzet}{" "}
                    <span className="text-xs font-medium text-neutral-800">
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
                <div className="flex items-center justify-between text-xs text-neutral-800 font-medium mt-1.5">
                  <span>
                    Porsi Rata-rata:{" "}
                    <strong className="text-black font-semibold">
                      {comparisonData.weekendPorsi} Porsi
                    </strong>
                  </span>
                  <span>{comparisonData.weekendDominant}</span>
                </div>
              </div>
            </div>

            {/* Channel Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-neutral-200 text-xs text-neutral-950 font-semibold">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-xs bg-[#1E562F] shrink-0"></span>
                <span>Dine-In (Makan Sini)</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                <span>GrabFood / GoFood</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-xs bg-[#EA580C] shrink-0"></span>
                <span>Takeaway (Bungkus)</span>
              </div>
            </div>

            {/* Insight Callout Box */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E562F]">
                <Info size={15} className="text-emerald-700 shrink-0" />
                <span>Insight Pengadaan Stok ({selectedBranch}):</span>
              </div>
              <p className="text-xs text-neutral-950 font-medium mt-1 leading-relaxed">
                Persediaan fillet ayam potong dan stok cabai rawit disarankan
                ditambah{" "}
                <strong className="text-black font-bold">
                  {comparisonData.stockInsightBoost}
                </strong>{" "}
                untuk mengantisipasi lonjakan permintaan.
              </p>
            </div>
          </div>

          {/* Right Card: Heatmap Kepadatan Order */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col justify-between print:break-inside-avoid">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#F59E0B] shrink-0"></span>
                  <h3 className="font-display font-bold text-base text-black">
                    Heatmap Kepadatan Order (Hari vs Jam)
                  </h3>
                </div>
                {hoveredHeatmap && (
                  <p className="text-xs text-black font-semibold mt-1 pl-5">
                    {hoveredHeatmap.day} ({hoveredHeatmap.slotLabel}):{" "}
                    <span className="text-[#DC2626] font-bold">
                      {hoveredHeatmap.val} Struk
                    </span>{" "}
                    • Okupansi{" "}
                    <span className="text-[#1E562F] font-bold">
                      {hoveredHeatmap.occ}%
                    </span>
                  </p>
                )}
              </div>

              {/* Scale Legend */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-800 font-bold shrink-0">
                <span>Rendah</span>
                <span className="w-3.5 h-3.5 rounded-xs bg-gray-100 border border-neutral-300"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#A7F3D0]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#FBBF24]"></span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#DC2626]"></span>
                <span>Sangat Ramai</span>
              </div>
            </div>

            {/* Heatmap Grid Table */}
            <div
              className="overflow-x-auto print:overflow-visible"
              onMouseLeave={() => setHoveredHeatmap(null)}
            >
              <table className="w-full border-separate border-spacing-1.5 text-center text-xs sm:text-sm">
                <thead>
                  <tr className="text-xs text-neutral-700 font-semibold">
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
                              ? "font-bold text-[#DC2626]"
                              : "font-semibold text-black"
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
            <div className="pt-3.5 mt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-800 font-medium">
              <span className="italic">
                *Angka dalam kotak menunjukkan rata-rata jumlah struk transaksi
              </span>
              <span className="text-neutral-950 whitespace-nowrap">
                Kapasitas Maksimal Meja:{" "}
                <strong className="text-black font-bold">
                  {branchProfile.heatmapMaxCap}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* BOTTOM TABLE: RINCIAN TRANSAKSI PENJUALAN TERKINI (SINKRON DENGAN RINGKASAN) */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 print:p-3 border border-neutral-200 shadow-sm print:shadow-none flex flex-col gap-4 min-h-[430px] print:min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
              <h3 className="font-display font-bold text-base sm:text-lg text-black">
                Rincian Transaksi Penjualan Terkini
              </h3>
            </div>
            <p className="text-xs text-neutral-700 font-semibold tabular-nums">
              {isLoading ? 0 : displayedTransactions.length} transaksi
            </p>
          </div>

          {/* Filter Bar */}
          <div className="print:hidden flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari ID struk, kasir, atau nama menu..."
              className="flex-1 min-w-[260px] border border-neutral-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
            />
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterTerminal}
                onChange={(e) => {
                  setFilterTerminal(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none w-[150px] shrink-0 truncate bg-white border border-neutral-300 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Kasir</option>
                {cashierOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-neutral-950"
              />
            </div>
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterPayment}
                onChange={(e) => {
                  setFilterPayment(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-neutral-300 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Pembayaran</option>
                <option value="Tunai">Tunai (Cash)</option>
                <option value="QRIS">QRIS</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-neutral-950"
              />
            </div>
            <div className="relative inline-flex items-center shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none w-[160px] shrink-0 truncate bg-white border border-neutral-300 rounded-2xl pl-3.5 pr-7 py-2.5 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="Semua">Semua Status</option>
                <option value="Berhasil">Berhasil</option>
                <option value="Batal">Batal</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 text-neutral-950"
              />
            </div>
            <button
              type="button"
              onClick={handleResetAllFilters}
              title="Reset Filter"
              aria-label="Reset Filter"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-neutral-300 bg-white hover:bg-gray-50 text-black transition cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto print:overflow-visible flex-1">
            <table className="w-full min-w-full print:text-[9px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-neutral-300 bg-gray-50 text-neutral-700 font-semibold uppercase text-[11px] print:text-[9px] tracking-wider">
                  <th className="py-2.5 pl-3.5 pr-2 w-[100px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    ID STRUK
                  </th>
                  <th className="py-2.5 px-2 w-[95px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    WAKTU
                  </th>
                  <th className="py-2.5 px-2 w-[115px] whitespace-nowrap print:px-1.5 print:py-2 text-left">
                    KASIR
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[170px] print:px-1.5 print:py-2 text-left">
                    RINGKASAN ITEM
                  </th>
                  <th className="py-2.5 px-2 w-[90px] text-right whitespace-nowrap print:px-1.5 print:py-2">
                    SUBTOTAL
                  </th>
                  <th className="py-2.5 px-2 w-[95px] text-right whitespace-nowrap print:px-1.5 print:py-2">
                    TOTAL AKHIR
                  </th>
                  <th className="py-2.5 px-2 w-[75px] text-center whitespace-nowrap print:px-1.5 print:py-2">
                    METODE
                  </th>
                  <th className="py-2.5 px-2 w-[80px] text-center whitespace-nowrap print:px-1.5 print:py-2">
                    STATUS
                  </th>
                  <th className="py-2.5 pl-2 pr-3.5 w-[70px] text-center whitespace-nowrap print:hidden">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-black">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="h-[280px] text-center text-neutral-800 font-medium align-middle"
                    >
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="h-[280px] text-center text-neutral-800 font-medium align-middle"
                    >
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-3 pl-3.5 pr-2 text-left font-mono font-bold text-black whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-3 px-2 text-left whitespace-nowrap">
                        <div className="font-mono font-bold text-black">
                          {tx.time} WIB
                        </div>
                        <div className="text-[11px] text-neutral-700 font-medium">
                          {tx.date}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left whitespace-nowrap">
                        <div className="font-semibold text-black">
                          {tx.cashier}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-left">
                        <div
                          className="font-semibold text-black leading-snug break-words max-w-[260px]"
                          title={tx.itemsSummary}
                        >
                          {tx.itemsSummary}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className="text-[11px] text-emerald-700 font-medium">
                            {tx.totalItems} item total
                          </span>
                          {tx.sambalSummary && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[#DC2626] text-[10px] font-semibold">
                              🌶️ {tx.sambalSummary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-neutral-950 whitespace-nowrap tabular-nums">
                        {formatRupiah(tx.subtotal)}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-black whitespace-nowrap tabular-nums">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-semibold text-[11px] px-2.5 py-0.5 rounded-lg border ${
                            tx.paymentMethod === "QRIS"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-blue-50 text-blue-800 border-blue-300"
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-semibold text-[11px] px-2.5 py-0.5 rounded-lg border ${
                            tx.status === "Berhasil"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-red-50 text-red-700 border-red-300"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-3.5 text-center whitespace-nowrap print:hidden">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(tx.id)}
                            className="p-1.5 rounded-lg border border-neutral-300 bg-gray-50 hover:bg-gray-100 text-black hover:text-black cursor-pointer transition"
                            title="Cetak Struk"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg border border-neutral-300 bg-gray-50 hover:bg-gray-100 text-black hover:text-black cursor-pointer transition"
                            title="Lihat Detail"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {displayedTransactions.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 bg-gray-50/90 font-semibold text-black">
                    <td
                      colSpan={5}
                      className="py-2.5 pl-3.5 pr-2 text-left text-xs uppercase tracking-wider text-neutral-950"
                    >
                      Total Rekapitulasi ({displayedTransactions.length}{" "}
                      transaksi)
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-[#EA8E18] whitespace-nowrap tabular-nums">
                      {formatRupiah(displayedTotalNominal)}
                    </td>
                    <td
                      colSpan={2}
                      className="py-2.5 px-2 text-center text-[11px] font-semibold text-emerald-700 whitespace-nowrap"
                    >
                      Transaksi Selesai
                    </td>
                    <td className="py-2.5 pl-2 pr-3.5 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Row */}
          <div className="print:hidden pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-800 font-medium">
            <div>
              Menampilkan{" "}
              <strong className="text-black font-semibold">
                {paginatedTransactions.length}
              </strong>{" "}
              dari{" "}
              <strong className="text-black font-semibold">
                {displayedTransactions.length}
              </strong>{" "}
              transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 border border-neutral-400 rounded-lg text-black font-medium hover:text-black hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-semibold transition cursor-pointer ${
                      activePage === page
                        ? "bg-[#1E3A1C] text-white"
                        : "border border-neutral-400 text-black hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3.5 py-1.5 border border-neutral-400 rounded-lg text-black font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER SISTEM */}
        <footer className="print:hidden pt-3 pb-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-700 font-medium">
          <span className="font-display font-bold text-[#EA8E18]">PrekDuaDara</span>
          <span>&copy; 2026 PrekDuaDara. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
