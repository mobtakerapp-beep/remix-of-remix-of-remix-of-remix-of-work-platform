function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  download(`${filename}.csv`, csv, "text/csv;charset=utf-8");
}

export function exportJson(filename: string, data: unknown) {
  download(`${filename}.json`, JSON.stringify(data, null, 2), "application/json");
}

/** Opens the browser print dialog; users can choose "Save as PDF". */
export function printPage() {
  window.print();
}
