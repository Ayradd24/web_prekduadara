"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";

type MenuCategory = "Paket Menu" | "Tambahan";
type CategoryFilterTab = "Semua Menu" | MenuCategory;

interface ProductItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  created_at?: string;
}

const SAMBAL_OPTIONS = [
  {
    name: "Sambal Bawang",
    badge: "bg-red-50 text-[#DC2626] border-red-200",
    dot: "bg-[#DC2626]",
  },
  {
    name: "Sambal Matah",
    badge: "bg-amber-50 text-[#B45309] border-amber-200",
    dot: "bg-[#D97706]",
  },
  {
    name: "Sambal Tomat",
    badge: "bg-orange-50 text-[#C2410C] border-orange-200",
    dot: "bg-[#EA580C]",
  },
  {
    name: "Sambal Ijo",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-600",
  },
] as const;

const ITEMS_PER_PAGE = 10;

const formatRupiah = (val: number) =>
  "Rp " + Math.round(val).toLocaleString("id-ID");

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Menyelesaikan URL gambar menu untuk web:
 * - URL penuh (http/https) atau Data URI base64 dikembalikan apa adanya.
 * - Asset statis lokal (assets/images/...) dipetakan ke root public web (/assets/images/...).
 * - Uploads dari backend (/uploads/...) diarahkan ke API_BASE_URL.
 */
function resolveImageUrl(img?: string | null): string {
  if (!img || !img.trim()) return "";
  const trimmed = img.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("assets/")) {
    return `/${trimmed}`;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${API_BASE_URL}/${trimmed}`;
  }
  return trimmed;
}

/**
 * Mengompresi file gambar menggunakan browser HTML5 Canvas:
 * - Resize ke max 600 x 600 px (aspek rasio terjaga)
 * - Format WebP (kualitas 0.82) dengan fallback ke JPEG
 * - Menghasilkan string Data URL base64 yang sangat ringan (~20-50 KB)
 */
function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<{ dataUrl: string; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context tidak didukung"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const base64Content = dataUrl.split(",")[1] || "";
        const compressedSize = Math.round((base64Content.length * 3) / 4);

        resolve({ dataUrl, compressedSize });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ManajemenMenuPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilterTab>("Semua Menu");
  const [activePage, setActivePage] = useState(1);

  // Form Tambah / Edit Menu (Kolom Kanan)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<MenuCategory>("Paket Menu");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    originalSize: string;
    compressedSize: string;
    ratio: string;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification dengan cleanup timer
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: "success" | "warning" | "info";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "warning" | "info" = "success") => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMsg({ text, type });
      toastTimerRef.current = setTimeout(() => {
        setToastMsg(null);
      }, 3200);
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

  // 1. FETCH DAFTAR MENU DARI BACKEND (GET /api/products)
  const loadProductsFromDB = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        const mapped: ProductItem[] = json.data.map(
          (item: {
            id: number | string;
            name?: string;
            description?: string | null;
            price?: number | string;
            category?: string;
            image?: string | null;
            created_at?: string;
          }) => ({
            id: Number(item.id),
            name: String(item.name || ""),
            description: String(item.description || ""),
            price: Number(item.price) || 0,
            category: String(item.category || "Paket Menu"),
            image: item.image ? String(item.image) : "",
            created_at: item.created_at,
          })
        );
        setProducts(mapped);
      }
    } catch {
      // ignore offline error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProductsFromDB();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProductsFromDB]);

  // Handler saat user memilih file gambar (klik atau drag & drop)
  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast(
        "File yang dipilih harus berupa gambar (JPG, PNG, WebP)!",
        "warning"
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast("Ukuran file gambar asli maksimal 15 MB!", "warning");
      return;
    }

    setIsCompressing(true);
    try {
      const { dataUrl, compressedSize } = await compressImage(
        file,
        600,
        600,
        0.82
      );
      const originalStr = formatBytes(file.size);
      const compressedStr = formatBytes(compressedSize);
      const savedPct = Math.max(
        0,
        Math.round(((file.size - compressedSize) / file.size) * 100)
      );

      setFormImage(dataUrl);
      setImagePreview(dataUrl);
      setImageMeta({
        originalSize: originalStr,
        compressedSize: compressedStr,
        ratio: `-${savedPct}%`,
      });

      showToast(
        `Gambar otomatis dikompresi: ${originalStr} ➔ ${compressedStr} (${savedPct}% lebih hemat)`,
        "success"
      );
    } catch (err) {
      console.error("Kompresi gambar gagal:", err);
      showToast("Gagal memproses dan mengompresi gambar!", "warning");
    } finally {
      setIsCompressing(false);
    }
  };

  // Reset form ke mode Tambah Menu Baru
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setFormName("");
    setFormCategory("Paket Menu");
    setFormPrice("");
    setFormDescription("");
    setFormImage("");
    setImagePreview(null);
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Mulai Edit Menu
  const handleStartEdit = (item: ProductItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCategory(
      item.category.toLowerCase() === "tambahan" ? "Tambahan" : "Paket Menu"
    );
    setFormPrice(String(item.price));
    setFormDescription(item.description || "");
    setFormImage(item.image || "");
    setImagePreview(item.image ? resolveImageUrl(item.image) : null);
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const formEl = document.getElementById("form-menu-cepat");
    formEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => nameInputRef.current?.focus(), 120);
    showToast(`Mengedit menu "${item.name}" (#${item.id}).`, "info");
  };

  // Simpan Menu Baru (POST /api/products) atau Update Menu (PUT /api/products/:id)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const numericPrice = Number(formPrice.replace(/\D/g, ""));
    const cleanDesc = formDescription.trim();

    if (!cleanName) {
      showToast("Nama menu wajib diisi!", "warning");
      return;
    }
    if (!formPrice.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      showToast("Harga menu harus berupa angka yang valid!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = editingId !== null;
      const endpoint = isEdit
        ? `${API_BASE_URL}/api/products/${editingId}`
        : `${API_BASE_URL}/api/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: cleanName,
          category: formCategory,
          price: numericPrice,
          description: cleanDesc,
          image: formImage,
        }),
      });

      const json = await res.json();

      if (res.status === 401 || res.status === 403) {
        showToast(
          json.message ||
            "Sesi login / token JWT tidak valid. Silakan login ulang.",
          "warning"
        );
        return;
      }

      if (res.ok && json.success) {
        await loadProductsFromDB(true);
        handleResetForm();
        showToast(
          isEdit
            ? `Menu "${cleanName}" berhasil diperbarui di database!`
            : `Menu baru "${cleanName}" berhasil ditambahkan ke database!`,
          "success"
        );
      } else {
        showToast(json.message || "Gagal menyimpan data menu ke server!", "warning");
      }
    } catch {
      showToast(
        "Tidak dapat terhubung ke server backend (port 5000).",
        "warning"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Konfirmasi Hapus Menu (DELETE /api/products/:id)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      const json = await res.json();

      if (res.status === 401 || res.status === 403) {
        showToast(
          json.message ||
            "Sesi login / token JWT tidak valid. Silakan login ulang.",
          "warning"
        );
        return;
      }

      if (res.ok && json.success) {
        if (editingId === deleteTarget.id) {
          handleResetForm();
        }
        await loadProductsFromDB(true);
        showToast(
          `Menu "${deleteTarget.name}" berhasil dihapus dari database!`,
          "success"
        );
        setDeleteTarget(null);
      } else {
        showToast(
          json.message || "Gagal menghapus menu dari database!",
          "warning"
        );
      }
    } catch {
      showToast("Gagal menghubungi server untuk menghapus menu!", "warning");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const totalMenus = products.length;
    const paketCount = products.filter(
      (p) => p.category.toLowerCase() === "paket menu"
    ).length;
    const tambahanCount = products.filter(
      (p) => p.category.toLowerCase() === "tambahan"
    ).length;
    const avgPrice =
      totalMenus > 0
        ? products.reduce((sum, p) => sum + p.price, 0) / totalMenus
        : 0;

    return { totalMenus, paketCount, tambahanCount, avgPrice };
  }, [products]);

  // Filter daftar menu
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const matchSearch =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchCat =
        activeCategory === "Semua Menu" ||
        item.category.toLowerCase() === activeCategory.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [products, searchQuery, activeCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(activePage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

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

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveCategory("Semua Menu");
    setActivePage(1);
    showToast("Filter daftar menu telah direset.", "info");
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-white border transition-all ${
            toastMsg.type === "warning"
              ? "bg-amber-600 border-amber-500"
              : toastMsg.type === "info"
                ? "bg-slate-800 border-slate-700"
                : "bg-[#2D452B] border-[#415C3E]"
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

      {/* Modal Konfirmasi Hapus Menu */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2D452B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-[#F3A712]" />
                <h3 className="font-display text-sm sm:text-base font-bold">
                  Hapus Menu dari Database?
                </h3>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs sm:text-sm text-neutral-950 leading-relaxed">
                Anda akan menghapus menu{" "}
                <strong className="text-black font-semibold">
                  {deleteTarget.name}
                </strong>{" "}
                ({formatRupiah(deleteTarget.price)}) dari daftar produk POS.
              </p>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                Tindakan ini akan menghapus data menu secara permanen dari tabel{" "}
                <code className="font-mono font-bold">products</code> di
                MariaDB.
              </div>
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-gray-100 text-xs font-semibold text-black transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Menu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR NAVIGASI */}
      <div className="shrink-0">
        <Sidebar />
      </div>

      {/* 2. KONTEN UTAMA MANAJEMEN MENU */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* TOP HEADER BAR (SERAGAM DENGAN SELURUH HALAMAN DASHBOARD) */}
        <header className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
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
                Manajemen Menu &amp; Daftar Produk POS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <div className="h-9 flex items-center gap-2 px-3.5 bg-[#E8F8F0] border border-[#A7F3D0] text-[#047857] text-xs font-semibold rounded-full shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
              <span>ONLINE SYNC</span>
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200 shrink-0">
              <div className="text-right">
                <div className="text-xs font-semibold text-black leading-tight whitespace-nowrap">
                  {user?.name || "Admin"}
                </div>
                <div className="text-[11px] text-[#EA8E18] font-medium leading-tight mt-0.5 whitespace-nowrap">
                  {user?.role || "Owner"}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8E18] to-[#FBBF24] text-white font-semibold text-xs flex items-center justify-center shadow-xs shrink-0">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE & ACTION SECTION */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="font-display text-base sm:text-lg font-bold text-black tracking-tight">
            Manajemen Menu &amp; Katalog Produk
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={() => {
                loadProductsFromDB();
                showToast("Menyegarkan daftar menu dari database...", "info");
              }}
              className="px-3.5 py-2 bg-white border border-neutral-400 hover:bg-gray-50 rounded-xl text-xs font-semibold text-black transition cursor-pointer whitespace-nowrap"
            >
              {isLoading ? "Memuat..." : "Segarkan Data"}
            </button>

            <button
              type="button"
              onClick={() => {
                handleResetForm();
                const el = document.getElementById("form-menu-cepat");
                el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                setTimeout(() => nameInputRef.current?.focus(), 120);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F3A712] hover:bg-[#df980e] text-black font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <PlusCircle size={14} />
              <span>+ Tambah Menu Baru</span>
            </button>
          </div>
        </section>

        {/* 4 SUMMARY KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: TOTAL MENU */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
              TOTAL MENU AKTIF
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.totalMenus}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Produk
              </span>
            </div>
          </div>

          {/* Card 2: PAKET MENU */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
              PAKET MENU UTAMA
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.paketCount}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Paket
              </span>
            </div>
          </div>

          {/* Card 3: MENU TAMBAHAN */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
              MENU TAMBAHAN
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-black whitespace-nowrap tabular-nums">
                {kpiStats.tambahanCount}
              </span>
              <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                Add-on
              </span>
            </div>
          </div>

          {/* Card 4: RATA-RATA HARGA */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
              RATA-RATA HARGA
            </p>
            <div className="mt-2">
              <span className="text-lg xl:text-xl font-extrabold text-black whitespace-nowrap tabular-nums">
                {formatRupiah(kpiStats.avgPrice)}
              </span>
            </div>
          </div>
        </section>

        {/* 2-COLUMN MAIN CONTENT: LEFT (DAFTAR MENU + INFO SAMBAL) & RIGHT (FORM TAMBAH / EDIT MENU) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN (8 COLS) */}
          <div className="xl:col-span-8 flex flex-col gap-5 h-full">
            {/* INFO CARD RINGKAS: 4 PILIHAN SAMBAL SAAT ORDER */}
            <div className="bg-[#FAF8F3] rounded-2xl p-4 shadow-sm border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <h3 className="font-display text-xs sm:text-sm font-bold text-black">
                4 Pilihan Sambal
              </h3>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {SAMBAL_OPTIONS.map((sambal) => (
                  <span
                    key={sambal.name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${sambal.badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${sambal.dot}`}
                    />
                    <span>{sambal.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* KARTU TABEL DAFTAR MENU */}
            <div className="flex-1 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4 flex-1">
              {/* SEARCH & RESET */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari nama menu atau deskripsi..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActivePage(1);
                    }}
                    className="w-full pl-9 pr-8 py-2 border border-neutral-300 rounded-xl text-xs font-semibold text-black placeholder:text-neutral-400 focus:outline-none focus:border-[#D97706] bg-gray-50/50"
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

                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  className="px-3 py-2 border border-neutral-400 rounded-xl text-black hover:bg-gray-100 transition cursor-pointer text-xs font-semibold shrink-0"
                >
                  Reset
                </button>
              </div>

              {/* CATEGORY TABS */}
              <div className="flex items-center gap-1.5 flex-wrap pb-2 text-[11px] font-semibold border-b border-neutral-200">
                {(
                  ["Semua Menu", "Paket Menu", "Tambahan"] as const
                ).map((cat) => {
                  const count =
                    cat === "Semua Menu"
                      ? products.length
                      : products.filter(
                          (p) => p.category.toLowerCase() === cat.toLowerCase()
                        ).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setActivePage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
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

              {/* TABEL DAFTAR MENU */}
              <div className="overflow-x-auto flex-1">
                <table className="table-fixed w-full min-w-[640px] text-left border-collapse text-xs">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[31%]" />
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-y border-neutral-300 bg-gray-50/80 text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      <th className="py-3 pl-4 pr-3 text-left whitespace-nowrap">
                        NAMA MENU
                      </th>
                      <th className="py-3 px-3 text-left whitespace-nowrap">
                        DESKRIPSI
                      </th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">
                        KATEGORI
                      </th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">
                        HARGA
                      </th>
                      <th className="py-3 pl-3 pr-4 text-center whitespace-nowrap">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-neutral-800 font-medium"
                        >
                          Memuat daftar menu dari database MariaDB...
                        </td>
                      </tr>
                    ) : paginatedProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-neutral-800 font-medium"
                        >
                          Tidak ada menu yang sesuai dengan pencarian atau
                          filter kategori.
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((item) => {
                        const isEditingRow = editingId === item.id;
                        const isPaket =
                          item.category.toLowerCase() === "paket menu";
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              isEditingRow
                                ? "bg-amber-50/70"
                                : "hover:bg-amber-50/30"
                            }`}
                          >
                            {/* NAMA MENU */}
                            <td className="py-3.5 pl-4 pr-3 align-middle whitespace-normal break-words">
                              <div className="flex items-start gap-2.5 min-w-0">
                                {item.image ? (
                                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-200 bg-amber-50 shrink-0 mt-0.5 shadow-2xs relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={resolveImageUrl(item.image)}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = "none";
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.classList.remove("hidden");
                                      }}
                                    />
                                    <div className="hidden w-full h-full items-center justify-center text-[#D97706] bg-[#FAF8F3]">
                                      <UtensilsCrossed size={14} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-[#FAF8F3] border border-amber-200 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                                    <UtensilsCrossed size={14} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-black text-xs sm:text-[13px] leading-snug break-words">
                                    {item.name}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono inline-block px-1.5 py-0.5 rounded bg-gray-100 border border-neutral-200 text-neutral-700 font-bold text-[10px]">
                                      ID #{item.id}
                                    </span>
                                    {isEditingRow && (
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-[#B45309] font-semibold text-[10px]">
                                        Sedang Diedit
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* DESKRIPSI */}
                            <td className="py-3.5 px-3 align-middle text-neutral-800 font-medium whitespace-normal break-words leading-relaxed">
                              {item.description ? (
                                item.description
                              ) : (
                                <span className="text-neutral-700 italic">
                                  Tidak ada deskripsi
                                </span>
                              )}
                            </td>

                            {/* KATEGORI */}
                            <td className="py-3.5 px-3 align-middle text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                                  isPaket
                                    ? "bg-emerald-50 text-[#2D452B] border-emerald-300"
                                    : "bg-amber-50 text-[#B45309] border-amber-300"
                                }`}
                              >
                                {item.category}
                              </span>
                            </td>

                            {/* HARGA */}
                            <td className="py-3.5 px-3 align-middle text-right font-semibold text-black whitespace-nowrap tabular-nums text-xs sm:text-[13px]">
                              {formatRupiah(item.price)}
                            </td>

                            {/* AKSI */}
                            <td className="py-3.5 pl-3 pr-4 align-middle whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  title="Edit Menu"
                                  className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#B45309] flex items-center justify-center transition cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(item)}
                                  title="Hapus Menu"
                                  className="w-7 h-7 rounded-lg border border-neutral-300 hover:border-red-400 hover:bg-red-50 text-black hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </div>

              {/* PAGINATION & SUMMARY */}
              <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-800 font-medium">
                <div>
                  Menampilkan{" "}
                  <strong className="text-black font-semibold">
                    {paginatedProducts.length} dari {filteredProducts.length}
                  </strong>{" "}
                  menu produk POS
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
          </div>

          {/* RIGHT COLUMN: FORM TAMBAH / EDIT MENU (4 COLS) */}
          <div
            id="form-menu-cepat"
            className="xl:col-span-4 flex flex-col gap-5"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex flex-col gap-4">
              <div className="pb-3.5 border-b border-neutral-200">
                <h3 className="font-display font-bold text-base text-black">
                  {editingId !== null
                    ? `Edit Menu #${editingId}`
                    : "Tambah Menu Baru"}
                </h3>
              </div>

              <form onSubmit={handleSaveMenu} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Nama Menu <span className="text-red-600">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="Contoh: Ayam Geprek Mozarella + Es Teh"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 bg-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Kategori <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as MenuCategory)
                    }
                    className="w-full border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black bg-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    <option value="Paket Menu">Paket Menu</option>
                    <option value="Tambahan">Tambahan</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-black">
                      Harga Jual <span className="text-red-600">*</span>
                    </label>
                    {formPrice && !Number.isNaN(Number(formPrice)) && (
                      <span className="text-[11px] font-semibold text-[#2D452B] tabular-nums">
                        {formatRupiah(Number(formPrice))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-white px-3.5 py-2.5 focus-within:border-[#D97706]">
                    <span className="text-xs font-semibold text-neutral-800 mr-2 shrink-0">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      required
                      placeholder="18000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full text-xs sm:text-sm font-semibold text-black outline-none bg-transparent tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Deskripsi Menu
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Nasi hangat + Ayam Geprek Bakar + Es Teh Manis + Pilihan Sambal"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-black placeholder:text-neutral-400 bg-white resize-none focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                {/* UPLOAD FOTO MENU MAKANAN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                      <span>Foto Menu Makanan</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Auto Kompres
                      </span>
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImage("");
                          setImagePreview(null);
                          setImageMeta(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Hapus Foto
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileChange(file);
                    }}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative border-2 border-dashed border-amber-300 rounded-2xl p-3 bg-amber-50/40 flex items-center gap-3">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-amber-200 bg-white shrink-0 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview Menu"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2D452B]">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Foto Siap Disimpan</span>
                        </div>
                        {imageMeta ? (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                              {imageMeta.compressedSize} ({imageMeta.ratio})
                            </span>
                            <span className="text-[10px] text-neutral-700 font-medium line-through">
                              {imageMeta.originalSize}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-neutral-700 font-medium mt-0.5">
                            Foto aktif di database POS
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 text-[#D97706] border border-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <UploadCloud size={12} />
                          Ganti Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageFileChange(file);
                      }}
                      className="border-2 border-dashed border-neutral-300 hover:border-[#D97706] hover:bg-amber-50/20 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 bg-gray-50/50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center">
                        <UploadCloud size={20} />
                      </div>
                      <div className="text-xs font-semibold text-black">
                        {isCompressing ? (
                          <span className="text-[#D97706] flex items-center gap-1.5">
                            <RefreshCw size={13} className="animate-spin" /> Mengompresi Foto...
                          </span>
                        ) : (
                          "Klik atau Tarik Foto Menu ke Sini"
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-700 font-medium">
                        JPG, PNG, atau WebP (maks. 600px)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  {editingId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetForm();
                        showToast("Mode edit dibatalkan.", "info");
                      }}
                      className="px-4 py-3 border border-neutral-400 bg-white hover:bg-gray-50 text-black font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shrink-0"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#F3A712] hover:bg-[#df980e] disabled:opacity-60 text-black font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editingId !== null
                        ? "Simpan Perubahan Menu"
                        : "Simpan Menu Baru"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
