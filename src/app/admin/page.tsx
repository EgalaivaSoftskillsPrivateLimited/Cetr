import { redirect } from "next/navigation";
import { getAdminUsername } from "@/lib/adminAuth";
import { listClaimTokens } from "@/lib/claimTokenStore";
import { getCertificate } from "@/data/certificates";
import { getSiteUrl } from "@/lib/siteUrl";
import AdminDashboard, { type AdminLink } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const username = await getAdminUsername();
  if (!username) {
    redirect("/admin/login");
  }

  const links: AdminLink[] = listClaimTokens().map((t) => ({
    ...t,
    url: `${getSiteUrl()}/claim/${t.token}`,
    recipientName: t.certificateId ? getCertificate(t.certificateId)?.recipientName : undefined,
  }));

  return <AdminDashboard username={username} initialLinks={links} />;
}
