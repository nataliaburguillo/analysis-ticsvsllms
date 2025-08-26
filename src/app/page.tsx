'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataRow {
  [key: string]: string | number | boolean;
}

export default function Home() {
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/benchmark_linguistics.xlsx');
        if (!response.ok) {
          throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error('El archivo Excel está vacío');
        }

        const headers = jsonData[0] as string[];
        const data = jsonData.slice(1).map((row: unknown) => {
          const rowArray = row as (string | number | boolean)[];
          const rowObj: DataRow = {};
          headers.forEach((header, index) => {
            rowObj[header] = rowArray[index] || '';
          });
          return rowObj;
        });

        setHeaders(headers);
        setData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los datos';
        setError(errorMessage);
      }
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-[90%] mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">
              Psycholinguistics Benchmark
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            TBD ADD ANY DESCRIPTION
          </p>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="w-full mb-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error al cargar los datos</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        {!error && data.length > 0 && (
          <div className="w-full">
            {/* Header de la tabla */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Benchmark results
              </h2>
              {/* <p className="text-sm text-gray-600 mt-1">
                {data.length} rows • {headers.length} columns
              </p> */}
            </div>

            {/* Tabla de datos */}
            <div className="rounded-lg">
              <DataTable data={data} headers={headers} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>
            
          </p>
        </footer>
      </div>
    </main>
  );
}
