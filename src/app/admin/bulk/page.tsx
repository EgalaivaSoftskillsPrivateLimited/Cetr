import { redirect } from "next/navigation";
import { getAdminUsername } from "@/lib/adminAuth";
import AdminBulkIssue from "@/components/AdminBulkIssue";

export default async function AdminBulkPage() {
  const username = await getAdminUsername();
  if (!username) {
    redirect("/admin/login");
  }

  return <AdminBulkIssue username={username} />;
}
