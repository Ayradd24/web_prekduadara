"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Upload,
  RefreshCw,
  RotateCcw,
  Save,
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed,
  Phone,
  Mail,
  Store,
  MapPin,
  Printer,
  Scissors,
  Info,
  ChevronDown,
  User,
  Wallet,
} from "lucide-react";

export default function PengaturanTokoPage() {
  const router = useRouter();
  const { logout } = useAuth();

  // State Profil Gerai (Section A)
  const [namaWarung, setNamaWarung] = useState(
    "Ayam Geprek PrekDuaDara - Cabang"
  );
  const [slogan, setSlogan] = useState(
    "Spesial Ayam Geprek Cobek & Sambal Uleg Asli"
  );
  const [alamat, setAlamat] = useState("samping gerbang um/matos");
  const [whatsapp, setWhatsapp] = useState("0812*********");
  const [emailResto, setEmailResto] = useState("halo.cabang@prekduadara.id");
  const [nib, setNib] = useState("9120003491824");

  // State Jam Operasional (Section B)
  const [jamBukaWeekday, setJamBukaWeekday] = useState("09:00 WIB");
  const [jamTutupWeekday, setJamTutupWeekday] = useState("22:00 WIB");
  const [jamBukaWeekend, setJamBukaWeekend] = useState("09:00 WIB");
  const [jamTutupWeekend, setJamTutupWeekend] = useState("23:00 WIB");
  const [autoCloseKasir, setAutoCloseKasir] = useState(true);
  const [istirahatSore, setIstirahatSore] = useState(false);

  // State Finansial & Pajak (Section C)
  const [pajakPersen, setPajakPersen] = useState("10");
  const [pajakTipe, setPajakTipe] = useState<"termasuk" | "akhir">("akhir");
  const [biayaKemasan, setBiayaKemasan] = useState("2.000");
  const [aturanPembulatan, setAturanPembulatan] = useState(
    "Kelipatan Rp 500 terdekat"
  );

  // State Template Struk (Section D)
  const [cetakLogo, setCetakLogo] = useState(true);
  const [cetakAlamat, setCetakAlamat] = useState(true);
  const [nomorAntrianBesar, setNomorAntrianBesar] = useState(true);
  const [kodeQrisDinamis, setKodeQrisDinamis] = useState(true);
  const [pesanFooter, setPesanFooter] = useState(
    "Matur nuwun sampun mampir! Pedasnya bikin nagih. Follow IG @prekduadara.id"
  );
  const [autoPrintLunas, setAutoPrintLunas] = useState(true);

  // State Metode Pembayaran (Section E)
  const [channelTunai, setChannelTunai] = useState(true);
  const [channelQris, setChannelQris] = useState(true);
  const [channelEdc, setChannelEdc] = useState(true);
  const [channelOjol, setChannelOjol] = useState(true);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleResetDefault = () => {
    setNamaWarung("Ayam Geprek PrekDuaDara - Cabang");
    setSlogan("Spesial Ayam Geprek Cobek & Sambal Uleg Asli");
    setAlamat("samping gerbang um/matos");
    setWhatsapp("0812*********");
    setEmailResto("halo.cabang@prekduadara.id");
    setNib("9120003491824");
    setJamBukaWeekday("09:00 WIB");
    setJamTutupWeekday("22:00 WIB");
    setJamBukaWeekend("09:00 WIB");
    setJamTutupWeekend("23:00 WIB");
    setAutoCloseKasir(true);
    setIstirahatSore(false);
    setPajakPersen("10");
    setPajakTipe("akhir");
    setBiayaKemasan("2.000");
    setAturanPembulatan("Kelipatan Rp 500 terdekat");
    setCetakLogo(true);
    setCetakAlamat(true);
    setNomorAntrianBesar(true);
    setKodeQrisDinamis(true);
    setPesanFooter(
      "Matur nuwun sampun mampir! Pedasnya bikin nagih. Follow IG @prekduadara.id"
    );
    setAutoPrintLunas(true);
    setChannelTunai(true);
    setChannelQris(true);
    setChannelEdc(true);
    setChannelOjol(true);
    showToast("Konfigurasi dikembalikan ke pengaturan awal (Default).");
  };

  const handleSave = () => {
    showToast("Perubahan konfigurasi toko berhasil disimpan!");
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans items-start text-gray-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2D452B] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-lg border border-[#415C3E]">
          {toastMsg}
        </div>
      )}

      {/* 1. SIDEBAR KIRI (KONSISTEN DENGAN SEMUA LAMAN DASHBOARD) */}
      <Sidebar />

      {/* 2. AREA KONTEN UTAMA */}
      <main className="flex-1 flex flex-col gap-5 overflow-x-hidden max-w-full">
        {/* TOP NAVBAR HEADER (BERSIH, KONTRAS, DAN TIDAK TERPOTONG) */}
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
                Pengaturan Staf &amp; Gerai
              </div>
            </div>
          </div>

          {/* Branch Pill & Center Nav Links */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA8E18] shrink-0"></span>
              <span>Cabang Sudirman Utama</span>
              <ChevronDown size={14} className="text-gray-500" />
            </div>

            <nav className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-700">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 hover:text-[#EA8E18] hover:bg-orange-50 rounded-lg transition"
              >
                Dashboard POS
              </Link>
              <Link
                href="/dashboard/transaksi"
                className="px-3 py-1.5 hover:text-[#EA8E18] hover:bg-orange-50 rounded-lg transition"
              >
                Riwayat Transaksi
              </Link>
              <Link
                href="/dashboard/kasir-shift"
                className="px-3 py-1.5 hover:text-[#EA8E18] hover:bg-orange-50 rounded-lg transition"
              >
                Shift &amp; Laci
              </Link>
              <Link
                href="/dashboard/pengaturan"
                className="px-3.5 py-1.5 bg-[#EA8E18] text-white font-bold rounded-lg shadow-sm transition"
              >
                Pengaturan Toko
              </Link>
            </nav>
          </div>

          {/* Right Status & Profile */}
          <div className="flex items-center gap-3">
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

        {/* PAGE HEADER & ACTION BUTTONS */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Store size={20} className="text-[#2D452B]" />
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Pengaturan &amp; Konfigurasi Toko
              </h2>
              <span className="text-xs font-extrabold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-0.5 rounded-md uppercase tracking-wider">
                SUPERVISOR / OWNER ACCESS
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm font-extrabold text-gray-800">
              <MapPin size={15} className="text-[#D97706] shrink-0" />
              <span>Cabang Sudirman Utama (Pusat)</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Atur identitas gerai, jam operasional warung, pajak PB1 &amp;
              servis, template struk kasir, serta integrasi QRIS &amp;
              pembayaran PrekDuaDara.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 transition shadow-2xs cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset ke Default</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2D452B] hover:bg-[#223520] rounded-xl text-xs font-extrabold text-white transition shadow-xs cursor-pointer"
            >
              <Save size={14} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </section>

        {/* A. Profil Gerai & Identitas Restoran */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                A
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Profil Gerai &amp; Identitas Restoran
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Informasi utama yang tercetak pada kepala struk print dan
                  aplikasi pemesanan.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-gray-700 bg-gray-100 px-3.5 py-1.5 rounded-lg border border-gray-200">
              ID: OUT-SUD-001
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Logo Upload Box */}
            <div className="w-full md:w-64 shrink-0 bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center p-2.5 mb-3.5">
                <img
                  src="/logo.png"
                  alt="Logo PrekDuaDara"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 text-center">
                Logo Struk &amp; Layar Display
              </p>
              <p className="text-xs text-gray-500 font-medium text-center mt-1 mb-4">
                Format PNG / SVG (maks. 2MB)
              </p>
              <button
                type="button"
                onClick={() => showToast("Dialog unggah logo siap digunakan.")}
                className="bg-[#0D8A52] hover:bg-[#097343] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Upload size={14} />
                <span>Unggah File Baru</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                  Nama Warung / Outlet
                </label>
                <input
                  type="text"
                  value={namaWarung}
                  onChange={(e) => setNamaWarung(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                  Slogan / Tagline Brand
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                  Alamat Lengkap Gerai
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 bg-white resize-none focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    WhatsApp / CS Warung
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white px-4 py-2.5 gap-2.5 focus-within:border-[#D97706]">
                    <Phone size={15} className="text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                    Email Restoran
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white px-4 py-2.5 gap-2.5 focus-within:border-[#D97706]">
                    <Mail size={15} className="text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={emailResto}
                      onChange={(e) => setEmailResto(e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1.5">
                  Nomor Izin Berusaha (NIB) / NPWP Restoran
                </label>
                <input
                  type="text"
                  value={nib}
                  onChange={(e) => setNib(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* B. Jam Buka & Jadwal Operasional */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                B
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Jam Buka &amp; Jadwal Operasional
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Jadwal buka kasir otomatis dan pembatasan order dapur per
                  hari.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200">
              7 Hari Buka
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            {/* Weekday */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-sm font-extrabold text-gray-900">
                  Senin s/d Jumat (Weekday)
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Aktif
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Jam Buka Kasir
                  </span>
                  <input
                    type="text"
                    value={jamBukaWeekday}
                    onChange={(e) => setJamBukaWeekday(e.target.value)}
                    className="w-full border border-gray-300 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Jam Tutup / Closing
                  </span>
                  <input
                    type="text"
                    value={jamTutupWeekday}
                    onChange={(e) => setJamTutupWeekday(e.target.value)}
                    className="w-full border border-gray-300 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Weekend */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-sm font-extrabold text-gray-900">
                  Sabtu &amp; Minggu (Weekend)
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  Peak Hours
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Jam Buka Kasir
                  </span>
                  <input
                    type="text"
                    value={jamBukaWeekend}
                    onChange={(e) => setJamBukaWeekend(e.target.value)}
                    className="w-full border border-gray-300 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Jam Tutup / Closing
                  </span>
                  <input
                    type="text"
                    value={jamTutupWeekend}
                    onChange={(e) => setJamTutupWeekend(e.target.value)}
                    className="w-full border border-gray-300 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-options row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  Auto-Close Kasir saat Toko Tutup
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                  Laci kasir otomatis terkunci dan minta rekap Z-Report
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoCloseKasir(!autoCloseKasir)}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  autoCloseKasir ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    autoCloseKasir ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={istirahatSore}
                  onChange={(e) => setIstirahatSore(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#0D8A52] rounded cursor-pointer"
                />
                <div>
                  <p className="text-sm font-extrabold text-gray-900">
                    Istirahat / Pergantian Shift Sore
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                    Jeda istirahat sambel &amp; hitung cash drawer (15:00 -
                    15:30 WIB)
                  </p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-black text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shrink-0">
                15:00 - 15:30
              </span>
            </div>
          </div>
        </section>

        {/* C. Finansial, Pajak PB1 & Biaya Pembungkusan */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                C
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Finansial, Pajak PB1 &amp; Biaya Pembungkusan
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Kalkulasi pajak daerah, kemasan box makan pulang, dan rounding
                  kembalian.
                </p>
              </div>
            </div>
            <Wallet size={20} className="text-gray-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Pajak Restoran (PB1) */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <label className="block text-sm font-extrabold text-gray-900 mb-3">
                Pajak Restoran (PB1)
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={pajakPersen}
                  onChange={(e) => setPajakPersen(e.target.value)}
                  className="w-20 border border-gray-300 py-2.5 px-3 rounded-xl text-sm font-extrabold bg-white text-gray-900 text-center"
                />
                <span className="text-sm font-extrabold text-gray-900">%</span>
                <span className="text-xs text-gray-600 font-medium leading-tight">
                  Tarif standar
                  <br />
                  Pemda DKI
                </span>
              </div>

              <div className="space-y-2.5 mt-4">
                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="pajak_tipe"
                    checked={pajakTipe === "termasuk"}
                    onChange={() => setPajakTipe("termasuk")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>Harga menu sudah termasuk pajak</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="pajak_tipe"
                    checked={pajakTipe === "akhir"}
                    onChange={() => setPajakTipe("akhir")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>Pajak ditambahkan di akhir nota</span>
                </label>
              </div>
            </div>

            {/* Col 2: Biaya Kemasan Box / Bungkus */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <div className="flex justify-between items-start gap-2 mb-2">
                <label className="text-sm font-extrabold text-gray-900 leading-snug">
                  Biaya Kemasan Box / Bungkus
                </label>
                <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0">
                  Takeaway
                </span>
              </div>
              <span className="block text-xs text-gray-600 font-medium mb-2">
                Biaya per porsi (paper lunch box)
              </span>
              <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 gap-2">
                <span className="text-sm font-extrabold text-gray-600">Rp</span>
                <input
                  type="text"
                  value={biayaKemasan}
                  onChange={(e) => setBiayaKemasan(e.target.value)}
                  className="w-full text-sm font-bold text-gray-900 outline-none bg-transparent"
                />
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mt-3">
                Otomatis ditambahkan saat kasir memilih mode{" "}
                <strong className="text-gray-900">Bungkus (Takeaway)</strong>{" "}
                atau pesanan ojol.
              </p>
            </div>

            {/* Col 3: Pembulatan Tunai */}
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-extrabold text-gray-900">
                  Pembulatan Tunai
                </label>
                <RefreshCw size={14} className="text-gray-500" />
              </div>
              <span className="block text-xs text-gray-600 font-medium mb-2">
                Aturan pembulatan kembalian kasir
              </span>
              <input
                type="text"
                value={aturanPembulatan}
                onChange={(e) => setAturanPembulatan(e.target.value)}
                className="w-full border border-gray-300 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-900 outline-none"
              />
              <div className="flex items-start gap-2 mt-3 text-xs text-gray-600 font-medium">
                <Info size={14} className="text-gray-500 shrink-0 mt-0.5" />
                <span>Mencegah selisih koin receh saat jam ramai.</span>
              </div>
            </div>
          </div>
        </section>

        {/* D. Template Struk Kasir & Thermal Printer */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                D
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Template Struk Kasir &amp; Thermal Printer
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Kustomisasi header, catatan bawah struk, dan preview cetak
                  kertas kasir.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-gray-800 bg-gray-100 px-3.5 py-1.5 rounded-lg border border-gray-200">
              Lebar Kertas: 80mm
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Config Controls */}
            <div className="flex-1 space-y-5 w-full">
              <div>
                <label className="block text-sm font-extrabold text-gray-900 mb-3">
                  Pilihan Elemen Header Nota
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs sm:text-sm text-gray-800 cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={cetakLogo}
                      onChange={(e) => setCetakLogo(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-bold">Cetak Logo PrekDuaDara</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs sm:text-sm text-gray-800 cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={cetakAlamat}
                      onChange={(e) => setCetakAlamat(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-bold">
                      Cetak Alamat &amp; WhatsApp
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs sm:text-sm text-gray-800 cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={nomorAntrianBesar}
                      onChange={(e) => setNomorAntrianBesar(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-bold">
                      Nomor Antrian Besar (Dapur)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs sm:text-sm text-gray-800 cursor-pointer hover:bg-gray-100/70 transition">
                    <input
                      type="checkbox"
                      checked={kodeQrisDinamis}
                      onChange={(e) => setKodeQrisDinamis(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-bold">Kode QRIS Dinamis</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-gray-900 mb-2">
                  Pesan Footer Struk (Catatan Penutup)
                </label>
                <textarea
                  rows={2}
                  value={pesanFooter}
                  onChange={(e) => setPesanFooter(e.target.value)}
                  className="w-full border border-gray-300 p-3.5 rounded-xl text-sm font-semibold text-gray-900 bg-white resize-none focus:outline-none focus:border-[#D97706]"
                />
                <p className="text-xs text-gray-600 font-medium mt-1.5">
                  Tercetak di bagian paling bawah struk setelah total
                  pembayaran.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">
                    Auto-Print Setelah Pembayaran Lunas
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    Langsung mengirim perintah cetak tanpa konfirmasi kasir
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPrintLunas(!autoPrintLunas)}
                  className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    autoPrintLunas ? "bg-[#0D8A52]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      autoPrintLunas ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    showToast("Mengirim sinyal Tes Cetak Thermal...")
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-extrabold text-gray-800 hover:text-black transition cursor-pointer shadow-2xs"
                >
                  <Printer size={14} />
                  <span>Tes Cetak Thermal</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast("Menguji pemotong kertas (Auto-Cutter)...")
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-extrabold text-gray-800 hover:text-black transition cursor-pointer shadow-2xs"
                >
                  <Scissors size={14} />
                  <span>Uji Auto-Cutter</span>
                </button>
              </div>
            </div>

            {/* Right Receipt Preview */}
            <div className="w-full lg:w-80 shrink-0 bg-[#F8F9FA] border border-gray-200 rounded-2xl p-5 flex flex-col items-center">
              <p className="text-xs font-extrabold text-center text-gray-600 tracking-wider uppercase mb-3">
                SIMULASI CETAK KERTAS (80MM)
              </p>
              <div
                className="w-64 bg-white border border-gray-300 shadow-md p-5 pb-7 relative flex flex-col font-mono text-[10.5px] text-gray-900 rounded-t-md"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 6px 100%, #F8F9FA 5px, transparent 6px)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "bottom",
                  backgroundRepeat: "repeat-x",
                }}
              >
                <div className="text-center mb-2.5">
                  {cetakLogo && (
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-7 h-7 rounded-full mx-auto mb-1 object-contain"
                    />
                  )}
                  <h4 className="font-bold text-xs tracking-wide">
                    PREKDUADARA
                  </h4>
                  {cetakAlamat && (
                    <>
                      <p className="text-[9.5px] text-gray-600">
                        Cabang Sudirman Utama
                      </p>
                      <p className="text-[9.5px] text-gray-600">
                        Jl. Jend. Sudirman No. 45
                      </p>
                      <p className="text-[9.5px] text-gray-600">
                        WA: 0812-8899-7766
                      </p>
                    </>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 my-2"></div>

                <div className="flex justify-between font-bold text-[10px]">
                  <span>KASIR: RIAN</span>
                  <span>MEJA: 04</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-gray-600">
                  <span>#INV-2605-008</span>
                  <span>14:22 WIB</span>
                </div>

                <div className="border-t border-dashed border-gray-300 my-2"></div>

                <div className="mb-1.5">
                  <div className="flex justify-between font-bold">
                    <span>2x Paket Geprek Ekstra</span>
                    <span>38.000</span>
                  </div>
                  <p className="text-[9px] text-gray-500">
                    Lvl 5 • Sambal Korek
                  </p>
                </div>

                <div className="flex justify-between mb-1.5 font-bold">
                  <span>1x Kulit Crispy Ori</span>
                  <span>12.000</span>
                </div>

                <div className="flex justify-between mb-1 font-bold">
                  <span>2x Es Teh Manis Jumbo</span>
                  <span>10.000</span>
                </div>

                <div className="border-t border-dashed border-gray-300 my-2"></div>

                <div className="flex justify-between text-[10px] text-gray-700 mb-0.5">
                  <span>Subtotal</span>
                  <span>60.000</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700 mb-1">
                  <span>PB1 ({pajakPersen}%)</span>
                  <span>6.000</span>
                </div>

                <div className="flex justify-between font-extrabold text-xs mt-1 pt-1 border-t border-gray-300">
                  <span>TOTAL BAYAR</span>
                  <span>Rp 66.000</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-gray-600 mt-0.5">
                  <span>QRIS (ShopeePay)</span>
                  <span>66.000</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-gray-600">
                  <span>Kembali</span>
                  <span>0</span>
                </div>

                <div className="border-t border-dashed border-gray-300 my-2.5"></div>

                <div className="text-center text-[9px] text-gray-600 leading-snug">
                  <p>{pesanFooter}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. Metode Pembayaran & Integrasi EDC/QRIS */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                E
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Metode Pembayaran &amp; Integrasi EDC/QRIS
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Konfigurasi channel pembayaran aktif yang muncul di layar
                  kasir checkout.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200">
              Semua Channel Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <Banknote size={20} className="text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm text-gray-900">
                    Tunai / Uang Cash
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Laci kasir otomatis terbuka saat bayar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChannelTunai(!channelTunai)}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  channelTunai ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    channelTunai ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <QrCode size={20} className="text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm text-gray-900">
                    QRIS Dinamis (BCA / ShopeePay)
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Auto-detect nominal &amp; notifikasi instan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChannelQris(!channelQris)}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  channelQris ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    channelQris ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <CreditCard
                  size={20}
                  className="text-[#D97706] mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-extrabold text-sm text-gray-900">
                    Mesin EDC Debit &amp; Kredit
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    BCA &amp; Mandiri Link (Input No. Approval)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChannelEdc(!channelEdc)}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  channelEdc ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    channelEdc ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <UtensilsCrossed
                  size={20}
                  className="text-rose-600 mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-extrabold text-sm text-gray-900">
                    GrabFood &amp; GoFood Merchant
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Sinkronisasi pesanan ojol langsung ke dapur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChannelOjol(!channelOjol)}
                className={`w-11 h-6 inline-flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  channelOjol ? "bg-[#0D8A52]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    channelOjol ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* F. Perangkat Keras Kasir & Tata Letak Meja */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-gray-900 font-black text-sm flex items-center justify-center shrink-0">
                F
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Perangkat Keras Kasir &amp; Tata Letak Meja
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                  Koneksi printer kasir bluetooth/LAN, kitchen display, dan
                  total meja dine-in.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast("Memindai ulang perangkat di jaringan lokal...")
              }
              className="text-xs font-extrabold text-gray-800 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-300 px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Pindai Ulang Perangkat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <p className="text-xs font-bold text-gray-500 mb-1">
                Printer Kasir Utama
              </p>
              <p className="font-extrabold text-sm text-gray-900">
                Epson TM-T82X (LAN)
              </p>
              <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                IP: 192.168.1.201 • Port 9100
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <p className="text-xs font-bold text-gray-500 mb-1">
                Printer Dapur / Cobek
              </p>
              <p className="font-extrabold text-sm text-gray-900">
                Thermal Kitchen 80mm
              </p>
              <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                IP: 192.168.1.202 • Auto-Buzzer
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <p className="text-xs font-bold text-gray-500 mb-1">
                Kapasitas Meja Dine-In
              </p>
              <p className="font-extrabold text-sm text-gray-900">24 Meja</p>
              <p className="text-xs font-medium text-gray-600 mt-1.5">
                Zona Dalam AC &amp; Area Luar Terbuka
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM SAVE BAR */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-gray-700">
            <Info size={18} className="text-[#2D452B] shrink-0" />
            <span>
              Perubahan konfigurasi tersimpan otomatis di perangkat lokal
              server.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-white bg-[#2D452B] hover:bg-[#223520] px-6 py-3 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Save size={16} />
            <span>Simpan Konfigurasi Lengkap</span>
          </button>
        </section>

        {/* LOG OUT BUTTON */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-sm tracking-wide py-3.5 px-16 rounded-xl shadow-sm transition cursor-pointer"
          >
            LOG OUT
          </button>
        </div>

        {/* FOOTER SYSTEM */}
        <footer className="pt-3 pb-4 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 font-medium gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[#D97706]">
              PrekDuaDara POS v2.4
            </span>
            <span>•</span>
            <span>Terminal Counter #01</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Cloud Database Terhubung
            </span>
          </div>
          <div>
            &copy; 2024 PrekDuaDara Quick-Service Culinary. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
