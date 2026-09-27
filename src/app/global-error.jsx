'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="id">
      <body className="bg-[#0b1120] text-white flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-bold mb-3 text-red-400">Terjadi Kesalahan Aplikasi</h2>
          <p className="text-xs text-slate-400 mb-4">{error?.message || 'Silakan muat ulang halaman.'}</p>
          <button
            onClick={() => reset && reset()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold text-xs transition"
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
