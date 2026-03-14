"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, Circle, RefreshCw, Users, User, Trash2, Edit2, Save, X } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

type Registration = {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  is_taken: boolean;
  created_at: string;
  ip_address: string;
  distance_meters: number;
  jenis_kelamin: string;
  alamat: string;
  added_by?: string;
};

export default function RegistrationTable({ isSuperAdmin }: { isSuperAdmin?: boolean } = {}) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "taken" | "pending">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: "", name: "" });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "danger" | "info" }>({ isOpen: false, title: "", message: "", type: "info" });

  const [pageSize, setPageSize] = useState<10 | 50 | 100>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      if (res.ok) setRegistrations(data);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
    // In our SQLite version we dont have real-time sockets yet
    // We will refresh periodically for this demo instead
    const interval = setInterval(() => {
        fetchRegistrations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setRegistrations((prev) => 
      prev.map(reg => reg.id === id ? { ...reg, is_taken: !currentStatus } : reg)
    );
    
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_taken: !currentStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
    } catch(err) {
      // Revert if error
      setRegistrations((prev) => 
        prev.map(reg => reg.id === id ? { ...reg, is_taken: currentStatus } : reg)
      );
      console.error(err);
    }
  };

  const handleEdit = (reg: Registration) => {
    setEditingId(reg.id);
    setEditForm({ name: reg.name, phone_number: reg.phone_number, email: reg.email, jenis_kelamin: reg.jenis_kelamin, alamat: reg.alamat });
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlertModal({ isOpen: true, title: "Berhasil", message: "Data jamaah berhasil dihapus.", type: "success" });
      fetchRegistrations();
    } catch(err: any) {
      setAlertModal({ isOpen: true, title: "Gagal", message: err.message, type: "danger" });
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingId(null);
      setAlertModal({ isOpen: true, title: "Berhasil", message: "Data jamaah berhasil diperbarui.", type: "success" });
      fetchRegistrations();
    } catch(err: any) {
      setAlertModal({ isOpen: true, title: "Gagal", message: err.message, type: "danger" });
    }
  };

  const filteredData = registrations.filter((reg) => {
    const matchesSearch = reg.name.toLowerCase().includes(search.toLowerCase()) || 
                          reg.phone_number.includes(search) || 
                          reg.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : filter === "taken" ? reg.is_taken : !reg.is_taken;
    return matchesSearch && matchesFilter;
  });

  // Today-only stats
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const todayRegistrations = registrations.filter(r => {
    const regDate = new Date(r.created_at).toLocaleDateString('en-CA');
    return regDate === todayStr;
  });
  const totalLaki = todayRegistrations.filter(r => r.jenis_kelamin === 'Laki-laki').length;
  const totalPerempuan = todayRegistrations.filter(r => r.jenis_kelamin === 'Perempuan').length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Jamaah Hari Ini</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{todayRegistrations.length}</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Laki-laki</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalLaki}</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <User size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Perempuan</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalPerempuan}</p>
          </div>
          <div className="p-3 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-lg">
            <User size={24} />
          </div>
        </div>
      </div>

    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama, WA, email..."
            className="pl-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
          <div className="flex gap-3 w-full sm:w-auto items-center">
            <select 
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
              value={filter}
              onChange={(e) => { setFilter(e.target.value as "all" | "taken" | "pending"); setCurrentPage(1); }}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Diambil</option>
              <option value="taken">Sudah Diambil</option>
            </select>
            <select
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value) as 10 | 50 | 100); setCurrentPage(1); }}
            >
              <option value={10}>10 / hal</option>
              <option value={50}>50 / hal</option>
              <option value={100}>100 / hal</option>
            </select>
            <button 
              onClick={fetchRegistrations} 
              className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 transition-colors">
            <tr>
              <th className="px-6 py-4">Nama Jamaah</th>
              <th className="px-6 py-4">Kontak</th>
              <th className="px-6 py-4">Waktu & Lokasi</th>
              <th className="px-6 py-4 text-center">Status Sahur</th>
              {isSuperAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && registrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <RefreshCw className="animate-spin inline-block mr-2" size={18} /> Memuat data...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  Tidak ada data registrasi yang sesuai.
                </td>
              </tr>
            ) : (
              paginatedData.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                  {editingId === reg.id ? (
                      <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Nama</label>
                            <input className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Kontak WA</label>
                            <input className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.phone_number || ""} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Jenis Kelamin</label>
                            <select className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={editForm.jenis_kelamin || ""} onChange={e => setEditForm({...editForm, jenis_kelamin: e.target.value})}>
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Email</label>
                            <input type="email" className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4">
                            <label className="text-xs text-slate-500 mb-1 block">Alamat</label>
                            <textarea rows={1} className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={editForm.alamat || ""} onChange={e => setEditForm({...editForm, alamat: e.target.value})} />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
                             <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1 transition-colors"><X size={14}/> Batal</button>
                             <button onClick={() => handleSave(reg.id)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"><Save size={14}/> Simpan Perubahan</button>
                          </div>
                        </div>
                      </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex flex-col">
                          <span>{reg.name}</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            {reg.jenis_kelamin} • {reg.alamat}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-300">{reg.phone_number}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{reg.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-300">{new Date(reg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {reg.added_by ? (
                               <span className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">Ditambahkan Oleh: {reg.added_by}</span>
                            ) : (
                               <>Jarak: {reg.distance_meters ? `${Math.round(reg.distance_meters)}m` : 'N/A'} • IP: {reg.ip_address || 'N/A'}</>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(reg.id, reg.is_taken)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            reg.is_taken 
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {reg.is_taken ? <CheckCircle size={14} /> : <Circle size={14} />}
                          {reg.is_taken ? "Sudah Diambil" : "Belum Diambil"}
                        </button>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(reg)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors" title="Edit Data"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(reg.id, reg.name)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors" title="Hapus Data"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}</span>–<span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * pageSize, filteredData.length)}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredData.length}</span> data
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >← Sebelumnya</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
            return (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${currentPage === page ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >{page}</button>
            );
          })}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >Berikutnya →</button>
        </div>
      </div>
    </div>

    <ConfirmModal 
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      onConfirm={confirmDelete}
      title="Hapus Data Jamaah?"
      message={`Apakah Anda yakin ingin menghapus data ${deleteModal.name}? Tindakan ini tidak dapat dibatalkan.`}
      type="danger"
      confirmText="Hapus Sekarang"
    />

    <ConfirmModal 
      isOpen={alertModal.isOpen}
      onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      title={alertModal.title}
      message={alertModal.message}
      type={alertModal.type}
      confirmText="Oke"
    />
    </div>
  );
}
