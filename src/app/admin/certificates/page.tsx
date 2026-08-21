import { redirect } from "next/navigation";
import { getAdminUsername } from "@/lib/adminAuth";
import { listIssuedCertificates } from "@/lib/certificateStore";
import AdminCertificates from "@/components/AdminCertificates";

export default async function AdminCertificatesPage() {
  const username = await getAdminUsername();
  if (!username) {
    redirect("/admin/login");
  }

  return <AdminCertificates username={username} certificates={listIssuedCertificates()} />;
}
