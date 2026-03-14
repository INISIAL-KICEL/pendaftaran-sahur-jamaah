"use client";

import RegistrationTable from "@/components/RegistrationTable";
import { Download } from "lucide-react";

export default function DashboardPage() {
  const handleDownload = () => {
    window.location.href = '/api/export';
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Pantau statistik jamaah hari ini dan kelola waktu pengambilan sahur.</p>
        </div>
        <button
          onClick={handleDownload}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Download size={18} />
          Unduh Excel
        </button>
      </div>

      <RegistrationTable />
    </div>
  );
}
