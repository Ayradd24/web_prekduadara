import Sidebar from '@/components/Sidebar';

export default function KasirShiftPage() {
  return (
    <div className="min-h-screen bg-[#FAF6E9] flex p-4 sm:p-6 gap-6 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Management Kasir & Shift</h1>
              <p className="text-xs text-gray-500 mt-1">
                Kelola terminal kasir, jadwal pergantian shift, dan akun kasir
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
          <span className="text-4xl mb-3">👥</span>
          <h2 className="text-base font-bold text-gray-800">Halaman Management Kasir & Shift</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Menu ini sedang dalam pengembangan dan siap dihubungkan dengan data shift kasir.
          </p>
        </div>
      </main>
    </div>
  );
}
