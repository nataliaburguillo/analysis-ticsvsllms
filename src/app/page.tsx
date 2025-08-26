'use client';

import React from 'react';
import DataTable from '@/components/DataTable';
import { FileSpreadsheet } from 'lucide-react';
import benchmarkData from '@/data/benchmark_linguistics.json';

export default function Home() {
  const { data, headers } = benchmarkData;

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

        {/* Tabla de datos */}
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

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>
            
          </p>
        </footer>
      </div>
    </main>
  );
}
