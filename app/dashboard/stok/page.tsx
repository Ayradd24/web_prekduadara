"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import AiStockForecastSection, {
  type ForecastItem,
  type ForecastResponseData,
} from "@/components/AiStockForecastSection";
import { useStok } from "@/context/StokContext";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Layers,
  PackagePlus,
  Plus,
  PlusCircle,
  Printer,
  RotateCcw,
  Save,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";

type StockStatus = "KRITIS" | "MENIPIS" | "AMAN";

type InventoryCategory =
  | "Bumbu & Sambal"
  | "Protein & Unggas"
  | "Tepung & Minyak"
  | "Bumbu & Pelengkap"
  | "Protein & Pelengkap"
  | "Minuman & Pelengkap"
  | "Kemasan / Box";

type FilterTabCategory =
  | "Protein & Unggas"
  | "Bumbu & Sambal"
  | "Tepung & Minyak"
  | "Minuman & Pelengkap"
  | "Kemasan / Box";

type MutationType =
  | "Stok Masuk (PO)"
  | "Pemakaian Dapur"
  | "Stok Rusak / Basi";

type LogFilterType = "Semua" | "in" | "out_replace";

export interface InventoryDetailItem {
  id: string;
  sku: string;
  name: string;
  supplier: string;
  category: InventoryCategory;
  filterTab: FilterTabCategory;
  stock: number;
  unit: string;
  safetyStock: number;
  safetyUnit: string;
  pct: number;
  daysLeft: string;
  estimatedDaysLeft?: number;
  suggestedPoQty?: number;
  unitPrice: number;
  priceUnit: string;
  status: StockStatus;
  icon: string;
  iconBg: string;
}

export interface MutationLog {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "out" | "in" | "replace";
}

const ITEMS_PER_PAGE = 10;
const STOCK_LOGS_STORAGE_KEY = "prekduadara_stock_logs_v1";
const MAX_STOCK_LOGS = 100;
const INTEGER_STOCK_UNITS = [
  "pcs",
  "box",
  "cup",
  "bungkus",
  "pack",
  "block",
  "botol",
  "kaleng",
];

function formatStockQty(val: number, unit: string): string {
  const num = Number(val) || 0;
  const isIntUnit = INTEGER_STOCK_UNITS.includes(unit.trim().toLowerCase());
  if (isIntUnit) return String(Math.round(num));
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

let mutationLogSeq = 0;
function createMutationLogId(suffix: string): string {
  mutationLogSeq += 1;
  return `LOG-${Date.now()}-${suffix}-${mutationLogSeq}`;
}

// Helper perhitungan status, persentase stok bar, dan estimasi sisa hari
function computeStockMetrics(
  stock: number,
  safetyStock: number
): { status: StockStatus; pct: number; daysLeft: string } {
  const safeVal = Math.max(0.1, safetyStock);
  const status: StockStatus =
    stock <= safeVal * 0.5
      ? "KRITIS"
      : stock <= safeVal
        ? "MENIPIS"
        : "AMAN";

  const pct = Math.min(
    100,
    Math.max(0, Math.round((stock / (safeVal * 1.5)) * 100))
  );

  const days =
    stock <= 0 ? 0 : Math.max(0.1, stock / Math.max(0.1, safeVal * 0.4));
  const daysLeft = `~${days.toFixed(1)} Hari`;

  return { status, pct, daysLeft };
}

interface StockMetadataEntry {
  category: InventoryCategory;
  filterTab: FilterTabCategory;
  supplier: string;
  unitPrice: number;
  icon: string;
  iconBg: string;
}

const STOCK_METADATA_BY_SKU: Record<string, StockMetadataEntry> = {
  "STK-01": {
    category: "Protein & Unggas",
    filterTab: "Protein & Unggas",
    supplier: "Supplier: Rumah Potong Unggas Berkah",
    unitPrice: 38500,
    icon: "🍗",
    iconBg: "bg-amber-50 border-amber-200",
  },
  "STK-02": {
    category: "Tepung & Minyak",
    filterTab: "Tepung & Minyak",
    supplier: "Supplier: Distribusi Pangan Makmur",
    unitPrice: 17000,
    icon: "💧",
    iconBg: "bg-amber-50 border-amber-200",
  },
  "STK-03": {
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Tani Segar Jaya",
    unitPrice: 65000,
    icon: "🌶️",
    iconBg: "bg-red-50 border-red-200",
  },
  "STK-04": {
    category: "Bumbu & Pelengkap",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Lumbung Padi Karawang Jaya",
    unitPrice: 14500,
    icon: "🍚",
    iconBg: "bg-gray-50 border-neutral-200",
  },
  "STK-05": {
    category: "Tepung & Minyak",
    filterTab: "Tepung & Minyak",
    supplier: "Supplier: Sentral Tepung Bogasari",
    unitPrice: 12500,
    icon: "🌾",
    iconBg: "bg-yellow-50 border-yellow-200",
  },
  "STK-06": {
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    supplier: "Supplier: Sentral Dairy & Keju",
    unitPrice: 95000,
    icon: "🧀",
    iconBg: "bg-amber-50 border-amber-200",
  },
  "STK-07": {
    category: "Protein & Unggas",
    filterTab: "Protein & Unggas",
    supplier: "Supplier: Pengrajin Tahu Tempe Lokal",
    unitPrice: 1500,
    icon: "🧆",
    iconBg: "bg-orange-50 border-orange-200",
  },
  "STK-08": {
    category: "Protein & Unggas",
    filterTab: "Protein & Unggas",
    supplier: "Supplier: Peternakan Telur Jaya",
    unitPrice: 27000,
    icon: "🥚",
    iconBg: "bg-amber-50 border-amber-200",
  },
  "STK-09": {
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    supplier: "Supplier: Budidaya Jamur Segar",
    unitPrice: 18000,
    icon: "🍄",
    iconBg: "bg-stone-50 border-neutral-200",
  },
  "STK-10": {
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    supplier: "Supplier: Grosir Minuman & Sembako",
    unitPrice: 16000,
    icon: "🍃",
    iconBg: "bg-emerald-50 border-emerald-200",
  },
  "STK-11": {
    category: "Kemasan / Box",
    filterTab: "Kemasan / Box",
    supplier: "Supplier: Percetakan Kemasan Nusantara",
    unitPrice: 1200,
    icon: "📦",
    iconBg: "bg-amber-50 border-amber-200",
  },
  "STK-12": {
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Juragan Sayur Majalengka",
    unitPrice: 36000,
    icon: "🧄",
    iconBg: "bg-orange-50 border-orange-200",
  },
  "STK-13": {
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Tani Segar Jaya",
    unitPrice: 42000,
    icon: "🫑",
    iconBg: "bg-emerald-50 border-emerald-200",
  },
  "STK-14": {
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Pasar Induk Sayur & Rempah",
    unitPrice: 15000,
    icon: "🍅",
    iconBg: "bg-red-50 border-red-200",
  },
  "STK-15": {
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    supplier: "Supplier: Tani Rempah Aromatik",
    unitPrice: 20000,
    icon: "🍋",
    iconBg: "bg-lime-50 border-lime-200",
  },
};

const STOCK_METADATA_BY_NAME: Record<string, StockMetadataEntry> = {
  "ayam potong": STOCK_METADATA_BY_SKU["STK-01"],
  "minyak goreng": STOCK_METADATA_BY_SKU["STK-02"],
  "cabai rawit": STOCK_METADATA_BY_SKU["STK-03"],
  beras: STOCK_METADATA_BY_SKU["STK-04"],
  "tepung bumbu": STOCK_METADATA_BY_SKU["STK-05"],
  "keju mozzarella": STOCK_METADATA_BY_SKU["STK-06"],
  "tahu & tempe": STOCK_METADATA_BY_SKU["STK-07"],
  "telur ayam": STOCK_METADATA_BY_SKU["STK-08"],
  "jamur tiram": STOCK_METADATA_BY_SKU["STK-09"],
  "teh & gula pasir": STOCK_METADATA_BY_SKU["STK-10"],
  "kemasan box & cup": STOCK_METADATA_BY_SKU["STK-11"],
  "bawang merah & putih": STOCK_METADATA_BY_SKU["STK-12"],
  "cabai hijau": STOCK_METADATA_BY_SKU["STK-13"],
  tomat: STOCK_METADATA_BY_SKU["STK-14"],
  "serai & daun jeruk": STOCK_METADATA_BY_SKU["STK-15"],
};

function getStockMetadata(name: string, id: string | number): StockMetadataEntry {
  const lower = name.trim().toLowerCase();
  const sku = `STK-${String(id).padStart(2, "0")}`;

  if (STOCK_METADATA_BY_NAME[lower]) {
    return STOCK_METADATA_BY_NAME[lower];
  }

  if (
    lower.includes("keju") ||
    lower.includes("mozzarella") ||
    lower.includes("mozarella")
  ) {
    return STOCK_METADATA_BY_SKU["STK-06"];
  }
  if (lower.includes("tahu") || lower.includes("tempe")) {
    return STOCK_METADATA_BY_SKU["STK-07"];
  }
  if (lower.includes("telur")) {
    return STOCK_METADATA_BY_SKU["STK-08"];
  }
  if (lower.includes("ayam") || lower.includes("daging")) {
    return STOCK_METADATA_BY_SKU["STK-01"];
  }
  if (lower.includes("jamur")) {
    return STOCK_METADATA_BY_SKU["STK-09"];
  }
  if (
    lower.includes("teh") ||
    lower.includes("gula") ||
    lower.includes("sirup")
  ) {
    return STOCK_METADATA_BY_SKU["STK-10"];
  }
  if (
    lower.includes("paper") ||
    lower.includes("box") ||
    lower.includes("cup") ||
    lower.includes("kemasan")
  ) {
    return STOCK_METADATA_BY_SKU["STK-11"];
  }
  if (lower.includes("bawang")) {
    return STOCK_METADATA_BY_SKU["STK-12"];
  }
  if (
    (lower.includes("cabai") || lower.includes("rawit")) &&
    (lower.includes("hijau") || lower.includes("ijo"))
  ) {
    return STOCK_METADATA_BY_SKU["STK-13"];
  }
  if (
    lower.includes("cabai") ||
    lower.includes("sambal") ||
    lower.includes("korek")
  ) {
    return STOCK_METADATA_BY_SKU["STK-03"];
  }
  if (lower.includes("tomat") || lower.includes("terasi")) {
    return STOCK_METADATA_BY_SKU["STK-14"];
  }
  if (lower.includes("serai") || lower.includes("jeruk")) {
    return STOCK_METADATA_BY_SKU["STK-15"];
  }
  if (lower.includes("minyak") || lower.includes("sawit")) {
    return STOCK_METADATA_BY_SKU["STK-02"];
  }
  if (lower.includes("beras") || lower.includes("nasi")) {
    return STOCK_METADATA_BY_SKU["STK-04"];
  }
  if (
    lower.includes("tepung") ||
    lower.includes("crispy") ||
    lower.includes("krispi")
  ) {
    return STOCK_METADATA_BY_SKU["STK-05"];
  }

  if (STOCK_METADATA_BY_SKU[sku]) {
    return STOCK_METADATA_BY_SKU[sku];
  }

  return {
    category: "Kemasan / Box",
    filterTab: "Kemasan / Box",
    supplier: "Supplier: Sentral Mitra Operasional",
    unitPrice: 2000,
    icon: "📦",
    iconBg: "bg-amber-50 border-amber-200",
  };
}

function mapBackendStockToInventory(item: {
  id: string | number;
  name: string;
  stock: number | string;
  unit?: string;
  minStock?: number | string;
  min_stock?: number | string;
  status?: string;
}): InventoryDetailItem {
  const meta = getStockMetadata(item.name, item.id);
  const stockVal = Number(item.stock) || 0;
  const safetyVal = Number(item.minStock ?? item.min_stock) || 10;
  const metrics = computeStockMetrics(stockVal, safetyVal);
  return {
    id: String(item.id),
    sku: `STK-${String(item.id).padStart(2, "0")}`,
    name: item.name,
    supplier: meta.supplier,
    category: meta.category,
    filterTab: meta.filterTab,
    stock: stockVal,
    unit: item.unit || "kg",
    safetyStock: safetyVal,
    safetyUnit: item.unit || "kg",
    unitPrice: meta.unitPrice,
    priceUnit: "/" + (item.unit || "kg"),
    status: metrics.status,
    pct: metrics.pct,
    daysLeft: metrics.daysLeft,
    icon: meta.icon,
    iconBg: meta.iconBg,
  };
}

export default function StokPage() {
  const { fetchStocks } = useStok();

  const [rawInventory, setRawInventory] = useState<InventoryDetailItem[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResponseData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<MutationLog[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [activeCategory, setActiveCategory] = useState("Semua Bahan");
  const [activePage, setActivePage] = useState(1);

  // Penyesuaian Cepat Form State
  const [selectedSku, setSelectedSku] = useState("");
  const [mutationType, setMutationType] =
    useState<MutationType>("Stok Masuk (PO)");
  const [mutationAmount, setMutationAmount] = useState("");
  const [mutationNote, setMutationNote] = useState("");

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State Modals
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameValues, setOpnameValues] = useState<Record<string, string>>({});
  const [showPoModal, setShowPoModal] = useState(false);
  const [poModalTab, setPoModalTab] = useState<"restock" | "all">("restock");
  const [poQuantities, setPoQuantities] = useState<Record<string, string>>({});
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logModalFilter, setLogModalFilter] =
    useState<LogFilterType>("Semua");

  // Modal Tambah Bahan Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] =
    useState<InventoryCategory>("Bumbu & Sambal");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemSafety, setNewItemSafety] = useState("");

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STOCK_LOGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLogs(parsed.slice(0, MAX_STOCK_LOGS));
          }
        }
      } catch {
        // Abaikan data localStorage yang tidak valid
      }
    }, 0);
    return () => window.clearTimeout(hydrateTimer);
  }, []);

  const appendMutationLog = useCallback((entry: MutationLog) => {
    setLogs((prev) => {
      const next = [entry, ...prev].slice(0, MAX_STOCK_LOGS);
      try {
        localStorage.setItem(STOCK_LOGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Abaikan jika penyimpanan browser penuh
      }
      return next;
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // 1. FETCH STOK DARI DATABASE BACKEND MARIADB
  const loadStocksFromDB = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stocks`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map(mapBackendStockToInventory);
        setRawInventory(mapped);
        if (mapped.length > 0) {
          setSelectedSku((prev) => {
            return mapped.some((m: InventoryDetailItem) => m.sku === prev)
              ? prev
              : mapped[0].sku;
          });
        }
      }
    } catch {
      // Gagal menghubungi backend stok
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initStocks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stocks`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(mapBackendStockToInventory);
          setRawInventory(mapped);
          if (mapped.length > 0) {
            setSelectedSku((prev) =>
              mapped.some((m: InventoryDetailItem) => m.sku === prev)
                ? prev
                : mapped[0].sku
            );
          }
        }
      } catch {
        // Gagal menghubungi backend stok
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void initStocks();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleForecastUpdate = useCallback((data: ForecastResponseData) => {
    setForecastData(data);
  }, []);

  const targetSafeDays =
    forecastData?.summary?.targetSafeDays ??
    forecastData?.settings?.targetSafeDays ??
    4;

  const forecastMap = useMemo(() => {
    const bySku = new Map<string, ForecastItem>();
    const byId = new Map<string, ForecastItem>();
    if (forecastData?.items) {
      forecastData.items.forEach((aiItem) => {
        const idStr = String(aiItem.id);
        const sku = `STK-${idStr.padStart(2, "0")}`;
        byId.set(idStr, aiItem);
        bySku.set(sku, aiItem);
      });
    }
    return { bySku, byId };
  }, [forecastData]);

  // Single Source of Truth: gabungkan data MariaDB dengan hasil analisis AI Agent
  // (computeStockMetrics hanya sebagai fallback sementara saat data AI masih loading)
  const inventory = useMemo<InventoryDetailItem[]>(() => {
    return rawInventory.map((item) => {
      const aiItem =
        forecastMap.bySku.get(item.sku) || forecastMap.byId.get(item.id);
      if (!aiItem) {
        return item;
      }

      const estDays = Math.max(0, Number(aiItem.estimatedDaysLeft) || 0);
      const safeDays = Math.max(1, targetSafeDays);
      const status: StockStatus =
        aiItem.isUrgentUnder2Days ||
        estDays < 2 ||
        item.stock <= item.safetyStock * 0.5
          ? "KRITIS"
          : estDays < safeDays || item.stock <= item.safetyStock
            ? "MENIPIS"
            : "AMAN";
      const pct = Math.min(
        100,
        Math.max(0, Math.round((estDays / safeDays) * 100))
      );
      const daysLeft = `~${estDays.toFixed(1)} Hari`;

      return {
        ...item,
        status,
        pct,
        daysLeft,
        estimatedDaysLeft: estDays,
        suggestedPoQty: Number(aiItem.suggestedPoQty) || 0,
      };
    });
  }, [rawInventory, forecastMap, targetSafeDays]);

  // Handler Reset Seluruh Filter
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("Semua Status");
    setActiveCategory("Semua Bahan");
    setActivePage(1);
    showToast("Seluruh filter inventaris telah direset.");
  };

  const selectedItemObj = useMemo(
    () => inventory.find((i) => i.sku === selectedSku) || inventory[0],
    [inventory, selectedSku]
  );

  // 4 KPI Card Metrics (disinkronkan dengan hasil analisis AI Agent)
  const kpiStats = useMemo(() => {
    const totalItems = inventory.length;
    const criticalItems = inventory.filter((item) => item.status === "KRITIS");
    const totalValue = inventory.reduce(
      (acc, item) => acc + item.stock * item.unitPrice,
      0
    );
    const totalDays = inventory.reduce((acc, item) => {
      if (typeof item.estimatedDaysLeft === "number") {
        return acc + item.estimatedDaysLeft;
      }
      const parsed = parseFloat(
        item.daysLeft.replace("~", "").replace("Hari", "").trim()
      );
      const fallback = item.stock / Math.max(0.1, item.safetyStock * 0.4);
      return acc + (isNaN(parsed) ? fallback : parsed);
    }, 0);
    const avgDays =
      totalItems > 0 ? (totalDays / totalItems).toFixed(1) : "0.0";
    const criticalLabel =
      criticalItems.length === 0
        ? "Semua stok aman"
        : criticalItems
            .map((i) => i.name.split(" ").slice(0, 2).join(" "))
            .join(" & ");

    return {
      totalItems,
      criticalItems,
      criticalCount: criticalItems.length,
      criticalLabel,
      totalValue,
      avgDays,
    };
  }, [inventory]);

  // Filter daftar bahan baku berdasarkan pencarian, status, dan tab kategori
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "Semua Status" || item.status === statusFilter;

      const matchCat =
        activeCategory === "Semua Bahan" || item.filterTab === activeCategory;

      return matchSearch && matchStatus && matchCat;
    });
  }, [inventory, searchQuery, statusFilter, activeCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(activePage, totalPages);
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventory, currentPage]);

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // 2. HANDLER TAMBAH CEPAT (+ Button di Baris Tabel)
  const handleQuickRestockRow = async (item: InventoryDetailItem) => {
    const addVal = 2;
    try {
      const res = await fetch(`${API_BASE_URL}/api/stocks/${item.id}`, {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ amount: addVal, action: "add" }),
      });
      const json = await res.json();
      if (json.success) {
        await loadStocksFromDB();
        await fetchStocks();
        const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
        appendMutationLog({
          id: createMutationLogId(item.sku),
          title: `${item.name.split(" ").slice(0, 3).join(" ")} • +${formatStockQty(addVal, item.unit)} ${item.unit}`,
          subtitle: `Penambahan cepat stok tabel (${item.sku}) • Gerai Utama`,
          time: nowStr,
          type: "in",
        });
        showToast(
          `+${formatStockQty(addVal, item.unit)} ${item.unit} ditambahkan ke ${item.name}!`
        );
      } else {
        showToast(json.message || "Gagal memperbarui stok di server!");
      }
    } catch {
      showToast("Gagal menghubungi server untuk menambah stok!");
    }
  };

  // 3. HANDLER SIMPAN FORM PENYESUAIAN CEPAT (Dapur & Kasir)
  const handleSaveMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(String(mutationAmount).replace(",", "."));
    if (isNaN(qty) || qty <= 0) {
      showToast("Jumlah mutasi stok harus lebih dari 0!");
      return;
    }

    if (!selectedItemObj) {
      showToast("Pilih bahan baku terlebih dahulu!");
      return;
    }

    const isAddition = mutationType === "Stok Masuk (PO)";

    if (!isAddition && qty > selectedItemObj.stock) {
      showToast(
        `Stok tidak mencukupi! Sisa stok ${selectedItemObj.name} saat ini: ${formatStockQty(selectedItemObj.stock, selectedItemObj.unit)} ${selectedItemObj.unit}.`
      );
      return;
    }

    const action = isAddition ? "add" : "subtract";

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/stocks/${selectedItemObj.id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ amount: qty, action }),
        }
      );
      const json = await res.json();
      if (json.success) {
        await loadStocksFromDB();
        await fetchStocks();
        const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
        appendMutationLog({
          id: createMutationLogId(selectedItemObj.sku),
          title: `${selectedItemObj.name.split(" ").slice(0, 3).join(" ")} • ${
            isAddition ? "+" : "-"
          }${formatStockQty(qty, selectedItemObj.unit)} ${selectedItemObj.unit}`,
          subtitle: `${
            mutationNote.trim() || `${mutationType} (${selectedItemObj.sku})`
          } • Gerai Utama`,
          time: nowStr,
          type: isAddition
            ? "in"
            : mutationType === "Stok Rusak / Basi"
              ? "replace"
              : "out",
        });
        setMutationAmount("");
        setMutationNote("");
        showToast(
          `Mutasi stok ${selectedItemObj.name} berhasil disimpan ke database!`
        );
      } else {
        showToast(json.message || "Gagal memperbarui stok di server!");
      }
    } catch {
      showToast("Gagal menghubungkan ke server backend!");
    }
  };

  // 4. HANDLER AUDIT / OPNAME FISIK
  const handleOpenOpnameModal = () => {
    const initialMap: Record<string, string> = {};
    inventory.forEach((item) => {
      initialMap[item.sku] = String(item.stock);
    });
    setOpnameValues(initialMap);
    setShowOpnameModal(true);
  };

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedCount = 0;
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    try {
      for (const item of inventory) {
        const rawVal = opnameValues[item.sku];
        const parsed = parseFloat(rawVal);
        if (!isNaN(parsed) && parsed >= 0 && parsed !== item.stock) {
          const res = await fetch(`${API_BASE_URL}/api/stocks/${item.id}`, {
            method: "PATCH",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ newStock: parsed }),
          });
          if (res.ok) {
            const diff = Math.round((parsed - item.stock) * 100) / 100;
            const sign = diff > 0 ? "+" : "-";
            appendMutationLog({
              id: createMutationLogId(item.sku),
              title: `${item.name.split(" ").slice(0, 3).join(" ")} • ${sign}${formatStockQty(Math.abs(diff), item.unit)} ${item.unit}`,
              subtitle: `Audit / Opname Fisik (${formatStockQty(item.stock, item.unit)} → ${formatStockQty(parsed, item.unit)} ${item.unit}) • Gerai Utama`,
              time: nowStr,
              type: diff > 0 ? "in" : "replace",
            });
            updatedCount++;
          }
        }
      }
      await loadStocksFromDB();
      await fetchStocks();
      setShowOpnameModal(false);
      showToast(
        `Hasil audit fisik ${updatedCount} bahan berhasil disimpan ke database!`
      );
    } catch {
      showToast("Gagal menyimpan hasil opname fisik ke server!");
    }
  };

  const handleApplyRecommendedPo = useCallback(
    (poMap: Record<string, string>) => {
      const count = Object.keys(poMap).length;
      if (count === 0) {
        showToast("Seluruh bahan baku saat ini dalam status aman menurut AI.");
        return;
      }
      setPoQuantities(poMap);
      setPoModalTab("restock");
      setShowPoModal(true);
      showToast(
        `Kuantitas saran PO dari analisis AI (${count} bahan) berhasil dimuat ke form!`
      );
    },
    [showToast]
  );

  const handleSendPo = async (e: React.FormEvent) => {
    e.preventDefault();
    let count = 0;
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    try {
      for (const [sku, qtyStr] of Object.entries(poQuantities)) {
        const parsedQty = parseFloat(String(qtyStr).replace(",", "."));
        const qty = Math.round(parsedQty * 100) / 100;
        if (!isNaN(qty) && qty > 0) {
          const item = inventory.find((i) => i.sku === sku);
          if (item) {
            const res = await fetch(`${API_BASE_URL}/api/stocks/${item.id}`, {
              method: "PATCH",
              headers: getAuthHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({ amount: qty, action: "add" }),
            });
            if (res.ok) {
              appendMutationLog({
                id: createMutationLogId(item.sku),
                title: `${item.name.split(" ").slice(0, 3).join(" ")} • +${formatStockQty(qty, item.unit)} ${item.unit}`,
                subtitle: `PO Restock Supplier (${item.sku}) • Gerai Utama`,
                time: nowStr,
                type: "in",
              });
              count++;
            }
          }
        }
      }
      await loadStocksFromDB();
      await fetchStocks();
      setShowPoModal(false);
      showToast(`Pesanan PO (${count} bahan) berhasil dikirim ke database!`);
    } catch {
      showToast("Gagal memproses pesanan PO ke server!");
    }
  };

  // 6. HANDLER TAMBAH BAHAN BAKU BARU KE DATABASE
  const handleAddNewIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    const initStock = parseFloat(newItemStock);
    const safetyVal = parseFloat(newItemSafety);

    if (!cleanName) {
      showToast("Nama bahan baku wajib diisi!");
      return;
    }
    if (isNaN(initStock) || initStock < 0) {
      showToast("Stok awal harus berupa angka valid (>= 0)!");
      return;
    }
    if (isNaN(safetyVal) || safetyVal <= 0) {
      showToast("Batas aman (Safety Stock) harus lebih dari 0!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/stocks`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: cleanName,
          stock: initStock,
          unit: newItemUnit,
          minStock: safetyVal,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
        appendMutationLog({
          id: createMutationLogId("NEW"),
          title: `${cleanName.split(" ").slice(0, 3).join(" ")} • +${formatStockQty(initStock, newItemUnit)} ${newItemUnit}`,
          subtitle: `Stok awal bahan baku baru (${newItemCategory}) • Gerai Utama`,
          time: nowStr,
          type: "in",
        });
        await loadStocksFromDB();
        await fetchStocks();
        setNewItemName("");
        setNewItemStock("");
        setNewItemSafety("");
        setShowAddModal(false);
        showToast(
          `Bahan baku "${cleanName}" berhasil ditambahkan ke database!`
        );
      } else {
        showToast(json.message || "Gagal menambah bahan ke database!");
      }
    } catch {
      showToast("Gagal menghubungi server untuk menambah bahan!");
    }
  };

  // 7. HANDLER HAPUS BAHAN DARI DATABASE
  const handleDeleteStock = async (item: InventoryDetailItem) => {
    if (
      !confirm(
        `Yakin ingin menghapus ${item.name} (${item.sku}) dari database?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/stocks/${item.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        await loadStocksFromDB();
        await fetchStocks();
        showToast(`Bahan baku ${item.name} berhasil dihapus dari database!`);
      } else {
        showToast(json.message || "Gagal menghapus bahan dari database!");
      }
    } catch {
      showToast("Gagal menghubungi server untuk menghapus bahan!");
    }
  };

  // 8. FUNGSI EXPORT EXCEL (.csv UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      "Kode SKU",
      "Nama Bahan Baku",
      "Kategori",
      "Supplier",
      "Stok Aktual",
      "Batas Aman (Safety Stock)",
      "Ketahanan",
      "Harga Satuan",
      "Total Nilai Stok",
      "Status",
    ];

    const rows = filteredInventory.map((item) => [
      item.sku,
      item.name,
      item.category,
      item.supplier.replace("Supplier: ", ""),
      `${formatStockQty(item.stock, item.unit)} ${item.unit}`,
      `${formatStockQty(item.safetyStock, item.safetyUnit)} ${item.safetyUnit}`,
      item.daysLeft,
      `Rp ${item.unitPrice.toLocaleString("id-ID")}`,
      `Rp ${Math.round(item.stock * item.unitPrice).toLocaleString("id-ID")}`,
      item.status,
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((r) =>
          r
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Stok_Gerai_Utama_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Laporan stok Gerai Utama berhasil diunduh ke Excel!");
  };

  const filteredModalLogs = useMemo(() => {
    if (logModalFilter === "Semua") return logs;
    if (logModalFilter === "in") return logs.filter((l) => l.type === "in");
    return logs.filter((l) => l.type === "out" || l.type === "replace");
  }, [logs, logModalFilter]);

  const poRestockItems = useMemo(() => {
    return inventory.filter((item) => {
      const qty =
        parseFloat(String(poQuantities[item.sku] || "0").replace(",", ".")) ||
        0;
      return qty > 0 || item.status === "KRITIS" || item.status === "MENIPIS";
    });
  }, [inventory, poQuantities]);

  const visiblePoItems = useMemo(
    () => (poModalTab === "restock" ? poRestockItems : inventory),
    [poModalTab, poRestockItems, inventory]
  );

  const poSummary = useMemo(() => {
    let totalCost = 0;
    let filledCount = 0;
    inventory.forEach((item) => {
      const qty =
        parseFloat(String(poQuantities[item.sku] || "0").replace(",", ".")) ||
        0;
      if (qty > 0) {
        totalCost += Math.round(qty * item.unitPrice);
        filledCount++;
      }
    });
    return { totalCost, filledCount };
  }, [inventory, poQuantities]);

  return (
    <div className="min-h-screen print:min-h-0 bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 bg-[#2D452B] text-white border border-[#415C3E] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold transition-all">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 size={15} />
          </div>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* MODAL 1: AUDIT / OPNAME FISIK */}
      {showOpnameModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowOpnameModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold">
                    Lembar Kerja Audit / Opname Fisik (Gerai Utama)
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Masukkan hasil hitung fisik aktual untuk menyesuaikan stok sistem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOpnameModal(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveOpname}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-5 overflow-y-auto space-y-3">
                {inventory.map((item) => {
                  const valNum = parseFloat(opnameValues[item.sku] ?? "");
                  const diff = isNaN(valNum)
                    ? 0
                    : Number((valNum - item.stock).toFixed(1));
                  return (
                    <div
                      key={item.sku}
                      className="p-3.5 rounded-xl bg-gray-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-black">
                            {item.name}{" "}
                            <span className="font-mono text-[11px] text-neutral-700 font-bold">
                              [{item.sku}]
                            </span>
                          </div>
                          <div className="text-xs text-neutral-800 font-medium">
                            Stok Sistem:{" "}
                            <strong className="font-semibold text-black">
                              {item.stock} {item.unit}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            diff > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : diff < 0
                                ? "bg-red-50 text-[#DC2626] border border-red-200"
                                : "bg-gray-100 text-neutral-800"
                          }`}
                        >
                          {diff > 0
                            ? `+${diff} ${item.unit}`
                            : diff < 0
                              ? `${diff} ${item.unit}`
                              : "Sesuai"}
                        </span>

                        <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3 py-1.5 w-32">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={opnameValues[item.sku] ?? ""}
                            onChange={(e) =>
                              setOpnameValues((prev) => ({
                                ...prev,
                                [item.sku]: e.target.value,
                              }))
                            }
                            className="w-full text-xs sm:text-sm font-semibold text-black outline-none bg-transparent"
                          />
                          <span className="text-xs font-medium text-neutral-800 ml-1">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F3A712] hover:bg-[#df980e] text-black text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Simpan Hasil Opname</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PESAN KE SUPPLIER (QUICK PO) */}
      {showPoModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#DC2626] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} />
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold">
                    Form Re-Order Cepat (Gerai Utama)
                  </h3>
                  <p className="text-[11px] text-red-100 font-medium">
                    Daftar otomatis bahan baku berstatus Kritis &amp; Menipis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPoModal(false)}
                className="p-1 rounded-lg text-red-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSendPo}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="px-5 pt-3.5 pb-2.5 border-b border-neutral-200 flex items-center gap-2 bg-gray-50/70">
                <button
                  type="button"
                  onClick={() => setPoModalTab("restock")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    poModalTab === "restock"
                      ? "bg-[#DC2626] text-white shadow-2xs"
                      : "bg-white border border-neutral-300 text-black hover:bg-gray-100"
                  }`}
                >
                  Perlu Restock ({poRestockItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPoModalTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    poModalTab === "all"
                      ? "bg-[#2D452B] text-white shadow-2xs"
                      : "bg-white border border-neutral-300 text-black hover:bg-gray-100"
                  }`}
                >
                  Semua Bahan ({inventory.length})
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {visiblePoItems.length === 0 ? (
                  <div className="py-10 text-center space-y-2.5">
                    <p className="text-xs font-medium text-neutral-800">
                      Tidak ada bahan yang berstatus Kritis/Menipis atau terisi kuantitas PO.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPoModalTab("all")}
                      className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-black transition cursor-pointer"
                    >
                      Tampilkan Semua Bahan
                    </button>
                  </div>
                ) : (
                  visiblePoItems.map((item) => {
                    const qty =
                      parseFloat(
                        String(poQuantities[item.sku] || "0").replace(",", ".")
                      ) || 0;
                    const subtotal = Math.round(qty * item.unitPrice);
                    return (
                      <div
                        key={item.sku}
                        className="p-4 rounded-xl bg-gray-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-black">
                              {item.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-neutral-700">
                              [{item.sku}]
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.status === "KRITIS"
                                  ? "bg-red-100 text-red-700"
                                  : item.status === "MENIPIS"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-800 mt-1 font-medium">
                            Stok:{" "}
                            <strong className="font-semibold text-black">
                              {formatStockQty(item.stock, item.unit)} {item.unit}
                            </strong>{" "}
                            • Safety:{" "}
                            <strong className="font-semibold text-black">
                              {formatStockQty(item.safetyStock, item.safetyUnit)}{" "}
                              {item.safetyUnit}
                            </strong>
                          </div>
                          <div className="text-xs text-neutral-800 font-medium mt-0.5">
                            {item.supplier}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-xs text-neutral-800 font-medium">
                              Est. Biaya:
                            </div>
                            <div className="text-xs font-bold text-black tabular-nums">
                              Rp {subtotal.toLocaleString("id-ID")}
                            </div>
                          </div>

                          <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3 py-1.5 w-28">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={poQuantities[item.sku] || ""}
                              onChange={(e) =>
                                setPoQuantities((prev) => ({
                                  ...prev,
                                  [item.sku]: e.target.value,
                                }))
                              }
                              className="w-full text-xs sm:text-sm font-semibold text-black outline-none bg-transparent"
                            />
                            <span className="text-xs font-medium text-neutral-800 ml-1">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium text-neutral-700">
                    Total Estimasi Biaya PO ({poSummary.filledCount} bahan)
                  </div>
                  <div className="text-sm sm:text-base font-bold text-black tabular-nums">
                    Rp {poSummary.totalCost.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={poSummary.filledCount === 0}
                    className="px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <ShoppingCart size={14} />
                    <span>Kirim PO Restock ke Database</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RIWAYAT LENGKAP LOG MUTASI STOK */}
      {showLogsModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold">
                  Riwayat Lengkap Log Mutasi Stok (Gerai Utama)
                </h3>
                <p className="text-[11px] text-emerald-200 font-medium">
                  Total {logs.length} aktivitas tercatat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-3.5 pb-2 border-b border-neutral-200 flex items-center gap-2">
              {(
                [
                  { key: "Semua", label: `Semua (${logs.length})` },
                  {
                    key: "in",
                    label: `Stok Masuk (${logs.filter((l) => l.type === "in").length})`,
                  },
                  {
                    key: "out_replace",
                    label: `Pemakaian / Keluar (${
                      logs.filter((l) => l.type !== "in").length
                    })`,
                  },
                ] satisfies { key: LogFilterType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLogModalFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    logModalFilter === tab.key
                      ? "bg-[#F3A712] text-black"
                      : "bg-gray-100 text-black hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {filteredModalLogs.length === 0 ? (
                <div className="py-12 text-center text-neutral-800 font-medium text-xs">
                  Belum ada catatan mutasi stok tercatat.
                </div>
              ) : (
                filteredModalLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          log.type === "in"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : log.type === "replace"
                              ? "bg-amber-100 text-[#B45309] border border-amber-300"
                              : "bg-red-100 text-[#DC2626] border border-red-300"
                        }`}
                      >
                        {log.type === "in" ? (
                          "+"
                        ) : log.type === "replace" ? (
                          <RotateCcw size={12} />
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-black">
                          {log.title}
                        </p>
                        <p className="text-xs text-neutral-800 font-medium mt-0.5">
                          {log.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-neutral-800 shrink-0">
                      {log.time}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2D452B] text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH BAHAN BAKU BARU KE DATABASE */}
      {showAddModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PackagePlus size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold">
                    Tambah Bahan Baku Baru
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Daftarkan item inventaris baru langsung ke database MariaDB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddNewIngredient}
              className="p-5 overflow-y-auto space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Nama Bahan Baku *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Saus Keju Spesial"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-black focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Kategori Bahan
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) =>
                    setNewItemCategory(e.target.value as InventoryCategory)
                  }
                  className="w-full border border-neutral-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-black bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                  <option value="Protein & Unggas">Protein &amp; Unggas</option>
                  <option value="Bumbu & Sambal">Bumbu &amp; Sambal</option>
                  <option value="Tepung & Minyak">Tepung &amp; Minyak</option>
                  <option value="Minuman & Pelengkap">
                    Minuman &amp; Pelengkap
                  </option>
                  <option value="Kemasan / Box">Kemasan / Box</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="Misal: 10"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-black focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Satuan *
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full border border-neutral-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-black bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    <option value="kg">kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="Block">Block</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Batas Aman (Min) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    placeholder="Misal: 5"
                    value={newItemSafety}
                    onChange={(e) => setNewItemSafety(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-black focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-neutral-200 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2D452B] hover:bg-[#1E562F] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGASI UTAMA */}
      <Sidebar />

      {/* KONTEN UTAMA */}
      <main className="flex-1 min-w-0 flex flex-col gap-5">
        {/* TOP NAVBAR HEADER (SERAGAM DI SELURUH HALAMAN DASHBOARD) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
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
                Manajemen Stok &amp; Inventaris Dapur
              </div>
            </div>
          </div>

          {/* Right Controls: Online Sync & Admin Profile */}
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
        </header>

        {/* PAGE TITLE & ACTION SECTION */}
        <section className="print:hidden bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-black tracking-tight">
              Manajemen Stok &amp; Bahan Baku
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[11px] font-semibold whitespace-nowrap">
              <Sparkles size={11} className="text-violet-600 shrink-0" />
              AI Agent
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black transition cursor-pointer whitespace-nowrap"
            >
              <Printer size={14} />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 transition cursor-pointer whitespace-nowrap"
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenOpnameModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black transition cursor-pointer whitespace-nowrap"
            >
              <ClipboardCheck size={14} className="text-black" />
              <span>Audit / Opname Fisik</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F3A712] hover:bg-[#df980e] text-black font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <PlusCircle size={14} />
              <span>+ Tambah Bahan Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-4 print:gap-3">
          {/* Card 1: TOTAL ITEM AKTIF */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                TOTAL ITEM AKTIF
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                  {kpiStats.totalItems}
                </span>
                <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                  Bahan Baku
                </span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-gray-100 border border-neutral-200 text-neutral-950 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
          </div>

          {/* Card 2: STOK KRITIS / RESTOCK */}
          <div
            className={`rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border flex items-center justify-between gap-3 ${
              kpiStats.criticalCount > 0
                ? "bg-[#FFF5F5] border-red-300"
                : "bg-emerald-50/60 border-emerald-300"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                    kpiStats.criticalCount > 0
                      ? "text-[#DC2626]"
                      : "text-emerald-800"
                  }`}
                >
                  STOK KRITIS / RESTOCK
                </p>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[9px] font-semibold whitespace-nowrap shrink-0">
                  <Sparkles size={8} className="text-violet-600 shrink-0" />
                  <span>AI Agent</span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  className={`text-2xl print:text-lg font-extrabold whitespace-nowrap tabular-nums ${
                    kpiStats.criticalCount > 0
                      ? "text-[#DC2626]"
                      : "text-emerald-800"
                  }`}
                >
                  {kpiStats.criticalCount}
                </span>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    kpiStats.criticalCount > 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  Bahan Baku
                </span>
              </div>
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium min-w-0 ${
                  kpiStats.criticalCount > 0
                    ? "text-[#DC2626]"
                    : "text-emerald-700"
                }`}
                title={kpiStats.criticalLabel}
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span className="truncate">{kpiStats.criticalLabel}</span>
              </div>
            </div>
            <div
              className={`w-11 h-11 print:w-8 print:h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                kpiStats.criticalCount > 0
                  ? "bg-red-100 border-red-200 text-[#DC2626]"
                  : "bg-emerald-100 border-emerald-200 text-emerald-700"
              }`}
            >
              <Bell size={20} />
            </div>
          </div>

          {/* Card 3: KETAHANAN OPERASIONAL */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                  KETAHANAN OPERASIONAL
                </p>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[9px] font-semibold whitespace-nowrap shrink-0">
                  <Sparkles size={8} className="text-violet-600 shrink-0" />
                  <span>AI Agent</span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                  {kpiStats.avgDays}
                </span>
                <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                  Hari
                </span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>

          {/* Card 4: NILAI TOTAL INVENTARIS */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                NILAI TOTAL INVENTARIS
              </p>
              <div className="mt-2">
                <span className="text-lg xl:text-xl print:text-base font-extrabold text-black whitespace-nowrap tabular-nums">
                  Rp {Math.round(kpiStats.totalValue).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </div>
        </section>

        {/* AI STOCK FORECAST & PERINGATAN DINI TERPADU */}
        <AiStockForecastSection
          onApplyRecommendedPo={handleApplyRecommendedPo}
          onForecastUpdate={handleForecastUpdate}
          onNotify={showToast}
          refreshTrigger={rawInventory
            .map((item) => `${item.id}:${item.stock}`)
            .join("|")}
        />

        {/* 2-COLUMN MAIN CONTENT: LEFT (TABLE) & RIGHT (MUTATION FORM & LOGS) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: TABLE (8 COLS) */}
          <div className="xl:col-span-8 print:col-span-12 bg-white rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-sm border border-neutral-200 flex flex-col justify-between gap-4 h-full">
            <div className="flex flex-col gap-4 flex-1">
            {/* SEARCH & STATUS FILTER */}
            <div className="print:hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="Cari nama bahan, supplier, atau kode SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActivePage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 border border-neutral-300 rounded-xl text-xs font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-[#D97706] bg-gray-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActivePage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                  <span>STATUS:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setActivePage(1);
                    }}
                    className="border border-neutral-400 rounded-xl px-2.5 py-1.5 text-xs font-medium text-black bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    <option value="Semua Status">Semua Status</option>
                    <option value="KRITIS">KRITIS</option>
                    <option value="MENIPIS">MENIPIS</option>
                    <option value="AMAN">AMAN</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  className="p-1.5 border border-neutral-400 rounded-xl text-black hover:bg-gray-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="print:hidden flex items-center gap-1.5 flex-wrap pb-1 text-[11px] font-semibold border-b border-neutral-200">
              {(
                [
                  "Semua Bahan",
                  "Protein & Unggas",
                  "Bumbu & Sambal",
                  "Tepung & Minyak",
                  "Minuman & Pelengkap",
                  "Kemasan / Box",
                ] as const
              ).map((cat) => {
                const count =
                  cat === "Semua Bahan"
                    ? inventory.length
                    : inventory.filter((i) => i.filterTab === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setActivePage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                      activeCategory === cat
                        ? "bg-[#F3A712] text-black shadow-2xs font-semibold"
                        : "bg-gray-100 text-black font-medium hover:bg-gray-200"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* TABEL INVENTARIS */}
            <div className="overflow-x-auto print:overflow-visible flex-1">
              <table className="table-fixed w-full min-w-[740px] text-left border-collapse text-xs">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[7%] print:hidden" />
                </colgroup>
                <thead>
                  <tr className="border-b border-neutral-300 text-[10px] font-semibold text-neutral-700 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-2.5 px-2.5">BAHAN BAKU</th>
                    <th className="py-2.5 px-1.5">KATEGORI</th>
                    <th className="py-2.5 px-1.5">STOK</th>
                    <th className="py-2.5 px-1.5">KETAHANAN</th>
                    <th className="py-2.5 px-1.5">HARGA</th>
                    <th className="py-2.5 px-1 text-center">STATUS</th>
                    <th className="py-2.5 px-1 text-center print:hidden">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-black">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-neutral-800 font-medium"
                      >
                        Memuat data inventaris dari database MariaDB...
                      </td>
                    </tr>
                  ) : paginatedInventory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-neutral-800 font-medium"
                      >
                        Tidak ada data bahan baku yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item) => (
                      <tr
                        key={item.sku}
                        className="hover:bg-amber-50/30 transition-colors"
                      >
                        {/* Bahan Baku & SKU */}
                        <td className="py-2.5 px-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div
                                className="font-semibold text-black text-xs truncate"
                                title={item.name}
                              >
                                {item.name}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                <span className="font-mono inline-block px-1 py-0.2 rounded bg-gray-100 border border-neutral-200 text-neutral-950 font-bold text-[9px] shrink-0">
                                  {item.sku}
                                </span>
                                <span
                                  className="text-[10px] text-neutral-700 font-medium truncate"
                                  title={item.supplier}
                                >
                                  {item.supplier.replace(/^Supplier:\s*/i, "")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-2.5 px-1.5">
                          <span
                            className="font-medium text-neutral-950 text-xs truncate block"
                            title={item.category}
                          >
                            {item.category}
                          </span>
                        </td>

                        {/* Stok Aktual */}
                        <td className="py-2.5 px-1.5">
                          <div className="font-semibold text-black text-xs tabular-nums">
                            {formatStockQty(item.stock, item.unit)} {item.unit}
                          </div>
                          <div className="text-[10px] text-neutral-700 font-medium">
                            Min: {formatStockQty(item.safetyStock, item.safetyUnit)}{" "}
                            {item.safetyUnit}
                          </div>
                        </td>

                        {/* Ketahanan & Safety */}
                        <td className="py-2.5 px-1.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <div className="w-9 sm:w-11 h-1.5 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                <div
                                  style={{
                                    width: `${Math.min(item.pct, 100)}%`,
                                  }}
                                  className={`h-full rounded-full transition-all ${
                                    item.status === "KRITIS"
                                      ? "bg-red-500"
                                      : item.status === "MENIPIS"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                  }`}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-neutral-950 tabular-nums shrink-0">
                                {item.pct}%
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-emerald-800 tabular-nums">
                              {item.daysLeft}
                            </span>
                          </div>
                        </td>

                        {/* Harga Unit */}
                        <td className="py-2.5 px-1.5">
                          <div className="font-semibold text-black text-xs tabular-nums whitespace-nowrap">
                            Rp {item.unitPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="text-[10px] text-neutral-700 font-medium">
                            {item.priceUnit}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-1 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                              item.status === "KRITIS"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : item.status === "MENIPIS"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Aksi (+ Quick Add & Delete) */}
                        <td className="py-2.5 px-1 text-center print:hidden">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickRestockRow(item)}
                              title={`Tambah cepat +2 ${item.unit}`}
                              className="w-6.5 h-6.5 rounded-lg border border-neutral-300 hover:border-[#F3A712] hover:bg-amber-50 text-black hover:text-amber-800 flex items-center justify-center transition cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStock(item)}
                              title="Hapus Bahan Baku dari Database"
                              className="w-6.5 h-6.5 rounded-lg border border-neutral-300 hover:border-red-400 hover:bg-red-50 text-black hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>

            {/* Pagination & Summary */}
            <div className="print:hidden pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-800 font-medium">
              <div>
                Menampilkan{" "}
                <strong className="text-black font-semibold">
                  {paginatedInventory.length} dari {filteredInventory.length}
                </strong>{" "}
                item bahan baku operasional
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-neutral-400 rounded-lg text-black font-medium hover:text-black hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  Sebelumnya
                </button>
                {visiblePageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePage(p)}
                    className={`w-7 h-7 rounded-lg font-semibold transition cursor-pointer ${
                      currentPage === p
                        ? "bg-[#F3A712] text-black shadow-2xs"
                        : "border border-neutral-400 text-black hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setActivePage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-1.5 border border-neutral-400 rounded-lg text-black font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PENYESUAIAN CEPAT (DAPUR & KASIR) & LOG MUTASI (4 COLS) */}
          <div className="print:hidden xl:col-span-4 flex flex-col gap-5">
            {/* CARD 1: PENYESUAIAN CEPAT */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3.5 border-b border-neutral-200">
                <div className="w-10 h-10 rounded-xl bg-[#F3A712] text-black flex items-center justify-center shrink-0 shadow-xs">
                  <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-display font-bold text-base text-black">
                  Penyesuaian Cepat
                </h3>
              </div>

              <form
                onSubmit={handleSaveMutation}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Pilih Bahan Baku
                  </label>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black bg-gray-50 focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    {inventory.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.name} [{item.sku}]
                      </option>
                    ))}
                  </select>

                  {/* Kotak Info Live Stok Aktual, Batas Aman & Status */}
                  {selectedItemObj && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FAF8F3] border border-neutral-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-neutral-800 font-medium">
                          Stok Saat Ini:{" "}
                        </span>
                        <strong className="font-bold text-black">
                          {formatStockQty(
                            selectedItemObj.stock,
                            selectedItemObj.unit
                          )}{" "}
                          {selectedItemObj.unit}
                        </strong>
                        <span className="text-neutral-700 mx-1.5">•</span>
                        <span className="text-neutral-800 font-medium">
                          Safety:{" "}
                          <strong className="font-semibold text-black">
                            {formatStockQty(
                              selectedItemObj.safetyStock,
                              selectedItemObj.safetyUnit
                            )}{" "}
                            {selectedItemObj.safetyUnit}
                          </strong>
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0 ${
                          selectedItemObj.status === "KRITIS"
                            ? "bg-red-100 text-[#DC2626] border border-red-200"
                            : selectedItemObj.status === "MENIPIS"
                              ? "bg-amber-100 text-[#B45309] border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {selectedItemObj.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5">
                      Tipe Mutasi
                    </label>
                    <select
                      value={mutationType}
                      onChange={(e) =>
                        setMutationType(e.target.value as MutationType)
                      }
                      className="w-full border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                      <option value="Stok Masuk (PO)">Stok Masuk (PO)</option>
                      <option value="Pemakaian Dapur">Pemakaian Dapur</option>
                      <option value="Stok Rusak / Basi">
                        Stok Rusak / Basi
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-black">
                        Jumlah
                      </label>
                      <span className="text-[10px] font-medium text-amber-700">
                        Min. 0.1 {selectedItemObj?.unit || "kg"}
                      </span>
                    </div>
                    <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3.5 py-2.5 focus-within:border-[#D97706]">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Misal: 0.5"
                        value={mutationAmount}
                        onChange={(e) => setMutationAmount(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-black outline-none bg-transparent"
                      />
                      <span className="text-xs font-semibold text-neutral-800 ml-1.5 shrink-0">
                        {selectedItemObj?.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Catatan / No. Faktur
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengiriman Supplier Pagi / No. DO-8812"
                    value={mutationNote}
                    onChange={(e) => setMutationNote(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 bg-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#F3A712] hover:bg-[#df980e] text-black font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer mt-1"
                >
                  <Save size={15} />
                  <span>Simpan Mutasi Stok</span>
                </button>
              </form>
            </div>

            {/* CARD 2: LOG MUTASI */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200">
                <h3 className="font-display font-bold text-base text-black">
                  Log Mutasi Hari Ini
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLogsModal(true)}
                  className="text-xs font-semibold text-[#D97706] hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-neutral-700 text-xs font-medium">
                    Belum ada log mutasi tercatat hari ini.
                  </div>
                ) : (
                  logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            log.type === "in"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : log.type === "replace"
                                ? "bg-amber-100 text-[#B45309] border border-amber-300"
                                : "bg-red-100 text-[#DC2626] border border-red-300"
                          }`}
                        >
                          {log.type === "in" ? (
                            "+"
                          ) : log.type === "replace" ? (
                            <RotateCcw size={11} />
                          ) : (
                            "-"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-black truncate">
                            {log.title}
                          </p>
                          <p className="text-[11px] text-neutral-700 font-medium mt-0.5 leading-snug truncate">
                            {log.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-neutral-700 shrink-0">
                        {log.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SYSTEM */}
        <footer className="print:hidden pt-3 pb-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-700 font-medium">
          <span className="font-display font-bold text-[#EA8E18]">
            PrekDuaDara
          </span>
          <span>&copy; 2026 PrekDuaDara. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
