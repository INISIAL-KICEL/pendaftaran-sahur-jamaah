"use client";

import { useState, useEffect } from "react";
import { BarChart2, Calendar, Users, User, RefreshCw } from "lucide-react";

type Registration = {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  jenis_kelamin: string;
  alamat: string;
  created_at: string;
  is_taken: boolean;
  ip_address: string;
  distance_meters: number;
  added_by?: string;
};

type DailySummary = {
  date: string;
  total: number;
  laki_laki: number;
  perempuan: number;
};

export default function HistoryPage() {
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    const res = await fetch('/api/history?summary=1');
    if (res.ok) setSummary(await res.json());
  };

  const fetchRegistrations = async (date?: string) => {
    setLoading(true);
    const url = date ? `/api/history?date=${date}` : '/api/history';
    const res = await fetch(url);
    if (res.ok) setRegistrations(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
    fetchRegistrations();
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchRegistrations(date || undefined);
  };

  const maxCount = Math.max(...summary.map(s => s.total), 1);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const totalAll = summary.reduce((a, b) => a + b.total, 0);
  const totalLakiAll = summary.reduce((a, b) => a + b.laki_laki, 0);
  const totalPerempuanAll = summary.reduce((a, b) => a + b.perempuan, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Riwayat Data Jamaah</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Arsip pendaftaran sahur dari seluruh hari — termasuk grafik dan statistik kumulatif.</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Semua Jamaah</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalAll}</p>
            <p className="text-xs text-slate-400 mt-1">{summary.length} hari aktif</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Laki-laki</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalLakiAll}</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <User size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Perempuan</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalPerempuanAll}</p>
          </div>
          <div className="p-3 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-lg">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {summary.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-emerald-500" />
            Grafik Pendaftaran Per Hari
          </h2>
          <div className="flex items-end gap-2 overflow-x-auto pb-2 min-h-[160px]">
            {summary.map((day) => {
              const height = Math.max(8, Math.round((day.total / maxCount) * 140));
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 min-w-[52px] group">
                  <div className="text-xs text-slate-700 dark:text-slate-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-white px-1.5 py-0.5 rounded">
                    {day.total}
                  </div>
                  <div
                    className="w-10 bg-emerald-500 dark:bg-emerald-600 rounded-t-md hover:bg-emerald-400 transition-all cursor-default"
                    style={{ height: `${height}px` }}
                    title={`${day.date}: ${day.total} jamaah`}
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight"
                    style={{ maxWidth: '52px', wordBreak: 'break-word' }}>
                    {formatDate(day.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-day summary cards */}
      {summary.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />
            Ringkasan Per Hari
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 pr-4 font-semibold">Tanggal</th>
                  <th className="py-3 pr-4 font-semibold text-center">Total</th>
                  <th className="py-3 pr-4 font-semibold text-center">Laki-laki</th>
                  <th className="py-3 pr-4 font-semibold text-center">Perempuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...summary].reverse().map((day) => (
                  <tr key={day.date} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedDate(day.date); fetchRegistrations(day.date); }}
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{formatDate(day.date)}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">{day.total}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs">{day.laki_laki}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="inline-block bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 px-2 py-0.5 rounded text-xs">{day.perempuan}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtered Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {selectedDate ? `Data Tanggal ${formatDate(selectedDate)}` : "Semua Data Jamaah"}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            {selectedDate && (
              <button
                onClick={() => { setSelectedDate(""); fetchRegistrations(); }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 hover:dark:text-red-400 transition-colors"
              >
                Reset
              </button>
            )}
            <button onClick={() => fetchRegistrations(selectedDate || undefined)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="animate-spin inline-block mb-2" size={20} />
            <p>Memuat data...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            Tidak ada data untuk tanggal yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama & Alamat</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Waktu Daftar</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{reg.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{reg.jenis_kelamin} • {reg.alamat}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{reg.phone_number}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{reg.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {new Date(reg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      {reg.added_by && (
                        <p className="text-indigo-600 dark:text-indigo-400 mt-0.5">Oleh: {reg.added_by}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${reg.is_taken ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {reg.is_taken ? "Diambil" : "Belum"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
