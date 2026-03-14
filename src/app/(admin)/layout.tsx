import Sidebar from "@/components/Sidebar";
import AudioNotificationProvider from "@/components/AudioNotificationProvider";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  let isSuperAdmin = false;

  if (token) {
    try {
      const verified = await jwtVerify(token, secretKey);
      isSuperAdmin = verified.payload.role === 'super_admin';
    } catch(err) {
      console.error(err);
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <AudioNotificationProvider />
      <Sidebar isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
