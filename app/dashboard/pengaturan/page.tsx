"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Mail,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  Scissors,
  Store,
  Upload,
  User,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";

type SingleBranchName =
  | "Cabang Sudirman Utama"
  | "Cabang Tebet Eco Park"
  | "Cabang Dago Heritage";

type BranchOption = "Semua Cabang" | SingleBranchName;

type RoundingOption =
  | "Tanpa Pembulatan"
  | "Kelipatan Rp 100 terdekat"
  | "Kelipatan Rp 500 terdekat"
  | "Kelipatan Rp 1.000 terdekat";

interface BranchStoreSettings {
  outletId: string;
  namaWarung: string;
  slogan: string;
  alamat: string;
  whatsapp: string;
  emailResto: string;
  nib: string;
  logoUrl: string;
  jamBukaWeekday: string;
  jamTutupWeekday: string;
  jamBukaWeekend: string;
  jamTutupWeekend: string;
  autoCloseKasir: boolean;
  istirahatSore: boolean;
  pajakPersen: string;
  pajakTipe: "termasuk" | "akhir";
  biayaKemasan: string;
  aturanPembulatan: RoundingOption;
  cetakLogo: boolean;
  cetakAlamat: boolean;
  nomorAntrianBesar: boolean;
  kodeQrisDinamis: boolean;
  cetakDetailPedas: boolean;
  jumlahSalinanStruk: "1x (Pelanggan)" | "2x (Pelanggan & Dapur)";
  pesanFooter: string;
  autoPrintLunas: boolean;
  channelTunai: boolean;
  channelQris: boolean;
  channelEdc: boolean;
  channelOjol: boolean;
  kapasitasMeja: number;
}

const ROUNDING_OPTIONS: RoundingOption[] = [
  "Tanpa Pembulatan",
  "Kelipatan Rp 100 terdekat",
  "Kelipatan Rp 500 terdekat",
  "Kelipatan Rp 1.000 terdekat",
];

const STORAGE_KEY = "prekduadara_store_settings_v1";

const DEFAULT_BRANCH_SETTINGS: Record<SingleBranchName, BranchStoreSettings> = {
  "Cabang Sudirman Utama": {
    outletId: "OUT-001",
    namaWarung: "Ayam Geprek PrekDuaDara",
    slogan: "Spesial Ayam Geprek Cobek & Sambal Uleg Asli",
    alamat: "Jl. Jend. Sudirman No. 45 (Samping Gerbang UM/Matos)",
    whatsapp: "0812-8899-7766",
    emailResto: "halo@prekduadara.id",
    nib: "9120003491824",
    logoUrl: "/logo.png",
    jamBukaWeekday: "09:00 WIB",
    jamTutupWeekday: "22:00 WIB",
    jamBukaWeekend: "09:00 WIB",
    jamTutupWeekend: "23:00 WIB",
    autoCloseKasir: true,
    istirahatSore: false,
    pajakPersen: "10",
    pajakTipe: "akhir",
    biayaKemasan: "2.000",
    aturanPembulatan: "Kelipatan Rp 500 terdekat",
    cetakLogo: true,
    cetakAlamat: true,
    nomorAntrianBesar: true,
    kodeQrisDinamis: true,
    cetakDetailPedas: true,
    jumlahSalinanStruk: "1x (Pelanggan)",
    pesanFooter:
      "Matur nuwun sampun mampir! Pedasnya bikin nagih. Follow IG @prekduadara.id",
    autoPrintLunas: true,
    channelTunai: true,
    channelQris: true,
    channelEdc: true,
    channelOjol: true,
    kapasitasMeja: 24,
  },
  "Cabang Tebet Eco Park": {
    outletId: "OUT-TBT-002",
    namaWarung: "Ayam Geprek PrekDuaDara - Cabang Tebet",
    slogan: "Spesial Ayam Geprek Cobek & Sambal Uleg Asli",
    alamat: "Jl. Tebet Barat Dalam Raya No. 18, Jakarta Selatan",
    whatsapp: "0812-9000-4455",
    emailResto: "halo.tebet@prekduadara.id",
    nib: "9120003491825",
    logoUrl: "/logo.png",
    jamBukaWeekday: "09:00 WIB",
    jamTutupWeekday: "22:00 WIB",
    jamBukaWeekend: "08:30 WIB",
    jamTutupWeekend: "23:00 WIB",
    autoCloseKasir: true,
    istirahatSore: false,
    pajakPersen: "10",
    pajakTipe: "akhir",
    biayaKemasan: "2.000",
    aturanPembulatan: "Kelipatan Rp 500 terdekat",
    cetakLogo: true,
    cetakAlamat: true,
    nomorAntrianBesar: true,
    kodeQrisDinamis: true,
    cetakDetailPedas: true,
    jumlahSalinanStruk: "1x (Pelanggan)",
    pesanFooter:
      "Matur nuwun sampun mampir di Cabang Tebet! Follow IG @prekduadara.id",
    autoPrintLunas: true,
    channelTunai: true,
    channelQris: true,
    channelEdc: true,
    channelOjol: true,
    kapasitasMeja: 30,
  },
  "Cabang Dago Heritage": {
    outletId: "OUT-DGO-003",
    namaWarung: "Ayam Geprek PrekDuaDara - Cabang Dago",
    slogan: "Spesial Ayam Geprek Cobek & Sambal Uleg Asli",
    alamat: "Jl. Ir. H. Juanda No. 112, Dago, Bandung",
    whatsapp: "0812-2233-8899",
    emailResto: "halo.dago@prekduadara.id",
    nib: "9120003491826",
    logoUrl: "/logo.png",
    jamBukaWeekday: "09:30 WIB",
    jamTutupWeekday: "22:00 WIB",
    jamBukaWeekend: "09:00 WIB",
    jamTutupWeekend: "23:30 WIB",
    autoCloseKasir: true,
    istirahatSore: true,
    pajakPersen: "10",
    pajakTipe: "akhir",
    biayaKemasan: "2.000",
    aturanPembulatan: "Kelipatan Rp 500 terdekat",
    cetakLogo: true,
    cetakAlamat: true,
    nomorAntrianBesar: true,
    kodeQrisDinamis: true,
    cetakDetailPedas: true,
    jumlahSalinanStruk: "1x (Pelanggan)",
    pesanFooter:
      "Hatur nuhun tos mampir di Cabang Dago! Follow IG @prekduadara.id",
    autoPrintLunas: true,
    channelTunai: true,
    channelQris: true,
    channelEdc: true,
    channelOjol: true,
    kapasitasMeja: 28,
  },
};

export default function PengaturanTokoPage() {
  // Cabang aktif yang sedang dikonfigurasi
  const selectedBranch: BranchOption = "Semua Cabang";
  const activeBranchKey: SingleBranchName =
    selectedBranch === "Semua Cabang"
      ? "Cabang Sudirman Utama"
      : selectedBranch;

  // State Konfigurasi Semua Cabang & Snapshot Tersimpan
  const [configsByBranch, setConfigsByBranch] = useState<
    Record<SingleBranchName, BranchStoreSettings>
  >(DEFAULT_BRANCH_SETTINGS);
  const [savedConfigsByBranch, setSavedConfigsByBranch] = useState<
    Record<SingleBranchName, BranchStoreSettings>
  >(DEFAULT_BRANCH_SETTINGS);

  // Ref Input File Logo & State UI Interaktif
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Bersihkan timer toast & scan perangkat saat komponen unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  // State Scroll untuk Floating Action Buttons yang selalu mengikuti layar sampai paling bawah
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollPos > 120);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Muat dari localStorage dan backend MariaDB saat halaman pertama kali dibuka
  useEffect(() => {
    let isCancelled = false;

    const loadInitialSettings = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === "object") {
            const merged: Record<SingleBranchName, BranchStoreSettings> = {
              "Cabang Sudirman Utama": {
                ...DEFAULT_BRANCH_SETTINGS["Cabang Sudirman Utama"],
                ...(parsed["Cabang Sudirman Utama"] || {}),
              },
              "Cabang Tebet Eco Park": {
                ...DEFAULT_BRANCH_SETTINGS["Cabang Tebet Eco Park"],
                ...(parsed["Cabang Tebet Eco Park"] || {}),
              },
              "Cabang Dago Heritage": {
                ...DEFAULT_BRANCH_SETTINGS["Cabang Dago Heritage"],
                ...(parsed["Cabang Dago Heritage"] || {}),
              },
            };
            setConfigsByBranch(merged);
            setSavedConfigsByBranch(merged);
          }
        }
      } catch {}

      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && !isCancelled) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setConfigsByBranch((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((k) => {
                const branchKey = k as SingleBranchName;
                updated[branchKey] = {
                  ...DEFAULT_BRANCH_SETTINGS[branchKey],
                  ...updated[branchKey],
                  namaWarung: d.namaWarung || updated[branchKey].namaWarung,
                  slogan: d.slogan || updated[branchKey].slogan,
                  alamat: d.alamat || updated[branchKey].alamat,
                  whatsapp: d.whatsapp || updated[branchKey].whatsapp,
                  emailResto: d.emailResto || updated[branchKey].emailResto,
                  nib: d.nib || updated[branchKey].nib,
                  jamBukaWeekday: d.jamBukaWeekday || updated[branchKey].jamBukaWeekday,
                  jamTutupWeekday: d.jamTutupWeekday || updated[branchKey].jamTutupWeekday,
                  jamBukaWeekend: d.jamBukaWeekend || updated[branchKey].jamBukaWeekend,
                  jamTutupWeekend: d.jamTutupWeekend || updated[branchKey].jamTutupWeekend,
                  autoCloseKasir:
                    d.autoCloseKasir !== undefined
                      ? Boolean(d.autoCloseKasir)
                      : updated[branchKey].autoCloseKasir,
                  istirahatSore:
                    d.istirahatSore !== undefined
                      ? Boolean(d.istirahatSore)
                      : updated[branchKey].istirahatSore,
                  pajakPersen: String(d.pajakPersen || updated[branchKey].pajakPersen),
                  pajakTipe: (d.pajakTipe as "termasuk" | "akhir") || updated[branchKey].pajakTipe,
                  biayaKemasan: String(d.biayaKemasan || updated[branchKey].biayaKemasan),
                  aturanPembulatan:
                    (d.aturanPembulatan as RoundingOption) ||
                    updated[branchKey].aturanPembulatan,
                  cetakLogo:
                    d.cetakLogo !== undefined
                      ? Boolean(d.cetakLogo)
                      : updated[branchKey].cetakLogo,
                  cetakAlamat:
                    d.cetakAlamat !== undefined
                      ? Boolean(d.cetakAlamat)
                      : updated[branchKey].cetakAlamat,
                  nomorAntrianBesar:
                    d.nomorAntrianBesar !== undefined
                      ? Boolean(d.nomorAntrianBesar)
                      : updated[branchKey].nomorAntrianBesar,
                  kodeQrisDinamis:
                    d.kodeQrisDinamis !== undefined
                      ? Boolean(d.kodeQrisDinamis)
                      : updated[branchKey].kodeQrisDinamis,
                  pesanFooter: d.pesanFooter || updated[branchKey].pesanFooter,
                  autoPrintLunas:
                    d.autoPrintLunas !== undefined
                      ? Boolean(d.autoPrintLunas)
                      : updated[branchKey].autoPrintLunas,
                  channelTunai:
                    d.channelTunai !== undefined
                      ? Boolean(d.channelTunai)
                      : updated[branchKey].channelTunai,
                  channelQris:
                    d.channelQris !== undefined
                      ? Boolean(d.channelQris)
                      : updated[branchKey].channelQris,
                  channelEdc:
                    d.channelEdc !== undefined
                      ? Boolean(d.channelEdc)
                      : updated[branchKey].channelEdc,
                  channelOjol:
                    d.channelOjol !== undefined
                      ? Boolean(d.channelOjol)
                      : updated[branchKey].channelOjol,
                };
              });
              setSavedConfigsByBranch(updated);
              return updated;
            });
          }
        }
      } catch (e) {
        console.warn("Gagal memuat pengaturan dari backend:", e);
      }
    };
    void loadInitialSettings();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Konfigurasi cabang aktif saat ini
  const currentConfig = configsByBranch[activeBranchKey];

  // Helper update field pada cabang aktif
  const updateField = <K extends keyof BranchStoreSettings>(
    field: K,
    value: BranchStoreSettings[K]
  ) => {
    setConfigsByBranch((prev) => ({
      ...prev,
      [activeBranchKey]: {
        ...prev[activeBranchKey],
        [field]: value,
      },
    }));
  };

  // Deteksi apakah ada perubahan yang belum disimpan
  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(configsByBranch[activeBranchKey]) !==
      JSON.stringify(savedConfigsByBranch[activeBranchKey])
    );
  }, [configsByBranch, savedConfigsByBranch, activeBranchKey]);

  // Hitung jumlah channel pembayaran yang aktif di Section E
  const activeChannelCount = useMemo(() => {
    return [
      currentConfig.channelTunai,
      currentConfig.channelQris,
      currentConfig.channelEdc,
      currentConfig.channelOjol,
    ].filter(Boolean).length;
  }, [
    currentConfig.channelTunai,
    currentConfig.channelQris,
    currentConfig.channelEdc,
    currentConfig.channelOjol,
  ]);

  // Kalkulasi Dinamis Struk Thermal 80mm (Section D)
  const receiptSimulation = useMemo(() => {
    const subtotal = 60000; // 38.000 + 12.000 + 10.000
    const parsedTax = Math.max(
      0,
      parseFloat(currentConfig.pajakPersen.replace(",", ".")) || 0
    );

    let taxNominal = 0;
    let rawTotal = subtotal;

    if (currentConfig.pajakTipe === "akhir") {
      taxNominal = Math.round((subtotal * parsedTax) / 100);
      rawTotal = subtotal + taxNominal;
    } else {
      // Harga menu sudah termasuk pajak
      taxNominal = Math.round(subtotal - subtotal / (1 + parsedTax / 100));
      rawTotal = subtotal;
    }

    let finalTotal = rawTotal;
    if (currentConfig.aturanPembulatan === "Kelipatan Rp 100 terdekat") {
      finalTotal = Math.round(rawTotal / 100) * 100;
    } else if (currentConfig.aturanPembulatan === "Kelipatan Rp 500 terdekat") {
      finalTotal = Math.round(rawTotal / 500) * 500;
    } else if (
      currentConfig.aturanPembulatan === "Kelipatan Rp 1.000 terdekat"
    ) {
      finalTotal = Math.round(rawTotal / 1000) * 1000;
    }

    return {
      subtotal,
      parsedTax,
      taxNominal,
      finalTotal,
    };
  }, [
    currentConfig.pajakPersen,
    currentConfig.pajakTipe,
    currentConfig.aturanPembulatan,
  ]);

  // Handler Unggah Logo Baru (Section A)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file logo maksimal 2MB!", "warning");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("logoUrl", reader.result);
        showToast(`Logo "${file.name}" berhasil dimuat ke pratinjau.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handler Simpan Konfigurasi ke Backend & localStorage
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        namaWarung: currentConfig.namaWarung,
        slogan: currentConfig.slogan,
        alamat: currentConfig.alamat,
        whatsapp: currentConfig.whatsapp,
        emailResto: currentConfig.emailResto,
        nib: currentConfig.nib,
        jamBukaWeekday: currentConfig.jamBukaWeekday,
        jamTutupWeekday: currentConfig.jamTutupWeekday,
        jamBukaWeekend: currentConfig.jamBukaWeekend,
        jamTutupWeekend: currentConfig.jamTutupWeekend,
        autoCloseKasir: currentConfig.autoCloseKasir,
        istirahatSore: currentConfig.istirahatSore,
        pajakPersen: currentConfig.pajakPersen,
        pajakTipe: currentConfig.pajakTipe,
        biayaKemasan: currentConfig.biayaKemasan,
        aturanPembulatan: currentConfig.aturanPembulatan,
        cetakLogo: currentConfig.cetakLogo,
        cetakAlamat: currentConfig.cetakAlamat,
        nomorAntrianBesar: currentConfig.nomorAntrianBesar,
        kodeQrisDinamis: currentConfig.kodeQrisDinamis,
        pesanFooter: currentConfig.pesanFooter,
        autoPrintLunas: currentConfig.autoPrintLunas,
        channelTunai: currentConfig.channelTunai,
        channelQris: currentConfig.channelQris,
        channelEdc: currentConfig.channelEdc,
        channelOjol: currentConfig.channelOjol,
      };

      try {
        await fetch(`${API_BASE_URL}/api/settings`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn("Gagal sinkronisasi pengaturan ke backend:", e);
      }

      setSavedConfigsByBranch(configsByBranch);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configsByBranch));
      } catch {}
      showToast("Perubahan konfigurasi toko berhasil disimpan!");
    } catch {
      showToast("Gagal menyimpan ke penyimpanan lokal browser.", "warning");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Konfirmasi Reset ke Data Terakhir Disimpan
  const handleConfirmResetSaved = () => {
    const updated =
      selectedBranch === "Semua Cabang"
        ? savedConfigsByBranch
        : {
            ...configsByBranch,
            [activeBranchKey]: savedConfigsByBranch[activeBranchKey],
          };
    setConfigsByBranch(updated);
    setShowResetModal(false);
    showToast(
      selectedBranch === "Semua Cabang"
        ? "Konfigurasi seluruh cabang berhasil dikembalikan ke data yang terakhir disimpan."
        : `Konfigurasi ${activeBranchKey} berhasil dikembalikan ke data yang terakhir disimpan.`
    );
  };

  // Handler Toggle Channel Pembayaran (Minimal 1 channel wajib aktif)
  const handleToggleChannel = (
    field: "channelTunai" | "channelQris" | "channelEdc" | "channelOjol"
  ) => {
    const currentVal = currentConfig[field];
    if (currentVal && activeChannelCount <= 1) {
      showToast(
        "Minimal 1 metode pembayaran harus tetap aktif untuk operasional kasir!",
        "warning"
      );
      return;
    }
    updateField(field, !currentVal);
  };

  // Handler Pindai Ulang Perangkat (Section F)
  const handleRescanDevices = () => {
    if (isScanningDevices) return;
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }
    setIsScanningDevices(true);
    showToast("Memindai ulang perangkat di jaringan lokal...");
    scanTimerRef.current = setTimeout(() => {
      setIsScanningDevices(false);
      showToast(
        "Pemindaian selesai: 2 Printer Thermal & 1 Cash Drawer terhubung."
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-white border transition-all ${
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

      {/* Modal Konfirmasi Reset ke Data Terakhir Disimpan */}
      {showResetModal && (
        <div
          onClick={() => setShowResetModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-black">
                    Reset ke Data Terakhir Disimpan?
                  </h3>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    PrekDuaDara (<span className="font-mono">{currentConfig.outletId || "OUT-001"}</span>)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-neutral-700 hover:text-black p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium mb-6">
              Seluruh perubahan konfigurasi yang belum disimpan akan dibatalkan
              dan dikembalikan ke data yang terakhir Anda simpan di database.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-400 bg-white hover:bg-gray-50 text-xs font-semibold text-black transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetSaved}
                className="px-4 py-2.5 rounded-xl bg-[#EA8E18] hover:bg-[#d67f12] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Ya, Kembalikan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR KIRI (KONSISTEN DENGAN SEMUA LAMAN DASHBOARD) */}
      <Sidebar />

      {/* 2. AREA KONTEN UTAMA */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* FLOATING ACTION BUTTONS (MURNI HANYA DUA TOMBOL, SELALU MENGIKUTI SCROLL SAMPAI PALING DASAR HALAMAN) */}
        <div
          className={`fixed top-4 sm:top-5 right-4 sm:right-6 lg:right-10 z-50 flex items-center gap-2.5 transition-all duration-300 ${
            isScrolled
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-3"
          }`}
        >
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black hover:text-black transition shadow-lg cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset ke Data Terakhir</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2D452B] hover:bg-[#223520] disabled:opacity-60 rounded-xl text-xs font-semibold text-white transition shadow-lg cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>

        {/* TOP NAVBAR HEADER (SERAGAM DENGAN MANAJEMEN KASIR & STOK) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
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
                Pengaturan &amp; Konfigurasi Gerai
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
        </header>

        {/* PAGE HEADER & ACTION BUTTONS */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Store size={18} className="text-[#2D452B] shrink-0" />
            <h2 className="font-display text-base sm:text-lg font-bold text-black tracking-tight">
              Pengaturan &amp; Konfigurasi Toko
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-end lg:self-center">
            {/* Indikator Status Simpan */}
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold whitespace-nowrap">
                <Clock size={13} className="shrink-0" />
                <span>Ada Perubahan Belum Disimpan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold whitespace-nowrap">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Tersimpan</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black hover:text-black transition shadow-2xs cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset ke Data Terakhir</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2D452B] hover:bg-[#223520] disabled:opacity-60 rounded-xl text-xs font-semibold text-white transition shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* A. Profil Gerai & Identitas Restoran */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                A
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Profil Gerai &amp; Identitas Restoran
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-neutral-950 bg-gray-100 px-3.5 py-1.5 rounded-lg border border-neutral-200">
              ID: {currentConfig.outletId}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Logo Upload Box */}
            <div className="w-full md:w-64 shrink-0 bg-[#F8F9FA] border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-2.5 mb-3.5 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentConfig.logoUrl || "/logo.png"}
                  alt="Logo PrekDuaDara"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <p className="text-[13px] font-semibold text-black text-center">
                Logo Struk &amp; Layar Display
              </p>
              <p className="text-xs text-neutral-800 font-medium text-center mt-1 mb-4">
                Format PNG / SVG (maks. 2MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0D8A52] hover:bg-[#097343] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Upload size={14} />
                <span>Unggah File Baru</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Nama Warung / Outlet
                </label>
                <input
                  type="text"
                  value={currentConfig.namaWarung}
                  onChange={(e) => updateField("namaWarung", e.target.value)}
                  className="w-full border border-neutral-300 px-3.5 py-2 rounded-xl text-xs font-medium text-black bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Slogan / Tagline Brand
                </label>
                <input
                  type="text"
                  value={currentConfig.slogan}
                  onChange={(e) => updateField("slogan", e.target.value)}
                  className="w-full border border-neutral-300 px-3.5 py-2 rounded-xl text-xs font-medium text-black bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Alamat Lengkap Gerai
                </label>
                <textarea
                  rows={2}
                  value={currentConfig.alamat}
                  onChange={(e) => updateField("alamat", e.target.value)}
                  className="w-full border border-neutral-300 px-3.5 py-2 rounded-xl text-xs font-medium text-black bg-white resize-none focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    WhatsApp / CS Warung
                  </label>
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3.5 py-2 gap-2.5 focus-within:border-[#D97706]">
                    <Phone size={14} className="text-neutral-800 shrink-0" />
                    <input
                      type="text"
                      value={currentConfig.whatsapp}
                      onChange={(e) => updateField("whatsapp", e.target.value)}
                      className="w-full text-xs font-medium text-black outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Email Restoran
                  </label>
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3.5 py-2 gap-2.5 focus-within:border-[#D97706]">
                    <Mail size={14} className="text-neutral-800 shrink-0" />
                    <input
                      type="text"
                      value={currentConfig.emailResto}
                      onChange={(e) =>
                        updateField("emailResto", e.target.value)
                      }
                      className="w-full text-xs font-medium text-black outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Nomor Izin Berusaha (NIB) / NPWP Restoran
                </label>
                <input
                  type="text"
                  value={currentConfig.nib}
                  onChange={(e) => updateField("nib", e.target.value)}
                  className="w-full border border-neutral-300 px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-black bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* B. Jam Buka & Jadwal Operasional */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                B
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Jam Buka &amp; Jadwal Operasional
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200">
              7 Hari Buka
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            {/* Weekday */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[13px] font-semibold text-black">
                  Senin s/d Jumat (Weekday)
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Aktif
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-xs font-medium text-neutral-800 mb-1.5">
                    Jam Buka Kasir
                  </span>
                  <TimeWheelPicker
                    value={currentConfig.jamBukaWeekday}
                    onChange={(val) => updateField("jamBukaWeekday", val)}
                    suffix="WIB"
                    ariaLabel="Jam Buka Kasir Weekday"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-neutral-800 mb-1.5">
                    Jam Tutup / Closing
                  </span>
                  <TimeWheelPicker
                    value={currentConfig.jamTutupWeekday}
                    onChange={(val) => updateField("jamTutupWeekday", val)}
                    suffix="WIB"
                    ariaLabel="Jam Tutup Kasir Weekday"
                  />
                </div>
              </div>
            </div>

            {/* Weekend */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[13px] font-semibold text-black">
                  Sabtu &amp; Minggu (Weekend)
                </span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  Peak Hours
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-xs font-medium text-neutral-800 mb-1.5">
                    Jam Buka Kasir
                  </span>
                  <TimeWheelPicker
                    value={currentConfig.jamBukaWeekend}
                    onChange={(val) => updateField("jamBukaWeekend", val)}
                    suffix="WIB"
                    ariaLabel="Jam Buka Kasir Weekend"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-neutral-800 mb-1.5">
                    Jam Tutup / Closing
                  </span>
                  <TimeWheelPicker
                    value={currentConfig.jamTutupWeekend}
                    onChange={(val) => updateField("jamTutupWeekend", val)}
                    suffix="WIB"
                    ariaLabel="Jam Tutup Kasir Weekend"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-options row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-black">
                  Auto-Close Kasir saat Toko Tutup
                </p>
                <p className="text-xs text-neutral-800 mt-1 font-medium leading-relaxed">
                  Laci kasir otomatis terkunci dan minta rekap Z-Report
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField("autoCloseKasir", !currentConfig.autoCloseKasir)
                }
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  currentConfig.autoCloseKasir ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    currentConfig.autoCloseKasir
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={currentConfig.istirahatSore}
                  onChange={(e) =>
                    updateField("istirahatSore", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 accent-[#0D8A52] rounded cursor-pointer"
                />
                <div>
                  <p className="text-[13px] font-semibold text-black">
                    Istirahat / Pergantian Shift Sore
                  </p>
                  <p className="text-xs text-neutral-800 mt-1 font-medium leading-relaxed">
                    Jeda istirahat sambel &amp; hitung cash drawer (15:00 -
                    15:30 WIB)
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-black bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shrink-0">
                15:00 - 15:30
              </span>
            </div>
          </div>
        </section>

        {/* C. Finansial, Pajak PB1 & Biaya Pembungkusan */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                C
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Finansial, Pajak PB1 &amp; Biaya Pembungkusan
              </h3>
            </div>
            <Wallet size={18} className="text-neutral-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Pajak Restoran (PB1) */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <label className="block text-[13px] font-semibold text-black mb-3">
                Pajak Restoran (PB1)
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={currentConfig.pajakPersen}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
                    const normalized = cleaned.replace(",", ".");
                    const num = parseFloat(normalized);
                    if (!Number.isNaN(num) && num > 100) {
                      updateField("pajakPersen", "100");
                    } else {
                      updateField("pajakPersen", cleaned);
                    }
                  }}
                  onBlur={() => {
                    if (!currentConfig.pajakPersen.trim()) {
                      updateField("pajakPersen", "0");
                    }
                  }}
                  className="w-20 border border-neutral-300 py-2 px-3 rounded-xl text-xs font-bold bg-white text-black text-center tabular-nums"
                />
                <span className="text-[13px] font-semibold text-black">%</span>
                <span className="text-xs text-neutral-800 font-medium leading-tight">
                  Tarif standar
                  <br />
                  Pemda DKI
                </span>
              </div>

              <div className="space-y-2.5 mt-4">
                <label className="flex items-center gap-2.5 text-xs text-neutral-950 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="pajak_tipe"
                    checked={currentConfig.pajakTipe === "termasuk"}
                    onChange={() => updateField("pajakTipe", "termasuk")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>Harga menu sudah termasuk pajak</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-black cursor-pointer">
                  <input
                    type="radio"
                    name="pajak_tipe"
                    checked={currentConfig.pajakTipe === "akhir"}
                    onChange={() => updateField("pajakTipe", "akhir")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>Pajak ditambahkan di akhir nota</span>
                </label>
              </div>
            </div>

            {/* Col 2: Biaya Kemasan Box / Bungkus */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <div className="flex justify-between items-start gap-2 mb-2">
                <label className="text-[13px] font-semibold text-black leading-snug">
                  Biaya Kemasan Box / Bungkus
                </label>
                <span className="text-xs font-semibold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                  Takeaway
                </span>
              </div>
              <span className="block text-xs text-neutral-800 font-medium mb-2">
                Biaya per porsi (paper lunch box)
              </span>
              <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3.5 py-2 gap-2">
                <span className="text-xs font-semibold text-neutral-800">Rp</span>
                <input
                  type="text"
                  value={currentConfig.biayaKemasan}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (!digits) {
                      updateField("biayaKemasan", "");
                    } else {
                      const formatted = parseInt(digits, 10).toLocaleString(
                        "id-ID"
                      );
                      updateField("biayaKemasan", formatted);
                    }
                  }}
                  onBlur={() => {
                    if (!currentConfig.biayaKemasan.trim()) {
                      updateField("biayaKemasan", "0");
                    }
                  }}
                  className="w-full text-xs font-semibold text-black outline-none bg-transparent tabular-nums"
                />
              </div>
              <p className="text-xs text-neutral-800 font-medium leading-relaxed mt-3">
                Otomatis ditambahkan saat kasir memilih mode{" "}
                <strong className="font-semibold text-black">Bungkus (Takeaway)</strong>{" "}
                atau pesanan ojol.
              </p>
            </div>

            {/* Col 3: Pembulatan Tunai */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[13px] font-semibold text-black">
                  Pembulatan Tunai
                </label>
                <RefreshCw size={14} className="text-neutral-800" />
              </div>
              <span className="block text-xs text-neutral-800 font-medium mb-2">
                Aturan pembulatan kembalian kasir
              </span>
              <select
                value={currentConfig.aturanPembulatan}
                onChange={(e) =>
                  updateField(
                    "aturanPembulatan",
                    e.target.value as RoundingOption
                  )
                }
                className="w-full border border-neutral-400 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-black outline-none focus:border-[#D97706] cursor-pointer"
              >
                {ROUNDING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex items-start gap-2 mt-3 text-xs text-neutral-800 font-medium">
                <Info size={14} className="text-neutral-800 shrink-0 mt-0.5" />
                <span>Mencegah selisih koin receh saat jam ramai.</span>
              </div>
            </div>
          </div>
        </section>

        {/* D. Template Struk Kasir & Thermal Printer */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                D
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Template Struk Kasir &amp; Thermal Printer
              </h3>
            </div>
            <span className="text-xs font-semibold text-black bg-gray-100 px-3.5 py-1.5 rounded-lg border border-neutral-200">
              Lebar Kertas: 80mm
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Left Config Controls */}
            <div className="flex-1 flex flex-col justify-between gap-4 w-full">
              <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-black mb-3">
                  Pilihan Elemen Header Nota
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs text-black cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={currentConfig.cetakLogo}
                      onChange={(e) =>
                        updateField("cetakLogo", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold">Cetak Logo PrekDuaDara</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs text-black cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={currentConfig.cetakAlamat}
                      onChange={(e) =>
                        updateField("cetakAlamat", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold">
                      Cetak Alamat &amp; WhatsApp
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs text-black cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={currentConfig.nomorAntrianBesar}
                      onChange={(e) =>
                        updateField("nomorAntrianBesar", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold">
                      Nomor Antrian Besar (Dapur)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs text-black cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={currentConfig.kodeQrisDinamis}
                      onChange={(e) =>
                        updateField("kodeQrisDinamis", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold">Kode QRIS Dinamis</span>
                  </label>
                  <label className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs text-black cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={currentConfig.cetakDetailPedas ?? true}
                      onChange={(e) =>
                        updateField("cetakDetailPedas", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold">
                      Detail Level Pedas &amp; Sambal
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-black mb-2">
                  Pesan Footer Struk (Catatan Penutup)
                </label>
                <textarea
                  rows={2}
                  value={currentConfig.pesanFooter}
                  onChange={(e) => updateField("pesanFooter", e.target.value)}
                  className="w-full border border-neutral-300 px-3.5 py-2 rounded-xl text-xs font-medium text-black bg-white resize-none focus:outline-none focus:border-[#D97706]"
                />
                <p className="text-xs text-neutral-800 font-medium mt-1.5">
                  Tercetak di bagian paling bawah struk setelah total
                  pembayaran.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-black">
                    Auto-Print Setelah Pembayaran Lunas
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-1">
                    Langsung mengirim perintah cetak tanpa konfirmasi kasir
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField("autoPrintLunas", !currentConfig.autoPrintLunas)
                  }
                  className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    currentConfig.autoPrintLunas
                      ? "bg-[#0D8A52]"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      currentConfig.autoPrintLunas
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="bg-[#F8F9FA] border border-neutral-200 rounded-xl p-3.5 w-full">
                <label className="block text-[13px] font-semibold text-black mb-2">
                  Jumlah Salinan Cetak
                </label>
                <select
                  value={currentConfig.jumlahSalinanStruk ?? "1x (Pelanggan)"}
                  onChange={(e) =>
                    updateField(
                      "jumlahSalinanStruk",
                      e.target.value as BranchStoreSettings["jumlahSalinanStruk"]
                    )
                  }
                  className="w-full border border-neutral-400 px-3 py-2 rounded-xl text-xs font-semibold text-black bg-white focus:outline-none focus:border-[#D97706]"
                >
                  <option value="1x (Pelanggan)">1x (Pelanggan)</option>
                  <option value="2x (Pelanggan & Dapur)">
                    2x (Pelanggan &amp; Dapur)
                  </option>
                </select>
              </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-black">
                  <Printer size={14} className="text-[#D97706] shrink-0" />
                  <span>Uji Perangkat Printer (ESC/POS 80mm)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        `Mengirim sinyal Tes Cetak Thermal (${activeBranchKey})...`
                      )
                    }
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black hover:text-black transition cursor-pointer shadow-2xs"
                  >
                    <Printer size={14} />
                    <span>Tes Cetak Thermal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast("Menguji pemotong kertas (Auto-Cutter)...")
                    }
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black hover:text-black transition cursor-pointer shadow-2xs"
                  >
                    <Scissors size={14} />
                    <span>Uji Auto-Cutter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Receipt Preview */}
            <div className="w-full lg:w-80 shrink-0 bg-[#F8F9FA] border border-neutral-200 rounded-2xl p-5 flex flex-col items-center">
              <p className="text-xs font-semibold text-center text-neutral-700 tracking-wider uppercase mb-3">
                SIMULASI CETAK KERTAS (80MM)
              </p>
              <div
                className="w-64 bg-white border border-neutral-300 shadow-md p-5 pb-8 relative flex flex-col font-mono text-[10.5px] text-black rounded-t-md"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 6px 100%, #F8F9FA 5px, transparent 6px)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "bottom",
                  backgroundRepeat: "repeat-x",
                }}
              >
                <div className="text-center mb-2.5">
                  {currentConfig.cetakLogo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentConfig.logoUrl || "/logo.png"}
                      alt="Logo"
                      className="w-8 h-8 rounded-full mx-auto mb-1.5 object-contain"
                    />
                  )}
                  <h4 className="font-bold text-xs tracking-wide uppercase leading-snug">
                    {currentConfig.namaWarung || "PREKDUADARA"}
                  </h4>
                  {currentConfig.cetakAlamat && (
                    <>
                      <p className="text-[9.5px] text-neutral-700 mt-0.5 leading-snug">
                        {currentConfig.alamat}
                      </p>
                      <p className="text-[9.5px] text-neutral-700 mt-0.5">
                        WA: {currentConfig.whatsapp}
                      </p>
                    </>
                  )}
                </div>

                {/* Nomor Antrian Besar (Dapur) */}
                {currentConfig.nomorAntrianBesar && (
                  <div className="my-1.5 py-1.5 px-2 border-y-2 border-gray-900 text-center bg-gray-50">
                    <div className="text-[8.5px] font-bold tracking-widest uppercase text-neutral-700">
                      NOMOR ANTRIAN DAPUR
                    </div>
                    <div className="text-base font-bold tracking-wider text-black leading-tight">
                      ANTRIAN #014
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-neutral-300 my-2"></div>

                <div className="flex justify-between font-bold text-[10px]">
                  <span>KASIR: RIAN</span>
                  <span>MEJA: 04</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-neutral-700">
                  <span>#INV-2605-008</span>
                  <span>14:22 WIB</span>
                </div>

                <div className="border-t border-dashed border-neutral-300 my-2"></div>

                <div className="mb-1.5">
                  <div className="flex justify-between font-bold">
                    <span>2x Paket Geprek Ekstra</span>
                    <span>38.000</span>
                  </div>
                  {currentConfig.cetakDetailPedas && (
                    <p className="text-[9px] text-neutral-700">
                      Lvl 5 • Sambal Korek
                    </p>
                  )}
                </div>

                <div className="flex justify-between mb-1.5 font-bold">
                  <span>1x Kulit Crispy Ori</span>
                  <span>12.000</span>
                </div>

                <div className="flex justify-between mb-1 font-bold">
                  <span>2x Es Teh Manis Jumbo</span>
                  <span>10.000</span>
                </div>

                <div className="border-t border-dashed border-neutral-300 my-2"></div>

                <div className="flex justify-between text-[10px] text-neutral-950 mb-0.5">
                  <span>Subtotal</span>
                  <span>
                    {receiptSimulation.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-950 mb-1">
                  <span>
                    PB1 ({currentConfig.pajakPersen || "0"}%
                    {currentConfig.pajakTipe === "termasuk" ? " Incl." : ""})
                  </span>
                  <span>
                    {receiptSimulation.taxNominal.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-xs mt-1 pt-1 border-t border-neutral-300">
                  <span>TOTAL BAYAR</span>
                  <span>
                    Rp {receiptSimulation.finalTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[9.5px] text-neutral-700 mt-0.5">
                  <span>QRIS (ShopeePay)</span>
                  <span>
                    {receiptSimulation.finalTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[9.5px] text-neutral-700">
                  <span>Kembali</span>
                  <span>0</span>
                </div>

                {/* Kode QRIS Dinamis */}
                {currentConfig.kodeQrisDinamis && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-300 flex flex-col items-center text-center">
                    <div className="p-1.5 bg-white border border-neutral-300 rounded-md">
                      <QrCode size={42} className="text-black" />
                    </div>
                    <span className="text-[8.5px] font-bold text-neutral-700 mt-1 uppercase tracking-wider">
                      SCAN QRIS DINAMIS • LUNAS OTOMATIS
                    </span>
                  </div>
                )}

                <div className="border-t border-dashed border-neutral-300 my-2.5"></div>

                <div className="text-center text-[9px] text-neutral-700 leading-snug">
                  <p>{currentConfig.pesanFooter}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. Metode Pembayaran & Integrasi EDC/QRIS */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                E
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Metode Pembayaran &amp; Integrasi EDC/QRIS
              </h3>
            </div>
            <span
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border ${
                activeChannelCount === 4
                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-amber-800 bg-amber-50 border-amber-300"
              }`}
            >
              {activeChannelCount === 4
                ? "Semua Channel Aktif"
                : `${activeChannelCount} dari 4 Channel Aktif`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <Banknote
                  size={18}
                  className="text-emerald-700 mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-semibold text-[13px] text-black">
                    Tunai / Uang Cash
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    Laci kasir otomatis terbuka saat bayar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChannel("channelTunai")}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  currentConfig.channelTunai ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    currentConfig.channelTunai
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <QrCode size={18} className="text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[13px] text-black">
                    QRIS Dinamis (BCA / ShopeePay)
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    Auto-detect nominal &amp; notifikasi instan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChannel("channelQris")}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  currentConfig.channelQris ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    currentConfig.channelQris
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <CreditCard
                  size={18}
                  className="text-[#D97706] mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-semibold text-[13px] text-black">
                    Mesin EDC Debit &amp; Kredit
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    BCA &amp; Mandiri Link (Input No. Approval)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChannel("channelEdc")}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  currentConfig.channelEdc ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    currentConfig.channelEdc
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <UtensilsCrossed
                  size={18}
                  className="text-rose-600 mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-semibold text-[13px] text-black">
                    GrabFood &amp; GoFood Merchant
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    Sinkronisasi pesanan ojol langsung ke dapur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChannel("channelOjol")}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  currentConfig.channelOjol ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    currentConfig.channelOjol
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* F. Perangkat Keras Kasir & Tata Letak Meja */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-black font-display font-bold text-sm flex items-center justify-center shrink-0">
                F
              </span>
              <h3 className="font-display font-bold text-sm text-black">
                Perangkat Keras Kasir &amp; Tata Letak Meja
              </h3>
            </div>
            <button
              type="button"
              onClick={handleRescanDevices}
              disabled={isScanningDevices}
              className="text-xs font-semibold text-black hover:text-black bg-gray-50 hover:bg-gray-100 disabled:opacity-60 border border-neutral-400 px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw
                size={13}
                className={isScanningDevices ? "animate-spin text-[#EA8E18]" : ""}
              />
              <span>
                {isScanningDevices
                  ? "Memindai Perangkat..."
                  : "Pindai Ulang Perangkat"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <p className="text-xs font-medium text-neutral-800 mb-1">
                Printer Kasir Utama
              </p>
              <p className="font-semibold text-[13px] text-black">
                Epson TM-T82X (LAN)
              </p>
              <p className="text-xs font-mono font-medium text-emerald-700 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                IP: 192.168.1.201 • Port 9100
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <p className="text-xs font-medium text-neutral-800 mb-1">
                Printer Dapur / Cobek
              </p>
              <p className="font-semibold text-[13px] text-black">
                Thermal Kitchen 80mm
              </p>
              <p className="text-xs font-mono font-medium text-emerald-700 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                IP: 192.168.1.202 • Auto-Buzzer
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-neutral-200">
              <p className="text-xs font-medium text-neutral-800 mb-1.5">
                Kapasitas Meja Dine-In
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={
                    currentConfig.kapasitasMeja === 0
                      ? ""
                      : currentConfig.kapasitasMeja
                  }
                  onChange={(e) => {
                    const num = Math.max(
                      0,
                      Math.min(200, parseInt(e.target.value, 10) || 0)
                    );
                    updateField("kapasitasMeja", num);
                  }}
                  onBlur={() => {
                    if (currentConfig.kapasitasMeja < 1) {
                      updateField("kapasitasMeja", 1);
                    }
                  }}
                  className="w-20 border border-neutral-300 bg-white px-2.5 py-2 rounded-lg font-bold text-xs text-black text-center tabular-nums focus:outline-none focus:border-[#D97706]"
                />
                <span className="font-semibold text-[13px] text-black">
                  Meja
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-800 mt-1.5">
                Zona Dalam AC &amp; Area Luar Terbuka
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM SAVE BAR */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-950">
            <Info size={16} className="text-[#2D452B] shrink-0" />
            <span>
              Simpan perubahan agar langsung diterapkan ke kasir.
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold whitespace-nowrap">
                <Clock size={13} className="shrink-0" />
                <span>Ada Perubahan Belum Disimpan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold whitespace-nowrap">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Tersimpan</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs font-semibold text-white bg-[#2D452B] hover:bg-[#223520] disabled:opacity-60 px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Simpan Konfigurasi Lengkap</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* FOOTER SYSTEM */}
        <footer className="pt-3 pb-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-700 font-medium">
          <span className="font-display font-bold text-[#EA8E18]">
            PrekDuaDara
          </span>
          <span>&copy; 2026 PrekDuaDara. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
