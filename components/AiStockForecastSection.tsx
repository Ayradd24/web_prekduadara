"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  ShoppingCart,
  X,
} from "lucide-react";

export type ScenarioTrendKey =
  | "awal_semester"
  | "bulan_puasa"
  | "pekan_ujian"
  | "siklus_kiriman"
  | "libur_semester"
  | "normal";

export type MarketTrendKey = "auto" | ScenarioTrendKey;

export type TrendCategoryKey =
  | "siklus_mahasiswa"
  | "musiman_cuaca"
  | "anomali_penjualan"
  | "event_khusus"
  | "operasional_normal";

interface CycleInfo {
  dayOfMonth: number;
  subPhase: "awal_bulan" | "pertengahan_bulan" | "tanggal_tua";
  subPhaseLabel: string;
  subPhaseDescription: string;
}

interface TrendMeta {
  key: string;
  mode?: "auto" | "manual";
  label: string;
  shortLabel: string;
  trendCategory?: TrendCategoryKey | string;
  description: string;
  impactRange: string;
  cycleInfo: CycleInfo | null;
  detectedTrendKey?: string;
  detectedTrendLabel?: string;
  detectionReason?: string;
  customContext?: string | null;
  isActive?: boolean;
}

export interface ForecastItem {
  id: string;
  name: string;
  unit: string;
  stockKey: string;
  currentStock: number;
  minStock: number;
  stockStatus: string;
  baselineDailyBurn: number;
  salesDailyBurn: number;
  burnSource: "baseline_fallback" | "sales_7d" | "blended";
  trendMultiplier: number;
  trendImpactPercent: number;
  projectedDailyBurn: number;
  estimatedDaysLeft: number;
  isUrgentUnder2Days: boolean;
  urgencyLevel: "KRITIS" | "WASPADA" | "AMAN";
  targetStockForSafeDays: number;
  suggestedPoQty: number;
  poReason: string;
}

export interface GeminiInsight {
  detectedTrendKey?: string;
  detectedTrendLabel?: string;
  trendCategory?: TrendCategoryKey | string;
  detectionReason?: string;
  kitchenStrategy: string;
  promoSuggestion: string;
  urgentAnalysis: string;
}

export interface StockForecastResponse {
  settings: {
    activeTrend: MarketTrendKey;
    resolvedTrendKey?: string;
    savedTrend: MarketTrendKey;
    isAutoMode?: boolean;
    isPreviewSimulation: boolean;
    autoDetectCycle: boolean;
    targetSafeDays: number;
    notes: string;
    updatedAt: string | null;
  };
  activeTrendMeta: TrendMeta;
  summary: {
    totalIngredients: number;
    urgentUnder2DaysCount: number;
    needPoCount: number;
    safeCount: number;
    targetSafeDays: number;
    totalTransactions7d: number;
    prevTransactions7d?: number;
    transactionGrowthPercent?: number | null;
    totalItemsSold7d: number;
    usedBaselineFallback: boolean;
    generatedAt: string;
  };
  aiEngine?: string;
  aiFallbackReason?: string | null;
  geminiInsight?: GeminiInsight;
  availableTrends: TrendMeta[];
  items: ForecastItem[];
}

export type ForecastResponseData = StockForecastResponse;

interface AiStockForecastSectionProps {
  onApplyRecommendedPo: (poMap: Record<string, string>) => void;
  onForecastUpdate?: (data: ForecastResponseData) => void;
  onNotify?: (msg: string) => void;
  refreshTrigger?: string | number;
}

const MANUAL_SCENARIO_OPTIONS: { key: ScenarioTrendKey; label: string }[] = [
  { key: "awal_semester", label: "Awal Semester" },
  { key: "bulan_puasa", label: "Bulan Puasa" },
  { key: "pekan_ujian", label: "Pekan Ujian" },
  { key: "siklus_kiriman", label: "Siklus Kiriman" },
  { key: "libur_semester", label: "Libur Semester" },
  { key: "normal", label: "Normal (Baseline)" },
];

const TREND_CATEGORY_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  siklus_mahasiswa: {
    label: "Siklus Mahasiswa",
    className: "bg-emerald-50 text-[#2D452B] border-emerald-300",
  },
  musiman_cuaca: {
    label: "Musiman & Cuaca",
    className: "bg-sky-50 text-sky-800 border-sky-300",
  },
  anomali_penjualan: {
    label: "Anomali Penjualan",
    className: "bg-rose-50 text-[#DC2626] border-rose-300",
  },
  event_khusus: {
    label: "Event Khusus",
    className: "bg-amber-50 text-[#B45309] border-amber-300",
  },
  operasional_normal: {
    label: "Operasional Normal",
    className: "bg-neutral-100 text-neutral-800 border-neutral-300",
  },
};

const INTEGER_UNITS = [
  "pcs",
  "box",
  "cup",
  "bungkus",
  "pack",
  "block",
  "botol",
  "kaleng",
];

function formatSkuFromId(id: string | number): string {
  return `STK-${String(id).padStart(2, "0")}`;
}

export function roundPoQty(val: number, unit: string): number {
  const isIntUnit = INTEGER_UNITS.includes(unit.trim().toLowerCase());
  const num = Number(val) || 0;
  if (num <= 0) return 0;
  return isIntUnit ? Math.ceil(num) : Math.ceil(num * 10) / 10;
}

function formatQty(val: number, unit: string): string {
  const isIntUnit = INTEGER_UNITS.includes(unit.trim().toLowerCase());
  if (isIntUnit) return String(Math.round(val));
  const rounded = Math.round(val * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export default function AiStockForecastSection({
  onApplyRecommendedPo,
  onForecastUpdate,
  onNotify,
  refreshTrigger,
}: AiStockForecastSectionProps) {
  const [selectedTrend, setSelectedTrend] = useState<MarketTrendKey>("auto");
  const [customContextInput, setCustomContextInput] = useState<string>("");
  const [appliedCustomContext, setAppliedCustomContext] = useState<string>("");
  const [forecast, setForecast] = useState<StockForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);
  const [isSimMenuOpen, setIsSimMenuOpen] = useState<boolean>(false);
  const onForecastUpdateRef = useRef(onForecastUpdate);
  const forceNextFetchRef = useRef<boolean>(false);
  const simMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onForecastUpdateRef.current = onForecastUpdate;
  }, [onForecastUpdate]);

  useEffect(() => {
    if (!isSimMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        simMenuRef.current &&
        !simMenuRef.current.contains(event.target as Node)
      ) {
        setIsSimMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSimMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSimMenuOpen]);

  const fetchForecast = useCallback(
    async (
      trendKey: MarketTrendKey,
      customContext: string,
      forceRefresh = false
    ) => {
      setIsLoading(true);
      setIsAlertDismissed(false);
      setErrorMsg(null);
      try {
        const params = new URLSearchParams();
        params.set("trend", trendKey);
        if (customContext.trim()) {
          params.set("customContext", customContext.trim());
        }
        if (forceRefresh) {
          params.set("force", "1");
        }
        const url = `${API_BASE_URL}/api/analytics/stock-forecast?${params.toString()}`;
        const res = await fetch(url, {
          cache: "no-store",
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const payload = json.data as ForecastResponseData;
          setForecast(payload);
          onForecastUpdateRef.current?.(payload);
        } else {
          setErrorMsg(
            json.message || "Gagal memuat data prediksi stok dari server."
          );
        }
      } catch {
        setErrorMsg("Tidak dapat terhubung ke server backend.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const shouldForce = forceNextFetchRef.current;
    forceNextFetchRef.current = false;
    fetchForecast(selectedTrend, appliedCustomContext, shouldForce);
  }, [fetchForecast, selectedTrend, appliedCustomContext, refreshTrigger]);

  const handleSelectTrend = (trendKey: MarketTrendKey) => {
    if (isLoading) return;
    if (trendKey === selectedTrend) {
      fetchForecast(trendKey, appliedCustomContext, true);
      return;
    }
    setSelectedTrend(trendKey);
  };

  const handleAnalyzeCustomContext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const trimmed = customContextInput.trim();
    if (trimmed === appliedCustomContext) {
      fetchForecast(selectedTrend, trimmed, true);
    } else {
      forceNextFetchRef.current = true;
      setAppliedCustomContext(trimmed);
    }
  };

  const handleClearCustomContext = () => {
    if (isLoading) return;
    setCustomContextInput("");
    if (appliedCustomContext !== "") {
      setAppliedCustomContext("");
    }
  };

  const urgentItems = useMemo(
    () =>
      (forecast?.items || []).filter(
        (item) =>
          item.isUrgentUnder2Days ||
          item.estimatedDaysLeft < 2 ||
          item.currentStock <= item.minStock * 0.5
      ),
    [forecast]
  );

  const recommendedPoItems = useMemo(
    () => (forecast?.items || []).filter((item) => item.suggestedPoQty > 0),
    [forecast]
  );

  const visibleItems = useMemo(() => {
    const all = forecast?.items || [];
    return showAllRows ? all : all.slice(0, 6);
  }, [forecast, showAllRows]);

  const handleTriggerSmartPo = () => {
    const poMap: Record<string, string> = {};
    recommendedPoItems.forEach((item) => {
      const sku = formatSkuFromId(item.id);
      const roundedQty = roundPoQty(item.suggestedPoQty, item.unit);
      if (roundedQty > 0) {
        poMap[sku] = String(roundedQty);
      }
    });
    onApplyRecommendedPo(poMap);
  };

  const activeMeta = forecast?.activeTrendMeta;
  const geminiInsight = forecast?.geminiInsight;
  const isAutoMode = selectedTrend === "auto";
  const activeManualOption = MANUAL_SCENARIO_OPTIONS.find(
    (opt) => opt.key === selectedTrend
  );

  const detectedTrendTitle =
    geminiInsight?.detectedTrendLabel ||
    activeMeta?.detectedTrendLabel ||
    activeMeta?.label ||
    "Analisis Tren Pasar Mahasiswa";

  const detectionReasonText =
    geminiInsight?.detectionReason || activeMeta?.detectionReason || "";

  const rawTrendCategory =
    geminiInsight?.trendCategory ||
    activeMeta?.trendCategory ||
    "siklus_mahasiswa";
  const categoryBadge = TREND_CATEGORY_BADGE[rawTrendCategory] || {
    label: String(rawTrendCategory).replace(/_/g, " "),
    className: "bg-neutral-100 text-neutral-800 border-neutral-300",
  };

  return (
    <section className="print:hidden bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
      {/* LAPISAN 1 — HEADER UTAMA */}
      <div className="bg-[#2D452B] text-white px-5 py-4 rounded-t-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <h3 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
            Prediksi Kebutuhan Stok &amp; Analisis Tren Pasar
          </h3>
          <span
            title={
              forecast?.aiFallbackReason || forecast?.aiEngine || "Prediksi AI"
            }
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border border-[#F3A712]/60 text-[#FFE38F] bg-[#F3A712]/10 whitespace-nowrap"
          >
            AI
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() =>
              fetchForecast(selectedTrend, appliedCustomContext, true)
            }
            disabled={isLoading}
            className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            <span>{isLoading ? "Menganalisis..." : "Hitung Ulang"}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSmartPo}
            disabled={isLoading || recommendedPoItems.length === 0}
            className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-[#F3A712] hover:bg-[#df980e] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart size={14} />
            <span>
              Isi Form PO
              {recommendedPoItems.length > 0
                ? ` (${recommendedPoItems.length} Bahan)`
                : ""}
            </span>
          </button>
        </div>
      </div>

      {/* LAPISAN 2 — BAR KONTROL 1 BARIS (MODE OTOMATIS + SIMULASI TREN + KONTEKS LAPANGAN) */}
      <div className="bg-[#FAF8F3] border-b border-amber-200/80 px-5 py-3 flex flex-col xl:flex-row xl:items-center gap-2.5">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSelectTrend("auto")}
            className={`h-8 inline-flex items-center px-3.5 rounded-full text-xs border transition cursor-pointer disabled:opacity-60 whitespace-nowrap ${
              isAutoMode
                ? "bg-[#2D452B] text-white border-[#2D452B] font-semibold shadow-2xs"
                : "bg-white text-black border-neutral-400 font-semibold hover:border-[#2D452B] hover:text-[#2D452B]"
            }`}
          >
            <span>Mode Otomatis</span>
          </button>

          <div ref={simMenuRef} className="relative inline-flex items-center">
            <button
              type="button"
              aria-label="Simulasi Tren Manual"
              aria-haspopup="listbox"
              aria-expanded={isSimMenuOpen}
              disabled={isLoading}
              onClick={() => setIsSimMenuOpen((prev) => !prev)}
              className={`h-8 inline-flex items-center gap-2 pl-3.5 pr-2.5 rounded-full text-xs border transition cursor-pointer disabled:opacity-60 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#2D452B]/25 ${
                !isAutoMode
                  ? "bg-[#2D452B] text-white border-[#2D452B] font-semibold shadow-2xs"
                  : "bg-white text-black border-neutral-400 font-semibold hover:border-[#2D452B] hover:text-[#2D452B]"
              }`}
            >
              <span>
                {!isAutoMode && activeManualOption
                  ? `Simulasi: ${activeManualOption.label}`
                  : "Simulasi Tren..."}
              </span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-150 shrink-0 ${
                  isSimMenuOpen ? "rotate-180" : ""
                } ${!isAutoMode ? "text-emerald-100" : "text-neutral-700"}`}
              />
            </button>

            {isSimMenuOpen && (
              <div
                role="listbox"
                aria-label="Pilihan Skenario Simulasi Tren"
                className="absolute left-0 top-full mt-1.5 z-30 w-56 bg-white text-black border border-neutral-300 rounded-xl shadow-lg py-1.5 overflow-hidden"
              >
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-700">
                  Pilih Skenario Simulasi
                </div>
                {MANUAL_SCENARIO_OPTIONS.map((opt) => {
                  const isSelected = !isAutoMode && selectedTrend === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setIsSimMenuOpen(false);
                        handleSelectTrend(opt.key);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 text-[#2D452B] font-semibold"
                          : "bg-white text-black font-medium hover:bg-neutral-100"
                      }`}
                    >
                      <span className="truncate">Simulasi: {opt.label}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          className="text-[#2D452B] shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
                {!isAutoMode && (
                  <div className="mt-1 pt-1 border-t border-neutral-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSimMenuOpen(false);
                        handleSelectTrend("auto");
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-[#2D452B] bg-white hover:bg-emerald-50/70 transition-colors cursor-pointer"
                    >
                      Kembali ke Mode Otomatis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <span
          className="hidden xl:inline-block h-5 w-px bg-amber-300/80 mx-0.5 shrink-0"
          aria-hidden="true"
        />

        <form
          onSubmit={handleAnalyzeCustomContext}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              maxLength={300}
              disabled={isLoading}
              value={customContextInput}
              onChange={(e) => setCustomContextInput(e.target.value)}
              placeholder="Konteks lapangan opsional: misal hujan deras, wisuda UM, atau ada event kampus..."
              className="h-8 w-full px-3 pr-7 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-[#EA8E18] disabled:opacity-60"
            />
            {(customContextInput || appliedCustomContext) && (
              <button
                type="button"
                onClick={handleClearCustomContext}
                title="Hapus konteks lapangan"
                aria-label="Hapus konteks lapangan"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#2D452B] hover:bg-[#1f331e] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isLoading && <Loader2 size={12} className="animate-spin" />}
            <span>{isLoading ? "Menganalisis..." : "Analisis"}</span>
          </button>
        </form>
      </div>

      {/* BODY CONTENT */}
      <div className="p-5 flex flex-col gap-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-bold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                fetchForecast(selectedTrend, appliedCustomContext, true)
              }
              className="px-3 py-1 rounded-lg bg-white border border-red-300 text-[#DC2626] hover:bg-red-100 text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {isLoading && !forecast ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-neutral-700">
            <Loader2 size={24} className="animate-spin text-[#EA8E18]" />
            <p className="text-xs font-bold text-[#2D452B]">
              Gemini AI sedang menganalisis stok...
            </p>
          </div>
        ) : forecast ? (
          <>
            {/* LAPISAN 3 — BANNER PERINGATAN DINI TERPADU (< 2 HARI ATAU <= BATAS AMAN) */}
            {urgentItems.length > 0 && !isAlertDismissed && (
              <div
                className={`bg-[#FFF5F5] border border-red-300 rounded-xl p-4 flex flex-col gap-3.5 transition-opacity duration-200 ${
                  isLoading
                    ? "opacity-60 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display text-xs sm:text-sm font-bold text-[#991B1B]">
                        Peringatan Dini Stok Kritis (&lt; 2 Hari)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-semibold uppercase tracking-wider">
                        {urgentItems.length} Bahan Urgent
                      </span>
                    </div>
                    <p className="text-xs text-red-950 font-medium mt-1 leading-relaxed">
                      {geminiInsight?.urgentAnalysis ||
                        `Terdapat ${urgentItems.length} bahan baku dengan estimasi habis < 2 hari atau di bawah batas aman pada kondisi ${detectedTrendTitle}.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={handleTriggerSmartPo}
                      className="h-8 px-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer whitespace-nowrap"
                    >
                      <ShoppingCart size={13} />
                      <span>Muat ke Form PO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAlertDismissed(true);
                        onNotify?.(
                          "Peringatan PO ditandai sudah dipesan ke supplier!"
                        );
                      }}
                      className="h-8 px-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-400 text-black text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      Tandai Sudah Dipesan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-stretch">
                  {urgentItems.map((item) => {
                    const sku = formatSkuFromId(item.id);
                    const poQty = roundPoQty(item.suggestedPoQty, item.unit);
                    return (
                      <div
                        key={item.id}
                        className="h-full bg-white rounded-xl border border-red-200/90 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-black truncate">
                              {item.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-neutral-700 shrink-0">
                              {sku}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-neutral-800 mt-0.5 tabular-nums">
                            Sisa{" "}
                            <strong className="font-semibold text-black">
                              {formatQty(item.currentStock, item.unit)}{" "}
                              {item.unit}
                            </strong>{" "}
                            • Aman {formatQty(item.minStock, item.unit)}{" "}
                            {item.unit}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-[#DC2626] tabular-nums">
                            ~{item.estimatedDaysLeft.toFixed(1)} Hari
                          </div>
                          <div className="text-[11px] font-semibold text-[#B45309] tabular-nums mt-0.5">
                            {poQty > 0
                              ? `PO +${formatQty(poQty, item.unit)} ${item.unit}`
                              : "Di bawah aman"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LAPISAN 4 — GRID 2 KOLOM SEJAJAR (items-stretch) UNTUK INSIGHT AI */}
            {activeMeta && (
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch transition-opacity duration-200 ${
                  isLoading
                    ? "opacity-60 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                {/* KARTU KIRI: STRATEGI OPERASIONAL & DETEKSI TREN */}
                <div className="bg-[#FAF8F3] border border-amber-200/90 rounded-xl p-4 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between gap-2.5">
                    <h4 className="font-display text-xs sm:text-sm font-bold text-black leading-tight">
                      Strategi Operasional &amp; Deteksi Tren
                    </h4>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[#B45309] text-[10px] font-semibold whitespace-nowrap shrink-0">
                      {activeMeta.impactRange}
                    </span>
                  </div>

                  {/* Ringkasan Tren Terdeteksi & Kategori */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-[13px] font-bold text-[#2D452B]">
                        {detectedTrendTitle}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryBadge.className}`}
                      >
                        {categoryBadge.label}
                      </span>
                      {activeMeta.cycleInfo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[#2D452B] text-[10px] font-medium">
                          {activeMeta.cycleInfo.subPhaseLabel}
                        </span>
                      )}
                    </div>

                    {detectionReasonText && (
                      <p className="text-[11px] font-medium text-neutral-800 leading-relaxed">
                        {detectionReasonText}
                      </p>
                    )}

                    {appliedCustomContext && (
                      <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-amber-100/90 border border-amber-300 text-[10px] font-medium text-[#92400E]">
                        <span>Konteks: &ldquo;{appliedCustomContext}&rdquo;</span>
                        <button
                          type="button"
                          onClick={handleClearCustomContext}
                          className="hover:text-red-700 cursor-pointer"
                          title="Hapus konteks"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Narasi Strategi Dapur */}
                  <div className="bg-white rounded-xl border border-amber-200/70 p-3.5 flex-1">
                    <p className="text-xs text-black font-medium leading-relaxed">
                      {geminiInsight?.kitchenStrategy || activeMeta.description}
                    </p>
                  </div>
                </div>

                {/* KARTU KANAN: REKOMENDASI PROMO & BUNDLING MENU */}
                <div className="bg-gradient-to-br from-[#FAF8F3] via-white to-emerald-50/40 border border-[#2D452B]/20 rounded-xl p-4 flex flex-col gap-3 h-full">
                  <h4 className="font-display text-xs sm:text-sm font-bold text-black leading-tight">
                    Rekomendasi Promo &amp; Bundling Menu
                  </h4>

                  <div className="bg-white rounded-xl border border-[#2D452B]/15 p-3.5 flex-1">
                    <p className="text-xs text-black font-medium leading-relaxed">
                      {geminiInsight?.promoSuggestion ||
                        "Optimalkan paket bundling menu utama dengan lauk tambahan untuk menjaga margin dan perputaran bahan harian."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2 flex-wrap text-[11px] text-neutral-800 font-medium">
                    <span>
                      Basis POS:{" "}
                      <strong className="font-semibold text-black tabular-nums">
                        {forecast.summary.totalTransactions7d} transaksi
                      </strong>{" "}
                      ({forecast.summary.totalItemsSold7d} item / 7 hr)
                    </span>
                    <span className="text-[#2D452B] font-semibold tabular-nums">
                      {forecast.summary.needPoCount} perlu PO •{" "}
                      {forecast.summary.safeCount} aman
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TABEL PROYEKSI KONSUMSI BAHAN BAKU */}
            <div
              className={`flex flex-col gap-3 transition-opacity duration-200 ${
                isLoading
                  ? "opacity-60 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-display text-xs sm:text-sm font-bold text-black">
                  Proyeksi Konsumsi &amp; Rekomendasi PO per Bahan Baku
                </h4>

                {forecast.items.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRows((prev) => !prev)}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-400 text-black text-xs font-semibold transition cursor-pointer self-start sm:self-center shrink-0"
                  >
                    {showAllRows
                      ? "Tampilkan Ringkas (6)"
                      : `Lihat Semua (${forecast.items.length} Bahan)`}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-neutral-300 rounded-xl">
                <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-300 text-[10px] font-semibold text-neutral-700 uppercase tracking-wider">
                      <th className="py-3 pl-4 pr-3 whitespace-nowrap">
                        Bahan Baku
                      </th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">
                        Stok Saat Ini
                      </th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">
                        Pakai / Hari
                      </th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">
                        Dampak Tren
                      </th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">
                        Estimasi Habis
                      </th>
                      <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                        Rekomendasi PO
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    {visibleItems.map((item) => {
                      const sku = formatSkuFromId(item.id);
                      const isPositiveImpact = item.trendImpactPercent > 0;
                      const isNegativeImpact = item.trendImpactPercent < 0;
                      const isCriticalRow =
                        item.isUrgentUnder2Days ||
                        item.estimatedDaysLeft < 2 ||
                        item.currentStock <= item.minStock * 0.5;
                      const roundedPo = roundPoQty(
                        item.suggestedPoQty,
                        item.unit
                      );

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isCriticalRow
                              ? "bg-red-50/40 hover:bg-red-50/70"
                              : "hover:bg-amber-50/30"
                          }`}
                        >
                          <td className="py-3 pl-4 pr-3">
                            <div className="font-semibold text-black">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px] font-bold">
                                {sku}
                              </span>
                              <span className="text-[10px] text-neutral-700 font-medium tabular-nums">
                                Safety: {formatQty(item.minStock, item.unit)}{" "}
                                {item.unit}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-semibold text-black whitespace-nowrap tabular-nums">
                            {formatQty(item.currentStock, item.unit)}{" "}
                            <span className="text-neutral-700 font-medium">
                              {item.unit}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap tabular-nums">
                            <div className="font-semibold text-black">
                              {formatQty(item.projectedDailyBurn, item.unit)}{" "}
                              {item.unit}/hr
                            </div>
                            <div className="text-[10px] text-neutral-700 font-medium">
                              {item.burnSource === "sales_7d"
                                ? "Data jual 7 hr"
                                : item.burnSource === "blended"
                                  ? "Blend jual & base"
                                  : "Baseline kampus"}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border tabular-nums ${
                                isPositiveImpact
                                  ? "bg-amber-50 text-[#B45309] border-amber-300"
                                  : isNegativeImpact
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-neutral-100 text-neutral-800 border-neutral-300"
                              }`}
                            >
                              {isPositiveImpact
                                ? `+${item.trendImpactPercent}%`
                                : `${item.trendImpactPercent}%`}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tabular-nums ${
                                item.urgencyLevel === "KRITIS"
                                  ? "bg-red-50 text-[#DC2626] border-red-300"
                                  : item.urgencyLevel === "WASPADA"
                                    ? "bg-amber-50 text-[#B45309] border-amber-300"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                              }`}
                            >
                              ~{item.estimatedDaysLeft.toFixed(1)} Hari
                            </span>
                          </td>

                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap tabular-nums">
                            {roundedPo > 0 ? (
                              <span
                                className={`font-bold ${
                                  isCriticalRow
                                    ? "text-[#DC2626]"
                                    : "text-[#EA8E18]"
                                }`}
                                title={item.poReason}
                              >
                                +{formatQty(roundedPo, item.unit)} {item.unit}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-700">
                                Stok Aman
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
