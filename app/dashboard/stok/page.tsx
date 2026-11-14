"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useStok } from "@/context/StokContext";
import {
  AlertTriangle,
  Bell,
  Box,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
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
  Store,
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

type SingleBranchName =
  | "Cabang Sudirman Utama"
  | "Cabang Tebet Eco Park"
  | "Cabang Dago Heritage";

interface InventoryDetailItem {
  sku: string;
  contextId?: string;
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
  unitPrice: number;
  priceUnit: string;
  status: StockStatus;
  icon: string;
  iconBg: string;
}

interface MutationLog {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "out" | "in" | "replace";
  branch: SingleBranchName;
}

const BRANCH_OPTIONS = [
  "Semua Cabang",
  "Cabang Sudirman Utama",
  "Cabang Tebet Eco Park",
  "Cabang Dago Heritage",
] as const;

const SINGLE_BRANCHES: SingleBranchName[] = [
  "Cabang Sudirman Utama",
  "Cabang Tebet Eco Park",
  "Cabang Dago Heritage",
];

const ITEMS_PER_PAGE = 5;

// Helper perhitungan tunggal untuk status, persentase bar (0-100), dan estimasi hari bertahan
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

function buildItem(
  base: Omit<InventoryDetailItem, "status" | "pct" | "daysLeft">
): InventoryDetailItem {
  const metrics = computeStockMetrics(base.stock, base.safetyStock);
  return {
    ...base,
    ...metrics,
  };
}

const BASE_SUDIRMAN_ITEMS: InventoryDetailItem[] = [
  buildItem({
    sku: "CBI-01",
    contextId: "STK-02",
    name: "Cabai Rawit Merah Setan",
    supplier: "Supplier: Tani Segar Jaya (Kramat)",
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    stock: 3.5,
    unit: "kg",
    safetyStock: 10,
    safetyUnit: "kg",
    unitPrice: 65000,
    priceUnit: "/Kg",
    icon: "🌶️",
    iconBg: "bg-red-50 border-red-200",
  }),
  buildItem({
    sku: "AYM-01",
    contextId: "STK-01",
    name: "Daging Ayam Segar Potong 4",
    supplier: "Supplier: Rumah Potong Unggas Berkah",
    category: "Protein & Unggas",
    filterTab: "Protein & Unggas",
    stock: 54.0,
    unit: "kg",
    safetyStock: 30,
    safetyUnit: "kg",
    unitPrice: 38500,
    priceUnit: "/Kg",
    icon: "🍗",
    iconBg: "bg-amber-50 border-amber-200",
  }),
  buildItem({
    sku: "MYK-01",
    contextId: "STK-04",
    name: "Minyak Goreng Sawit Curah Higienis",
    supplier: "Supplier: Distribusi Pangan Makmur",
    category: "Tepung & Minyak",
    filterTab: "Tepung & Minyak",
    stock: 12.0,
    unit: "Liter",
    safetyStock: 25,
    safetyUnit: "Liter",
    unitPrice: 17000,
    priceUnit: "/Liter",
    icon: "💧",
    iconBg: "bg-amber-50 border-amber-200",
  }),
  buildItem({
    sku: "TPG-01",
    name: "Tepung Terigu Krispi Racikan PrekDuaDara",
    supplier: "Supplier: Sentral Tepung Bogasari",
    category: "Tepung & Minyak",
    filterTab: "Tepung & Minyak",
    stock: 18.5,
    unit: "kg",
    safetyStock: 20,
    safetyUnit: "kg",
    unitPrice: 12500,
    priceUnit: "/Kg",
    icon: "🌾",
    iconBg: "bg-yellow-50 border-yellow-200",
  }),
  buildItem({
    sku: "BRS-01",
    contextId: "STK-03",
    name: "Beras Putih Pulen Rojolele Super",
    supplier: "Supplier: Lumbung Padi Karawang Jaya",
    category: "Bumbu & Pelengkap",
    filterTab: "Bumbu & Sambal",
    stock: 85.0,
    unit: "kg",
    safetyStock: 35,
    safetyUnit: "kg",
    unitPrice: 14500,
    priceUnit: "/Kg",
    icon: "🍚",
    iconBg: "bg-gray-50 border-gray-200",
  }),
  buildItem({
    sku: "BWG-01",
    name: "Bawang Putih Kating Bersih",
    supplier: "Supplier: Juragan Sayur Majalengka",
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    stock: 14.0,
    unit: "kg",
    safetyStock: 8,
    safetyUnit: "kg",
    unitPrice: 42000,
    priceUnit: "/Kg",
    icon: "🧄",
    iconBg: "bg-orange-50 border-orange-200",
  }),
  buildItem({
    sku: "KJU-01",
    name: "Mozarella Block Anchor Leleh",
    supplier: "Supplier: Dairy Food Indofood",
    category: "Protein & Pelengkap",
    filterTab: "Protein & Unggas",
    stock: 4.0,
    unit: "Block",
    safetyStock: 5,
    safetyUnit: "Block",
    unitPrice: 115000,
    priceUnit: "/Block",
    icon: "🧀",
    iconBg: "bg-amber-50 border-amber-200",
  }),
  buildItem({
    sku: "TEH-01",
    contextId: "STK-05",
    name: "Daun Teh Melati Wangi Solo",
    supplier: "Supplier: Kebun Teh Wangi",
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    stock: 22.0,
    unit: "Bungkus",
    safetyStock: 10,
    safetyUnit: "Bungkus",
    unitPrice: 18000,
    priceUnit: "/Pak",
    icon: "🍃",
    iconBg: "bg-emerald-50 border-emerald-200",
  }),
  buildItem({
    sku: "GLA-01",
    name: "Gula Pasir Kristal Putih Gulaku",
    supplier: "Supplier: Grosir Sembako Mulia",
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    stock: 30.0,
    unit: "kg",
    safetyStock: 15,
    safetyUnit: "kg",
    unitPrice: 17500,
    priceUnit: "/Kg",
    icon: "🧂",
    iconBg: "bg-slate-50 border-slate-200",
  }),
  buildItem({
    sku: "BOX-01",
    name: "Kotak Kemasan Cetak PrekDuaDara",
    supplier: "Supplier: Percetakan Kemasan Nusantara",
    category: "Kemasan / Box",
    filterTab: "Kemasan / Box",
    stock: 450,
    unit: "Pcs",
    safetyStock: 200,
    safetyUnit: "Pcs",
    unitPrice: 1250,
    priceUnit: "/Pcs",
    icon: "📦",
    iconBg: "bg-amber-50 border-amber-200",
  }),
];

// Profil Cabang Tebet Eco Park: Daging Ayam (AYM-01) & Mozarella (KJU-01) KRITIS/MENIPIS, Cabai Rawit aman
const BASE_TEBET_ITEMS: InventoryDetailItem[] = BASE_SUDIRMAN_ITEMS.map(
  (item) => {
    const stockOverrides: Record<
      string,
      { stock: number; safetyStock: number }
    > = {
      "CBI-01": { stock: 14.5, safetyStock: 9 },
      "AYM-01": { stock: 11.0, safetyStock: 26 },
      "MYK-01": { stock: 28.0, safetyStock: 20 },
      "TPG-01": { stock: 16.0, safetyStock: 18 },
      "BRS-01": { stock: 68.0, safetyStock: 30 },
      "BWG-01": { stock: 11.5, safetyStock: 7 },
      "KJU-01": { stock: 2.0, safetyStock: 5 },
      "TEH-01": { stock: 18.0, safetyStock: 10 },
      "GLA-01": { stock: 24.0, safetyStock: 14 },
      "BOX-01": { stock: 340, safetyStock: 180 },
    };
    const ov = stockOverrides[item.sku];
    return buildItem({
      ...item,
      contextId: undefined,
      stock: ov ? ov.stock : item.stock,
      safetyStock: ov ? ov.safetyStock : item.safetyStock,
    });
  }
);

// Profil Cabang Dago Heritage: Tepung Terigu (TPG-01) & Bawang Putih (BWG-01) KRITIS/MENIPIS
const BASE_DAGO_ITEMS: InventoryDetailItem[] = BASE_SUDIRMAN_ITEMS.map(
  (item) => {
    const stockOverrides: Record<
      string,
      { stock: number; safetyStock: number }
    > = {
      "CBI-01": { stock: 12.0, safetyStock: 8 },
      "AYM-01": { stock: 42.0, safetyStock: 24 },
      "MYK-01": { stock: 24.0, safetyStock: 18 },
      "TPG-01": { stock: 7.5, safetyStock: 18 },
      "BRS-01": { stock: 62.0, safetyStock: 28 },
      "BWG-01": { stock: 3.0, safetyStock: 8 },
      "KJU-01": { stock: 6.5, safetyStock: 4 },
      "TEH-01": { stock: 16.0, safetyStock: 8 },
      "GLA-01": { stock: 12.5, safetyStock: 14 },
      "BOX-01": { stock: 310, safetyStock: 160 },
    };
    const ov = stockOverrides[item.sku];
    return buildItem({
      ...item,
      contextId: undefined,
      stock: ov ? ov.stock : item.stock,
      safetyStock: ov ? ov.safetyStock : item.safetyStock,
    });
  }
);

const INITIAL_BRANCH_INVENTORIES: Record<
  SingleBranchName,
  InventoryDetailItem[]
> = {
  "Cabang Sudirman Utama": BASE_SUDIRMAN_ITEMS,
  "Cabang Tebet Eco Park": BASE_TEBET_ITEMS,
  "Cabang Dago Heritage": BASE_DAGO_ITEMS,
};

const INITIAL_BRANCH_LOGS: Record<SingleBranchName, MutationLog[]> = {
  "Cabang Sudirman Utama": [
    {
      id: "LOG-SUD-1",
      title: "Daging Ayam • -12 Potong",
      subtitle: "Auto-Deduct POS #GPRK-8829 (Geprek Mozarella)",
      time: "13:20 WIB",
      type: "out",
      branch: "Cabang Sudirman Utama",
    },
    {
      id: "LOG-SUD-2",
      title: "Cabai Rawit Merah • -0.8 kg",
      subtitle: "Batch Ulek Sambal Siang (Dapur Line 1–2)",
      time: "13:05 WIB",
      type: "out",
      branch: "Cabang Sudirman Utama",
    },
    {
      id: "LOG-SUD-3",
      title: "Daging Ayam Segar • +50 kg",
      subtitle: "Penerimaan RPU Berkah (Faktur PO-219)",
      time: "08:30 WIB",
      type: "in",
      branch: "Cabang Sudirman Utama",
    },
    {
      id: "LOG-SUD-4",
      title: "Beras Rojolele • +2 Sak (50kg)",
      subtitle: "Tani Sembako Karawang (Faktur PO-218)",
      time: "07:15 WIB",
      type: "in",
      branch: "Cabang Sudirman Utama",
    },
    {
      id: "LOG-SUD-5",
      title: "Minyak Jelantah • -4.5 Liter",
      subtitle: "Penggantian minyak wajan deep-fryer pagi",
      time: "06:45 WIB",
      type: "replace",
      branch: "Cabang Sudirman Utama",
    },
  ],
  "Cabang Tebet Eco Park": [
    {
      id: "LOG-TBT-1",
      title: "Daging Ayam Segar • -9.5 kg",
      subtitle: "Auto-Deduct POS #GPRK-8828 (Rombongan Taman)",
      time: "13:10 WIB",
      type: "out",
      branch: "Cabang Tebet Eco Park",
    },
    {
      id: "LOG-TBT-2",
      title: "Mozarella Block • -1.5 Block",
      subtitle: "Pemakaian Topping Geprek Leleh Siang",
      time: "12:35 WIB",
      type: "out",
      branch: "Cabang Tebet Eco Park",
    },
    {
      id: "LOG-TBT-3",
      title: "Cabai Rawit Merah • +10 kg",
      subtitle: "Kiriman Segar Pasar Induk Kramat Jati",
      time: "08:10 WIB",
      type: "in",
      branch: "Cabang Tebet Eco Park",
    },
  ],
  "Cabang Dago Heritage": [
    {
      id: "LOG-DGO-1",
      title: "Tepung Terigu Krispi • -5.5 kg",
      subtitle: "Batch Penepungan Ayam Crispy Shift Pagi",
      time: "12:50 WIB",
      type: "out",
      branch: "Cabang Dago Heritage",
    },
    {
      id: "LOG-DGO-2",
      title: "Bawang Putih Kating • -1.2 kg",
      subtitle: "Bumbu Marinasi & Sambal Bawang Dago",
      time: "11:40 WIB",
      type: "out",
      branch: "Cabang Dago Heritage",
    },
    {
      id: "LOG-DGO-3",
      title: "Daging Ayam Segar • +30 kg",
      subtitle: "Penerimaan Supplier Unggas Lembang",
      time: "07:50 WIB",
      type: "in",
      branch: "Cabang Dago Heritage",
    },
  ],
};

function mapCategoryToFilterTab(cat: InventoryCategory): FilterTabCategory {
  if (cat === "Protein & Unggas" || cat === "Protein & Pelengkap") {
    return "Protein & Unggas";
  }
  if (cat === "Bumbu & Sambal" || cat === "Bumbu & Pelengkap") {
    return "Bumbu & Sambal";
  }
  if (cat === "Tepung & Minyak") {
    return "Tepung & Minyak";
  }
  if (cat === "Minuman & Pelengkap") {
    return "Minuman & Pelengkap";
  }
  return "Kemasan / Box";
}

export default function StokPage() {
  // Pertahankan state global StokContext sesuai .cursorrules
  const { updateStok, restockItem } = useStok();

  const [branchInventories, setBranchInventories] = useState<
    Record<SingleBranchName, InventoryDetailItem[]>
  >(INITIAL_BRANCH_INVENTORIES);

  const [branchLogs, setBranchLogs] = useState<
    Record<SingleBranchName, MutationLog[]>
  >(INITIAL_BRANCH_LOGS);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [activeCategory, setActiveCategory] = useState("Semua Bahan");
  const [activePage, setActivePage] = useState(1);

  // Status Re-Order ditandai per cabang
  const [reorderMarkedByBranch, setReorderMarkedByBranch] = useState<
    Record<string, boolean>
  >({
    "Semua Cabang": false,
    "Cabang Sudirman Utama": false,
    "Cabang Tebet Eco Park": false,
    "Cabang Dago Heritage": false,
  });

  // State Dropdown Cabang di Header (Default: "Semua Cabang")
  const [selectedBranch, setSelectedBranch] = useState<string>("Semua Cabang");
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement | null>(null);

  // Handler Reset seluruh filter ke kondisi awal ("Semua Cabang")
  const handleResetFilters = () => {
    setSelectedBranch("Semua Cabang");
    setSearchQuery("");
    setStatusFilter("Semua Status");
    setActiveCategory("Semua Bahan");
    setActivePage(1);
    showToast("Seluruh filter telah direset ke Semua Cabang.");
  };

  // State Form Penyesuaian Cepat
  const [mutationTargetBranch, setMutationTargetBranch] =
    useState<SingleBranchName>("Cabang Sudirman Utama");
  const [selectedSku, setSelectedSku] = useState("CBI-01");
  const [mutationType, setMutationType] =
    useState<MutationType>("Stok Masuk (PO)");
  const [mutationAmount, setMutationAmount] = useState("");
  const [mutationNote, setMutationNote] = useState("");

  // Toast Notification dengan useRef timer
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State Modal Interaktif (Opname Fisik, Quick PO, Riwayat Log, & Tambah Bahan Baru)
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameValues, setOpnameValues] = useState<Record<string, string>>({});
  const [showPoModal, setShowPoModal] = useState(false);
  const [poQuantities, setPoQuantities] = useState<Record<string, string>>({});
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logModalFilter, setLogModalFilter] =
    useState<LogFilterType>("Semua");

  // Modal Tambah Bahan Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemSupplier, setNewItemSupplier] = useState("");
  const [newItemCategory, setNewItemCategory] =
    useState<InventoryCategory>("Bumbu & Sambal");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemSafety, setNewItemSafety] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  // Click-outside handler untuk menutup dropdown cabang
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBranchMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sinkronisasi awal Cabang Sudirman Utama ke StokContext saat mount
  const hasSyncedInitialContext = useRef(false);
  useEffect(() => {
    if (!hasSyncedInitialContext.current) {
      hasSyncedInitialContext.current = true;
      branchInventories["Cabang Sudirman Utama"].forEach((item) => {
        if (item.contextId) {
          updateStok(item.contextId, item.stock);
        }
      });
    }
  }, [branchInventories, updateStok]);

  // Cabang target untuk aksi tulis (jika "Semua Cabang" aktif, gunakan mutationTargetBranch)
  const targetWriteBranch: SingleBranchName =
    selectedBranch === "Semua Cabang"
      ? mutationTargetBranch
      : (selectedBranch as SingleBranchName);

  // Daftar inventaris aktif berdasarkan pilihan cabang (atau agregasi Semua Cabang)
  const inventory = useMemo<InventoryDetailItem[]>(() => {
    if (selectedBranch !== "Semua Cabang") {
      return (
        branchInventories[selectedBranch as SingleBranchName] ||
        branchInventories["Cabang Sudirman Utama"]
      );
    }

    // Gabungan (agregasi) stok & safetyStock dari ketiga gerai
    const skuMap = new Map<string, InventoryDetailItem>();

    SINGLE_BRANCHES.forEach((bName) => {
      branchInventories[bName].forEach((item) => {
        const existing = skuMap.get(item.sku);
        if (!existing) {
          skuMap.set(item.sku, { ...item });
        } else {
          const combinedStock =
            item.unit === "Pcs"
              ? Math.round(existing.stock + item.stock)
              : Number((existing.stock + item.stock).toFixed(1));
          const combinedSafety =
            item.unit === "Pcs"
              ? Math.round(existing.safetyStock + item.safetyStock)
              : Number((existing.safetyStock + item.safetyStock).toFixed(1));
          const metrics = computeStockMetrics(combinedStock, combinedSafety);
          skuMap.set(item.sku, {
            ...existing,
            stock: combinedStock,
            safetyStock: combinedSafety,
            ...metrics,
          });
        }
      });
    });

    return Array.from(skuMap.values());
  }, [branchInventories, selectedBranch]);

  // Daftar log mutasi aktif sesuai cabang
  const logs = useMemo<MutationLog[]>(() => {
    if (selectedBranch !== "Semua Cabang") {
      return (
        branchLogs[selectedBranch as SingleBranchName] ||
        branchLogs["Cabang Sudirman Utama"]
      );
    }
    return [
      ...branchLogs["Cabang Sudirman Utama"],
      ...branchLogs["Cabang Tebet Eco Park"],
      ...branchLogs["Cabang Dago Heritage"],
    ];
  }, [branchLogs, selectedBranch]);

  const reorderMarked = Boolean(reorderMarkedByBranch[selectedBranch]);

  const selectedItemObj = useMemo(
    () => inventory.find((i) => i.sku === selectedSku) || inventory[0],
    [inventory, selectedSku]
  );

  // Untuk validasi stok keluar saat "Semua Cabang" aktif, ambil item dari cabang target atau tampilan aktif
  const targetBranchSelectedItem = useMemo(() => {
    const branchList = branchInventories[targetWriteBranch];
    return (
      branchList.find((i) => i.sku === selectedSku) ||
      selectedItemObj ||
      branchList[0]
    );
  }, [branchInventories, targetWriteBranch, selectedSku, selectedItemObj]);

  // Kalkulasi Dinamis 4 KPI Card & Daftar Item Kritis (Deteksi per cabang saat "Semua Cabang" aktif)
  const kpiStats = useMemo(() => {
    const totalItems = inventory.length;

    const criticalItems: (InventoryDetailItem & {
      branchName: SingleBranchName;
      branchShort: string;
    })[] = [];

    if (selectedBranch === "Semua Cabang") {
      SINGLE_BRANCHES.forEach((bName) => {
        const bShort = bName.replace("Cabang ", "");
        branchInventories[bName].forEach((item) => {
          if (item.status === "KRITIS") {
            criticalItems.push({
              ...item,
              branchName: bName,
              branchShort: bShort,
            });
          }
        });
      });
    } else {
      const bName = selectedBranch as SingleBranchName;
      const bShort = bName.replace("Cabang ", "");
      inventory.forEach((item) => {
        if (item.status === "KRITIS") {
          criticalItems.push({
            ...item,
            branchName: bName,
            branchShort: bShort,
          });
        }
      });
    }

    const totalValue = inventory.reduce(
      (acc, item) => acc + item.stock * item.unitPrice,
      0
    );

    const totalDays = inventory.reduce((acc, item) => {
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
            .map((i) => {
              const shortName = i.name.split(" ").slice(0, 2).join(" ");
              return selectedBranch === "Semua Cabang"
                ? `${shortName} (${i.branchShort.split(" ")[0]})`
                : shortName;
            })
            .join(" & ");

    return {
      totalItems,
      criticalItems,
      criticalCount: criticalItems.length,
      criticalLabel,
      totalValue,
      avgDays,
    };
  }, [inventory, branchInventories, selectedBranch]);

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

  const filteredTotalValue = useMemo(
    () =>
      filteredInventory.reduce(
        (sum, item) => sum + item.stock * item.unitPrice,
        0
      ),
    [filteredInventory]
  );

  // Pagination: 5 item per halaman & maksimal 5 tombol nomor halaman
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
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Helper pembuat UID unik untuk Log Mutasi
  const createUid = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Helper update inventaris satu cabang + sinkronisasi StokContext di luar updater setState
  const updateBranchItemStock = (
    branch: SingleBranchName,
    sku: string,
    computeNewStock: (currentStock: number, item: InventoryDetailItem) => number
  ) => {
    const currentList = branchInventories[branch];
    let becameCritical = false;
    const contextUpdates: { id: string; nextStock: number }[] = [];

    const nextList = currentList.map((row) => {
      if (row.sku !== sku) return row;
      const rawNext = computeNewStock(row.stock, row);
      const nextStock =
        row.unit === "Pcs"
          ? Math.max(0, Math.round(rawNext))
          : Math.max(0, Number(rawNext.toFixed(1)));
      const metrics = computeStockMetrics(nextStock, row.safetyStock);
      if (row.status !== "KRITIS" && metrics.status === "KRITIS") {
        becameCritical = true;
      }
      if (branch === "Cabang Sudirman Utama" && row.contextId) {
        contextUpdates.push({ id: row.contextId, nextStock });
      }
      return {
        ...row,
        stock: nextStock,
        ...metrics,
      };
    });

    setBranchInventories((prev) => ({
      ...prev,
      [branch]: nextList,
    }));

    contextUpdates.forEach((u) => {
      updateStok(u.id, u.nextStock);
    });

    if (becameCritical) {
      setReorderMarkedByBranch((prev) => ({
        ...prev,
        [branch]: false,
        "Semua Cabang": false,
      }));
    }
  };

  // Handler tambah cepat (+ button pada baris tabel)
  const handleQuickRestockRow = (item: InventoryDetailItem) => {
    const addVal = item.unit === "Pcs" ? 50 : 5;
    const branchToUpdate = targetWriteBranch;

    updateBranchItemStock(branchToUpdate, item.sku, (curr) => curr + addVal);

    const uid = createUid();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const newLog: MutationLog = {
      id: `LOG-${uid}-${item.sku}`,
      title: `${item.name.split(" ").slice(0, 3).join(" ")} • +${addVal} ${item.unit}`,
      subtitle: `Penambahan cepat stok tabel (${item.sku}) • ${branchToUpdate}`,
      time: nowStr,
      type: "in",
      branch: branchToUpdate,
    };

    setBranchLogs((prev) => ({
      ...prev,
      [branchToUpdate]: [newLog, ...prev[branchToUpdate]],
    }));

    showToast(
      `+${addVal} ${item.unit} ditambahkan ke ${item.name} (${branchToUpdate})`
    );
  };

  // Handler simpan form Penyesuaian Cepat
  const handleSaveMutation = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(mutationAmount);
    if (isNaN(qty) || qty <= 0) {
      showToast("Masukkan jumlah mutasi stok yang valid (lebih dari 0)!");
      return;
    }

    const isAddition = mutationType === "Stok Masuk (PO)";
    const branchToUpdate = targetWriteBranch;
    const branchItem = targetBranchSelectedItem;

    // Validasi stok keluar tidak boleh melebihi stok aktual
    if (!isAddition && qty > branchItem.stock) {
      showToast(
        `Stok tidak mencukupi! Sisa stok ${branchItem.name} di ${branchToUpdate} saat ini: ${branchItem.stock} ${branchItem.unit}.`
      );
      return;
    }

    updateBranchItemStock(branchToUpdate, selectedSku, (curr) =>
      isAddition ? curr + qty : curr - qty
    );

    const uid = createUid();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const newLog: MutationLog = {
      id: `LOG-${uid}-${branchItem.sku}`,
      title: `${branchItem.name.split(" ").slice(0, 3).join(" ")} • ${
        isAddition ? "+" : "-"
      }${qty} ${branchItem.unit}`,
      subtitle: `${
        mutationNote.trim() || `${mutationType} (${branchItem.sku})`
      } • ${branchToUpdate}`,
      time: nowStr,
      type: isAddition
        ? "in"
        : mutationType === "Stok Rusak / Basi"
          ? "replace"
          : "out",
      branch: branchToUpdate,
    };

    setBranchLogs((prev) => ({
      ...prev,
      [branchToUpdate]: [newLog, ...prev[branchToUpdate]],
    }));

    setMutationAmount("");
    setMutationNote("");
    showToast(
      `Mutasi stok ${branchItem.name} berhasil disimpan ke ${branchToUpdate}!`
    );
  };

  // Buka Modal Audit / Opname Fisik
  const handleOpenOpnameModal = () => {
    const sourceList = branchInventories[targetWriteBranch];
    const initialMap: Record<string, string> = {};
    sourceList.forEach((item) => {
      initialMap[item.sku] = String(item.stock);
    });
    setOpnameValues(initialMap);
    setShowOpnameModal(true);
  };

  // Simpan Hasil Audit / Opname Fisik
  const handleSaveOpname = (e: React.FormEvent) => {
    e.preventDefault();
    const branchToUpdate = targetWriteBranch;
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const uid = createUid();
    const currentList = branchInventories[branchToUpdate];
    const newLogs: MutationLog[] = [];
    const contextUpdates: { id: string; nextStock: number }[] = [];
    let hasNewCritical = false;

    const nextList = currentList.map((row) => {
      const rawVal = opnameValues[row.sku];
      const parsed = parseFloat(rawVal);
      if (isNaN(parsed) || parsed < 0 || parsed === row.stock) {
        return row;
      }

      const diff = Number((parsed - row.stock).toFixed(1));
      const nextStock =
        row.unit === "Pcs" ? Math.round(parsed) : Number(parsed.toFixed(1));
      const metrics = computeStockMetrics(nextStock, row.safetyStock);

      if (row.status !== "KRITIS" && metrics.status === "KRITIS") {
        hasNewCritical = true;
      }

      if (branchToUpdate === "Cabang Sudirman Utama" && row.contextId) {
        contextUpdates.push({ id: row.contextId, nextStock });
      }

      newLogs.push({
        id: `LOG-OPN-${uid}-${row.sku}`,
        title: `${row.name.split(" ").slice(0, 3).join(" ")} • ${
          diff > 0 ? `+${diff}` : diff
        } ${row.unit}`,
        subtitle: `Penyesuaian Audit / Opname Fisik (${row.sku}) • ${branchToUpdate}`,
        time: nowStr,
        type: diff > 0 ? "in" : "replace",
        branch: branchToUpdate,
      });

      return {
        ...row,
        stock: nextStock,
        ...metrics,
      };
    });

    setBranchInventories((prev) => ({
      ...prev,
      [branchToUpdate]: nextList,
    }));

    contextUpdates.forEach((u) => {
      updateStok(u.id, u.nextStock);
    });

    if (hasNewCritical) {
      setReorderMarkedByBranch((prev) => ({
        ...prev,
        [branchToUpdate]: false,
        "Semua Cabang": false,
      }));
    }

    if (newLogs.length > 0) {
      setBranchLogs((prev) => ({
        ...prev,
        [branchToUpdate]: [...newLogs, ...prev[branchToUpdate]],
      }));
      showToast(
        `Hasil Opname Fisik ${branchToUpdate} disimpan (${newLogs.length} bahan disesuaikan)!`
      );
    } else {
      showToast("Stok fisik sesuai sistem, tidak ada selisih opname.");
    }
    setShowOpnameModal(false);
  };

  // Buka Modal Pesan ke Supplier Sekarang (Quick PO Lintas Cabang)
  const handleOpenPoModal = () => {
    const branchesToInspect: SingleBranchName[] =
      selectedBranch === "Semua Cabang"
        ? SINGLE_BRANCHES
        : [selectedBranch as SingleBranchName];

    const initialPo: Record<string, string> = {};

    branchesToInspect.forEach((bName) => {
      const list = branchInventories[bName];
      const criticalOrLow = list.filter(
        (item) => item.status === "KRITIS" || item.status === "MENIPIS"
      );
      criticalOrLow.forEach((item) => {
        const key = `${bName}::${item.sku}`;
        const recommended = Math.max(
          item.unit === "Pcs" ? 100 : 10,
          Number((item.safetyStock * 1.5 - item.stock).toFixed(1))
        );
        initialPo[key] = String(recommended);
      });
    });

    // Fallback jika semua aman di cabang terpilih
    if (Object.keys(initialPo).length === 0) {
      const fallbackBranch = targetWriteBranch;
      branchInventories[fallbackBranch].slice(0, 3).forEach((item) => {
        const key = `${fallbackBranch}::${item.sku}`;
        const recommended = item.unit === "Pcs" ? 100 : 10;
        initialPo[key] = String(recommended);
      });
    }

    setPoQuantities(initialPo);
    setShowPoModal(true);
  };

  // Daftar item yang ditampilkan di dalam Modal Quick PO
  const poModalEntries = useMemo(() => {
    const entries: {
      key: string;
      branchName: SingleBranchName;
      branchShort: string;
      item: InventoryDetailItem;
    }[] = [];

    SINGLE_BRANCHES.forEach((bName) => {
      const bShort = bName.replace("Cabang ", "");
      branchInventories[bName].forEach((item) => {
        const key = `${bName}::${item.sku}`;
        if (key in poQuantities) {
          entries.push({ key, branchName: bName, branchShort: bShort, item });
        }
      });
    });

    return entries;
  }, [branchInventories, poQuantities]);

  // Kirim Pesanan PO ke Supplier (Mendukung Multi-Cabang sekaligus)
  const handleSendPo = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const uid = createUid();

    const nextInventories: Record<SingleBranchName, InventoryDetailItem[]> = {
      "Cabang Sudirman Utama": [...branchInventories["Cabang Sudirman Utama"]],
      "Cabang Tebet Eco Park": [...branchInventories["Cabang Tebet Eco Park"]],
      "Cabang Dago Heritage": [...branchInventories["Cabang Dago Heritage"]],
    };

    const newLogsByBranch: Record<SingleBranchName, MutationLog[]> = {
      "Cabang Sudirman Utama": [],
      "Cabang Tebet Eco Park": [],
      "Cabang Dago Heritage": [],
    };

    const contextRestocks: { id: string; orderQty: number }[] = [];
    const updatedBranches = new Set<SingleBranchName>();

    SINGLE_BRANCHES.forEach((bName) => {
      nextInventories[bName] = branchInventories[bName].map((row) => {
        const key = `${bName}::${row.sku}`;
        if (!(key in poQuantities)) return row;
        const orderQty = parseFloat(poQuantities[key]);
        if (isNaN(orderQty) || orderQty <= 0) return row;

        const nextStock =
          row.unit === "Pcs"
            ? Math.round(row.stock + orderQty)
            : Number((row.stock + orderQty).toFixed(1));
        const metrics = computeStockMetrics(nextStock, row.safetyStock);

        if (bName === "Cabang Sudirman Utama" && row.contextId) {
          contextRestocks.push({ id: row.contextId, orderQty });
        }

        updatedBranches.add(bName);
        newLogsByBranch[bName].push({
          id: `LOG-PO-${uid}-${bName.slice(7, 10).toUpperCase()}-${row.sku}`,
          title: `${row.name.split(" ").slice(0, 3).join(" ")} • +${orderQty} ${row.unit}`,
          subtitle: `Purchase Order Cepat (${row.supplier.replace("Supplier: ", "")}) • ${bName}`,
          time: nowStr,
          type: "in",
          branch: bName,
        });

        return {
          ...row,
          stock: nextStock,
          ...metrics,
        };
      });
    });

    setBranchInventories(nextInventories);

    contextRestocks.forEach((r) => {
      restockItem(r.id, r.orderQty);
    });

    setBranchLogs((prev) => ({
      "Cabang Sudirman Utama": [
        ...newLogsByBranch["Cabang Sudirman Utama"],
        ...prev["Cabang Sudirman Utama"],
      ],
      "Cabang Tebet Eco Park": [
        ...newLogsByBranch["Cabang Tebet Eco Park"],
        ...prev["Cabang Tebet Eco Park"],
      ],
      "Cabang Dago Heritage": [
        ...newLogsByBranch["Cabang Dago Heritage"],
        ...prev["Cabang Dago Heritage"],
      ],
    }));

    const nextMarked: Record<string, boolean> = {
      ...reorderMarkedByBranch,
      [selectedBranch]: true,
    };
    updatedBranches.forEach((b) => {
      nextMarked[b] = true;
    });
    setReorderMarkedByBranch(nextMarked);

    setShowPoModal(false);
    showToast(
      `Pesanan PO (${selectedBranch}) berhasil dikirim & stok masuk telah diperbarui!`
    );
  };

  // Handler Tambah Bahan Baku Baru
  const handleAddNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    const cleanSku = newItemSku.trim().toUpperCase();
    const cleanSupplier = newItemSupplier.trim();
    const initStock = parseFloat(newItemStock);
    const safetyVal = parseFloat(newItemSafety);
    const priceVal = parseFloat(newItemPrice);

    if (!cleanName || !cleanSku) {
      showToast("Nama bahan dan kode SKU wajib diisi!");
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
    if (isNaN(priceVal) || priceVal <= 0) {
      showToast("Harga satuan harus lebih dari Rp 0!");
      return;
    }

    const branchToUpdate = targetWriteBranch;
    const existsInAny = SINGLE_BRANCHES.some((bName) =>
      branchInventories[bName].some((i) => i.sku.toUpperCase() === cleanSku)
    );
    if (existsInAny) {
      showToast(`Kode SKU ${cleanSku} sudah terdaftar di katalog inventaris!`);
      return;
    }

    const baseProps = {
      sku: cleanSku,
      name: cleanName,
      supplier: cleanSupplier.startsWith("Supplier:")
        ? cleanSupplier
        : `Supplier: ${cleanSupplier || "Mitra Pangan Utama"}`,
      category: newItemCategory,
      filterTab: mapCategoryToFilterTab(newItemCategory),
      unit: newItemUnit,
      safetyStock:
        newItemUnit === "Pcs"
          ? Math.round(safetyVal)
          : Number(safetyVal.toFixed(1)),
      safetyUnit: newItemUnit,
      unitPrice: Math.round(priceVal),
      priceUnit: `/${newItemUnit}`,
      icon: "📦",
      iconBg: "bg-amber-50 border-amber-200",
    };

    const formattedInitStock =
      newItemUnit === "Pcs"
        ? Math.round(initStock)
        : Number(initStock.toFixed(1));

    const createdTargetItem = buildItem({
      ...baseProps,
      stock: formattedInitStock,
    });

    const createdZeroItem = buildItem({
      ...baseProps,
      stock: 0,
    });

    if (selectedBranch === "Semua Cabang") {
      setBranchInventories((prev) => ({
        "Cabang Sudirman Utama": [
          branchToUpdate === "Cabang Sudirman Utama"
            ? createdTargetItem
            : createdZeroItem,
          ...prev["Cabang Sudirman Utama"],
        ],
        "Cabang Tebet Eco Park": [
          branchToUpdate === "Cabang Tebet Eco Park"
            ? createdTargetItem
            : createdZeroItem,
          ...prev["Cabang Tebet Eco Park"],
        ],
        "Cabang Dago Heritage": [
          branchToUpdate === "Cabang Dago Heritage"
            ? createdTargetItem
            : createdZeroItem,
          ...prev["Cabang Dago Heritage"],
        ],
      }));
    } else {
      setBranchInventories((prev) => ({
        ...prev,
        [branchToUpdate]: [createdTargetItem, ...prev[branchToUpdate]],
      }));
    }

    const uid = createUid();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const newLog: MutationLog = {
      id: `LOG-NEW-${uid}-${cleanSku}`,
      title: `${cleanName} • +${createdTargetItem.stock} ${newItemUnit}`,
      subtitle: `Registrasi SKU Bahan Baru (${cleanSku}) • ${branchToUpdate}`,
      time: nowStr,
      type: "in",
      branch: branchToUpdate,
    };

    setBranchLogs((prev) => ({
      ...prev,
      [branchToUpdate]: [newLog, ...prev[branchToUpdate]],
    }));

    setSelectedSku(cleanSku);
    setNewItemName("");
    setNewItemSku("");
    setNewItemSupplier("");
    setNewItemStock("");
    setNewItemSafety("");
    setNewItemPrice("");
    setShowAddModal(false);
    showToast(
      `Bahan baku baru "${cleanName}" [${cleanSku}] berhasil ditambahkan ke ${branchToUpdate}!`
    );
  };

  // Fungsi Export Excel (.csv UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      "Kode SKU",
      "Nama Bahan Baku",
      "Cabang",
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
      selectedBranch,
      item.category,
      item.supplier.replace("Supplier: ", ""),
      `${item.unit === "Pcs" ? item.stock : item.stock.toFixed(1)} ${item.unit}`,
      `${item.safetyStock} ${item.safetyUnit}`,
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
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const branchSlug = selectedBranch.replace(/\s+/g, "_");
    link.href = url;
    link.setAttribute(
      "download",
      `Laporan_Stok_PrekDuaDara_${branchSlug}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Laporan stok (${selectedBranch}) berhasil diunduh ke Excel!`);
  };

  const filteredModalLogs = useMemo(() => {
    if (logModalFilter === "Semua") return logs;
    if (logModalFilter === "in") return logs.filter((l) => l.type === "in");
    return logs.filter((l) => l.type === "out" || l.type === "replace");
  }, [logs, logModalFilter]);

  const opnameSourceList = branchInventories[targetWriteBranch];

  return (
    <div className="min-h-screen print:min-h-0 bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-gray-900">
      {/* Toast Notification Seragam di Pojok Kanan Bawah */}
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
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Lembar Kerja Audit / Opname Fisik ({targetWriteBranch})
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Masukkan hasil hitung fisik aktual untuk menyesuaikan stok
                    sistem
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
                {opnameSourceList.map((item) => {
                  const valNum = parseFloat(opnameValues[item.sku] ?? "");
                  const diff = isNaN(valNum)
                    ? 0
                    : Number((valNum - item.stock).toFixed(1));
                  return (
                    <div
                      key={item.sku}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-gray-900">
                            {item.name}{" "}
                            <span className="text-[11px] text-gray-500 font-bold">
                              [{item.sku}]
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            Stok Sistem:{" "}
                            <strong className="text-gray-900">
                              {item.stock} {item.unit}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            diff > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : diff < 0
                                ? "bg-red-50 text-[#DC2626] border border-red-200"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {diff > 0
                            ? `+${diff} ${item.unit}`
                            : diff < 0
                              ? `${diff} ${item.unit}`
                              : "Sesuai"}
                        </span>

                        <div className="flex items-center border border-gray-300 rounded-xl bg-white px-3 py-1.5 w-32">
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
                            className="w-full text-xs sm:text-sm font-extrabold text-gray-900 outline-none bg-transparent"
                          />
                          <span className="text-xs font-bold text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F3A712] hover:bg-[#df980e] text-gray-950 text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Simpan Hasil Opname</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PESAN KE SUPPLIER SEKARANG (QUICK PO) */}
      {showPoModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#DC2626] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Form Re-Order Cepat ({selectedBranch})
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
              <div className="p-5 overflow-y-auto space-y-3">
                {poModalEntries.map(({ key, branchShort, item }) => {
                  const qty = parseFloat(poQuantities[key] || "0") || 0;
                  const subtotal = Math.round(qty * item.unitPrice);
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-200 text-gray-800">
                            {branchShort}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.status === "KRITIS"
                                ? "bg-red-100 text-[#DC2626]"
                                : "bg-amber-100 text-[#B45309]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {item.supplier} • Sisa: {item.stock} {item.unit}{" "}
                          (Safety: {item.safetyStock} {item.safetyUnit})
                        </p>
                        <p className="text-xs font-extrabold text-emerald-700 mt-1">
                          Estimasi Biaya: Rp {subtotal.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs font-bold text-gray-600">
                          Order:
                        </span>
                        <div className="flex items-center border border-gray-300 rounded-xl bg-white px-3 py-1.5 w-32">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={poQuantities[key] ?? ""}
                            onChange={(e) =>
                              setPoQuantities((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="w-full text-xs sm:text-sm font-extrabold text-gray-900 outline-none bg-transparent"
                          />
                          <span className="text-xs font-bold text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-gray-700">
                  Total Estimasi PO:{" "}
                  <strong className="text-sm font-black text-gray-900">
                    Rp{" "}
                    {poModalEntries
                      .reduce((sum, { key, item }) => {
                        const q = parseFloat(poQuantities[key] || "0") || 0;
                        return sum + Math.round(q * item.unitPrice);
                      }, 0)
                      .toLocaleString("id-ID")}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <ShoppingCart size={14} />
                    <span>Kirim Pesanan PO</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIHAT SEMUA LOG MUTASI HARI INI */}
      {showLogsModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">
                  Riwayat Lengkap Log Mutasi Stok ({selectedBranch})
                </h3>
                <p className="text-[11px] text-emerald-200 font-medium">
                  Total {logs.length} aktivitas tercatat hari ini
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

            <div className="px-5 pt-3.5 pb-2 border-b border-gray-200 flex items-center gap-2">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    logModalFilter === tab.key
                      ? "bg-[#F3A712] text-gray-950"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {filteredModalLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
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
                      <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                        {log.title}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        {log.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-gray-500 shrink-0">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2D452B] text-white text-xs font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH BAHAN BAKU / SKU BARU */}
      {showAddModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PackagePlus size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Tambah Bahan Baku / SKU Baru
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Daftarkan item inventaris baru ke {targetWriteBranch}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Nama Bahan Baku *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Saus Keju Spesial"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Kode SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mis: KJU-02"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-extrabold uppercase text-gray-900 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Kategori Bahan
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) =>
                      setNewItemCategory(e.target.value as InventoryCategory)
                    }
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
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
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Nama Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT Pangan Nusantara"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="Mis: 20"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Satuan
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    <option value="kg">kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Block">Block</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Safety Stock *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    placeholder="Mis: 10"
                    value={newItemSafety}
                    onChange={(e) => setNewItemSafety(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">
                  Harga Satuan (Rp) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  placeholder="Contoh: 45000"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F3A712] hover:bg-[#df980e] text-gray-950 text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Tambahkan Bahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR KIRI (FIXED & PATEN) */}
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>

      {/* 2. AREA KONTEN UTAMA MANAJEMEN STOK */}
      <main className="flex-1 flex flex-col gap-6 overflow-x-hidden print:overflow-visible max-w-full">
        {/* TOP NAVBAR HEADER (SERAGAM, RAPI 1 BARIS TANPA LINK REDUNDAN) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm print:shadow-none border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Logo PrekDuaDara"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0"
            />
            <div>
              <div className="font-extrabold text-base text-[#EA8E18] tracking-tight leading-tight">
                PrekDuaDara
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight mt-0.5">
                Manajemen Stok &amp; Inventaris Dapur
              </div>
            </div>
          </div>

          {/* Info Cetak Saat Mode Print */}
          <div className="hidden print:block text-right text-xs text-gray-700">
            <div className="font-bold text-gray-900">
              Laporan Inventaris Dapur • {selectedBranch}
            </div>
            <div className="mt-0.5">
              Total SKU: {inventory.length} Bahan • Nilai Inventaris: Rp{" "}
              {Math.round(kpiStats.totalValue).toLocaleString("id-ID")}
            </div>
          </div>

          {/* Right Controls: Interactive Branch Selector, Online Sync & Profile */}
          <div className="print:hidden flex items-center gap-3 flex-wrap">
            {/* Interactive Branch Dropdown with Click-Outside Ref */}
            <div ref={branchDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowBranchMenu((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition"
              >
                <Store size={14} className="text-[#EA8E18] shrink-0" />
                <span className="whitespace-nowrap">{selectedBranch}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {showBranchMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs">
                  {BRANCH_OPTIONS.map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(branch);
                        setActivePage(1);
                        setShowBranchMenu(false);
                        showToast(`Menampilkan inventaris dapur: ${branch}`);
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

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#E8F8F0] border border-[#A7F3D0] text-[#047857] text-xs font-extrabold rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
              <span>ONLINE SYNC</span>
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="text-right">
                <div className="text-xs font-extrabold text-gray-900 leading-tight">
                  Rian Pratama
                </div>
                <div className="text-[11px] text-[#EA8E18] font-bold leading-tight mt-0.5">
                  Supervisor Kasir
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE & ACTION SECTION */}
        <section className="print:hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F3] border border-gray-200 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/logo.png"
                alt="PrekDuaDara"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  Manajemen Stok &amp; Bahan Baku
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Sinkronisasi POS &amp; Dapur Otomatis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-2xl leading-relaxed font-medium">
                Pantau ketersediaan bahan utama ayam geprek, peringatan stok
                menipis, pencatatan barang masuk (inflow), dan kalkulasi HPP
                harian ({selectedBranch}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-800 transition cursor-pointer"
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenOpnameModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-800 transition cursor-pointer"
            >
              <ClipboardCheck size={15} className="text-gray-700" />
              <span>Audit / Opname Fisik</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F3A712] hover:bg-[#df980e] text-gray-950 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>+ Tambah Bahan Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY KPI CARDS (DINAMIS DARI STATE INVENTORY CABANG) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-5 print:gap-3">
          {/* Card 1: TOTAL ITEM AKTIF */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none print:break-inside-avoid border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider truncate">
                TOTAL ITEM AKTIF
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.totalItems}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Bahan
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-bold min-w-0">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">5 Kategori operasional</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
          </div>

          {/* Card 2: STOK KRITIS / RESTOCK */}
          <div
            className={`rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none print:break-inside-avoid border flex items-center justify-between gap-3 ${
              kpiStats.criticalCount > 0
                ? "bg-[#FFF5F5] border-red-300"
                : "bg-emerald-50/60 border-emerald-300"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-extrabold uppercase tracking-wider truncate ${
                  kpiStats.criticalCount > 0
                    ? "text-[#DC2626]"
                    : "text-emerald-800"
                }`}
              >
                STOK KRITIS / RESTOCK
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl print:text-lg font-black ${
                    kpiStats.criticalCount > 0
                      ? "text-[#DC2626]"
                      : "text-emerald-800"
                  }`}
                >
                  {kpiStats.criticalCount}
                </span>
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    kpiStats.criticalCount > 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  Bahan Baku
                </span>
              </div>
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-xs font-extrabold min-w-0 ${
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
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none print:break-inside-avoid border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider truncate">
                KETAHANAN OPERASIONAL
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.avgDays}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Hari
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-semibold min-w-0">
                <Clock size={14} className="text-[#D97706] shrink-0" />
                <span className="truncate">Estimasi ketahanan rata-rata</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>

          {/* Card 4: NILAI TOTAL INVENTARIS */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none print:break-inside-avoid border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider truncate">
                NILAI TOTAL INVENTARIS
              </p>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl print:text-base font-black text-gray-900">
                  Rp {Math.round(kpiStats.totalValue).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-semibold min-w-0">
                <Box size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{selectedBranch}</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </div>
        </section>

        {/* DYNAMIC CRITICAL RE-ORDER ALERT BANNER */}
        {kpiStats.criticalCount > 0 ? (
          <section className="print:hidden bg-[#FFF5F5] border border-red-300 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white font-black text-base flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                !
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                    Peringatan Kritis ({selectedBranch}): {kpiStats.criticalCount}{" "}
                    Bahan Memerlukan Re-Order Mendesak
                  </h3>
                  <span className="bg-[#DC2626] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    RUSH SIANG–MALAM
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 mt-1.5 leading-relaxed font-medium">
                  {kpiStats.criticalItems.map((ci, idx) => (
                    <React.Fragment key={`${ci.branchName}-${ci.sku}`}>
                      {idx > 0 && " • "}
                      <strong className="text-[#DC2626] font-extrabold">
                        {ci.name}
                        {selectedBranch === "Semua Cabang"
                          ? ` (${ci.branchShort})`
                          : ""}
                      </strong>{" "}
                      tersisa{" "}
                      <strong className="text-gray-900">
                        {ci.stock} {ci.unit}
                      </strong>{" "}
                      (Batas Aman: {ci.safetyStock} {ci.safetyUnit})
                    </React.Fragment>
                  ))}
                  . Segera lakukan pengadaan ulang sebelum jam ramai malam.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-center">
              <button
                type="button"
                onClick={handleOpenPoModal}
                className="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <ShoppingCart size={14} />
                <span>Pesan ke Supplier Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextState = !reorderMarked;
                  setReorderMarkedByBranch((prev) => ({
                    ...prev,
                    [selectedBranch]: nextState,
                  }));
                  showToast(
                    nextState
                      ? `Ditandai sudah dipesan ke supplier (${selectedBranch})!`
                      : `Status pesanan (${selectedBranch}) direset.`
                  );
                }}
                className={`px-4 py-2.5 border rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  reorderMarked
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                    : "bg-white border-gray-300 hover:bg-gray-50 text-gray-800"
                }`}
              >
                {reorderMarked ? "✓ Sudah Dipesan" : "Tandai Sudah Dipesan"}
              </button>
            </div>
          </section>
        ) : (
          <section className="print:hidden bg-emerald-50 border border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  Semua Stok Bahan Baku dalam Batas Aman ({selectedBranch})
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 font-medium mt-1.5">
                  Tidak ada bahan baku yang berstatus kritis saat ini. Operasional
                  dapur siap melayani jam sibuk.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenPoModal}
              className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0"
            >
              <ShoppingCart size={14} />
              <span>Buat PO Tambahan</span>
            </button>
          </section>
        )}

        {/* 2-COLUMN MAIN CONTENT: LEFT (INVENTORY TABLE) & RIGHT (QUICK ADJUSTMENT + LOGS) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INVENTORY TABLE (8 COLS, FULL 12 COLS ON PRINT) */}
          <div className="xl:col-span-8 print:col-span-12 bg-white rounded-2xl p-6 print:p-3 shadow-sm print:shadow-none border border-gray-200 flex flex-col gap-5">
            {/* Search & Status Filter Bar */}
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="relative flex-1 max-w-md">
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
                  placeholder="Cari nama bahan, supplier, atau kode SKU..."
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D97706]"
                />
                {searchQuery !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActivePage(1);
                    }}
                    title="Hapus pencarian"
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                  STATUS:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setActivePage(1);
                  }}
                  className="border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-800 bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                  <option value="Semua Status">Semua Status</option>
                  <option value="KRITIS">KRITIS</option>
                  <option value="MENIPIS">MENIPIS</option>
                  <option value="AMAN">AMAN</option>
                </select>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  aria-label="Reset Filter"
                  className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="print:hidden flex flex-wrap items-center gap-2.5 pb-1 mb-2">
              {[
                {
                  key: "Semua Bahan",
                  label: `Semua Bahan (${inventory.length})`,
                },
                { key: "Protein & Unggas", label: "Protein & Unggas" },
                { key: "Bumbu & Sambal", label: "Bumbu & Sambal" },
                { key: "Tepung & Minyak", label: "Tepung & Minyak" },
                { key: "Minuman & Pelengkap", label: "Minuman & Pelengkap" },
                { key: "Kemasan / Box", label: "Kemasan / Box" },
              ].map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.key);
                      setActivePage(1);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isActive
                        ? "bg-[#F3A712] text-gray-950 font-extrabold shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200/70 text-gray-700 font-bold border border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Table with locked fixed column widths */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="table-fixed w-[1090px] print:table-auto print:w-full print:text-[10px] text-left border-collapse text-xs sm:text-sm">
                <colgroup>
                  <col className="w-[260px] print:w-auto" />
                  <col className="w-[175px] print:w-auto" />
                  <col className="w-[150px] print:w-auto" />
                  <col className="w-[185px] print:w-auto" />
                  <col className="w-[130px] print:w-auto" />
                  <col className="w-[95px] print:w-auto" />
                  <col className="w-[95px] print:w-auto" />
                </colgroup>
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50 text-xs print:text-[9px] font-extrabold text-gray-600 uppercase tracking-wider">
                    <th className="py-4 px-4 text-left whitespace-nowrap">
                      BAHAN BAKU &amp; SKU
                    </th>
                    <th className="py-4 px-4 text-left whitespace-nowrap">
                      KATEGORI
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      STOK AKTUAL
                    </th>
                    <th className="py-4 px-4 text-left whitespace-nowrap">
                      KETAHANAN &amp; SAFETY
                    </th>
                    <th className="py-4 px-4 text-right whitespace-nowrap">
                      HARGA SATUAN
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      STATUS
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap print:hidden">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {filteredInventory.map((item, idx) => {
                    const isOutsideCurrentPage =
                      idx < (currentPage - 1) * ITEMS_PER_PAGE ||
                      idx >= currentPage * ITEMS_PER_PAGE;
                    return (
                      <tr
                        key={item.sku}
                        className={`hover:bg-amber-50/30 transition-colors ${
                          isOutsideCurrentPage ? "hidden print:table-row" : ""
                        }`}
                      >
                        {/* 1. BAHAN BAKU & SKU */}
                        <td className="py-5 px-4 text-left">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl border ${item.iconBg} flex items-center justify-center text-base shrink-0 mt-0.5 print:hidden`}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-gray-900 text-xs sm:text-sm leading-snug">
                                {item.name}
                              </div>
                              <div className="mt-1.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 font-extrabold text-[10px]">
                                  {item.sku}
                                </span>
                              </div>
                              <p
                                className="text-xs text-gray-500 font-medium mt-1.5 truncate"
                                title={item.supplier}
                              >
                                {item.supplier}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. KATEGORI */}
                        <td className="py-5 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                          {item.category}
                        </td>

                        {/* 3. STOK AKTUAL */}
                        <td className="py-5 px-4 text-center whitespace-nowrap">
                          <div
                            className={`font-black text-sm whitespace-nowrap ${
                              item.status === "KRITIS"
                                ? "text-[#DC2626]"
                                : item.status === "MENIPIS"
                                  ? "text-[#D97706]"
                                  : "text-gray-900"
                            }`}
                          >
                            {item.unit === "Pcs"
                              ? item.stock
                              : item.stock.toFixed(1)}{" "}
                            {item.unit}
                          </div>
                          <div className="text-xs text-gray-500 font-medium whitespace-nowrap mt-1">
                            Safety: {item.safetyStock} {item.safetyUnit}
                          </div>
                        </td>

                        {/* 4. KETAHANAN & SAFETY */}
                        <td className="py-5 px-4 text-left">
                          <div className="flex items-center justify-between text-xs mb-2 gap-2 whitespace-nowrap">
                            <span className="text-gray-600 font-bold">
                              {item.pct}%
                            </span>
                            <span
                              className={`font-extrabold ${
                                item.status === "KRITIS"
                                  ? "text-[#DC2626]"
                                  : item.status === "MENIPIS"
                                    ? "text-[#D97706]"
                                    : "text-emerald-700"
                              }`}
                            >
                              {item.daysLeft}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === "KRITIS"
                                  ? "bg-[#DC2626]"
                                  : item.status === "MENIPIS"
                                    ? "bg-[#F59E0B]"
                                    : "bg-emerald-600"
                              }`}
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </td>

                        {/* 5. HARGA SATUAN */}
                        <td className="py-5 px-4 text-right whitespace-nowrap">
                          <div className="font-extrabold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                            Rp {item.unitPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-gray-500 font-medium whitespace-nowrap mt-1">
                            {item.priceUnit}
                          </div>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide whitespace-nowrap ${
                              item.status === "KRITIS"
                                ? "bg-red-50 text-[#DC2626] border border-red-300"
                                : item.status === "MENIPIS"
                                  ? "bg-amber-50 text-[#B45309] border border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* 7. AKSI */}
                        <td className="py-5 px-4 text-center whitespace-nowrap print:hidden">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickRestockRow(item)}
                              title="Tambah Stok Cepat"
                              className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#B45309] flex items-center justify-center transition cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSku(item.sku);
                                const el =
                                  document.getElementById("form-mutasi-cepat");
                                el?.scrollIntoView({ behavior: "smooth" });
                                showToast(`Memilih ${item.name} untuk diedit.`);
                              }}
                              title="Edit / Mutasi Bahan"
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 flex items-center justify-center transition cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInventory.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-gray-500 font-medium"
                      >
                        <p>Tidak ada bahan baku yang sesuai dengan filter.</p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-extrabold text-gray-700 transition cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Reset Semua Filter</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredInventory.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-[#FAF8F3] text-xs sm:text-sm print:text-[10px]">
                      <td
                        colSpan={4}
                        className="py-4 px-4 font-extrabold text-gray-800"
                      >
                        Total Valuasi Stok Terfilter ({filteredInventory.length}{" "}
                        Bahan • {selectedBranch})
                      </td>
                      <td className="py-4 px-4 text-right font-black text-[#EA8E18] whitespace-nowrap">
                        Rp{" "}
                        {Math.round(filteredTotalValue).toLocaleString("id-ID")}
                      </td>
                      <td colSpan={2} className="print:hidden" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="print:hidden pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 font-medium">
              <div>
                Menampilkan{" "}
                <strong className="text-gray-900 font-extrabold">
                  {paginatedInventory.length} dari {filteredInventory.length}
                </strong>{" "}
                item bahan baku operasional
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
                {visiblePageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePage(p)}
                    className={`w-8 h-8 rounded-lg font-extrabold transition cursor-pointer ${
                      currentPage === p
                        ? "bg-[#F3A712] text-gray-950 shadow-2xs"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PENYESUAIAN CEPAT & LOG MUTASI (4 COLS, HIDDEN ON PRINT) */}
          <div
            id="form-mutasi-cepat"
            className="print:hidden xl:col-span-4 flex flex-col gap-6"
          >
            {/* CARD 1: PENYESUAIAN CEPAT */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3A712] text-gray-950 flex items-center justify-center shrink-0 shadow-xs">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      Penyesuaian Cepat
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-1.5">
                      Catat stok masuk, keluar, atau sisa basi
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-extrabold uppercase leading-tight text-center shrink-0">
                  DAPUR &amp;
                  <br />
                  KASIR
                </span>
              </div>

              <form
                onSubmit={handleSaveMutation}
                className="flex flex-col gap-4"
              >
                {selectedBranch === "Semua Cabang" && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                      Cabang Tujuan Mutasi
                    </label>
                    <select
                      value={mutationTargetBranch}
                      onChange={(e) =>
                        setMutationTargetBranch(
                          e.target.value as SingleBranchName
                        )
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                      {SINGLE_BRANCHES.map((bName) => (
                        <option key={bName} value={bName}>
                          {bName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    Pilih Bahan Baku
                  </label>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 bg-gray-50 focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    {inventory.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.name} [{item.sku}]
                      </option>
                    ))}
                  </select>

                  {/* Kotak Info Live Stok Aktual, Batas Aman, & Status Bahan Terpilih */}
                  {targetBranchSelectedItem && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FAF8F3] border border-gray-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 font-semibold">
                          Stok ({targetWriteBranch.replace("Cabang ", "")}):{" "}
                        </span>
                        <strong className="font-black text-gray-900">
                          {targetBranchSelectedItem.unit === "Pcs"
                            ? targetBranchSelectedItem.stock
                            : targetBranchSelectedItem.stock.toFixed(1)}{" "}
                          {targetBranchSelectedItem.unit}
                        </strong>
                        <span className="text-gray-400 mx-1.5">•</span>
                        <span className="text-gray-500 font-semibold">
                          Safety:{" "}
                          <strong className="text-gray-800">
                            {targetBranchSelectedItem.safetyStock}{" "}
                            {targetBranchSelectedItem.safetyUnit}
                          </strong>
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                          targetBranchSelectedItem.status === "KRITIS"
                            ? "bg-red-100 text-[#DC2626] border border-red-200"
                            : targetBranchSelectedItem.status === "MENIPIS"
                              ? "bg-amber-100 text-[#B45309] border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {targetBranchSelectedItem.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                      Tipe Mutasi
                    </label>
                    <select
                      value={mutationType}
                      onChange={(e) =>
                        setMutationType(e.target.value as MutationType)
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                      <option value="Stok Masuk (PO)">Stok Masuk (PO)</option>
                      <option value="Pemakaian Dapur">Pemakaian Dapur</option>
                      <option value="Stok Rusak / Basi">
                        Stok Rusak / Basi
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                      Jumlah
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-xl bg-white px-3.5 py-2.5 focus-within:border-[#D97706]">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Misal: 5"
                        value={mutationAmount}
                        onChange={(e) => setMutationAmount(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold text-gray-900 outline-none bg-transparent"
                      />
                      <span className="text-xs font-extrabold text-gray-500 ml-1.5 shrink-0">
                        {selectedItemObj.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    Catatan / No. Faktur
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengiriman Supplier Pagi / No. DO-8812"
                    value={mutationNote}
                    onChange={(e) => setMutationNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-gray-900 bg-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-1 py-3 px-4 bg-[#F3A712] hover:bg-[#df980e] text-gray-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Save size={16} />
                  <span>Simpan Mutasi Stok</span>
                </button>
              </form>
            </div>

            {/* CARD 2: LOG MUTASI HARI INI */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Log Mutasi Hari Ini
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-1.5">
                    Sinkron otomatis POS &amp; Penerimaan ({selectedBranch})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogsModal(true)}
                  className="text-xs font-extrabold text-[#D97706] hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
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
                        <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                          {log.title}
                        </p>
                        <p className="text-xs text-gray-600 font-medium mt-1 leading-snug">
                          {log.subtitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold shrink-0 ${
                        log.type === "in"
                          ? "text-emerald-700"
                          : log.type === "replace"
                            ? "text-[#D97706]"
                            : "text-gray-500"
                      }`}
                    >
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Khusus Dokumen Cetak */}
        <div className="hidden print:flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-200">
          <span>
            Sistem Manajemen Inventaris &amp; Dapur POS PrekDuaDara • Dicetak
            otomatis
          </span>
          <span>
            Total SKU Tercetak: {filteredInventory.length} Bahan Baku (
            {selectedBranch})
          </span>
        </div>
      </main>
    </div>
  );
}
