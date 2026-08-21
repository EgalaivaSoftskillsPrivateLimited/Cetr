import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getAdminUsernameFromRequest } from "@/lib/adminAuth";

const MAX_ROWS = 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const username = getAdminUsernameFromRequest(request);
  if (!username) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large (max 5MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isCsv = "name" in file && typeof file.name === "string" && /\.csv$/i.test(file.name);

  let workbook: XLSX.WorkBook;
  try {
    // CSV has no built-in encoding marker — decode as UTF-8 text ourselves
    // (SheetJS's own CSV-from-buffer path can otherwise mis-decode non-ASCII
    // headers/names). Native .xlsx/.xls already carry proper encoding.
    workbook = isCsv
      ? XLSX.read(buffer.toString("utf-8"), { type: "string" })
      : XLSX.read(buffer, { type: "buffer" });
  } catch {
    return NextResponse.json(
      { error: "Couldn't read this file. Upload a .xlsx or .csv file." },
      { status: 400 }
    );
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    return NextResponse.json({ error: "The file has no sheets." }, { status: 400 });
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (rawRows.length < 2) {
    return NextResponse.json(
      { error: "The file needs a header row plus at least one data row." },
      { status: 400 }
    );
  }

  // Excel prefixes a cell with ' or ` to force text mode (e.g. so a phone
  // number keeps a leading "+" instead of being read as a formula/number).
  // That marker leaks into the exported value — strip it.
  const cleanCell = (value: unknown): string =>
    String(value ?? "").trim().replace(/^[`']+/, "");

  const headers = rawRows[0].map((h) => cleanCell(h));
  const dataRows = rawRows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
  }

  const rows = dataRows.map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, cleanCell(r[i])]))
  );

  return NextResponse.json({ headers, rows });
}
