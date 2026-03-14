"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Users, AlertCircle, CheckCircle2, Clock, Save, Trash2, Power } from "lucide-react";
import RegistrationTable from "@/components/RegistrationTable";

export default function SuperAdminPage() {
  const [blasting, setBlasting] = useState(false);
  const [blastResult, setBlastResult] = useState<{success: boolean; message: string} | null>(null);

  const [adminForm, setAdminForm] = useState({ name: "", phone_number: "", email: "", password: "", role: "admin" });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminResult, setAdminResult] = useState<{success: boolean; message: string} | null>(null);

  const [settingsForm, setSettingsForm] = useState({ open_time: "", close_time: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsResult, setSettingsResult] = useState<{success: boolean; message: string} | null>(null);

  const [bypassForm, setBypassForm] = useState({ name: "", jenis_kelamin: "Laki-laki", alamat: "", phone_number: "", email: "" });
  const [addingBypass, setAddingBypass] = useState(false);
  const [bypassResult, setBypassResult] = useState<{success: boolean; message: string} | null>(null);

  type AdminUser = { id: number; email: string; role: string; name: string; phone_number: string; is_active: number; last_login_at: string | null };
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setAdminList(await res.json());
    setLoadingAdmins(false);
  };

  const toggleAdminActive = async (id: number, current: number) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: current === 0 ? 1 : 0 })
    });
    fetchAdmins();
  };

  const deleteAdmin = async (id: number) => {
    if (!confirm('Hapus akun admin ini?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchAdmins();
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.open_time && data.close_time) {
          setSettingsForm({ open_time: data.open_time, close_time: data.close_time });
        }
      })
      .catch(console.error);
    fetchAdmins();
  }, []);

  const handleWaBlast = async () => {
    if (!confirm("Apakah Anda yakin ingin mengirim Notifikasi Push ke semua browser jamaah?")) return;

    setBlasting(true);
    setBlastResult(null);

    try {
      const res = await fetch('/api/notifications/broadcast', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Pengingat Sahur: Masjid Ar-Rahman",
          body: "Waktu sahur telah tiba. Bagi pendaftar yang belum mengambil hidangan, silakan segera menuju lokasi."
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setBlastResult({ success: true, message: data.message });
    } catch (err: unknown) {
      const error = err as Error;
      setBlastResult({ success: false, message: error.message || "Unknown error" });
    } finally {
      setBlasting(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.password.length < 6) {
      setAdminResult({ success: false, message: "Kata sandi minimal 6 karakter." });
      return;
    }

    setAddingAdmin(true);
    setAdminResult(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setAdminResult({ success: true, message: `Akun ${adminForm.name} berhasil ditambahkan.` });
      setAdminForm({ name: "", phone_number: "", email: "", password: "", role: "admin" });
      fetchAdmins();
    } catch(err: any) {
      setAdminResult({ success: false, message: err.message });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setSettingsResult({ success: true, message: "Pengaturan jadwal sahur berhasil diperbarui." });
    } catch(err: any) {
      setSettingsResult({ success: false, message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBypassRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingBypass(true);
    setBypassResult(null);

    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bypassForm)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setBypassResult({ success: true, message: `Jamaah ${bypassForm.name} berhasil ditambahkan ke daftar antrian sahur.` });
      setBypassForm({ name: "", jenis_kelamin: "Laki-laki", alamat: "", phone_number: "", email: "" });
    } catch(err: any) {
      setBypassResult({ success: false, message: err.message });
    } finally {
      setAddingBypass(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 text-slate-900 dark:text-slate-100 transition-colors">Super Admin Controls</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Area khusus Super Admin untuk mengelola sistem dan komunikasi jamaah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Web Push Broadcast</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Kirim notifikasi sahur massal</p>
            </div>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm transition-colors">
            Klik tombol di bawah ini untuk mengirimkan notifikasi push secara langsung ke browser seluruh pendaftar yang mengaktifkan akses.
          </p>

          {blastResult && (
            <div className={`p-4 rounded-lg mb-6 flex gap-3 items-start ${blastResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {blastResult.success ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
              <p className="text-sm font-medium">{blastResult.message}</p>
            </div>
          )}

          <button
            onClick={handleWaBlast}
            disabled={blasting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {blasting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengirim Pesan...
              </>
            ) : (
              <>
                <MessageSquare size={20} />
                Kirim Web Notification Sekarang
              </>
            )}
          </button>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Jadwal Operasional Form</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Atur jam buka dan tutup pendaftaran</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsResult && (
              <div className={`p-3 rounded-lg text-sm flex gap-2 items-start ${settingsResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {settingsResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <p>{settingsResult.message}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jam Buka</label>
                <input
                  type="time"
                  required
                  value={settingsForm.open_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, open_time: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jam Tutup</label>
                <input
                  type="time"
                  required
                  value={settingsForm.close_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, close_time: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-colors"
            >
              <Save size={18} />
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Waktu"}
            </button>
          </form>
        </div>

        {/* Admin Management Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Manajemen Admin</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tambah akses staff masjid baru</p>
            </div>
          </div>
          
          <form onSubmit={handleAddAdmin} className="space-y-4">
            {adminResult && (
              <div className={`p-3 rounded-lg text-sm flex gap-2 items-start ${adminResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {adminResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <p>{adminResult.message}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Staff</label>
                <input required type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Nama lengkap" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor HP</label>
                <input required type="tel" value={adminForm.phone_number} onChange={e => setAdminForm({...adminForm, phone_number: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="08..." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-slate-400 dark:text-slate-500 font-normal">(Login)</span></label>
              <input required type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="staff@masjid.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kata Sandi</label>
                <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Minimal 6 karakter" minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Peran (Role)</label>
                <select value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none">
                  <option value="admin">Admin Biasa</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={addingAdmin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {addingAdmin ? "Menambahkan..." : "Tambah Akun Staff"}
            </button>
          </form>
        </div>

        {/* Bypass Registration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Tambah Jamaah (Bypass Sistem)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Daftarkan jamaah tanpa batasan geofencing atau jam operasional. Transparan tercatat di sistem dengan nama Anda.</p>
            </div>
          </div>
          
          <form onSubmit={handleBypassRegistration} className="space-y-4">
            {bypassResult && (
              <div className={`p-3 rounded-lg text-sm flex gap-2 items-start ${bypassResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {bypassResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <p>{bypassResult.message}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input required type="text" value={bypassForm.name} onChange={e => setBypassForm({...bypassForm, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nama jamaah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin</label>
                <select required value={bypassForm.jenis_kelamin} onChange={e => setBypassForm({...bypassForm, jenis_kelamin: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
              <textarea required rows={2} value={bypassForm.alamat} onChange={e => setBypassForm({...bypassForm, alamat: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Masukkan detail wilayah" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp</label>
                <input required type="tel" value={bypassForm.phone_number} onChange={e => setBypassForm({...bypassForm, phone_number: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="08..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Email</label>
                <input required type="email" value={bypassForm.email} onChange={e => setBypassForm({...bypassForm, email: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@contoh.com" />
              </div>
            </div>

            <button type="submit" disabled={addingBypass} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm">
              {addingBypass ? "Memproses Data..." : "Daftarkan Jamaah (Bypass)"}
            </button>
          </form>
        </div>

        {/* Admin List Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Admin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Kelola akun yang memiliki akses ke Dashboard</p>
              </div>
            </div>
            <button onClick={fetchAdmins} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              ↻ Refresh
            </button>
          </div>

          {loadingAdmins ? (
            <p className="text-sm text-slate-500 py-4 text-center animate-pulse">Memuat daftar admin...</p>
          ) : adminList.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Belum ada akun admin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                    <th className="px-4 py-3">Nama / Email</th>
                    <th className="px-4 py-3">Peran</th>
                    <th className="px-4 py-3">Login Terakhir</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adminList.map(admin => (
                    <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{admin.name || "—"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${admin.role === 'super_admin' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {admin.last_login_at 
                          ? new Date(admin.last_login_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Belum pernah login'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${admin.is_active !== 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active !== 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {admin.is_active !== 0 ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleAdminActive(admin.id, admin.is_active)}
                            title={admin.is_active !== 0 ? "Nonaktifkan" : "Aktifkan"}
                            className={`p-1.5 rounded-lg transition-colors ${admin.is_active !== 0 ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            onClick={() => deleteAdmin(admin.id)}
                            title="Hapus Admin"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manajemen Data Jamaah Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors md:col-span-2 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Manajemen Data Jamaah</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Edit, hapus, dan kelola antrean absen peserta (Khusus Super Admin)</p>
            </div>
          </div>
          <RegistrationTable isSuperAdmin={true} />
        </div>
      </div>
    </div>
  );
}
