'use client';

import React, { useState, useMemo } from 'react';
  import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Info } from 'lucide-react';

interface DataRow {
  [key: string]: string | number | boolean;
}

interface DataTableProps {
  data: DataRow[];
  headers: string[];
}

// Extender la interfaz de ColumnMeta para incluir tooltip
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    getTooltip?: () => string;
  }
}

const DataTable: React.FC<DataTableProps> = ({ data, headers }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFTYes, setShowFTYes] = useState(true); // Estado para el checkbox de FT

  // Función para normalizar texto (sin acentos, signos de puntuación, mayúsculas)
  const normalizeText = (text: string, keepSpaces: boolean = false): string => {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos
    
    if (keepSpaces) {
      return normalized.replace(/[^a-z0-9\s]/g, ''); // Solo letras, números y espacios
    } else {
      return normalized.replace(/[^a-z0-9]/g, ''); // Solo letras y números
    }
  };

  // Filtro global personalizado
  const customGlobalFilter = (row: { original: DataRow }, columnId: string, value: string) => {
    const searchValue = normalizeText(value, true); // Mantener espacios para dividir en palabras
    if (!searchValue) return true;

    // Crear cadena larga con todo el contenido de la fila (sin espacios)
    const rowValues = Object.values(row.original).join('');
    const normalizedRowContent = normalizeText(String(rowValues), false); // Sin espacios para búsqueda
    
    // Dividir la búsqueda en palabras individuales
    const searchWords = searchValue.split(/\s+/).filter(word => word.length > 0);
    
    // Verificar que TODAS las palabras estén presentes en el contenido de la fila
    return searchWords.every(word => normalizedRowContent.includes(word));
  };

  // Filtrar datos basado en el estado del checkbox de FT
  const filteredData = useMemo(() => {
    if (!showFTYes) {
      // Si el checkbox no está marcado, mostrar solo FT = "No"
      return data.filter(row => {
        const ftValue = String(row.FT || row.ft || '').toLowerCase();
        return ftValue === 'no';
      });
    }
    // Si está marcado, mostrar todos los datos
    return data;
  }, [data, showFTYes]);

  const columns = useMemo(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: { getValue: () => unknown }) => {
        const value = info.getValue();
        const cellValue = String(value);

        // Aplicar estilos basados en el contenido
        let cellClass = 'text-sm break-words';
        
        // Estilos para correlaciones (valores numéricos entre 0 y 1)
        if (header.toLowerCase() == "r" || header.toLowerCase() == "ρ") {
          // Los estilos se aplican ahora en la td, solo retornamos el contenido sin padding
          return cellValue;
        }
        // Estilos para fine-tuning
        else if (header.toLowerCase() === 'ft') {
          if (cellValue.toLowerCase() === 'yes') {
            return (
              <div className="text-sm flex items-center break-words">
                <Check className="h-4 w-4 text-green-600 mr-1" />
                {/* <span className="text-green-600 font-medium">Yes</span> */}
              </div>
            );
          } else if (cellValue.toLowerCase() === 'no') {
            return (
              <div className="text-sm flex items-center break-words">
                <X className="h-4 w-4 text-red-600 mr-1" />
                {/* <span className="text-red-600 font-medium">No</span> */}
              </div>
            );
          } else {
            cellClass += ' text-gray-900';
          }
        }
        // Estilos para work
        else if (header.toLowerCase() === 'work' || header.toLowerCase() === 'dataset') {
          // I want to add Paper with the link the content of work
          const works = cellValue.split(';').map((w) => w.trim());
          return (
                <div className="text-sm break-words">
                  {works.map((work, index) => {
                    // Extraer texto y url con regex
                    const match = work.match(/^(.*?)\s*\[(.*?)\]\s*$/);
                    const text = match ? match[1].trim() : work;
                    const url = match ? match[2].trim() : "#";
                    if (url === "#") {
                      return (
                        <div key={index} className="flex items-center">
                          <span>{text}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="flex items-center">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {text}
                        </a>
                      </div>
                    );
                  })}
                </div>
              );
        }

        // Estilos generales para otros campos
        else {
          cellClass += ' text-gray-900';
        }

        return (
          <div className={cellClass}>
            {cellValue}
          </div>
        );
      },
      enableSorting: header.toLowerCase() !== 'ft', // Deshabilitar sorting para FT
      enableColumnFilter: true,
      // Función para obtener el tooltip de cada columna
      meta: {
        getTooltip: () => {
          switch (header.toLowerCase()) {
            case 'r':
              return 'Pearson correlation coefficient between model predictions and ground truth';
            case 'ρ':
              return 'Pearson correlation coefficient between model predictions and ground truth';
            case 'ft':
              return 'Indicates whether the model was fine-tuned for this specific task. Uncheck to avoid fine-tuned models';
            case 'work':
              return 'Reference to the paper/work where this result is reported';
            case 'dataset':
              return 'Dataset used for model evaluation';
            case 'model':
              return 'Name of the evaluated language model';
            case 'task':
              return 'Psycholinguistic task evaluated';
            case 'language':
              return 'Language in which the evaluation was performed';
            case 'words':
              return 'Sample size used in the evaluation';
            case 'metric':
              return 'Metric used to measure model performance';
            default:
              return `No information available`;
          }
        }
      }
    }));
  }, [headers]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: customGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const getSortIcon = (column: { getIsSorted: () => string | false }) => {
    const sortDirection = column.getIsSorted();
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos para mostrar. Sube un archivo Excel para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filtro global */}
      <div className="mb-4 flex justify-center">
        <div className="relative max-w-lg w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Información de filas */}
      <div className="mb-4 text-sm text-gray-600">
        Rows: {table.getFilteredRowModel().rows.length}
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto divide-y divide-gray-200 min-w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const tooltip = header.column.columnDef.meta?.getTooltip?.();
                    const headerName = String(header.column.columnDef.header).toLowerCase();
                    const isFTColumn = headerName === 'ft';
                    
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 last:border-r-0 relative group"
                        onClick={!isFTColumn ? header.column.getToggleSortingHandler() : undefined}
                        title={tooltip}
                      >
                        <div className="flex items-center">
                          <span className="relative">
                            {tooltip && (
                              <Info className="h-2.5 w-2.5 absolute -top-1 -left-2 text-gray-400 opacity-70" />
                            )}
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {isFTColumn ? (
                            <input
                              type="checkbox"
                              checked={showFTYes}
                              onChange={(e) => setShowFTYes(e.target.checked)}
                              className="ml-2 h-3 w-3 text-gray-500 rounded border-gray-300 focus:ring-gray-400"
                              title="Show fine-tuned models (unchecked = only non-fine-tuned)"
                            />
                          ) : (
                            getSortIcon(header.column)
                          )}
                        </div>
                        {/* Tooltip personalizado */}
                        {tooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {tooltip}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const cellValue = String(cell.getValue());
                    const header = cell.column.columnDef.header;
                    let tdClasses = "border-r border-gray-200 last:border-r-0 break-words whitespace-normal px-4 py-2 text-sm";
                    
                    // Aplicar estilos específicos a la celda para correlaciones
                    if (typeof header === 'string' && (header.toLowerCase() === "r" || header.toLowerCase() === "ρ")) {
                      const numValue = parseFloat(cellValue);
                      if (!isNaN(numValue)) {
                        if (numValue >= 0.8) {
                          tdClasses += ' bg-green-100 text-green-800 font-medium';
                        } else if (numValue >= 0.6) {
                          tdClasses += ' bg-yellow-100 text-yellow-800 font-medium';
                        } else if (numValue >= 0.4) {
                          tdClasses += ' bg-orange-100 text-orange-800 font-medium';
                        } else {
                          tdClasses += ' bg-red-100 text-red-800 font-medium';
                        }
                      }
                    }

                    return (
                      <td key={cell.id} className={tdClasses}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
