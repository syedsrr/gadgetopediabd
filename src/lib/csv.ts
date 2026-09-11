/** Minimal RFC4180-ish CSV parser (handles quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Parse a CSV with a header row into keyed objects (headers lowercased/trimmed). */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  const headerRow = rows[0];
  if (!headerRow) return [];
  const headers = headerRow.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

export const PRODUCT_CSV_TEMPLATE = [
  "name,slug,sku,category,brand,price,sale_price,old_price,stock,low_stock_threshold,image_url,image_alt,short_description,description,weight_kg,status,is_active,is_featured,is_preorder,preorder_release_date,preorder_note",
  '"Turbo Table Fan 12""",turbo-table-fan-12,GO-FAN-001,Fans & Cooling,Vision,2450,2290,2790,25,5,/images/p-kettle.jpg,Turbo table fan,Quiet 3-speed table fan,"Copper motor, 3 speeds, 12 inch blade",2.4,published,true,false,false,,',
].join("\n");

