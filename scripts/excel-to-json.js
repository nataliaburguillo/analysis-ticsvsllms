// scripts/excel-to-json.js (CommonJS)
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../public");
const OUTPUT_ROOT = path.join(__dirname, "../src/data");

// listar recursivamente todos los .xlsx (excluye temporales ~$_)
function listExcelFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listExcelFiles(full));
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".xlsx" &&
      !entry.name.startsWith("~$")
    ) {
      out.push(full);
    }
  }
  return out;
}

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function convertOneExcel(excelPath) {
  const rel = path.relative(PUBLIC_DIR, excelPath); // ruta relativa desde public
  const jsonPath = path.join(OUTPUT_ROOT, rel.replace(/\.xlsx$/i, ".json"));

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ No existe: ${excelPath}`);
    return false;
  }

  ensureDir(jsonPath);

  const workbook = XLSX.readFile(excelPath);
  const firstSheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[firstSheetName];
  const rows2d = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (!rows2d.length) {
    console.warn(`⚠️  Vacío: ${excelPath}`);
    return false;
  }

  const headers = rows2d[0];
  const rows = rows2d.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });

  const result = {
    headers,
    data: rows,
    metadata: {
      totalRows: rows.length,
      totalColumns: headers.length,
      generatedAt: new Date().toISOString(),
      source: path.relative(process.cwd(), excelPath),
      sheet: firstSheetName,
    },
  };

  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");
  console.log(
    `✅ ${rel} → ${path.relative(process.cwd(), jsonPath)}  (${
      rows.length
    } filas, ${headers.length} cols)`
  );
  return true;
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ No existe el directorio: ${PUBLIC_DIR}`);
    process.exit(1);
  }

  const files = listExcelFiles(PUBLIC_DIR);
  if (!files.length) {
    console.log("ℹ️  No se encontraron .xlsx en public/");
    return;
  }

  let ok = 0;
  for (const f of files) if (convertOneExcel(f)) ok++;
  console.log(`\n📦 Hecho. ${ok}/${files.length} convertidos.`);
}

main();
