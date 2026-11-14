"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Sidebar from "@/components/Sidebar";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coffee,
  CreditCard,
  Edit3,
  Filter,
  Lock,
  Moon,
  Power,
  Printer,
  RefreshCw,
  Repeat,
  RotateCcw,
  Save,
  ScanBarcode,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

type SingleBranchName =
  | "Cabang Sudirman Utama"
  | "Cabang Tebet Eco Park"
  | "Cabang Dago Heritage";

type ShiftMainType =
  | "Shift Pagi"
  | "Shift Siang"
  | "Shift Malam"
  | "Off / Libur";

type LiveStatusType =
  | "Aktif Melayani"
  | "Standby / Rehat"
  | "Selesai Shift / Off";

export interface KasirItem {
  id: string; // cashier_code, misal: '#KSR-001'
  dbId?: number;
  name: string;
  roleTitle: string;
  shift: string;
  shiftMain: ShiftMainType;
  shiftHours: string;
  statusLive: LiveStatusType;
  isActive: boolean;
  branch: SingleBranchName;
  avatarColor: string;
  initials: string;
  createdAt?: string;
}

interface ApiCashierRow {
  id: string;
  dbId?: number;
  name: string;
  roleTitle?: string;
  role_title?: string;
  shift?: string;
  statusLive?: LiveStatusType;
  status_live?: LiveStatusType;
  isActive?: boolean | number;
  is_active?: boolean | number;
  branch?: SingleBranchName;
  createdAt?: string;
}

interface BranchDrawerState {
  counter: string;
  operatorId: string;
  operatorName: string;
  shiftInfo: string;
  modalAwal: number;
  totalSales: number;
  totalNotes: number;
  isOpen: boolean;
  lastClosedInfo?: string;
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

// Data Default (Sinkron dengan tabel `kasir` MariaDB prekduadara_db + profil cabang)
const INITIAL_KASIR: KasirItem[] = [
  {
    id: "#KSR-001",
    dbId: 1,
    name: "Rian",
    roleTitle: "Kasir",
    shift: "Shift Pagi (08:00 - 12:00)",
    shiftMain: "Shift Pagi",
    shiftHours: "08:00 - 12:00",
    statusLive: "Aktif Melayani",
    isActive: true,
    branch: "Cabang Sudirman Utama",
    avatarColor: "bg-amber-100 text-amber-800 border-amber-300",
    initials: "RN",
  },
  {
    id: "#KSR-002",
    dbId: 2,
    name: "Siti",
    roleTitle: "Kasir",
    shift: "Shift Siang (12:00 - 17:00)",
    shiftMain: "Shift Siang",
    shiftHours: "12:00 - 17:00",
    statusLive: "Standby / Rehat",
    isActive: true,
    branch: "Cabang Sudirman Utama",
    avatarColor: "bg-orange-100 text-orange-800 border-orange-300",
    initials: "ST",
  },
  {
    id: "#KSR-003",
    dbId: 3,
    name: "Budi",
    roleTitle: "Kasir",
    shift: "Shift Malam (17:00 - 22:00)",
    shiftMain: "Shift Malam",
    shiftHours: "17:00 - 22:00",
    statusLive: "Standby / Rehat",
    isActive: true,
    branch: "Cabang Sudirman Utama",
    avatarColor: "bg-slate-100 text-slate-700 border-slate-300",
    initials: "BD",
  },
  {
    id: "#KSR-004",
    name: "Dimas",
    roleTitle: "Kepala Kasir",
    shift: "Shift Pagi (08:00 - 12:00)",
    shiftMain: "Shift Pagi",
    shiftHours: "08:00 - 12:00",
    statusLive: "Aktif Melayani",
    isActive: true,
    branch: "Cabang Tebet Eco Park",
    avatarColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    initials: "DM",
  },
  {
    id: "#KSR-005",
    name: "Nabila",
    roleTitle: "Kasir",
    shift: "Shift Siang (12:00 - 17:00)",
    shiftMain: "Shift Siang",
    shiftHours: "12:00 - 17:00",
    statusLive: "Standby / Rehat",
    isActive: true,
    branch: "Cabang Tebet Eco Park",
    avatarColor: "bg-blue-100 text-blue-800 border-blue-300",
    initials: "NB",
  },
  {
    id: "#KSR-006",
    name: "Fajar",
    roleTitle: "Kasir",
    shift: "Shift Pagi (08:00 - 12:00)",
    shiftMain: "Shift Pagi",
    shiftHours: "08:00 - 12:00",
    statusLive: "Aktif Melayani",
    isActive: true,
    branch: "Cabang Dago Heritage",
    avatarColor: "bg-amber-100 text-amber-800 border-amber-300",
    initials: "FJ",
  },
  {
    id: "#KSR-007",
    name: "Citra",
    roleTitle: "Kasir",
    shift: "Shift Malam (17:00 - 22:00)",
    shiftMain: "Shift Malam",
    shiftHours: "17:00 - 22:00",
    statusLive: "Selesai Shift / Off",
    isActive: false,
    branch: "Cabang Dago Heritage",
    avatarColor: "bg-gray-100 text-gray-700 border-gray-300",
    initials: "CT",
  },
];

const INITIAL_DRAWERS: Record<SingleBranchName, BranchDrawerState> = {
  "Cabang Sudirman Utama": {
    counter: "Counter #01",
    operatorId: "#KSR-001",
    operatorName: "Rian",
    shiftInfo: "Shift Pagi (08:00 - 12:00) • Login 07:54 WIB",
    modalAwal: 500000,
    totalSales: 3842500,
    totalNotes: 94,
    isOpen: true,
  },
  "Cabang Tebet Eco Park": {
    counter: "Counter #02",
    operatorId: "#KSR-004",
    operatorName: "Dimas",
    shiftInfo: "Shift Pagi (08:00 - 12:00) • Login 07:58 WIB",
    modalAwal: 500000,
    totalSales: 2915000,
    totalNotes: 71,
    isOpen: true,
  },
  "Cabang Dago Heritage": {
    counter: "Counter #03",
    operatorId: "#KSR-006",
    operatorName: "Fajar",
    shiftInfo: "Shift Pagi (08:00 - 12:00) • Login 08:01 WIB",
    modalAwal: 400000,
    totalSales: 2480000,
    totalNotes: 63,
    isOpen: true,
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "KS";
}

function parseShift(shiftStr?: string): {
  shiftMain: ShiftMainType;
  shiftHours: string;
} {
  let shiftMain: ShiftMainType = "Shift Pagi";
  let shiftHours = "08:00 - 12:00";

  if (!shiftStr) return { shiftMain, shiftHours };

  const lower = shiftStr.toLowerCase();
  if (lower.includes("siang")) {
    shiftMain = "Shift Siang";
    shiftHours = "12:00 - 17:00";
  } else if (lower.includes("malam")) {
    shiftMain = "Shift Malam";
    shiftHours = "17:00 - 22:00";
  } else if (lower.includes("off") || lower.includes("libur")) {
    shiftMain = "Off / Libur";
    shiftHours = "Jadwal Libur";
  }

  return { shiftMain, shiftHours };
}

function generateNextCashierCode(list: KasirItem[]): string {
  const maxNum = list.reduce((max, item) => {
    const match = item.id.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, num);
  }, 0);
  return `#KSR-${String(maxNum + 1).padStart(3, "0")}`;
}

export default function KasirShiftPage() {
  const [kasirList, setKasirList] = useState<KasirItem[]>(INITIAL_KASIR);
  const [drawersByBranch, setDrawersByBranch] =
    useState<Record<SingleBranchName, BranchDrawerState>>(INITIAL_DRAWERS);

  // Filter Header & Tabel
  const [selectedBranch, setSelectedBranch] = useState<string>("Semua Cabang");
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShiftFilter, setSelectedShiftFilter] =
    useState<string>("Semua");
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Toast Notification dengan useRef Timer
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "info" | "warning" = "success") => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMsg({ text, type });
      toastTimerRef.current = setTimeout(() => {
        setToastMsg(null);
      }, 3400);
    },
    []
  );

  // State Form Kasir
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Kasir");
  const [formId, setFormId] = useState("#KSR-008");
  const [formBranch, setFormBranch] = useState<SingleBranchName>(
    "Cabang Sudirman Utama"
  );
  const [formShift, setFormShift] = useState<"Pagi" | "Siang" | "Malam">(
    "Pagi"
  );
  const [formIsActive, setFormIsActive] = useState(true);

  // State Modals Interaktif (Menggantikan alert & confirm)
  const [showSopModal, setShowSopModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KasirItem | null>(null);

  // Modal Ganti Operator Laci
  const [showSwitchOperatorModal, setShowSwitchOperatorModal] = useState(false);
  const [selectedNewOperatorId, setSelectedNewOperatorId] = useState("");

  // Modal Tutup Shift / Buka Shift Baru
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState("");
  const [reopenModalAwalInput, setReopenModalAwalInput] = useState("500000");

  // Click-outside handler untuk dropdown cabang & filter shift
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target as Node)
      ) {
        setShowBranchMenu(false);
      }
      if (
        shiftDropdownRef.current &&
        !shiftDropdownRef.current.contains(e.target as Node)
      ) {
        setShowShiftDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refs untuk pembacaan state terkini saat sinkronisasi DB tanpa memicu re-fetch loop
  const kasirListRef = useRef<KasirItem[]>(kasirList);
  kasirListRef.current = kasirList;
  const editingIdRef = useRef<string | null>(editingId);
  editingIdRef.current = editingId;
  const formNameRef = useRef<string>(formName);
  formNameRef.current = formName;

  // 1. FETCH DATA DARI API BACKEND MARIADB (`Cabang Sudirman Utama`)
  const loadCashiersFromDB = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/cashiers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const avatarBgs = [
          "bg-amber-100 text-amber-800 border-amber-300",
          "bg-orange-100 text-orange-800 border-orange-300",
          "bg-slate-100 text-slate-700 border-slate-300",
          "bg-emerald-100 text-emerald-800 border-emerald-300",
        ];

        const mappedDbItems: KasirItem[] = (json.data as ApiCashierRow[]).map(
          (c, idx) => {
            const { shiftMain, shiftHours } = parseShift(c.shift);
            const activeFlag = Boolean(c.isActive ?? c.is_active ?? true);
            const liveStatus: LiveStatusType =
              c.statusLive ||
              c.status_live ||
              (activeFlag ? "Aktif Melayani" : "Selesai Shift / Off");

            return {
              id: c.id,
              dbId: c.dbId,
              name: c.name,
              roleTitle: c.roleTitle || c.role_title || "Kasir",
              shift: c.shift || "Shift Pagi (08:00 - 12:00)",
              shiftMain,
              shiftHours,
              statusLive: liveStatus,
              isActive: activeFlag,
              branch: c.branch || "Cabang Sudirman Utama",
              avatarColor: avatarBgs[idx % avatarBgs.length],
              initials: getInitials(c.name),
              createdAt: c.createdAt,
            };
          }
        );

        const otherBranches = kasirListRef.current.filter(
          (item) => item.branch !== "Cabang Sudirman Utama"
        );
        const nextList = [...mappedDbItems, ...otherBranches];

        setDbConnected(true);
        setKasirList(nextList);

        if (!editingIdRef.current && formNameRef.current === "") {
          setFormId(generateNextCashierCode(nextList));
        }

        const activeSudirman = mappedDbItems.find(
          (item) => item.statusLive === "Aktif Melayani" && item.isActive
        );
        if (activeSudirman) {
          setDrawersByBranch((prev) => ({
            ...prev,
            "Cabang Sudirman Utama": {
              ...prev["Cabang Sudirman Utama"],
              operatorId: activeSudirman.id,
              operatorName: activeSudirman.name,
              shiftInfo: `${activeSudirman.shift} • Login Aktif`,
            },
          }));
        }
      }
    } catch {
      setDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashiersFromDB();
  }, [loadCashiersFromDB]);

  // Cabang target untuk Laci Kasir & aksi tulis
  const activeDrawerBranch: SingleBranchName =
    selectedBranch === "Semua Cabang"
      ? formBranch
      : (selectedBranch as SingleBranchName);

  const activeDrawer = drawersByBranch[activeDrawerBranch];

  // Daftar kasir sesuai pilihan cabang di header
  const branchScopedKasir = useMemo(() => {
    if (selectedBranch === "Semua Cabang") return kasirList;
    return kasirList.filter((k) => k.branch === selectedBranch);
  }, [kasirList, selectedBranch]);

  // Filter Data Berdasarkan Cabang, Pencarian & Shift
  const filteredKasir = useMemo(() => {
    return branchScopedKasir.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q) ||
        item.shift.toLowerCase().includes(q) ||
        item.branch.toLowerCase().includes(q);

      if (selectedShiftFilter === "Semua") return matchesSearch;
      if (selectedShiftFilter === "Pagi")
        return matchesSearch && item.shift.includes("Pagi");
      if (selectedShiftFilter === "Siang")
        return matchesSearch && item.shift.includes("Siang");
      if (selectedShiftFilter === "Malam")
        return matchesSearch && item.shift.includes("Malam");
      return matchesSearch;
    });
  }, [branchScopedKasir, searchQuery, selectedShiftFilter]);

  // Metrik Ringkasan Dinamis Berdasarkan Cabang Terpilih
  const kpiStats = useMemo(() => {
    const totalKasir = branchScopedKasir.length;
    const kasirOnline = branchScopedKasir.filter(
      (c) => c.statusLive === "Aktif Melayani" && c.isActive
    ).length;
    const kasirStandby = branchScopedKasir.filter(
      (c) => c.statusLive === "Standby / Rehat" && c.isActive
    ).length;
    const kasirOff = branchScopedKasir.filter(
      (c) => !c.isActive || c.statusLive === "Selesai Shift / Off"
    ).length;

    return { totalKasir, kasirOnline, kasirStandby, kasirOff };
  }, [branchScopedKasir]);

  // Reset seluruh filter tabel
  const handleResetFilters = () => {
    setSelectedBranch("Semua Cabang");
    setSearchQuery("");
    setSelectedShiftFilter("Semua");
    showToast("Seluruh filter telah direset ke Semua Cabang.", "info");
  };

  // 2. TOGGLE STATUS AKSES KASIR (Sinkron ke Database)
  const handleToggleActive = async (id: string) => {
    const targetKasir = kasirList.find((c) => c.id === id);
    if (!targetKasir) return;
    const nextActive = !targetKasir.isActive;

    let nextList = kasirList.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        isActive: nextActive,
        statusLive: (nextActive
          ? c.shiftMain === "Off / Libur"
            ? "Standby / Rehat"
            : "Aktif Melayani"
          : "Selesai Shift / Off") as LiveStatusType,
      };
    });

    if (!nextActive) {
      const nextDrawers = { ...drawersByBranch };
      let drawerChanged = false;
      const promotedIds = new Set<string>();

      SINGLE_BRANCHES.forEach((bName) => {
        if (nextDrawers[bName].operatorId === id) {
          drawerChanged = true;
          const replacement = nextList.find(
            (c) => c.branch === bName && c.isActive && c.id !== id
          );
          if (replacement) {
            promotedIds.add(replacement.id);
            nextDrawers[bName] = {
              ...nextDrawers[bName],
              operatorId: replacement.id,
              operatorName: replacement.name,
              shiftInfo: `${replacement.shift} • Dialihkan Otomatis`,
            };
          } else {
            nextDrawers[bName] = {
              ...nextDrawers[bName],
              isOpen: false,
              lastClosedInfo:
                "Laci ditutup otomatis (tidak ada operator aktif)",
            };
          }
        }
      });

      if (promotedIds.size > 0) {
        nextList = nextList.map((c) =>
          promotedIds.has(c.id)
            ? { ...c, statusLive: "Aktif Melayani" as LiveStatusType }
            : c
        );
      }

      if (drawerChanged) {
        setDrawersByBranch(nextDrawers);
      }
    }

    setKasirList(nextList);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("prek_auth_token")
          : null;
      await fetch(
        `http://localhost:5000/api/cashiers/${encodeURIComponent(id)}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
    } catch {
      // Tetap terupdate di state lokal
    }

    showToast(
      `Hak akses ${targetKasir.name} (${targetKasir.id}) ${
        nextActive ? "diaktifkan" : "dinonaktifkan"
      }!`,
      "success"
    );
  };

  // 3. EDIT KASIR
  const handleStartEdit = (kasir: KasirItem) => {
    setEditingId(kasir.id);
    setFormName(kasir.name);
    setFormRole(kasir.roleTitle || "Kasir");
    setFormId(kasir.id);
    setFormBranch(kasir.branch);
    if (kasir.shift.includes("Siang")) setFormShift("Siang");
    else if (kasir.shift.includes("Malam")) setFormShift("Malam");
    else setFormShift("Pagi");
    setFormIsActive(kasir.isActive);

    const formElem = document.getElementById("form-kasir-container");
    formElem?.scrollIntoView({ behavior: "smooth" });
    showToast(`Mengedit profil kasir: ${kasir.name} (${kasir.id})`, "info");
  };

  // 4. RESET FORM
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setFormName("");
    setFormRole("Kasir");
    setFormId(generateNextCashierCode(kasirList));
    setFormBranch(
      selectedBranch === "Semua Cabang"
        ? "Cabang Sudirman Utama"
        : (selectedBranch as SingleBranchName)
    );
    setFormShift("Pagi");
    setFormIsActive(true);
  }, [kasirList, selectedBranch]);

  // 5. SIMPAN KASIR (POST / PUT ke Database + State Multi-Cabang)
  const handleSaveKasir = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanRole = formRole.trim() || "Kasir";
    const rawCode = formId.trim().toUpperCase();
    const cleanCode = rawCode.startsWith("#") ? rawCode : `#${rawCode}`;

    if (!cleanName) {
      showToast("Nama lengkap kasir wajib diisi!", "warning");
      return;
    }

    if (
      !editingId &&
      kasirList.some((k) => k.id.toUpperCase() === cleanCode.toUpperCase())
    ) {
      showToast(
        `Kode Kasir ${cleanCode} sudah digunakan! Gunakan kode unik lain.`,
        "warning"
      );
      return;
    }

    const shiftMap: Record<
      "Pagi" | "Siang" | "Malam",
      { label: string; main: ShiftMainType; hours: string }
    > = {
      Pagi: {
        label: "Shift Pagi (08:00 - 12:00)",
        main: "Shift Pagi",
        hours: "08:00 - 12:00",
      },
      Siang: {
        label: "Shift Siang (12:00 - 17:00)",
        main: "Shift Siang",
        hours: "12:00 - 17:00",
      },
      Malam: {
        label: "Shift Malam (17:00 - 22:00)",
        main: "Shift Malam",
        hours: "17:00 - 22:00",
      },
    };

    const chosen = shiftMap[formShift];
    const statusLive: LiveStatusType = !formIsActive
      ? "Selesai Shift / Off"
      : chosen.main === "Shift Pagi"
        ? "Aktif Melayani"
        : "Standby / Rehat";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("prek_auth_token")
        : null;

    if (editingId) {
      setKasirList((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: cleanName,
                roleTitle: cleanRole,
                shift: chosen.label,
                shiftMain: chosen.main,
                shiftHours: chosen.hours,
                statusLive,
                isActive: formIsActive,
                branch: formBranch,
                initials: getInitials(cleanName),
              }
            : item
        )
      );

      // Update operator name di laci jika kasir ini sedang memegang laci
      setDrawersByBranch((prev) => {
        const next = { ...prev };
        SINGLE_BRANCHES.forEach((bName) => {
          if (next[bName].operatorId === editingId) {
            next[bName] = {
              ...next[bName],
              operatorName: cleanName,
              shiftInfo: `${chosen.label} • Diperbarui`,
            };
          }
        });
        return next;
      });

      try {
        await fetch(
          `http://localhost:5000/api/cashiers/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: cleanName,
              role_title: cleanRole,
              shift: chosen.label,
              status_live: statusLive,
              is_active: formIsActive,
            }),
          }
        );
      } catch {
        // Tetap tersimpan di state lokal
      }

      showToast(
        `Profil kasir ${cleanName} (${editingId}) berhasil diperbarui!`,
        "success"
      );
      setEditingId(null);
      setFormName("");
      setFormRole("Kasir");
      setFormId(generateNextCashierCode(kasirList));
    } else {
      const newKasir: KasirItem = {
        id: cleanCode,
        name: cleanName,
        roleTitle: cleanRole,
        shift: chosen.label,
        shiftMain: chosen.main,
        shiftHours: chosen.hours,
        statusLive,
        isActive: formIsActive,
        branch: formBranch,
        avatarColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        initials: getInitials(cleanName),
      };

      const nextList = [newKasir, ...kasirList];
      setKasirList(nextList);

      if (formBranch === "Cabang Sudirman Utama") {
        try {
          const res = await fetch("http://localhost:5000/api/cashiers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              cashier_code: cleanCode,
              name: cleanName,
              role_title: cleanRole,
              shift: chosen.label,
              status_live: statusLive,
              is_active: formIsActive,
            }),
          });
          const resJson = await res.json();
          if (resJson.success) {
            loadCashiersFromDB();
          }
        } catch {
          // Tetap tersimpan di state lokal
        }
      }

      showToast(
        `Staf kasir baru ${cleanName} (${cleanCode}) berhasil ditambahkan ke ${formBranch}!`,
        "success"
      );
      setEditingId(null);
      setFormName("");
      setFormRole("Kasir");
      setFormId(generateNextCashierCode(nextList));
    }
  };

  // 6. KONFIRMASI HAPUS KASIR (Modal Interaktif)
  const handleConfirmDeleteKasir = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;

    let nextList = kasirList.filter((c) => c.id !== id);

    const nextDrawers = { ...drawersByBranch };
    let drawerChanged = false;
    const promotedIds = new Set<string>();

    SINGLE_BRANCHES.forEach((bName) => {
      if (nextDrawers[bName].operatorId === id) {
        drawerChanged = true;
        const replacement = nextList.find(
          (c) => c.branch === bName && c.isActive
        );
        if (replacement) {
          promotedIds.add(replacement.id);
          nextDrawers[bName] = {
            ...nextDrawers[bName],
            operatorId: replacement.id,
            operatorName: replacement.name,
            shiftInfo: `${replacement.shift} • Dialihkan Otomatis`,
          };
        } else {
          nextDrawers[bName] = {
            ...nextDrawers[bName],
            isOpen: false,
            lastClosedInfo:
              "Laci ditutup otomatis (tidak ada operator aktif)",
          };
        }
      }
    });

    if (promotedIds.size > 0) {
      nextList = nextList.map((c) =>
        promotedIds.has(c.id)
          ? { ...c, statusLive: "Aktif Melayani" as LiveStatusType }
          : c
      );
    }

    if (drawerChanged) {
      setDrawersByBranch(nextDrawers);
    }

    setKasirList(nextList);
    if (editingId === id) {
      setEditingId(null);
      setFormName("");
      setFormId(generateNextCashierCode(nextList));
    }
    setDeleteTarget(null);
    showToast(`Data kasir ${name} (${id}) telah dihapus.`, "info");

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("prek_auth_token")
          : null;
      await fetch(
        `http://localhost:5000/api/cashiers/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
    } catch {
      // Tetap terhapus di UI
    }
  };

  // 7. BUKA MODAL GANTI OPERATOR LACI
  const availableBranchCashiers = useMemo(() => {
    const branchMatch = kasirList.filter(
      (c) => c.branch === activeDrawerBranch && c.isActive
    );
    return branchMatch.length > 0
      ? branchMatch
      : kasirList.filter((c) => c.isActive);
  }, [kasirList, activeDrawerBranch]);

  const handleOpenSwitchOperator = () => {
    if (availableBranchCashiers.length === 0) {
      showToast(
        "Tidak ada staf kasir berstatus akses aktif untuk menggantikan operator.",
        "warning"
      );
      return;
    }
    const candidate =
      availableBranchCashiers.find((c) => c.id !== activeDrawer.operatorId) ||
      availableBranchCashiers[0];
    setSelectedNewOperatorId(candidate.id);
    setShowSwitchOperatorModal(true);
  };

  const handleConfirmSwitchOperator = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = availableBranchCashiers.find(
      (c) => c.id === selectedNewOperatorId
    );
    if (!chosen) return;

    const nowTime = new Date().toTimeString().slice(0, 5);
    setDrawersByBranch((prev) => ({
      ...prev,
      [activeDrawerBranch]: {
        ...prev[activeDrawerBranch],
        operatorId: chosen.id,
        operatorName: chosen.name,
        shiftInfo: `${chosen.shift} • Serah Terima ${nowTime} WIB`,
        isOpen: true,
      },
    }));

    setKasirList((prev) =>
      prev.map((c) => {
        if (c.branch !== activeDrawerBranch) return c;
        if (c.id === chosen.id) {
          return { ...c, statusLive: "Aktif Melayani", isActive: true };
        }
        if (c.id === activeDrawer.operatorId && c.statusLive === "Aktif Melayani") {
          return { ...c, statusLive: "Standby / Rehat" };
        }
        return c;
      })
    );

    setShowSwitchOperatorModal(false);
    showToast(
      `Operator laci ${activeDrawer.counter} (${activeDrawerBranch}) dialihkan ke ${chosen.name} (${chosen.id})!`,
      "success"
    );
  };

  // 8. TUTUP SHIFT (REKONSILIASI X-REPORT) & BUKA SHIFT BARU
  const expectedDrawerCash = activeDrawer.modalAwal + activeDrawer.totalSales;

  const handleOpenCloseShiftModal = () => {
    setCountedCashInput(String(expectedDrawerCash));
    setReopenModalAwalInput(String(activeDrawer.modalAwal));
    setShowCloseShiftModal(true);
  };

  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const nowTime = new Date().toTimeString().slice(0, 5);
    const counted = parseFloat(countedCashInput) || expectedDrawerCash;
    const diff = counted - expectedDrawerCash;

    setDrawersByBranch((prev) => ({
      ...prev,
      [activeDrawerBranch]: {
        ...prev[activeDrawerBranch],
        isOpen: false,
        lastClosedInfo: `Ditutup ${nowTime} WIB • Fisik Rp ${Math.round(
          counted
        ).toLocaleString("id-ID")} (${
          diff === 0
            ? "Sesuai Sistem"
            : diff > 0
              ? `Surplus +Rp ${Math.round(diff).toLocaleString("id-ID")}`
              : `Selisih -Rp ${Math.round(Math.abs(diff)).toLocaleString("id-ID")}`
        })`,
      },
    }));

    setKasirList((prev) =>
      prev.map((c) =>
        c.id === activeDrawer.operatorId
          ? { ...c, statusLive: "Selesai Shift / Off" }
          : c
      )
    );

    setShowCloseShiftModal(false);
    showToast(
      `Shift ${activeDrawer.counter} (${activeDrawerBranch}) ditutup & Shift X-Report berhasil direkap!`,
      "success"
    );
  };

  const handleConfirmReopenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const modalBaru = Math.max(0, parseFloat(reopenModalAwalInput) || 500000);
    const nowTime = new Date().toTimeString().slice(0, 5);

    setDrawersByBranch((prev) => ({
      ...prev,
      [activeDrawerBranch]: {
        ...prev[activeDrawerBranch],
        modalAwal: modalBaru,
        isOpen: true,
        shiftInfo: `Shift Aktif • Dibuka kembali pukul ${nowTime} WIB`,
      },
    }));

    setKasirList((prev) =>
      prev.map((c) =>
        c.id === activeDrawer.operatorId
          ? { ...c, statusLive: "Aktif Melayani", isActive: true }
          : c
      )
    );

    setShowCloseShiftModal(false);
    showToast(
      `Shift baru ${activeDrawer.counter} (${activeDrawerBranch}) berhasil dibuka dengan modal awal Rp ${modalBaru.toLocaleString(
        "id-ID"
      )}!`,
      "success"
    );
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-gray-900">
      {/* Toast Notification Seragam */}
      {toastMsg && (
        <div
          className={`print:hidden fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-white border transition-all ${
            toastMsg.type === "success"
              ? "bg-[#2D452B] border-[#415C3E]"
              : toastMsg.type === "warning"
                ? "bg-amber-600 border-amber-500"
                : "bg-slate-800 border-slate-700"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            {toastMsg.type === "warning" ? (
              <AlertTriangle size={14} />
            ) : (
              <CheckCircle2 size={15} className="text-emerald-300" />
            )}
          </div>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* MODAL 1: PANDUAN SOP PERGANTIAN SHIFT */}
      {showSopModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSopModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    SOP Pergantian Shift &amp; Serah Terima Laci Tunai
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Standar Operasional Kasir POS PrekDuaDara
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSopModal(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs sm:text-sm text-gray-700 font-medium">
              {[
                "Hitung total uang tunai fisik di dalam laci kasir (Modal Awal + Penjualan Tunai).",
                "Klik tombol 'Tutup Shift (X-Report)' untuk mencocokkan nominal fisik dengan catatan sistem.",
                "Cetak struk rekapitulasi Shift X-Report pada printer thermal 58mm/80mm.",
                "Serahkan laci kasir beserta lembar X-Report yang telah ditandatangani kepada operator shift berikutnya.",
                "Gunakan tombol 'Ganti Operator Laci' agar transaksi baru tercatat atas nama kasir penerus.",
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#FAF8F3] border border-gray-200 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#F3A712] text-gray-950 font-black text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSopModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2D452B] text-white text-xs font-extrabold cursor-pointer"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS KASIR */}
      {deleteTarget && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#DC2626] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 size={18} />
                <h3 className="text-sm sm:text-base font-extrabold">
                  Konfirmasi Hapus Staf Kasir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-red-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus profil kasir{" "}
              <strong className="text-gray-900 font-extrabold">
                {deleteTarget.name} ({deleteTarget.id})
              </strong>{" "}
              dari <strong className="text-gray-900">{deleteTarget.branch}</strong>?
              Tindakan ini akan mencabut akses login POS kasir tersebut.
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKasir}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Ya, Hapus Kasir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GANTI OPERATOR LACI KASIR */}
      {showSwitchOperatorModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSwitchOperatorModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Repeat size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Ganti Operator Laci ({activeDrawer.counter})
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    {activeDrawerBranch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchOperatorModal(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSwitchOperator} className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-gray-700">
                Operator Saat Ini:{" "}
                <strong className="font-extrabold text-gray-900">
                  {activeDrawer.operatorName} ({activeDrawer.operatorId})
                </strong>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  Pilih Operator Kasir Penerus
                </label>
                <select
                  value={selectedNewOperatorId}
                  onChange={(e) => setSelectedNewOperatorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#EA8E18] cursor-pointer"
                >
                  {availableBranchCashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — {c.shiftMain} [{c.branch.replace("Cabang ", "")}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSwitchOperatorModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F3A712] hover:bg-[#df980e] text-gray-950 text-xs font-extrabold cursor-pointer"
                >
                  Alihkan Laci Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TUTUP SHIFT (X-REPORT) / BUKA SHIFT BARU */}
      {showCloseShiftModal && (
        <div
          className="print:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCloseShiftModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`${
                activeDrawer.isOpen ? "bg-[#E11D48]" : "bg-[#1E562F]"
              } text-white px-5 py-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2.5">
                <Power size={18} />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    {activeDrawer.isOpen
                      ? `Tutup Shift & Rekonsiliasi (${activeDrawer.counter})`
                      : `Buka Shift Baru (${activeDrawer.counter})`}
                  </h3>
                  <p className="text-[11px] text-white/85 font-medium">
                    {activeDrawerBranch} • Operator: {activeDrawer.operatorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {activeDrawer.isOpen ? (
              <form onSubmit={handleConfirmCloseShift} className="p-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Modal Awal Laci:</span>
                    <strong className="text-gray-900">
                      Rp {activeDrawer.modalAwal.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">
                      Total Penjualan ({activeDrawer.totalNotes} Nota):
                    </span>
                    <strong className="text-gray-900">
                      Rp {activeDrawer.totalSales.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-200 font-extrabold text-gray-900">
                    <span>Ekspektasi Total Kas Sistem:</span>
                    <span className="text-[#B45309]">
                      Rp {expectedDrawerCash.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    Nominal Uang Fisik Dihitung di Laci (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-gray-900 focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Tutup Shift &amp; Cetak X-Report
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReopenShift} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    Modal Awal Laci Tunai Baru (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={reopenModalAwalInput}
                    onChange={(e) => setReopenModalAwalInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-gray-900 focus:outline-none focus:border-[#1E562F]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1E562F] hover:bg-[#164223] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Buka Shift Laci Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 1. SIDEBAR KIRI (FIXED & PATEN) */}
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>

      {/* 2. AREA KONTEN UTAMA */}
      <main className="flex-1 flex flex-col gap-6 overflow-x-hidden print:overflow-visible max-w-full">
        {/* TOP NAVBAR HEADER (SERAGAM DENGAN DASHBOARD & STOK) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm print:shadow-none border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
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
                Pengaturan Staf &amp; Kasir Restoran
              </div>
            </div>
          </div>

          {/* Info Cetak Saat Mode Print */}
          <div className="hidden print:block text-right text-xs text-gray-700">
            <div className="font-bold text-gray-900">
              Laporan Staf Kasir &amp; Shift • {selectedBranch}
            </div>
            <div className="mt-0.5">
              Total Kasir Terfilter: {filteredKasir.length} Staf • Online:{" "}
              {kpiStats.kasirOnline} Kasir
            </div>
          </div>

          {/* Right Controls: Branch Selector, Online Sync & User Profile */}
          <div className="print:hidden flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            {/* Interactive Branch Selector */}
            <div ref={branchDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowBranchMenu((prev) => !prev)}
                className="h-9 shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition"
              >
                <Store size={14} className="text-[#EA8E18] shrink-0" />
                <span>{selectedBranch}</span>
                <ChevronDown size={14} className="text-gray-500 shrink-0" />
              </button>

              {showBranchMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs">
                  {BRANCH_OPTIONS.map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(branch);
                        if (branch !== "Semua Cabang") {
                          setFormBranch(branch as SingleBranchName);
                        }
                        setShowBranchMenu(false);
                        showToast(`Menampilkan staf kasir: ${branch}`, "info");
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-amber-50/60 transition cursor-pointer ${
                        selectedBranch === branch
                          ? "font-extrabold text-[#EA8E18] bg-amber-50/40"
                          : "font-semibold text-gray-700"
                      }`}
                    >
                      <Store size={13} className="shrink-0" />
                      <span className="truncate">{branch}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Online Sync Pill */}
            <div className="h-9 flex items-center gap-2 px-3.5 bg-[#E8F8F0] border border-[#A7F3D0] text-[#047857] text-xs font-extrabold rounded-full shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
              <span>ONLINE SYNC</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200 shrink-0">
              <div className="text-right">
                <div className="text-xs font-extrabold text-gray-900 leading-tight whitespace-nowrap">
                  Rian Pratama
                </div>
                <div className="text-[11px] text-[#EA8E18] font-bold leading-tight mt-0.5 whitespace-nowrap">
                  Supervisor Kasir
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE & ACTION ROW */}
        <section className="print:hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Pengaturan &amp; Manajemen Kasir
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-xs font-extrabold uppercase tracking-wide shrink-0">
                <ShieldCheck size={14} className="text-amber-600" />
                DATABASE KASIR
              </span>
              <span className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold shrink-0">
                Tabel `kasir` • {selectedBranch}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 font-medium leading-relaxed">
              Kelola data kasir dari database MariaDB (tabel `kasir`), pantau
              status shift lintas cabang, dan atur hak akses akun secara
              real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start xl:self-auto flex-wrap sm:flex-nowrap shrink-0">
            {/* Filter Shift Dropdown */}
            <div ref={shiftDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowShiftDropdown((prev) => !prev)}
                className="h-10 w-[185px] justify-between shrink-0 whitespace-nowrap px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Filter size={14} className="text-gray-600 shrink-0" />
                  <span className="truncate">
                    Filter Shift: {selectedShiftFilter}
                  </span>
                </span>
                <ChevronDown size={14} className="text-gray-500 shrink-0" />
              </button>

              {showShiftDropdown && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 text-xs">
                  {[
                    { key: "Semua", label: "Semua Shift" },
                    { key: "Pagi", label: "Shift Pagi (08:00 - 12:00)" },
                    { key: "Siang", label: "Shift Siang (12:00 - 17:00)" },
                    { key: "Malam", label: "Shift Malam (17:00 - 22:00)" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedShiftFilter(opt.key);
                        setShowShiftDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-amber-50/60 transition cursor-pointer ${
                        selectedShiftFilter === opt.key
                          ? "text-[#EA8E18] font-extrabold bg-amber-50/40"
                          : "text-gray-700 font-semibold"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Cetak Laporan */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 w-[92px] justify-center shrink-0 whitespace-nowrap bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} className="shrink-0" />
              <span>Cetak</span>
            </button>

            {/* Tombol Refresh dari Database */}
            <button
              type="button"
              onClick={() => {
                loadCashiersFromDB();
                showToast("Menyinkronkan ulang data tabel kasir...", "info");
              }}
              title="Refresh Data dari Database"
              aria-label="Refresh Data dari Database"
              className="h-10 w-10 justify-center shrink-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition flex items-center cursor-pointer"
            >
              <RefreshCw
                size={15}
                className={isLoading ? "animate-spin text-[#EA8E18]" : ""}
              />
            </button>

            {/* Tambah Kasir Baru Button */}
            <button
              type="button"
              onClick={() => {
                handleResetForm();
                const formElem = document.getElementById(
                  "form-kasir-container"
                );
                formElem?.scrollIntoView({ behavior: "smooth" });
                showToast(
                  "Silakan lengkapi form di sebelah kanan untuk mendaftarkan kasir baru.",
                  "info"
                );
              }}
              className="h-10 w-[178px] justify-center shrink-0 whitespace-nowrap bg-[#F3A712] hover:bg-[#df980e] text-gray-950 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus size={15} className="shrink-0" />
              <span>+ Tambah Kasir Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY STAT CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-5 print:gap-3">
          {/* Card 1: Total Kasir */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 tracking-wider uppercase truncate">
                TOTAL KASIR TERDAFTAR
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.totalKasir}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Staf Kasir
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-bold min-w-0">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{selectedBranch}</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#EA8E18] flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
          </div>

          {/* Card 2: Sedang Bertugas */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold text-gray-500 tracking-wider uppercase truncate">
                  SEDANG BERTUGAS
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Live
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.kasirOnline}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Kasir Online
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-semibold min-w-0">
                <UserCheck size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">Status: Aktif Melayani</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
          </div>

          {/* Card 3: Standby / Istirahat */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 tracking-wider uppercase truncate">
                STANDBY / ISTIRAHAT
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.kasirStandby}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Kasir
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-semibold min-w-0">
                <Coffee size={14} className="text-[#EA8E18] shrink-0" />
                <span className="truncate">Pergantian shift berikutnya</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#EA8E18] flex items-center justify-center shrink-0">
              <Coffee size={20} />
            </div>
          </div>

          {/* Card 4: Off / Non-Aktif */}
          <div className="bg-white rounded-2xl p-6 print:p-3.5 shadow-sm print:shadow-none border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-500 tracking-wider uppercase truncate">
                OFF / NON-AKTIF
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl print:text-lg font-black text-gray-900">
                  {kpiStats.kasirOff}
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Kasir
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-semibold min-w-0">
                <Lock size={14} className="text-gray-500 shrink-0" />
                <span className="truncate">Hak akses akun tertahan</span>
              </div>
            </div>
            <div className="w-11 h-11 print:w-8 print:h-8 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
              <Moon size={20} />
            </div>
          </div>
        </section>

        {/* ACTIVE CASH DRAWER BANNER */}
        <section
          className={`print:hidden rounded-2xl p-6 border shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 ${
            activeDrawer.isOpen
              ? "bg-[#FFFDF7] border-[#F59E0B]/40"
              : "bg-gray-50 border-gray-300"
          }`}
        >
          {/* Sisi Kiri: Operator & Counter Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${
                activeDrawer.isOpen
                  ? "bg-[#FEF3C7] border-[#F59E0B]/50 text-amber-800"
                  : "bg-gray-200 border-gray-300 text-gray-600"
              }`}
            >
              <Wallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-extrabold flex items-center gap-1.5 ${
                    activeDrawer.isOpen ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeDrawer.isOpen
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  ></span>
                  {activeDrawer.isOpen
                    ? "LACI KASIR AKTIF SAAT INI"
                    : "LACI KASIR DITUTUP (SELESAI SHIFT)"}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
                  {activeDrawer.counter}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold">
                  {activeDrawerBranch}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                {activeDrawer.operatorName} ({activeDrawer.operatorId})
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                {activeDrawer.shiftInfo} • Modal Awal Rp{" "}
                {activeDrawer.modalAwal.toLocaleString("id-ID")}
              </p>
              {!activeDrawer.isOpen && activeDrawer.lastClosedInfo && (
                <p className="text-xs font-bold text-rose-700 mt-1">
                  {activeDrawer.lastClosedInfo}
                </p>
              )}
            </div>
          </div>

          {/* Sisi Tengah: Metrik Shift */}
          <div className="flex items-center gap-6 sm:gap-10 border-y xl:border-y-0 xl:border-x border-[#FDE68A] py-3 xl:py-0 xl:px-8 shrink-0">
            <div className="w-[160px] shrink-0">
              <div className="text-xs font-extrabold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                TOTAL PENJUALAN SHIFT
              </div>
              <div className="text-lg sm:text-xl font-black text-[#B45309] mt-1 tabular-nums whitespace-nowrap">
                Rp {activeDrawer.totalSales.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="w-[130px] shrink-0">
              <div className="text-xs font-extrabold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                TRANSAKSI SELESAI
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900 mt-1 tabular-nums whitespace-nowrap">
                {activeDrawer.totalNotes} Nota
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-2.5 sm:self-end xl:self-center shrink-0">
            <button
              type="button"
              onClick={handleOpenSwitchOperator}
              disabled={!activeDrawer.isOpen}
              className="h-10 w-[178px] shrink-0 justify-center whitespace-nowrap bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none text-gray-800 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Repeat size={14} className="text-gray-600 shrink-0" />
              <span>Ganti Operator Laci</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCloseShiftModal}
              className={`h-10 w-[162px] shrink-0 justify-center whitespace-nowrap rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                activeDrawer.isOpen
                  ? "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                  : "bg-[#1E562F] hover:bg-[#164223] text-white"
              }`}
            >
              <Power size={14} className="shrink-0" />
              <span>
                {activeDrawer.isOpen ? "Tutup Shift Paksa" : "Buka Shift Baru"}
              </span>
            </button>
          </div>
        </section>

        {/* 2-COLUMN MAIN CONTENT: LEFT (TABLE) & RIGHT (FORM & HARDWARE) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: TABEL DAFTAR KASIR (8 cols, 12 on print) */}
          <div className="xl:col-span-8 print:col-span-12 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 print:p-3 shadow-sm print:shadow-none border border-gray-200 flex flex-col gap-5">
              {/* Header Tabel & Search */}
              <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-2.5 shrink-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 whitespace-nowrap">
                    Daftar Staf Kasir POS
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-extrabold tabular-nums whitespace-nowrap shrink-0">
                    {filteredKasir.length} Terdata
                  </span>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <div className="relative h-9 flex-1 sm:w-[270px] sm:flex-none shrink-0">
                    <Search
                      size={15}
                      className="text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Cari nama, kode, atau cabang..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full pl-9 pr-8 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#EA8E18]"
                    />
                    {searchQuery !== "" && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        title="Hapus pencarian"
                        aria-label="Hapus pencarian"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabel Sinkron dengan Database `kasir` */}
              <div className="overflow-x-auto print:overflow-visible">
                <table className="table-fixed w-[910px] print:table-auto print:w-full print:text-[10px] text-left border-collapse text-xs sm:text-sm">
                  <colgroup>
                    <col className="w-[240px] print:w-auto" />
                    <col className="w-[130px] print:w-auto" />
                    <col className="w-[165px] print:w-auto" />
                    <col className="w-[165px] print:w-auto" />
                    <col className="w-[105px] print:w-auto" />
                    <col className="w-[105px] print:w-auto" />
                  </colgroup>
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50 text-xs print:text-[9px] font-extrabold text-gray-600 uppercase tracking-wider">
                      <th className="py-4 px-4 whitespace-nowrap">
                        STAF KASIR &amp; CABANG
                      </th>
                      <th className="py-4 px-4 whitespace-nowrap">PERAN</th>
                      <th className="py-4 px-4 whitespace-nowrap">
                        SHIFT TERJADWAL
                      </th>
                      <th className="py-4 px-4 whitespace-nowrap">
                        STATUS LIVE
                      </th>
                      <th className="py-4 px-4 text-center whitespace-nowrap">
                        AKSES AKTIF
                      </th>
                      <th className="py-4 px-4 text-center whitespace-nowrap print:hidden">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {filteredKasir.map((kasir) => (
                      <tr
                        key={kasir.id}
                        className="hover:bg-amber-50/30 transition-colors"
                      >
                        {/* 1. Staf Kasir (Avatar, Nama, ID/cashier_code, Cabang) */}
                        <td className="py-5 px-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border ${kasir.avatarColor} shrink-0 mt-0.5 print:hidden`}
                            >
                              {kasir.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                                {kasir.name}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 font-extrabold text-[10px] shrink-0">
                                  {kasir.id}
                                </span>
                                <span className="text-xs text-gray-500 font-medium truncate">
                                  {kasir.branch.replace("Cabang ", "")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Peran (role_title) */}
                        <td className="py-5 px-4 font-bold text-gray-900 whitespace-nowrap truncate">
                          {kasir.roleTitle || "Kasir"}
                        </td>

                        {/* 3. Shift Terjadwal (shift) */}
                        <td className="py-5 px-4 whitespace-nowrap">
                          <div
                            className={`font-extrabold text-xs sm:text-sm ${
                              kasir.shift.includes("Pagi")
                                ? "text-amber-800"
                                : kasir.shift.includes("Siang")
                                  ? "text-orange-700"
                                  : kasir.shift.includes("Malam")
                                    ? "text-slate-800"
                                    : "text-rose-700"
                            }`}
                          >
                            {kasir.shiftMain}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-1 tabular-nums">
                            {kasir.shiftHours}
                          </div>
                        </td>

                        {/* 4. Status Live (status_live) */}
                        <td className="py-5 px-4 whitespace-nowrap">
                          {kasir.statusLive === "Aktif Melayani" ? (
                            <span className="inline-flex items-center justify-center gap-1.5 w-[144px] py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                              <span>Aktif Melayani</span>
                            </span>
                          ) : kasir.statusLive === "Standby / Rehat" ? (
                            <span className="inline-flex items-center justify-center gap-1.5 w-[144px] py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                              <span>Standby / Rehat</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1.5 w-[144px] py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span>
                              <span>Selesai Shift / Off</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Akses Aktif (is_active) Toggle Switch */}
                        <td className="py-5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            title="Nyalakan / Matikan Hak Akses Kasir"
                            onClick={() => handleToggleActive(kasir.id)}
                            className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                              kasir.isActive ? "bg-[#1E562F]" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                kasir.isActive
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* 6. Aksi (Edit & Delete) */}
                        <td className="py-5 px-4 text-center whitespace-nowrap print:hidden">
                          <div className="inline-flex items-center justify-center gap-2 text-gray-500">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(kasir)}
                              title="Edit Data Kasir"
                              className="w-8 h-8 shrink-0 border border-gray-200 hover:border-[#EA8E18] hover:text-[#EA8E18] hover:bg-amber-50 rounded-lg flex items-center justify-center transition cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(kasir)}
                              title="Hapus Kasir"
                              className="w-8 h-8 shrink-0 border border-gray-200 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredKasir.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-gray-500 font-medium"
                        >
                          <p>
                            {isLoading
                              ? "Memuat data dari database..."
                              : "Tidak ada data staf kasir yang sesuai dengan filter."}
                          </p>
                          {!isLoading && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-extrabold text-gray-700 transition cursor-pointer"
                            >
                              <RotateCcw size={13} />
                              <span>Reset Semua Filter</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Catatan Bawah Tabel */}
              <div className="print:hidden flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 pt-4 border-t border-gray-200 gap-2 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    Perubahan saklar status kasir tersinkron otomatis ke
                    database MariaDB &amp; Flutter POS.
                  </span>
                </div>
                <div className="font-semibold">
                  Menampilkan {filteredKasir.length} dari {branchScopedKasir.length} Kasir
                </div>
              </div>
            </div>

            {/* BOX KEBIJAKAN KEAMANAN POS */}
            <div className="print:hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">
                    Kebijakan Keamanan Kasir POS PrekDuaDara
                  </h4>
                  <p className="text-xs text-gray-600 mt-1.5 font-medium">
                    Setiap pergantian operator wajib cetak struk rekap &apos;Shift
                    X-Report&apos; sebelum serah terima laci tunai.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSopModal(true)}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-800 transition whitespace-nowrap shadow-2xs cursor-pointer"
              >
                Lihat Panduan SOP
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: FORM KASIR SESUAI DATABASE & HARDWARE (4 cols) */}
          <div
            id="form-kasir-container"
            className="print:hidden xl:col-span-4 flex flex-col gap-6"
          >
            {/* CARD 1: FORM KASIR */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              {/* Header Form */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <ClipboardList size={17} className="text-amber-600 shrink-0" />
                    <span className="truncate">
                      {editingId ? "Edit Profil Kasir" : "Form Kasir"}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 font-medium truncate">
                    {editingId
                      ? `Memperbarui data staf ${editingId}`
                      : "Tambah atau perbarui profil staf kasir ke database."}
                  </p>
                </div>
                <span className="w-[92px] py-1 rounded bg-amber-50 border border-amber-300 text-amber-800 text-xs font-extrabold text-center shrink-0 whitespace-nowrap">
                  {editingId ? "Mode Edit" : "Input Cepat"}
                </span>
              </div>

              {/* Form Input */}
              <form
                onSubmit={handleSaveKasir}
                className="flex flex-col gap-3.5"
              >
                {/* Cabang Penugasan */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
                    CABANG PENUGASAN *
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) =>
                      setFormBranch(e.target.value as SingleBranchName)
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#EA8E18] cursor-pointer"
                  >
                    {SINGLE_BRANCHES.map((bName) => (
                      <option key={bName} value={bName}>
                        {bName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1. Nama Lengkap Kasir */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
                    NAMA KASIR *
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rian, Siti, Budi..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#EA8E18]"
                    />
                  </div>
                </div>

                {/* 2. Peran / role_title */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
                    PERAN (ROLE TITLE) *
                  </label>
                  <input
                    type="text"
                    required
                    list="role-title-options"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#EA8E18]"
                  />
                  <datalist id="role-title-options">
                    <option value="Kasir" />
                    <option value="Kepala Kasir" />
                    <option value="Supervisor Kasir" />
                    <option value="Kasir Trainee" />
                  </datalist>
                </div>

                {/* 3. ID Kasir (cashier_code) */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
                    KODE KASIR (CASHIER CODE) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingId)}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:border-[#EA8E18]"
                  />
                </div>

                {/* 4. Shift Kerja Reguler */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    SHIFT KERJA REGULER (DATABASE)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "Pagi", hours: "08:00-12:00" },
                        { key: "Siang", hours: "12:00-17:00" },
                        { key: "Malam", hours: "17:00-22:00" },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setFormShift(s.key)}
                        className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                          formShift === s.key
                            ? "bg-gradient-to-r from-[#EA8E18] to-[#F59E0B] text-white border-transparent shadow-xs"
                            : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-black text-xs">{s.key}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            formShift === s.key
                              ? "text-amber-100"
                              : "text-gray-500"
                          }`}
                        >
                          {s.hours}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Status Akun Kasir Aktif (is_active) Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 mt-1">
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">
                      Status Akun Kasir Aktif (is_active)
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-0.5">
                      Kasir dapat login ke sistem kasir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      formIsActive ? "bg-[#1E562F]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formIsActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-200 mt-1">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-10 px-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center whitespace-nowrap cursor-pointer"
                  >
                    Batal / Bersihkan
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-3 bg-[#1E562F] hover:bg-[#164223] text-white rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    <Save size={15} className="shrink-0" />
                    <span>{editingId ? "Perbarui Kasir" : "Simpan Kasir"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: KONEKSI HARDWARE KASIR */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-extrabold text-gray-600 tracking-wider uppercase">
                  KONEKSI HARDWARE KASIR ({activeDrawer.counter})
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Normal
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 text-gray-800 font-semibold">
                    <Printer size={15} className="text-gray-600" />
                    <span>Printer Thermal Struk {activeDrawer.counter}</span>
                  </div>
                  <span className="font-extrabold text-emerald-700">Ready</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-800 font-semibold">
                    <CreditCard size={15} className="text-gray-600" />
                    <span>Cash Drawer RJ11</span>
                  </div>
                  <span className="font-extrabold text-gray-900">
                    {activeDrawer.isOpen ? "Terbuka / Aktif" : "Terkunci"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-800 font-semibold">
                    <ScanBarcode size={15} className="text-gray-600" />
                    <span>Barcode / QRIS Scanner</span>
                  </div>
                  <span className="font-extrabold text-gray-900">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SYSTEM */}
        <footer className="pt-2 pb-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2 font-medium">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[#EA8E18]">
              PrekDuaDara POS v2.4
            </span>
            <span>•</span>
            <span>
              Terminal {activeDrawer.counter} ({activeDrawerBranch})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {dbConnected
                ? "MariaDB `prekduadara_db` Terhubung"
                : "Mode Sinkronisasi Lokal & MariaDB"}
            </span>
          </div>
          <div>
            &copy; 2026 PrekDuaDara Quick-Service Culinary. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
