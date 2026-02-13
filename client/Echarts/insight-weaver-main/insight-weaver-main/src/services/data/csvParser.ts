/** Generic CSV parser — returns rows as string[][] with header extraction */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export function parseCSV(raw: string): ParsedCSV {
  const lines = raw.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  // Remove BOM if present
  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const headers = splitCSVLine(headerLine);
  const rows = lines.slice(1).map(splitCSVLine);

  return { headers, rows };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
