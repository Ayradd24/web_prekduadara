'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Gagal terhubung ke server backend! Pastikan backend sudah menyala.');
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#F7B733] to-[#FC4A1A] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* Kartu Login (Sisi Kiri) */}
        <div className="bg-[#FAF9F6] rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-xl flex flex-col items-center text-center mx-auto md:mx-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">PrekDuaDara</h1>
          
          <div className="w-36 h-36 relative mb-6">
            <Image
              src="/logo.png" 
              alt="Logo PrekDuaDara"
              fill
              className="object-contain"
              priority
            />
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input
                type="email"
                placeholder="Masukkan Email Admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1E3F20] text-sm text-gray-800"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1E3F20] text-sm text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1E3F20] hover:bg-[#152e17] text-white font-semibold py-3 rounded-lg transition duration-200 tracking-wider text-sm shadow-md"
            >
              LOGIN
            </button>
          </form>

          <div className="flex items-center my-6 w-full">
            <div className="flex-grow border-t border-[#1E3F20]"></div>
            <span className="px-3 text-xs text-[#1E3F20] font-medium">Lupa sandi?</span>
            <div className="flex-grow border-t border-[#1E3F20]"></div>
          </div>
        </div>

        {/* Informasi Panel Admin (Sisi Kanan) */}
        <div className="text-white max-w-md space-y-4 text-center md:text-left mx-auto md:mx-0">
          <span className="inline-block bg-[#1E3F20] text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wide uppercase">
            PANEL ADMIN
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900">
            Pantau penjualan toko dalam satu layar.
          </h2>
          
          <p className="text-sm text-gray-900 font-medium leading-relaxed">
            Tinggalkan buku tulis. Semua catatan pesanan dari kasir langsung terkumpul rapi dan siap dibaca.
          </p>

          <ul className="space-y-3 pt-4 text-xs font-semibold text-gray-900">
            <li className="flex items-center gap-3 bg-white/40 backdrop-blur-sm p-2.5 rounded-xl">
              <span className="bg-amber-100 p-1.5 rounded-lg text-lg">📊</span>
              Dashboard penjualan harian
            </li>
            <li className="flex items-center gap-3 bg-white/40 backdrop-blur-sm p-2.5 rounded-xl">
              <span className="bg-amber-100 p-1.5 rounded-lg text-lg">📋</span>
              Log transaksi dari kasir
            </li>
            <li className="flex items-center gap-3 bg-white/40 backdrop-blur-sm p-2.5 rounded-xl">
              <span className="bg-amber-100 p-1.5 rounded-lg text-lg">🕒</span>
              Data historis untuk evaluasi
            </li>
          </ul>
        </div>

      </div>
    </main>
  );
}