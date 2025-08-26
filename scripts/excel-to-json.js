const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Rutas de archivos
const excelFilePath = path.join(__dirname, '../public/benchmark_linguistics.xlsx');
const jsonOutputPath = path.join(__dirname, '../src/data/benchmark_linguistics.json');

function convertExcelToJson() {
  try {
    // Verificar que el archivo Excel existe
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Archivo Excel no encontrado: ${excelFilePath}`);
    }

    // Crear directorio de destino si no existe
    const outputDir = path.dirname(jsonOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(excelFilePath);
    
    // Obtener la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir a JSON con headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('El archivo Excel está vacío');
    }

    // Separar headers y datos
    const headers = jsonData[0];
    const rows = jsonData.slice(1).map((row) => {
      const rowObj = {};
      headers.forEach((header, headerIndex) => {
        rowObj[header] = row[headerIndex] || '';
      });
      return rowObj;
    });

    // Crear el objeto final
    const result = {
      headers: headers,
      data: rows,
      metadata: {
        totalRows: rows.length,
        totalColumns: headers.length,
        generatedAt: new Date().toISOString(),
        source: 'benchmark_linguistics.xlsx'
      }
    };

    // Escribir el archivo JSON
    fs.writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), 'utf8');
    
    // Solo mostrar output detallado si se ejecuta manualmente
    const isManual = process.argv.includes('--verbose') || !process.env.npm_lifecycle_event;
    
    if (isManual) {
      console.log(`✅ Conversión exitosa!`);
      console.log(`📊 Datos: ${rows.length} filas, ${headers.length} columnas`);
      console.log(`📁 Archivo generado: ${jsonOutputPath}`);
    } else {
      console.log(`📊 JSON generado: ${rows.length} filas, ${headers.length} columnas`);
    }
    
  } catch (error) {
    console.error('❌ Error al convertir Excel a JSON:', error.message);
    process.exit(1);
  }
}

// Ejecutar la conversión
convertExcelToJson();