"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit3,
  Power,
  Printer,
  RefreshCw,
  Repeat,
  ScanBarcode,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";

type SingleBranchName = "Gerai Utama";

type ShiftMainType =
  | "Shift Pagi"
  | "Shift Siang"
  | "Shift Malam"
  | "Shift Kustom"
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
  branch?: string;
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

const SINGLE_BRANCHES: SingleBranchName[] = ["Gerai Utama"];

const INITIAL_DRAWERS: Record<SingleBranchName, BranchDrawerState> = {
  "Gerai Utama": {
    counter: "Counter #01",
    operatorId: "-",
    operatorName: "Memuat kasir...",
    shiftInfo: "Menghubungkan ke database...",
    modalAwal: 500000,
    totalSales: 0,
    totalNotes: 0,
    isOpen: false,
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

  const hourMatch = shiftStr.match(/(\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2})/);
  if (hourMatch) {
    shiftHours = hourMatch[1].replace(".", ":");
  }

  const lower = shiftStr.toLowerCase();
  if (lower.includes("siang")) {
    shiftMain = "Shift Siang";
    if (!hourMatch) shiftHours = "12:00 - 17:00";
  } else if (lower.includes("malam")) {
    shiftMain = "Shift Malam";
    if (!hourMatch) shiftHours = "17:00 - 22:00";
  } else if (lower.includes("kustom")) {
    shiftMain = "Shift Kustom";
  } else if (lower.includes("off") || lower.includes("libur")) {
    shiftMain = "Off / Libur";
    shiftHours = "Jadwal Libur";
  } else if (lower.includes("pagi")) {
    shiftMain = "Shift Pagi";
    if (!hourMatch) shiftHours = "08:00 - 12:00";
  } else if (hourMatch) {
    shiftMain = "Shift Kustom";
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
  const [kasirList, setKasirList] = useState<KasirItem[]>([]);
  const [drawersByBranch, setDrawersByBranch] =
    useState<Record<SingleBranchName, BranchDrawerState>>(INITIAL_DRAWERS);

  // Filter Header & Tabel
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShiftFilter, setSelectedShiftFilter] =
    useState<string>("Semua");
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // State Form Kasir
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Kasir");
  const [formId, setFormId] = useState("#KSR-001");
  const [formBranch, setFormBranch] = useState<SingleBranchName>("Gerai Utama");
  const [formShift, setFormShift] = useState<"Pagi" | "Siang" | "Malam" | "Kustom">(
    "Pagi"
  );
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("18:00");
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

  // Click-outside handler untuk dropdown filter shift
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
  const editingIdRef = useRef<string | null>(editingId);
  const formNameRef = useRef<string>(formName);

  useEffect(() => {
    kasirListRef.current = kasirList;
    editingIdRef.current = editingId;
    formNameRef.current = formName;
  }, [kasirList, editingId, formName]);

  // 1. FETCH DATA DARI API BACKEND MARIADB
  const loadCashiersFromDB = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cashiers`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length === 0) {
          setKasirList([]);
          return;
        }

        const avatarBgs = [
          "bg-amber-100 text-amber-800 border-amber-300",
          "bg-orange-100 text-orange-800 border-orange-300",
          "bg-slate-100 text-neutral-950 border-neutral-300",
          "bg-emerald-100 text-emerald-800 border-emerald-300",
        ];

        const mappedDbItems: KasirItem[] = (json.data as ApiCashierRow[]).map(
          (c, idx) => {
            const { shiftMain, shiftHours } = parseShift(c.shift);
            const activeFlag = Boolean(c.isActive ?? c.is_active ?? true);
            const liveStatus: LiveStatusType =
              c.statusLive ||
              c.status_live ||
              (activeFlag ? "Standby / Rehat" : "Selesai Shift / Off");

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
              branch: "Gerai Utama",
              avatarColor: avatarBgs[idx % avatarBgs.length],
              initials: getInitials(c.name),
              createdAt: c.createdAt,
            };
          }
        );

        setKasirList(mappedDbItems);

        if (!editingIdRef.current && formNameRef.current === "") {
          setFormId(generateNextCashierCode(mappedDbItems));
        }

        // Ambil data transaksi langsung dari database MariaDB (khusus Hari Ini untuk shift aktif)
        let salesSum = 0;
        let notesCount = 0;
        try {
          const trxRes = await fetch(`${API_BASE_URL}/api/transactions`, {
            cache: "no-store",
            headers: getAuthHeaders(),
          });
          const trxJson = await trxRes.json();
          if (trxJson.success && Array.isArray(trxJson.data)) {
            const isToday = (created?: string) => {
              if (!created) return true;
              const d = new Date(created);
              if (isNaN(d.getTime())) return true;
              const now = new Date();
              return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
              );
            };
            const todayTrx = trxJson.data.filter((t: { created_at?: string }) => isToday(t.created_at));
            notesCount = todayTrx.length;
            salesSum = todayTrx.reduce(
              (sum: number, t: { total?: number | string }) =>
                sum + (Number(t.total) || 0),
              0
            );
          }
        } catch {
          // Abaikan jika server transaksi sedang offline
        }

        const servingKasir = mappedDbItems.find(
          (item) => item.statusLive === "Aktif Melayani" && item.isActive
        );
        const fallbackKasir =
          mappedDbItems.find((item) => item.isActive) || mappedDbItems[0];

        if (servingKasir) {
          setDrawersByBranch((prev) => {
            const prevDrawer =
              prev["Gerai Utama"] || INITIAL_DRAWERS["Gerai Utama"];
            return {
              ...prev,
              "Gerai Utama": {
                ...prevDrawer,
                isOpen: true,
                operatorId: servingKasir.id,
                operatorName: servingKasir.name,
                shiftInfo: `${servingKasir.shift} • Login Aktif`,
                totalSales: salesSum,
                totalNotes: notesCount,
                lastClosedInfo: undefined,
              },
            };
          });
        } else if (fallbackKasir) {
          setDrawersByBranch((prev) => {
            const prevDrawer =
              prev["Gerai Utama"] || INITIAL_DRAWERS["Gerai Utama"];
            return {
              ...prev,
              "Gerai Utama": {
                ...prevDrawer,
                isOpen: false,
                operatorId: fallbackKasir.id,
                operatorName: fallbackKasir.name,
                shiftInfo: "Tidak ada kasir aktif melayani (Semua Standby)",
                totalSales: salesSum,
                totalNotes: notesCount,
                lastClosedInfo:
                  prevDrawer.lastClosedInfo ||
                  "Shift ditutup — seluruh kasir berstatus Standby / Rehat",
              },
            };
          });
        }
      }
    } catch {
      // ignore offline error
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void loadCashiersFromDB(false);
    }, 0);
    const interval = setInterval(() => {
      void loadCashiersFromDB(true);
    }, 3000);
    const handleFocus = () => {
      void loadCashiersFromDB(true);
    };
    const handleVisibility = () => {
      if (!document.hidden) void loadCashiersFromDB(true);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadCashiersFromDB]);

  // Cabang target untuk Laci Kasir (Gerai Utama Pusat)
  const activeDrawerBranch: SingleBranchName = "Gerai Utama";
  const activeDrawer =
    drawersByBranch[activeDrawerBranch] || INITIAL_DRAWERS["Gerai Utama"];

  // Daftar kasir dari database backend
  const branchScopedKasir = useMemo(() => {
    return kasirList;
  }, [kasirList]);

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
    setSearchQuery("");
    setSelectedShiftFilter("Semua");
    showToast("Seluruh filter telah direset.", "info");
  };

  // 2. TOGGLE STATUS AKSES KASIR (Sinkron ke Database)
  const handleToggleActive = async (id: string) => {
    const targetKasir = kasirList.find((c) => c.id === id);
    if (!targetKasir) return;
    const nextActive = !targetKasir.isActive;
    const hasOtherServingInBranch =
      nextActive &&
      kasirList.some(
        (c) =>
          c.id !== id &&
          c.branch === targetKasir.branch &&
          c.isActive &&
          c.statusLive === "Aktif Melayani"
      );

    let nextList = kasirList.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        isActive: nextActive,
        statusLive: (nextActive
          ? hasOtherServingInBranch || c.shiftMain === "Off / Libur"
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
      await fetch(
        `${API_BASE_URL}/api/cashiers/${encodeURIComponent(id)}/toggle`,
        {
          method: "PATCH",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
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

  // 2B. TOGGLE STATUS LIVE KASIR (Aktif Melayani <-> Standby / Rehat)
  const handleToggleLiveStatus = async (kasir: KasirItem) => {
    if (!kasir.isActive) {
      showToast("Kasir sedang nonaktif. Aktifkan saklar akun terlebih dahulu.", "warning");
      return;
    }

    const nextStatus: LiveStatusType =
      kasir.statusLive === "Aktif Melayani" ? "Standby / Rehat" : "Aktif Melayani";

    // Update state lokal seketika
    setKasirList((prev) =>
      prev.map((c) =>
        c.id === kasir.id
          ? { ...c, statusLive: nextStatus }
          : nextStatus === "Aktif Melayani" && c.statusLive === "Aktif Melayani"
            ? { ...c, statusLive: "Standby / Rehat" }
            : c
      )
    );

    try {
      if (nextStatus === "Aktif Melayani") {
        await fetch(`${API_BASE_URL}/api/cashiers/login`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ cashier: kasir.name, id: kasir.id }),
        });
      } else {
        await fetch(`${API_BASE_URL}/api/cashiers/logout`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ cashier: kasir.name, id: kasir.id }),
        });
      }
      loadCashiersFromDB();
      showToast(
        `Status ${kasir.name} diubah menjadi ${nextStatus}!`,
        "success"
      );
    } catch {
      // Tetap terupdate di state lokal
    }
  };

  // 3. EDIT KASIR
  const handleStartEdit = (kasir: KasirItem) => {
    setEditingId(kasir.id);
    setFormName(kasir.name);
    setFormRole(kasir.roleTitle || "Kasir");
    setFormId(kasir.id);
    setFormBranch(kasir.branch || "Gerai Utama");
    if (kasir.shift.includes("Siang")) {
      setFormShift("Siang");
    } else if (kasir.shift.includes("Malam")) {
      setFormShift("Malam");
    } else if (kasir.shift.includes("Kustom") || (!kasir.shift.includes("Pagi") && kasir.shiftHours)) {
      setFormShift("Kustom");
      const match = kasir.shift.match(/(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})/);
      if (match) {
        setCustomStartTime(match[1].replace(".", ":"));
        setCustomEndTime(match[2].replace(".", ":"));
      }
    } else {
      setFormShift("Pagi");
    }
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
    setFormBranch("Gerai Utama");
    setFormShift("Pagi");
    setCustomStartTime("09:00");
    setCustomEndTime("18:00");
    setFormIsActive(true);
  }, [kasirList]);

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

    let chosen: { label: string; main: ShiftMainType; hours: string };
    if (formShift === "Kustom") {
      const start = customStartTime.trim() || "09:00";
      const end = customEndTime.trim() || "18:00";
      const hours = `${start} - ${end}`;
      chosen = {
        label: `Shift Kustom (${hours})`,
        main: "Shift Kustom",
        hours,
      };
    } else {
      chosen = shiftMap[formShift];
    }

    const currentLiveStatus = editingId
      ? (kasirList.find((c) => c.id === editingId)?.statusLive || "Standby / Rehat")
      : "Standby / Rehat";

    const statusLive: LiveStatusType = !formIsActive
      ? "Selesai Shift / Off"
      : currentLiveStatus;

    if (editingId) {
      let nextList = kasirList.map((item) =>
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
      );

      // Update / alihkan operator laci jika kasir ini sedang memegang laci cabang
      const nextDrawers = { ...drawersByBranch };
      let drawerChanged = false;
      const promotedIds = new Set<string>();

      SINGLE_BRANCHES.forEach((bName) => {
        if (nextDrawers[bName].operatorId === editingId) {
          drawerChanged = true;
          if (!formIsActive || formBranch !== bName) {
            const replacement = nextList.find(
              (c) => c.branch === bName && c.isActive && c.id !== editingId
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
          } else {
            nextDrawers[bName] = {
              ...nextDrawers[bName],
              operatorName: cleanName,
              shiftInfo: `${chosen.label} • Diperbarui`,
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

      setKasirList(nextList);
      if (drawerChanged) {
        setDrawersByBranch(nextDrawers);
      }

      try {
        await fetch(
          `${API_BASE_URL}/api/cashiers/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              name: cleanName,
              role_title: cleanRole,
              shift: chosen.label,
              status_live: statusLive,
              is_active: formIsActive,
            }),
          }
        );
        loadCashiersFromDB();
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
      setFormId(generateNextCashierCode(nextList));
      setFormShift("Pagi");
      setCustomStartTime("09:00");
      setCustomEndTime("18:00");
      setFormIsActive(true);
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
        branch: "Gerai Utama",
        avatarColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        initials: getInitials(cleanName),
      };

      const nextList = [newKasir, ...kasirList];
      setKasirList(nextList);

      try {
        const res = await fetch(`${API_BASE_URL}/api/cashiers`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
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

      showToast(
        `Staf kasir baru ${cleanName} (${cleanCode}) berhasil didaftarkan ke sistem!`,
        "success"
      );
      setEditingId(null);
      setFormName("");
      setFormRole("Kasir");
      setFormId(generateNextCashierCode(nextList));
      setFormShift("Pagi");
      setCustomStartTime("09:00");
      setCustomEndTime("18:00");
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
      setFormShift("Pagi");
      setCustomStartTime("09:00");
      setCustomEndTime("18:00");
    }
    setDeleteTarget(null);
    showToast(`Data kasir ${name} (${id}) telah dihapus.`, "info");

    try {
      await fetch(`${API_BASE_URL}/api/cashiers/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      loadCashiersFromDB();
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

  const handleConfirmSwitchOperator = async (e: React.FormEvent) => {
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
        if (c.statusLive === "Aktif Melayani") {
          return { ...c, statusLive: "Standby / Rehat" };
        }
        return c;
      })
    );

    try {
      await fetch(`${API_BASE_URL}/api/cashiers/login`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ cashier: chosen.name, id: chosen.id }),
      });
      loadCashiersFromDB();
    } catch {
      // Abaikan jika backend offline
    }

    setShowSwitchOperatorModal(false);
    showToast(
      `Operator laci ${activeDrawer.counter} dialihkan ke ${chosen.name} (${chosen.id})!`,
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

  const handleConfirmCloseShift = async (e: React.FormEvent) => {
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
        c.statusLive === "Aktif Melayani"
          ? { ...c, statusLive: "Standby / Rehat" }
          : c
      )
    );

    try {
      await fetch(`${API_BASE_URL}/api/cashiers/logout`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({}),
      });
      loadCashiersFromDB();
    } catch {
      // Abaikan jika backend offline
    }

    setShowCloseShiftModal(false);
    showToast(
      `Shift ${activeDrawer.counter} ditutup & seluruh kasir kembali Standby!`,
      "success"
    );
  };

  const handleConfirmReopenShift = async (e: React.FormEvent) => {
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

    try {
      await fetch(`${API_BASE_URL}/api/cashiers/login`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          cashier: activeDrawer.operatorName,
          id: activeDrawer.operatorId,
        }),
      });
      loadCashiersFromDB();
    } catch {
      // Abaikan jika backend offline
    }

    setShowCloseShiftModal(false);
    showToast(
      `Shift baru ${activeDrawer.counter} berhasil dibuka dengan modal awal Rp ${modalBaru.toLocaleString(
        "id-ID"
      )}!`,
      "success"
    );
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-[#FAF6E9] print:bg-white flex p-4 sm:p-6 print:p-0 gap-6 font-sans items-start text-black">
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
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold">
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

            <div className="p-5 space-y-3 text-xs sm:text-sm text-neutral-950 font-medium">
              {[
                "Hitung total uang tunai fisik di dalam laci kasir (Modal Awal + Penjualan Tunai).",
                "Klik tombol 'Tutup Shift (X-Report)' untuk mencocokkan nominal fisik dengan catatan sistem.",
                "Cetak struk rekapitulasi Shift X-Report pada printer thermal 58mm/80mm.",
                "Serahkan laci kasir beserta lembar X-Report yang telah ditandatangani kepada operator shift berikutnya.",
                "Gunakan tombol 'Ganti Operator Laci' agar transaksi baru tercatat atas nama kasir penerus.",
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#FAF8F3] border border-neutral-200 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#F3A712] text-black font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{step}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSopModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2D452B] text-white text-xs font-semibold cursor-pointer"
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
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#DC2626] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 size={18} />
                <h3 className="font-display text-sm sm:text-base font-bold">
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

            <div className="p-5 text-xs sm:text-sm text-neutral-950 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus profil kasir{" "}
              <strong className="text-black font-semibold">
                {deleteTarget.name} (<span className="font-mono">{deleteTarget.id}</span>)
              </strong>
              ? Tindakan ini akan mencabut akses login POS kasir tersebut.
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKasir}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
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
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Repeat size={18} className="text-[#F3A712]" />
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold">
                    Ganti Operator Laci ({activeDrawer.counter})
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    PrekDuaDara POS
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
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-neutral-950">
                Operator Saat Ini:{" "}
                <strong className="font-semibold text-black">
                  {activeDrawer.operatorName} (<span className="font-mono">{activeDrawer.operatorId}</span>)
                </strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1.5">
                  Pilih Operator Kasir Penerus
                </label>
                <select
                  value={selectedNewOperatorId}
                  onChange={(e) => setSelectedNewOperatorId(e.target.value)}
                  className="w-full border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black bg-white focus:outline-none focus:border-[#EA8E18] cursor-pointer"
                >
                  {availableBranchCashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — {c.shiftMain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowSwitchOperatorModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F3A712] hover:bg-[#df980e] text-black text-xs font-semibold cursor-pointer"
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
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden"
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
                  <h3 className="font-display text-sm sm:text-base font-bold">
                    {activeDrawer.isOpen
                      ? `Tutup Shift & Rekonsiliasi (${activeDrawer.counter})`
                      : `Buka Shift Baru (${activeDrawer.counter})`}
                  </h3>
                  <p className="text-[11px] text-white/85 font-medium">
                    Operator: {activeDrawer.operatorName}
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
                <div className="p-3.5 rounded-xl bg-gray-50 border border-neutral-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-800 font-medium">Modal Awal Laci:</span>
                    <strong className="text-black">
                      Rp {activeDrawer.modalAwal.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-800 font-medium">
                      Total Penjualan ({activeDrawer.totalNotes} Nota):
                    </span>
                    <strong className="text-black">
                      Rp {activeDrawer.totalSales.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-neutral-200 font-bold text-black">
                    <span>Ekspektasi Total Kas Sistem:</span>
                    <span className="text-[#B45309]">
                      Rp {expectedDrawerCash.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Nominal Uang Fisik Dihitung di Laci (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold cursor-pointer"
                  >
                    Tutup Shift &amp; Cetak X-Report
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReopenShift} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Modal Awal Laci Tunai Baru (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={reopenModalAwalInput}
                    onChange={(e) => setReopenModalAwalInput(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-[#1E562F]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1E562F] hover:bg-[#164223] text-white text-xs font-semibold cursor-pointer"
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
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full print:overflow-visible">
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
                Pengaturan Staf &amp; Kasir Restoran
              </div>
            </div>
          </div>

          {/* Info Cetak Saat Mode Print */}
          <div className="hidden print:block text-right text-xs text-neutral-950">
            <div className="font-display font-bold text-black">
              Laporan Staf Kasir &amp; Shift • PrekDuaDara
            </div>
            <div className="mt-0.5">
              Total Kasir Terfilter: {filteredKasir.length} Staf • Online:{" "}
              {kpiStats.kasirOnline} Kasir
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
        </header>

        {/* PAGE TITLE & ACTION ROW */}
        <section className="print:hidden bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h1 className="font-display text-base sm:text-lg font-bold text-black tracking-tight">
            Pengaturan &amp; Manajemen Kasir
          </h1>

          <div className="flex items-center gap-2.5 self-start xl:self-auto flex-wrap sm:flex-nowrap shrink-0">
            {/* Filter Shift Dropdown */}
            <div ref={shiftDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowShiftDropdown((prev) => !prev)}
                className="h-9 w-[175px] justify-between shrink-0 whitespace-nowrap px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 text-black rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <span className="truncate">
                  Filter Shift: {selectedShiftFilter}
                </span>
                <ChevronDown size={14} className="text-black shrink-0" />
              </button>

              {showShiftDropdown && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl z-30 py-1.5 text-xs">
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
                          ? "text-[#EA8E18] font-semibold bg-amber-50/40"
                          : "text-black font-medium"
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
              className="h-9 px-3.5 py-2 shrink-0 whitespace-nowrap bg-white border border-neutral-400 hover:bg-gray-50 text-black rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cetak
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
              className="h-9 w-9 justify-center shrink-0 p-2 bg-white border border-neutral-400 hover:bg-gray-50 text-black rounded-xl transition flex items-center cursor-pointer"
            >
              <RefreshCw
                size={14}
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
              className="h-9 w-[178px] justify-center shrink-0 whitespace-nowrap px-3.5 py-2 bg-[#F3A712] hover:bg-[#df980e] text-black rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus size={14} className="shrink-0" />
              <span>+ Tambah Kasir Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY STAT CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-4 print:gap-3">
          {/* Card 1: Total Kasir */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 tracking-wider uppercase whitespace-nowrap">
              TOTAL KASIR TERDAFTAR
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.totalKasir}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Staf Kasir
              </span>
            </div>
          </div>

          {/* Card 2: Sedang Bertugas */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-semibold text-neutral-700 tracking-wider uppercase whitespace-nowrap">
                SEDANG BERTUGAS
              </p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.kasirOnline}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Kasir Online
              </span>
            </div>
          </div>

          {/* Card 3: Standby / Istirahat */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 tracking-wider uppercase whitespace-nowrap">
              STANDBY / ISTIRAHAT
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.kasirStandby}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Kasir
              </span>
            </div>
          </div>

          {/* Card 4: Off / Non-Aktif */}
          <div className="bg-white rounded-2xl p-4 print:p-3.5 shadow-sm print:shadow-none border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 tracking-wider uppercase whitespace-nowrap">
              OFF / NON-AKTIF
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl print:text-lg font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.kasirOff}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Kasir
              </span>
            </div>
          </div>
        </section>

        {/* ACTIVE CASH DRAWER BANNER */}
        <section
          className={`print:hidden rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 ${
            activeDrawer.isOpen
              ? "bg-[#FFFDF7] border-[#F59E0B]/40"
              : "bg-gray-50 border-neutral-300"
          }`}
        >
          {/* Sisi Kiri: Operator & Counter Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  activeDrawer.isOpen ? "text-emerald-700" : "text-neutral-800"
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
              <span className="px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
                {activeDrawer.counter}
              </span>
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-black mt-1">
              {activeDrawer.operatorName}{" "}
              <span className="font-mono text-sm font-bold text-neutral-800">
                ({activeDrawer.operatorId})
              </span>
            </h2>
            <p className="text-xs text-neutral-800 font-medium mt-0.5">
              {activeDrawer.shiftInfo} • Modal Awal Rp{" "}
              {activeDrawer.modalAwal.toLocaleString("id-ID")}
            </p>
            {!activeDrawer.isOpen && activeDrawer.lastClosedInfo && (
              <p className="text-xs font-semibold text-rose-700 mt-1">
                {activeDrawer.lastClosedInfo}
              </p>
            )}
          </div>

          {/* Sisi Tengah: Metrik Shift */}
          <div className="flex items-center gap-6 sm:gap-10 border-y xl:border-y-0 xl:border-x border-[#FDE68A] py-3 xl:py-0 xl:px-8 shrink-0">
            <div className="w-[160px] shrink-0">
              <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                TOTAL PENJUALAN SHIFT
              </div>
              <div className="text-base sm:text-lg font-bold text-[#B45309] mt-1 tabular-nums whitespace-nowrap">
                Rp {activeDrawer.totalSales.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="w-[130px] shrink-0">
              <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                TRANSAKSI SELESAI
              </div>
              <div className="text-base sm:text-lg font-bold text-black mt-1 tabular-nums whitespace-nowrap">
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
              className="h-9 px-3.5 py-2 shrink-0 whitespace-nowrap bg-white border border-neutral-400 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none text-black rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              Ganti Operator Laci
            </button>

            <button
              type="button"
              onClick={handleOpenCloseShiftModal}
              className={`h-9 px-3.5 py-2 shrink-0 whitespace-nowrap rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                activeDrawer.isOpen
                  ? "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                  : "bg-[#1E562F] hover:bg-[#164223] text-white"
              }`}
            >
              {activeDrawer.isOpen ? "Tutup Shift Paksa" : "Buka Shift Baru"}
            </button>
          </div>
        </section>

        {/* 2-COLUMN MAIN CONTENT: LEFT (TABLE) & RIGHT (FORM & HARDWARE) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: TABEL DAFTAR KASIR (8 cols, 12 on print) */}
          <div className="xl:col-span-8 print:col-span-12 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-4 sm:p-5 print:p-3 shadow-sm print:shadow-none border border-neutral-200 flex flex-col gap-4">
              {/* Header Tabel & Search */}
              <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-black whitespace-nowrap">
                    Daftar Staf Kasir POS
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold tabular-nums whitespace-nowrap shrink-0">
                    {filteredKasir.length} Terdata
                  </span>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <div className="relative h-9 flex-1 sm:w-[250px] sm:flex-none shrink-0">
                    <Search
                      size={15}
                      className="text-neutral-800 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode staf kasir..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full pl-9 pr-8 bg-gray-50 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-[#EA8E18]"
                    />
                    {searchQuery !== "" && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        title="Hapus pencarian"
                        aria-label="Hapus pencarian"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabel Sinkron dengan Database `kasir` */}
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full print:table-auto print:w-full print:text-[10px] text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-y border-neutral-300 bg-gray-50 text-[11px] print:text-[9px] font-semibold text-neutral-700 uppercase tracking-wider">
                      <th className="py-2.5 px-2.5 whitespace-nowrap">
                        STAF KASIR
                      </th>
                      <th className="py-2.5 px-2 whitespace-nowrap">PERAN</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">
                        SHIFT TERJADWAL
                      </th>
                      <th className="py-2.5 px-2 whitespace-nowrap">
                        STATUS LIVE
                      </th>
                      <th className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        AKSES AKTIF
                      </th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap print:hidden">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    {filteredKasir.map((kasir) => (
                      <tr
                        key={kasir.id}
                        className="hover:bg-amber-50/30 transition-colors"
                      >
                        {/* 1. Staf Kasir (Avatar, Nama, ID/cashier_code, Cabang) */}
                        <td className="py-3 px-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${kasir.avatarColor} shrink-0 print:hidden`}
                            >
                              {kasir.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-black text-xs sm:text-sm truncate">
                                {kasir.name}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono inline-block px-1.5 py-0.2 rounded bg-gray-100 border border-neutral-200 text-neutral-950 font-bold text-[10px] shrink-0">
                                  {kasir.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Peran (role_title) */}
                        <td className="py-3 px-2 font-medium text-black text-xs sm:text-sm whitespace-nowrap">
                          {kasir.roleTitle || "Kasir"}
                        </td>

                        {/* 3. Shift Terjadwal (shift) */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          <div
                            className={`font-semibold text-xs sm:text-sm ${
                              kasir.shift.includes("Pagi")
                                ? "text-amber-800"
                                : kasir.shift.includes("Siang")
                                  ? "text-orange-700"
                                  : kasir.shift.includes("Malam")
                                    ? "text-black"
                                    : "text-rose-700"
                            }`}
                          >
                            {kasir.shiftMain}
                          </div>
                          <div className="font-mono text-[11px] text-neutral-700 font-medium mt-0.5 tabular-nums">
                            {kasir.shiftHours}
                          </div>
                        </td>

                        {/* 4. Status Live (status_live) */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleLiveStatus(kasir)}
                            title="Klik untuk ubah status Aktif / Standby"
                            className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                          >
                            {kasir.statusLive === "Aktif Melayani" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 whitespace-nowrap hover:bg-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                <span>Aktif Melayani</span>
                              </span>
                            ) : kasir.statusLive === "Standby / Rehat" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 whitespace-nowrap hover:bg-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                <span>Standby / Rehat</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-black text-[11px] font-semibold border border-neutral-300 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                <span>Selesai Shift / Off</span>
                              </span>
                            )}
                          </button>
                        </td>

                        {/* 5. Akses Aktif (is_active) Toggle Switch */}
                        <td className="py-3 px-1.5 text-center whitespace-nowrap">
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
                        <td className="py-3 px-2 text-center whitespace-nowrap print:hidden">
                          <div className="inline-flex items-center justify-center gap-1.5 text-neutral-800">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(kasir)}
                              title="Edit Data Kasir"
                              className="w-7.5 h-7.5 shrink-0 border border-neutral-300 hover:border-[#EA8E18] hover:text-[#EA8E18] hover:bg-amber-50 rounded-lg flex items-center justify-center transition cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(kasir)}
                              title="Hapus Kasir"
                              className="w-7.5 h-7.5 shrink-0 border border-neutral-300 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredKasir.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-neutral-800 font-medium"
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
                              className="mt-3 px-3.5 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-50 text-xs font-semibold text-black transition cursor-pointer"
                            >
                              Reset Semua Filter
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Catatan Bawah Tabel */}
              <div className="print:hidden flex items-center justify-end text-xs text-neutral-800 pt-4 border-t border-neutral-200 font-semibold">
                Menampilkan {filteredKasir.length} dari {branchScopedKasir.length} Kasir
              </div>
            </div>

            {/* BOX KEBIJAKAN KEAMANAN POS */}
            <div className="print:hidden bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-display font-bold text-black text-xs sm:text-sm">
                  Kebijakan Keamanan Kasir POS PrekDuaDara
                </h4>
                <p className="text-xs text-neutral-800 mt-1.5 font-medium">
                  Setiap pergantian operator wajib cetak struk rekap &apos;Shift
                  X-Report&apos; sebelum serah terima laci tunai.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSopModal(true)}
                className="px-4 py-2.5 border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black transition whitespace-nowrap shadow-2xs cursor-pointer"
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col gap-4">
              {/* Header Form */}
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3.5">
                <h3 className="font-display font-bold text-black text-sm sm:text-base truncate">
                  {editingId ? `Edit Profil Kasir (${editingId})` : "Form Kasir"}
                </h3>
                {editingId && (
                  <span className="px-2.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-semibold shrink-0 whitespace-nowrap">
                    Mode Edit
                  </span>
                )}
              </div>

              {/* Form Input */}
              <form
                onSubmit={handleSaveKasir}
                className="flex flex-col gap-3.5"
              >
                {/* 1. Nama Lengkap Kasir */}
                <div>
                  <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1">
                    NAMA KASIR *
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="text-neutral-800 absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama staf kasir..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-[#EA8E18]"
                    />
                  </div>
                </div>

                {/* 2. Peran / role_title */}
                <div>
                  <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1">
                    PERAN *
                  </label>
                  <input
                    type="text"
                    required
                    list="role-title-options"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium text-black focus:outline-none focus:border-[#EA8E18]"
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
                  <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1">
                    KODE KASIR *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingId)}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-black disabled:bg-gray-100 disabled:text-neutral-800 focus:outline-none focus:border-[#EA8E18]"
                  />
                </div>

                {/* 4. Shift Kerja Reguler */}
                <div>
                  <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1.5">
                    SHIFT KERJA
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
                            : "bg-white border-neutral-400 text-black hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-semibold text-xs">{s.key}</span>
                        <span
                          className={`font-mono text-[10px] font-medium ${
                            formShift === s.key
                              ? "text-amber-100"
                              : "text-neutral-800"
                          }`}
                        >
                          {s.hours}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Jam Kustom di Bawah Jam Shift Reguler */}
                  <div
                    className={`mt-2.5 p-2.5 rounded-xl border transition-all ${
                      formShift === "Kustom"
                        ? "bg-amber-50/70 border-amber-300 shadow-xs"
                        : "bg-gray-50/80 border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        type="button"
                        onClick={() => setFormShift("Kustom")}
                        className="flex items-center gap-1.5 cursor-pointer text-left group"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition ${
                            formShift === "Kustom"
                              ? "border-[#EA8E18] bg-[#EA8E18]"
                              : "border-gray-400 bg-white group-hover:border-gray-600"
                          }`}
                        >
                          {formShift === "Kustom" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            formShift === "Kustom"
                              ? "text-[#EA8E18]"
                              : "text-black group-hover:text-black"
                          }`}
                        >
                          Atur Jam Kustom
                        </span>
                      </button>
                      {formShift === "Kustom" && (
                        <span className="font-mono text-[10px] font-bold text-[#EA8E18] bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          {customStartTime} - {customEndTime}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-700 block mb-0.5">
                          Jam Mulai
                        </label>
                        <TimeWheelPicker
                          value={customStartTime}
                          onChange={(val) => {
                            setCustomStartTime(val);
                            setFormShift("Kustom");
                          }}
                          active={formShift === "Kustom"}
                          compact
                          ariaLabel="Jam Mulai Shift Kustom"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-700 block mb-0.5">
                          Jam Selesai
                        </label>
                        <TimeWheelPicker
                          value={customEndTime}
                          onChange={(val) => {
                            setCustomEndTime(val);
                            setFormShift("Kustom");
                          }}
                          active={formShift === "Kustom"}
                          compact
                          ariaLabel="Jam Selesai Shift Kustom"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Status Akun Kasir Aktif Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-neutral-200 mt-1">
                  <div>
                    <div className="text-xs font-semibold text-black">
                      Akun Kasir Aktif
                    </div>
                    <div className="text-xs text-neutral-800 font-medium mt-0.5">
                      Izinkan login ke aplikasi kasir
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
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-200 mt-1">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-10 px-3 border border-neutral-400 hover:bg-gray-50 text-black rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center whitespace-nowrap cursor-pointer"
                  >
                    Batal / Bersihkan
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-3 bg-[#1E562F] hover:bg-[#164223] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    {editingId ? "Perbarui Kasir" : "Simpan Kasir"}
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: KONEKSI HARDWARE KASIR */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <span className="text-xs font-semibold text-neutral-700 tracking-wider uppercase">
                  KONEKSI HARDWARE KASIR ({activeDrawer.counter})
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Normal
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 text-black font-medium">
                    <Printer size={15} className="text-neutral-800" />
                    <span>Printer Thermal Struk {activeDrawer.counter}</span>
                  </div>
                  <span className="font-semibold text-emerald-700">Ready</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-neutral-200">
                  <div className="flex items-center gap-2.5 text-black font-medium">
                    <CreditCard size={15} className="text-neutral-800" />
                    <span>Cash Drawer RJ11</span>
                  </div>
                  <span className="font-semibold text-black">
                    {activeDrawer.isOpen ? "Terbuka / Aktif" : "Terkunci"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-neutral-200">
                  <div className="flex items-center gap-2.5 text-black font-medium">
                    <ScanBarcode size={15} className="text-neutral-800" />
                    <span>Barcode / QRIS Scanner</span>
                  </div>
                  <span className="font-semibold text-black">Aktif</span>
                </div>
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
