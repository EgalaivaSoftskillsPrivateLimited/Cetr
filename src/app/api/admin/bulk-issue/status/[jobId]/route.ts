import { NextResponse, type NextRequest } from "next/server";
import { getAdminUsernameFromRequest } from "@/lib/adminAuth";
import { getBulkIssueJob } from "@/lib/bulkIssueJobs";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/bulk-issue/status/[jobId]">
) {
  const username = getAdminUsernameFromRequest(request);
  if (!username) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const job = getBulkIssueJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
