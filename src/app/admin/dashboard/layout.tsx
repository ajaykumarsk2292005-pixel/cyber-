import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminAuth";

export default async function AdminDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirect("/admin/login");

  return children;
}