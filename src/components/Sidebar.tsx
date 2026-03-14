"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut, History, Menu, X, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

export default function Sidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    ...(isSuperAdmin ? [{ href: "/super-admin", icon: <Users size={20} />, label: "Super Admin" }] : []),
    { href: "/history", icon: <History size={20} />, label: "Riwayat Data" },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="p-5 flex justify-between items-center border-b border-slate-800">
        <div>
          <h1 className="text-white font-bold text-lg">Ar-Rahman</h1>
          <p className="text-xs text-slate-400">Sahur Ops Panel</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors md:hidden">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 py-4">
        {navLinks.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
              pathname === href
                ? "bg-emerald-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}

        <div className="pt-4 mt-2 border-t border-slate-800">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            <FileText size={20} />
            Form Pendaftaran
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3 h-14">
        <div>
          <span className="text-white font-bold">Ar-Rahman</span>
          <span className="text-slate-400 text-xs ml-2">Sahur Ops Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile slide-over overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 bg-slate-900 flex flex-col h-full shadow-2xl animate-in slide-in-from-left">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 min-h-screen flex-col shrink-0 border-r border-slate-800 transition-colors">
        <SidebarContent />
      </aside>
    </>
  );
}
