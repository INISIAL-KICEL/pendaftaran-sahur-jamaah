"use client";
import Link from "next/link";

import { useState, useEffect } from "react";
import { Calendar, User, Phone, Mail, MapPin, Users, Bell, BellOff, BellRing } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ConfirmModal from "@/components/ConfirmModal";

// Titik Koordinat Masjid Agung Ar-Rahman
const MASJID_LAT = -6.308822;
const MASJID_LNG = 106.104390;

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371e3; // Radius of the earth in m
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in m
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    jenis_kelamin: "Laki-laki",
    alamat: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [distance, setDistance] = useState<number | null>(null);
  const [calculatingLocation, setCalculatingLocation] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [storeStatus, setStoreStatus] = useState<{isOpen: boolean, openTime: string, closeTime: string, checking: boolean}>({
    isOpen: true,
    openTime: "",
    closeTime: "",
    checking: true
  });

  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "danger" | "info" }>({ isOpen: false, title: "", message: "", type: "info" });
  const [submittedData, setSubmittedData] = useState<typeof formData & { registeredAt: string; ip: string } | null>(null);

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<string | null>(null);

  // Check current notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
      // If already granted, get existing subscription silently
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) setPushSubscription(JSON.stringify(sub));
          });
        }).catch(() => {});
      }
    }
  }, []);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const requestNotifPermission = async () => {
    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const VAPID_PUBLIC_KEY = "BM76HcimawbQbvLMKOvBELkFODxkW9vsedvufEz1urCwuHoiq6GJt8U9khnEOJhlOPgBlWiEKW8jgTHIHqCkxzk";
        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
        }
        setPushSubscription(JSON.stringify(sub));
      }
    } catch(err) {
      console.warn('Notification setup failed:', err);
    }
    setNotifLoading(false);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung Geolocation.");
      setCalculatingLocation(false);
      return;
    }

    // Always get current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const dist = getDistanceFromLatLonInM(userLat, userLng, MASJID_LAT, MASJID_LNG);
        setDistance(dist);
        setCalculatingLocation(false);
      },
      (error) => {
        let errMessage = "Gagal mendapatkan lokasi.";
        if (error.code === 1) errMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi browser Anda.";
        else if (error.code === 2) errMessage = "Lokasi tidak tersedia.";
        else if (error.code === 3) errMessage = "Waktu pencarian lokasi habis.";
        setLocationError(errMessage);
        setCalculatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    const checkStoreHours = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          const openTime = settings.open_time || "00:00";
          const closeTime = settings.close_time || "23:59";
          
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          const [openH, openM] = openTime.split(':').map(Number);
          const [closeH, closeM] = closeTime.split(':').map(Number);
          
          const currentMinutesTotal = currentHour * 60 + currentMinute;
          const openMinutesTotal = openH * 60 + openM;
          const closeMinutesTotal = closeH * 60 + closeM;
          
          let isOpen = false;
          if (closeMinutesTotal < openMinutesTotal) {
            isOpen = currentMinutesTotal >= openMinutesTotal || currentMinutesTotal <= closeMinutesTotal;
          } else {
            isOpen = currentMinutesTotal >= openMinutesTotal && currentMinutesTotal <= closeMinutesTotal;
          }
  
          setStoreStatus({
            isOpen, openTime, closeTime, checking: false
          });
        } else {
          setStoreStatus(prev => ({...prev, checking: false}));
        }
      } catch(err) {
        setStoreStatus(prev => ({...prev, checking: false}));
      }
    };
  
    checkStoreHours();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      if (distance === null || distance > 200) {
        throw new Error("Anda harus berada dalam radius 200 meter dari Masjid Agung Ar-Rahman.");
      }

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...formData, distance_meters: distance, push_subscription: pushSubscription })
      });

      if (!res.ok) {
        throw new Error('Terjadi kesalahan saat menyimpan data');
      }

      setStatus("success");
      setAlertModal({ 
        isOpen: true, 
        title: "Pendaftaran Berhasil!", 
        message: "Selamat! Pendaftaran Anda telah kami terima. Silakan datang ke Masjid Agung Ar-Rahman sesuai jadwal.", 
        type: "success" 
      });
      // Capture submitted info for display on success screen
      let userIp = "Tidak tersedia";
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) { const ipData = await ipRes.json(); userIp = ipData.ip; }
      } catch {}
      setSubmittedData({
        ...formData,
        registeredAt: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
        ip: userIp
      });
      setFormData({ name: "", phone_number: "", email: "", jenis_kelamin: "Laki-laki", alamat: "" });
    } catch(err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Terjadi kesalahan saat pendaftaran.");
      setAlertModal({ 
        isOpen: true, 
        title: "Pendaftaran Gagal", 
        message: err.message || "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.", 
        type: "danger" 
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg text-sm transition-all border border-emerald-100 dark:border-slate-800">
          <Users size={16} />
          Login Admin
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-10 transition-colors">
        <div className="bg-emerald-600 dark:bg-emerald-800 p-8 text-center text-white relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-emerald-500 dark:text-emerald-700 opacity-50 transition-colors">
            <Calendar size={120} />
          </div>
          <h1 className="text-3xl font-bold relative z-10">Ar-Rahman Sahur Ops</h1>
          <p className="text-emerald-100 dark:text-emerald-200 mt-2 relative z-10">
            Pendaftaran Sahur Masjid Agung Ar-Rahman Kabupaten Pandeglang
          </p>
        </div>
        
        <div className="p-8">
          {status === "success" ? (
            <div className="py-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Alhamdulillah! Terdaftar ✅</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Silakan tangkap layar ini sebagai bukti pendaftaran Anda.</p>
              </div>

              {submittedData && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 mb-5 text-sm">
                  <div className="flex px-4 py-3">
                    <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">Nama</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{submittedData.name}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">Alamat</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{submittedData.alamat}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">Jenis Kelamin</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{submittedData.jenis_kelamin}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">Jam Daftar</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{submittedData.registeredAt}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">IP Perangkat</span>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400 self-center">{submittedData.ip}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setStatus("idle"); setSubmittedData(null); }}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg px-6 py-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Daftar Lagi
              </button>
            </div>
          ) : (
            <>
              {storeStatus.checking || calculatingLocation ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center transition-colors">
                   <svg className="animate-spin mb-3 h-8 w-8 text-emerald-500 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <p className="text-sm font-medium">Memeriksa kelayakan pendaftaran...</p>
                   <p className="text-xs mt-1">Sistem memastikan jadwal dan lokasi Anda.</p>
                </div>
              ) : !storeStatus.isOpen ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-8 rounded-lg mb-2 text-sm border border-red-100 dark:border-red-900/30 text-center transition-colors">
                  <Calendar size={36} className="mx-auto mb-3 text-red-500 dark:text-red-400" />
                  <p className="font-bold text-lg mb-1">Pendaftaran Ditutup</p>
                  <p>Jam operasional pendaftaran saat ini telah ditutup.</p>
                  <p className="mt-3 text-xs opacity-90 font-medium badge bg-red-100 dark:bg-red-950 px-3 py-1.5 rounded-full inline-block">
                    Jadwal Buka: {storeStatus.openTime} - {storeStatus.closeTime} WIB
                  </p>
                </div>
              ) : locationError ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-5 rounded-lg mb-6 text-sm border border-red-100 dark:border-red-900/30 text-center transition-colors">
                  <MapPin size={24} className="mx-auto mb-2 text-red-500 dark:text-red-400" />
                  <p className="font-semibold mb-1">Lokasi Tidak Terdeteksi</p>
                  <p>{locationError}</p>
                  <button onClick={() => window.location.reload()} className="mt-3 bg-white dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-4 py-1.5 rounded text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">Coba Lagi</button>
                </div>
              ) : distance !== null && distance > 200 ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-5 rounded-lg mb-6 text-sm border border-amber-200 dark:border-amber-900/30 text-center transition-colors">
                  <MapPin size={24} className="mx-auto mb-2 text-amber-600 dark:text-amber-500" />
                  <p className="font-semibold mb-1">Lokasi Terlalu Jauh</p>
                  <p>Anda berada {Math.round(distance)} meter dari Masjid Agung Ar-Rahman.</p>
                  <p className="mt-2 text-xs opacity-90">Pendaftaran hanya dapat dilakukan di dalam area masjid (maksimal 200 meter).</p>
                  <button onClick={() => window.location.reload()} className="mt-4 bg-white dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50 px-4 py-1.5 rounded text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">Periksa Ulang Lokasi</button>
                </div>
              ) : (
                <>
                  {status === "error" && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm border border-red-100 dark:border-red-900/30 transition-colors">
                      {errorMessage}
                    </div>
                  )}
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 p-3 rounded-lg mb-6 text-xs border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 transition-colors">
                    <MapPin size={16} className="shrink-0" />
                    <p>Lokasi terverifikasi ({Math.round(distance!)}m). Anda berada di area Masjid Agung Ar-Rahman.</p>
                  </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                    Jenis Kelamin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                      <Users size={18} />
                    </div>
                    <select
                      required
                      value={formData.jenis_kelamin}
                      onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                      className="pl-10 w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                    Alamat Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                      <MapPin size={18} />
                    </div>
                    <textarea
                      required
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="pl-10 w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                      placeholder="Masukkan alamat RT/RW, Kecamatan..."
                    />
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="pl-10 w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                {/* Notification Permission Banner */}
                {notifPermission !== 'denied' && (
                  <div className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                    notifPermission === 'granted' && pushSubscription
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className={`shrink-0 ${notifPermission === 'granted' && pushSubscription ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {notifPermission === 'granted' && pushSubscription ? <BellRing size={20} /> : <Bell size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {notifPermission === 'granted' && pushSubscription ? (
                        <>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Notifikasi Aktif ✓</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500">Anda akan mendapat pengingat saat sahur siap.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Aktifkan Notifikasi Sahur</p>
                          <p className="text-xs text-amber-600 dark:text-amber-500">Terima pengingat langsung di HP Anda.</p>
                        </>
                      )}
                    </div>
                    {notifPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={requestNotifPermission}
                        disabled={notifLoading}
                        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {notifLoading ? 'Memproses...' : 'Izinkan'}
                      </button>
                    )}
                  </div>
                )}
                {notifPermission === 'denied' && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3 flex items-center gap-2">
                    <BellOff size={16} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">Notifikasi diblokir di browser ini. Aktifkan manual di pengaturan browser.</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-emerald-600 text-white font-semibold rounded-lg px-4 py-3 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {status === "loading" ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      "Daftar Sahur"
                    )}
                  </button>
                </div>
                </form>
              </>
            )}
          </>
        )}
        </div>

        <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs transition-colors border-t border-slate-100 dark:border-slate-800">
          &copy; {new Date().getFullYear()} Masjid Agung Ar-Rahman Pandeglang.
        </div>
      </div>

      <ConfirmModal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="Dimengerti"
      />
    </main>
  );
}
