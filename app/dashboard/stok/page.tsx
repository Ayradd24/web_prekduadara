"use client";

import React, { useState, useMemo } from "react";
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
  Edit3,
  Layers,
  Plus,
  PlusCircle,
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

interface InventoryDetailItem {
  sku: string;
  contextId?: string;
  name: string;
  supplier: string;
  category:
    | "Bumbu & Sambal"
    | "Protein & Unggas"
    | "Tepung & Minyak"
    | "Bumbu & Pelengkap"
    | "Protein & Pelengkap"
    | "Minuman & Pelengkap"
    | "Kemasan / Box";
  filterTab:
    | "Protein & Unggas"
    | "Bumbu & Sambal"
    | "Tepung & Minyak"
    | "Minuman & Pelengkap"
    | "Kemasan / Box";
  stock: number;
  unit: string;
  safetyStock: number;
  safetyUnit: string;
  pct: number;
  daysLeft: string;
  unitPrice: number;
  priceUnit: string;
  status: "KRITIS" | "MENIPIS" | "AMAN";
  icon: string;
  iconBg: string;
}

const INITIAL_INVENTORY: InventoryDetailItem[] = [
  {
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
    pct: 35,
    daysLeft: "~0.9 Hari",
    unitPrice: 65000,
    priceUnit: "/Kg",
    status: "KRITIS",
    icon: "🌶️",
    iconBg: "bg-red-50 border-red-200",
  },
  {
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
    pct: 90,
    daysLeft: "~4.5 Hari",
    unitPrice: 38500,
    priceUnit: "/Kg",
    status: "AMAN",
    icon: "🍗",
    iconBg: "bg-amber-50 border-amber-200",
  },
  {
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
    pct: 48,
    daysLeft: "~1.2 Hari",
    unitPrice: 17000,
    priceUnit: "/Liter",
    status: "KRITIS",
    icon: "💧",
    iconBg: "bg-amber-50 border-amber-200",
  },
  {
    sku: "TPG-01",
    name: "Tepung Terigu Krispi Racikan PrekDuaDara",
    supplier: "Supplier: Sentral Tepung Bogasari",
    category: "Tepung & Minyak",
    filterTab: "Tepung & Minyak",
    stock: 18.5,
    unit: "kg",
    safetyStock: 20,
    safetyUnit: "kg",
    pct: 62,
    daysLeft: "~2.3 Hari",
    unitPrice: 12500,
    priceUnit: "/Kg",
    status: "MENIPIS",
    icon: "🌾",
    iconBg: "bg-yellow-50 border-yellow-200",
  },
  {
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
    pct: 85,
    daysLeft: "~6.1 Hari",
    unitPrice: 14500,
    priceUnit: "/Kg",
    status: "AMAN",
    icon: "🍚",
    iconBg: "bg-gray-50 border-gray-200",
  },
  {
    sku: "BWG-01",
    name: "Bawang Putih Kating Bersih",
    supplier: "Supplier: Juragan Sayur Majalengka",
    category: "Bumbu & Sambal",
    filterTab: "Bumbu & Sambal",
    stock: 14.0,
    unit: "kg",
    safetyStock: 8,
    safetyUnit: "kg",
    pct: 78,
    daysLeft: "~4.4 Hari",
    unitPrice: 42000,
    priceUnit: "/Kg",
    status: "AMAN",
    icon: "🧄",
    iconBg: "bg-orange-50 border-orange-200",
  },
  {
    sku: "KJU-01",
    name: "Mozarella Block Anchor Leleh",
    supplier: "Supplier: Dairy Food Indofood",
    category: "Protein & Pelengkap",
    filterTab: "Protein & Unggas",
    stock: 4.0,
    unit: "Block",
    safetyStock: 5,
    safetyUnit: "Block",
    pct: 53,
    daysLeft: "~2.0 Hari",
    unitPrice: 115000,
    priceUnit: "/Block",
    status: "MENIPIS",
    icon: "🧀",
    iconBg: "bg-amber-50 border-amber-200",
  },
  {
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
    pct: 88,
    daysLeft: "~5.5 Hari",
    unitPrice: 18000,
    priceUnit: "/Pak",
    status: "AMAN",
    icon: "🍃",
    iconBg: "bg-emerald-50 border-emerald-200",
  },
  {
    sku: "GLA-01",
    name: "Gula Pasir Kristal Putih Gulaku",
    supplier: "Supplier: Grosir Sembako Mulia",
    category: "Minuman & Pelengkap",
    filterTab: "Minuman & Pelengkap",
    stock: 30.0,
    unit: "kg",
    safetyStock: 15,
    safetyUnit: "kg",
    pct: 75,
    daysLeft: "~5.0 Hari",
    unitPrice: 17500,
    priceUnit: "/Kg",
    status: "AMAN",
    icon: "🧂",
    iconBg: "bg-slate-50 border-slate-200",
  },
  {
    sku: "BOX-01",
    name: "Kotak Kemasan Cetak PrekDuaDara",
    supplier: "Supplier: Percetakan Kemasan Nusantara",
    category: "Kemasan / Box",
    filterTab: "Kemasan / Box",
    stock: 450,
    unit: "Pcs",
    safetyStock: 200,
    safetyUnit: "Pcs",
    pct: 90,
    daysLeft: "~5.6 Hari",
    unitPrice: 1250,
    priceUnit: "/Pcs",
    status: "AMAN",
    icon: "📦",
    iconBg: "bg-amber-50 border-amber-200",
  },
];

interface MutationLog {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "out" | "in" | "replace";
}

const INITIAL_LOGS: MutationLog[] = [
  {
    id: "LOG-1",
    title: "Daging Ayam • -12 Potong",
    subtitle: "Auto-Deduct POS #TRX-1092 (Geprek Mozarella)",
    time: "13:20 WIB",
    type: "out",
  },
  {
    id: "LOG-2",
    title: "Cabai Rawit Merah • -0.8 kg",
    subtitle: "Batch Ulek Sambal Siang (Dapur Line 1–2)",
    time: "13:05 WIB",
    type: "out",
  },
  {
    id: "LOG-3",
    title: "Daging Ayam Segar • +50 kg",
    subtitle: "Penerimaan RPU Berkah (Faktur PO-219)",
    time: "08:30 WIB",
    type: "in",
  },
  {
    id: "LOG-4",
    title: "Beras Rojolele • +2 Sak (50kg)",
    subtitle: "Tani Sembako Karawang (Faktur PO-218)",
    time: "07:15 WIB",
    type: "in",
  },
  {
    id: "LOG-5",
    title: "Minyak Jelantah • -4.5 Liter",
    subtitle: "Penggantian minyak wajan deep-fryer pagi",
    time: "06:45 WIB",
    type: "replace",
  },
];

const BRANCH_OPTIONS = [
  "Semua Cabang",
  "Cabang Sudirman Utama",
  "Cabang Tebet Eco Park",
  "Cabang Dago Heritage",
];

const ITEMS_PER_PAGE = 5;

const calcDaysLeft = (stock: number, safetyStock: number): string => {
  const days = Math.max(0.1, stock / (safetyStock * 0.4));
  return `~${days.toFixed(1)} Hari`;
};

export default function StokPage() {
  // Pertahankan state global StokContext sesuai .cursorrules
  const { stokList, updateStok, restockItem } = useStok();

  const [inventory, setInventory] =
    useState<InventoryDetailItem[]>(INITIAL_INVENTORY);
  const [logs, setLogs] = useState<MutationLog[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [activeCategory, setActiveCategory] = useState("Semua Bahan");
  const [activePage, setActivePage] = useState(1);
  const [reorderMarked, setReorderMarked] = useState(false);

  // State Dropdown Cabang di Header
  const [selectedBranch, setSelectedBranch] = useState("Cabang Sudirman Utama");
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  // State Form Penyesuaian Cepat
  const [selectedSku, setSelectedSku] = useState("CBI-01");
  const [mutationType, setMutationType] = useState<
    "Stok Masuk (PO)" | "Pemakaian Dapur" | "Stok Rusak / Basi"
  >("Stok Masuk (PO)");
  const [mutationAmount, setMutationAmount] = useState("");
  const [mutationNote, setMutationNote] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // State Modal Interaktif (Opname Fisik, Quick PO, & Riwayat Log)
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameValues, setOpnameValues] = useState<Record<string, string>>({});
  const [showPoModal, setShowPoModal] = useState(false);
  const [poQuantities, setPoQuantities] = useState<Record<string, string>>({});
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logModalFilter, setLogModalFilter] = useState<
    "Semua" | "in" | "out_replace"
  >("Semua");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedItemObj = useMemo(
    () => inventory.find((i) => i.sku === selectedSku) || inventory[0],
    [inventory, selectedSku]
  );

  // Kalkulasi Dinamis 4 KPI Card & Daftar Item Kritis
  const kpiStats = useMemo(() => {
    const totalItems = inventory.length;
    const criticalItems = inventory.filter((item) => item.status === "KRITIS");
    const totalValue = inventory.reduce(
      (acc, item) => acc + item.stock * item.unitPrice,
      0
    );

    const totalDays = inventory.reduce((acc, item) => {
      const parsed = parseFloat(
        item.daysLeft.replace("~", "").replace("Hari", "").trim()
      );
      const fallback = item.stock / (item.safetyStock * 0.4);
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

  // Pagination: 5 item per halaman
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(activePage, totalPages);
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventory, currentPage]);

  // Handler tambah cepat (+ button pada baris tabel)
  const handleQuickRestockRow = (item: InventoryDetailItem) => {
    const addVal = item.unit === "Pcs" ? 50 : 5;
    setInventory((prev) =>
      prev.map((row) => {
        if (row.sku !== item.sku) return row;
        const nextStock = Number((row.stock + addVal).toFixed(1));
        const nextStatus: "KRITIS" | "MENIPIS" | "AMAN" =
          nextStock <= row.safetyStock * 0.5
            ? "KRITIS"
            : nextStock <= row.safetyStock
              ? "MENIPIS"
              : "AMAN";
        const nextPct = Math.min(
          100,
          Math.max(10, Math.round((nextStock / (row.safetyStock * 1.5)) * 100))
        );
        return {
          ...row,
          stock: nextStock,
          status: nextStatus,
          pct: nextPct,
          daysLeft: calcDaysLeft(nextStock, row.safetyStock),
        };
      })
    );

    if (item.contextId) {
      restockItem(item.contextId, addVal);
    }

    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    setLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        title: `${item.name.split(" ").slice(0, 3).join(" ")} • +${addVal} ${item.unit}`,
        subtitle: `Penambahan cepat stok tabel (${item.sku})`,
        time: nowStr,
        type: "in",
      },
      ...prev,
    ]);

    showToast(`+${addVal} ${item.unit} ditambahkan ke ${item.name}`);
  };

  // Handler simpan form Penyesuaian Cepat
  const handleSaveMutation = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(mutationAmount);
    if (isNaN(qty) || qty <= 0) {
      showToast("Masukkan jumlah mutasi stok yang valid!");
      return;
    }

    const isAddition = mutationType === "Stok Masuk (PO)";

    setInventory((prev) =>
      prev.map((row) => {
        if (row.sku !== selectedSku) return row;
        const nextStock = isAddition
          ? Number((row.stock + qty).toFixed(1))
          : Math.max(0, Number((row.stock - qty).toFixed(1)));
        const nextStatus: "KRITIS" | "MENIPIS" | "AMAN" =
          nextStock <= row.safetyStock * 0.5
            ? "KRITIS"
            : nextStock <= row.safetyStock
              ? "MENIPIS"
              : "AMAN";
        const nextPct = Math.min(
          100,
          Math.max(10, Math.round((nextStock / (row.safetyStock * 1.5)) * 100))
        );
        return {
          ...row,
          stock: nextStock,
          status: nextStatus,
          pct: nextPct,
          daysLeft: calcDaysLeft(nextStock, row.safetyStock),
        };
      })
    );

    if (selectedItemObj.contextId) {
      const ctxItem = stokList.find((s) => s.id === selectedItemObj.contextId);
      if (ctxItem) {
        if (isAddition) {
          restockItem(selectedItemObj.contextId, qty);
        } else {
          updateStok(
            selectedItemObj.contextId,
            Math.max(0, ctxItem.stock - qty)
          );
        }
      }
    }

    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    setLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        title: `${selectedItemObj.name.split(" ").slice(0, 3).join(" ")} • ${
          isAddition ? "+" : "-"
        }${qty} ${selectedItemObj.unit}`,
        subtitle:
          mutationNote.trim() || `${mutationType} (${selectedItemObj.sku})`,
        time: nowStr,
        type: isAddition
          ? "in"
          : mutationType === "Stok Rusak / Basi"
            ? "replace"
            : "out",
      },
      ...prev,
    ]);

    setMutationAmount("");
    setMutationNote("");
    showToast(`Mutasi stok ${selectedItemObj.name} berhasil disimpan!`);
  };

  // Buka Modal Audit / Opname Fisik
  const handleOpenOpnameModal = () => {
    const initialMap: Record<string, string> = {};
    inventory.forEach((item) => {
      initialMap[item.sku] = String(item.stock);
    });
    setOpnameValues(initialMap);
    setShowOpnameModal(true);
  };

  // Simpan Hasil Audit / Opname Fisik
  const handleSaveOpname = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const newLogs: MutationLog[] = [];

    setInventory((prev) =>
      prev.map((row) => {
        const rawVal = opnameValues[row.sku];
        const parsed = parseFloat(rawVal);
        if (isNaN(parsed) || parsed < 0 || parsed === row.stock) {
          return row;
        }

        const diff = Number((parsed - row.stock).toFixed(1));
        const nextStock =
          row.unit === "Pcs" ? Math.round(parsed) : Number(parsed.toFixed(1));
        const nextStatus: "KRITIS" | "MENIPIS" | "AMAN" =
          nextStock <= row.safetyStock * 0.5
            ? "KRITIS"
            : nextStock <= row.safetyStock
              ? "MENIPIS"
              : "AMAN";
        const nextPct = Math.min(
          100,
          Math.max(10, Math.round((nextStock / (row.safetyStock * 1.5)) * 100))
        );

        if (row.contextId) {
          updateStok(row.contextId, nextStock);
        }

        newLogs.push({
          id: `LOG-OPN-${Date.now()}-${row.sku}`,
          title: `${row.name.split(" ").slice(0, 3).join(" ")} • ${
            diff > 0 ? `+${diff}` : diff
          } ${row.unit}`,
          subtitle: `Penyesuaian Audit / Opname Fisik (${row.sku})`,
          time: nowStr,
          type: diff > 0 ? "in" : "replace",
        });

        return {
          ...row,
          stock: nextStock,
          status: nextStatus,
          pct: nextPct,
          daysLeft: calcDaysLeft(nextStock, row.safetyStock),
        };
      })
    );

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev]);
      showToast(
        `Hasil Opname Fisik disimpan (${newLogs.length} bahan disesuaikan)!`
      );
    } else {
      showToast("Stok fisik sesuai sistem, tidak ada selisih opname.");
    }
    setShowOpnameModal(false);
  };

  // Buka Modal Pesan ke Supplier Sekarang (Quick PO)
  const handleOpenPoModal = () => {
    const targetItems = inventory.filter(
      (item) => item.status === "KRITIS" || item.status === "MENIPIS"
    );
    const listToUse = targetItems.length > 0 ? targetItems : inventory.slice(0, 3);
    const initialPo: Record<string, string> = {};
    listToUse.forEach((item) => {
      const recommended = Math.max(
        item.unit === "Pcs" ? 100 : 10,
        Number((item.safetyStock * 1.5 - item.stock).toFixed(1))
      );
      initialPo[item.sku] = String(recommended);
    });
    setPoQuantities(initialPo);
    setShowPoModal(true);
  };

  // Kirim Pesanan PO ke Supplier
  const handleSendPo = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toTimeString().slice(0, 5) + " WIB";
    const newLogs: MutationLog[] = [];

    setInventory((prev) =>
      prev.map((row) => {
        if (!(row.sku in poQuantities)) return row;
        const orderQty = parseFloat(poQuantities[row.sku]);
        if (isNaN(orderQty) || orderQty <= 0) return row;

        const nextStock = Number((row.stock + orderQty).toFixed(1));
        const nextStatus: "KRITIS" | "MENIPIS" | "AMAN" =
          nextStock <= row.safetyStock * 0.5
            ? "KRITIS"
            : nextStock <= row.safetyStock
              ? "MENIPIS"
              : "AMAN";
        const nextPct = Math.min(
          100,
          Math.max(10, Math.round((nextStock / (row.safetyStock * 1.5)) * 100))
        );

        if (row.contextId) {
          restockItem(row.contextId, orderQty);
        }

        newLogs.push({
          id: `LOG-PO-${Date.now()}-${row.sku}`,
          title: `${row.name.split(" ").slice(0, 3).join(" ")} • +${orderQty} ${row.unit}`,
          subtitle: `Purchase Order Cepat (${row.supplier.replace("Supplier: ", "")})`,
          time: nowStr,
          type: "in",
        });

        return {
          ...row,
          stock: nextStock,
          status: nextStatus,
          pct: nextPct,
          daysLeft: calcDaysLeft(nextStock, row.safetyStock),
        };
      })
    );

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev]);
    }
    setReorderMarked(true);
    setShowPoModal(false);
    showToast(
      "Pesanan PO berhasil dikirim ke supplier & stok masuk telah diperbarui!"
    );
  };

  const filteredModalLogs = useMemo(() => {
    if (logModalFilter === "Semua") return logs;
    if (logModalFilter === "in") return logs.filter((l) => l.type === "in");
    return logs.filter((l) => l.type === "out" || l.type === "replace");
  }, [logs, logModalFilter]);

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-gray-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2D452B] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-lg border border-[#415C3E]">
          {toastMsg}
        </div>
      )}

      {/* MODAL 1: AUDIT / OPNAME FISIK */}
      {showOpnameModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
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
                    Lembar Kerja Audit / Opname Fisik Dapur
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
                {inventory.map((item) => {
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
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
                    Form Re-Order Cepat (Purchase Order Supplier)
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
                {inventory
                  .filter((i) => i.sku in poQuantities)
                  .map((item) => {
                    const qty = parseFloat(poQuantities[item.sku] || "0") || 0;
                    const subtotal = Math.round(qty * item.unitPrice);
                    return (
                      <div
                        key={item.sku}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                              {item.name}
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
                            Estimasi Biaya: Rp{" "}
                            {subtotal.toLocaleString("id-ID")}
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
                              value={poQuantities[item.sku] ?? ""}
                              onChange={(e) =>
                                setPoQuantities((prev) => ({
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

              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-gray-700">
                  Total Estimasi PO:{" "}
                  <strong className="text-sm font-black text-gray-900">
                    Rp{" "}
                    {inventory
                      .filter((i) => i.sku in poQuantities)
                      .reduce((sum, item) => {
                        const q =
                          parseFloat(poQuantities[item.sku] || "0") || 0;
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">
                  Riwayat Lengkap Log Mutasi Stok
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
              {[
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
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLogModalFilter(tab.key as any)}
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

      {/* 1. SIDEBAR KIRI (FIXED & PATEN) */}
      <Sidebar />

      {/* 2. AREA KONTEN UTAMA MANAJEMEN STOK */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* TOP NAVBAR HEADER (SERAGAM, RAPI 1 BARIS TANPA LINK REDUNDAN) */}
        <header className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo PrekDuaDara"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0"
            />
            <div>
              <div className="font-extrabold text-base text-[#EA8E18] tracking-tight leading-tight">
                PrekDuaDara
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight">
                Manajemen Stok &amp; Inventaris Dapur
              </div>
            </div>
          </div>

          {/* Right Controls: Interactive Branch Selector, Online Sync & Profile */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Interactive Branch Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBranchMenu((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA8E18] shrink-0"></span>
                <span>{selectedBranch}</span>
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
                <div className="text-[11px] text-[#EA8E18] font-bold leading-tight">
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
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed font-medium">
                Pantau ketersediaan bahan utama ayam geprek, peringatan stok
                menipis, pencatatan barang masuk (inflow), dan kalkulasi HPP
                harian.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={handleOpenOpnameModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-800 transition cursor-pointer shadow-2xs"
            >
              <ClipboardCheck size={15} className="text-gray-700" />
              <span>Audit / Opname Fisik</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("form-mutasi-cepat");
                el?.scrollIntoView({ behavior: "smooth" });
                showToast(
                  "Silakan catat barang masuk (PO) melalui panel Penyesuaian Cepat."
                );
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F3A712] hover:bg-[#df980e] text-gray-950 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>+ Catat Stok Masuk / PO</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY KPI CARDS (DINAMIS DARI STATE INVENTORY) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL ITEM AKTIF */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                TOTAL ITEM AKTIF
              </p>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {kpiStats.totalItems}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Bahan
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>5 Kategori operasional</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
          </div>

          {/* Card 2: STOK KRITIS / RESTOCK */}
          <div
            className={`rounded-2xl p-5 shadow-sm border flex items-center justify-between gap-3 ${
              kpiStats.criticalCount > 0
                ? "bg-[#FFF5F5] border-red-300"
                : "bg-emerald-50/60 border-emerald-300"
            }`}
          >
            <div>
              <p
                className={`text-xs font-extrabold uppercase tracking-wider ${
                  kpiStats.criticalCount > 0
                    ? "text-[#DC2626]"
                    : "text-emerald-800"
                }`}
              >
                STOK KRITIS / RESTOCK
              </p>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-black ${
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
                className={`flex items-center gap-1.5 text-xs font-extrabold ${
                  kpiStats.criticalCount > 0
                    ? "text-[#DC2626]"
                    : "text-emerald-700"
                }`}
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span className="truncate max-w-[180px]">
                  {kpiStats.criticalLabel}
                </span>
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                kpiStats.criticalCount > 0
                  ? "bg-red-100 border-red-200 text-[#DC2626]"
                  : "bg-emerald-100 border-emerald-200 text-emerald-700"
              }`}
            >
              <Bell size={20} />
            </div>
          </div>

          {/* Card 3: KETAHANAN OPERASIONAL */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                KETAHANAN OPERASIONAL
              </p>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {kpiStats.avgDays}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Hari
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                <Clock size={14} className="text-[#D97706] shrink-0" />
                <span>Basis 214 porsi geprek/hari</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>

          {/* Card 4: NILAI TOTAL INVENTARIS */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                NILAI TOTAL INVENTARIS
              </p>
              <div className="my-1.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900">
                  Rp {Math.round(kpiStats.totalValue).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                <Box size={14} className="text-emerald-600 shrink-0" />
                <span>Dapur, freezer &amp; storage</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </div>
        </section>

        {/* DYNAMIC CRITICAL RE-ORDER ALERT BANNER */}
        {kpiStats.criticalCount > 0 ? (
          <section className="bg-[#FFF5F5] border border-red-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white font-black text-base flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                !
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                    Peringatan Kritis: {kpiStats.criticalCount} Bahan Memerlukan
                    Re-Order Mendesak
                  </h3>
                  <span className="bg-[#DC2626] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    RUSH SIANG–MALAM
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 mt-1 leading-relaxed font-medium">
                  {kpiStats.criticalItems.map((ci, idx) => (
                    <React.Fragment key={ci.sku}>
                      {idx > 0 && " • "}
                      <strong className="text-[#DC2626] font-extrabold">
                        {ci.name}
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
                  setReorderMarked(!reorderMarked);
                  showToast(
                    reorderMarked
                      ? "Status pesanan direset."
                      : "Ditandai sudah dipesan ke supplier!"
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
          <section className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  Semua Stok Bahan Baku dalam Batas Aman
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 font-medium mt-0.5">
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
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: INVENTORY TABLE (8 COLS) */}
          <div className="xl:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
            {/* Search & Status Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D97706]"
                />
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
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
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

            {/* Table with proportional column widths (no narrow table-fixed overlap) */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50 text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-3.5 min-w-[230px]">
                      BAHAN BAKU &amp; SKU
                    </th>
                    <th className="py-3.5 px-3.5 whitespace-nowrap">
                      KATEGORI
                    </th>
                    <th className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      STOK AKTUAL
                    </th>
                    <th className="py-3.5 px-3.5 min-w-[155px] whitespace-nowrap">
                      KETAHANAN &amp; SAFETY
                    </th>
                    <th className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      HARGA SATUAN
                    </th>
                    <th className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      STATUS
                    </th>
                    <th className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {paginatedInventory.map((item) => (
                    <tr
                      key={item.sku}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      {/* 1. BAHAN BAKU & SKU */}
                      <td className="py-4 px-3.5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl border ${item.iconBg} flex items-center justify-center text-base shrink-0 mt-0.5`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-gray-900 text-xs sm:text-sm leading-snug">
                                {item.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 font-extrabold text-[10px] shrink-0">
                                {item.sku}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {item.supplier}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. KATEGORI */}
                      <td className="py-4 px-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>

                      {/* 3. STOK AKTUAL */}
                      <td className="py-4 px-3.5 text-right whitespace-nowrap">
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
                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                          Safety: {item.safetyStock} {item.safetyUnit}
                        </div>
                      </td>

                      {/* 4. KETAHANAN & SAFETY */}
                      <td className="py-4 px-3.5 min-w-[155px]">
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2 whitespace-nowrap">
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
                      <td className="py-4 px-3.5 text-right whitespace-nowrap">
                        <div className="font-extrabold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                          Rp {item.unitPrice.toLocaleString("id-ID")}
                        </div>
                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                          {item.priceUnit}
                        </div>
                      </td>

                      {/* 6. STATUS */}
                      <td className="py-4 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap ${
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
                      <td className="py-4 px-3.5 text-center whitespace-nowrap">
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
                  ))}

                  {paginatedInventory.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-gray-500 font-medium"
                      >
                        Tidak ada bahan baku yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 font-medium">
              <div>
                Menampilkan{" "}
                <strong className="text-gray-900 font-extrabold">
                  {paginatedInventory.length} dari {inventory.length}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
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
          </div>

          {/* RIGHT COLUMN: PENYESUAIAN CEPAT & LOG MUTASI (4 COLS) */}
          <div
            id="form-mutasi-cepat"
            className="xl:col-span-4 flex flex-col gap-5"
          >
            {/* CARD 1: PENYESUAIAN CEPAT */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3A712] text-gray-950 flex items-center justify-center shrink-0 shadow-xs">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      Penyesuaian Cepat
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
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
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                      Tipe Mutasi
                    </label>
                    <select
                      value={mutationType}
                      onChange={(e) => setMutationType(e.target.value as any)}
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
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-200">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Log Mutasi Hari Ini
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Sinkron otomatis POS &amp; Penerimaan
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

              <div className="flex flex-col gap-3">
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
                        <p className="text-xs text-gray-600 font-medium mt-0.5 leading-snug">
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
      </main>
    </div>
  );
}
