"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";

interface DataRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface DataTableProps {
  data: DataRow[];
  headers: string[];
}

// Extender ColumnMeta para tooltip
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData = unknown, TValue = unknown> {
    getTooltip?: () => string;
  }
}

const ModelDataTable: React.FC<DataTableProps> = ({ data, headers }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFTYes, setShowFTYes] = useState(true); // checkbox para filtrar aciertos

  // ===== helpers de normalización (igual estilo que antes) =====
  const normalizeText = (text: string, keepSpaces = false): string => {
    const normalized = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return keepSpaces
      ? normalized.replace(/[^a-z0-9\s]/g, "")
      : normalized.replace(/[^a-z0-9]/g, "");
  };

  const customGlobalFilter = (
    row: { original: DataRow },
    _columnId: string,
    value: string
  ) => {
    const searchValue = normalizeText(value, true);
    if (!searchValue) return true;
    const rowValues = Object.values(row.original).join(" ");
    const normalizedRowContent = normalizeText(String(rowValues), false);
    const searchWords = searchValue.split(/\s+/).filter(Boolean);
    return searchWords.every((word) => normalizedRowContent.includes(word));
  };

  // ===== mapeo robusto de headers a los nombres reales del excel =====
  const H = useMemo(() => {
    const stripAccents = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const canon = (s: string) =>
      stripAccents(String(s).trim().toLowerCase()).replace(/[^a-z0-9]/g, "");

    const idx: Record<string, string> = {};
    headers.forEach((h) => (idx[canon(h)] = h));
    const pick = (cands: string[], fallback?: string) => {
      for (const c of cands) {
        const key = canon(c);
        if (idx[key]) return idx[key];
      }
      return fallback ?? cands[0];
    };

    return {
      customId: pick(["customid", "custom id", "id"]),
      respuestaModelo: pick([
        "respuesta modelo",
        "respuestamodelo",
        "model response",
        "answer",
      ]),
      logprobLetra: pick(["logprob letra", "logprobletra", "letter logprob"]),
      topLogprobs: pick(["top logprobs", "toplogprobs", "top_logprobs"]),
      respuestaReal: pick([
        "respuesta real",
        "respuestareal",
        "correct answer",
        "real answer",
      ]),
      acierto: pick(["acierto", "correct", "success", "hit"]),
      respuestaCompleta: pick([
        "respuesta completa",
        "respuestacompleta",
        "full response",
        "complete response",
      ]),
    };
  }, [headers]);

  // ===== filtro por acierto (igual UX que antes: marcado = todo, desmarcado = solo correctos) =====
  const filteredData = useMemo(() => {
    if (showFTYes) return data;
    return data.filter((row) => {
      const aciertoValue = String(row[H.acierto] ?? "").toLowerCase();
      return (
        aciertoValue === "verdadero" ||
        aciertoValue === "true" ||
        aciertoValue === "1"
      );
    });
  }, [data, showFTYes, H.acierto]);

  // ===== definición de columnas =====
  const columns = useMemo(() => {
    return [
      {
        accessorKey: H.customId,
        header: "CustomId",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          return (
            <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {cellValue}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Identificador único de la pregunta" },
      },
      {
        accessorKey: H.respuestaModelo,
        header: "Respuesta Modelo",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          return (
            <span className="text-sm font-semibold text-blue-700 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              {cellValue.toUpperCase()}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Respuesta dada por el modelo (a, b, c, d)" },
      },
      {
        accessorKey: H.logprobLetra,
        header: "Logprob Letra",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          return cellValue ? (
            <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
              {cellValue}
            </span>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Log probability de la letra de respuesta" },
      },
      {
        accessorKey: H.topLogprobs,
        header: "Top Logprobs",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          const isEmpty =
            !cellValue || cellValue === "[]" || cellValue.trim() === "";
          return (
            <span
              className={`text-xs px-2 py-1 rounded ${
                isEmpty
                  ? "text-gray-400 bg-gray-50"
                  : "text-purple-700 bg-purple-50 font-mono"
              }`}
            >
              {isEmpty ? "Empty" : "Data"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Top log probabilities del modelo" },
      },
      {
        accessorKey: H.respuestaReal,
        header: "Respuesta Real",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          return (
            <span className="text-sm font-semibold text-green-700 w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              {cellValue.toUpperCase()}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Respuesta correcta (a, b, c, d)" },
      },
      {
        accessorKey: H.acierto,
        header: "Acierto",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "").toLowerCase();
          const isCorrect =
            cellValue === "verdadero" ||
            cellValue === "true" ||
            cellValue === "1";
          const isIncorrect = 
            cellValue === "falso" ||
            cellValue === "false" ||
            cellValue === "0";
          
          return (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isCorrect
                  ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                  : isIncorrect
                  ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                  : "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200"
              }`}
            >
              {isCorrect ? "✓ Correcto" : isIncorrect ? "✗ Incorrecto" : "— En blanco"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Indica si el modelo acertó la respuesta" },
      },
      {
        accessorKey: H.respuestaCompleta,
        header: "Respuesta Completa",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "");
          const truncated =
            cellValue.length > 60
              ? cellValue.substring(0, 60) + "..."
              : cellValue;
          return (
            <div className="max-w-xs">
              <span
                className="text-sm text-gray-700 cursor-help"
                title={cellValue}
              >
                {truncated}
              </span>
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: true,
        meta: {
          getTooltip: () => "Respuesta completa del modelo con explicación",
        },
      },
    ];
  }, [H]);

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
      pagination: { pageSize: 20 },
    },
  });

  const getSortIcon = (column: { getIsSorted: () => string | false }) => {
    const sortDirection = column.getIsSorted();
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 ml-1" />;
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4 ml-1" />;
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filtro global (igual que antes) */}
      <div className="mb-4 flex justify-center">
        <div className="relative max-w-lg w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto divide-y divide-gray-200 min-w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const tooltip =
                      header.column.columnDef.meta?.getTooltip?.();
                    const headerName = String(
                      header.column.columnDef.header
                    ).toLowerCase();
                    const isAciertoColumn = headerName === "acierto";

                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 last:border-r-0 relative group"
                        onClick={
                          !isAciertoColumn
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        title={tooltip}
                      >
                        <div className="flex items-center">
                          <span className="relative">
                            {tooltip && (
                              <Info className="h-2.5 w-2.5 absolute -top-1 -left-2 text-gray-400 opacity-70" />
                            )}
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>

                          {/* checkbox para filtrar por aciertos */}
                          {isAciertoColumn ? (
                            <input
                              type="checkbox"
                              checked={showFTYes}
                              onChange={(e) => setShowFTYes(e.target.checked)}
                              className="ml-2 h-3 w-3 text-gray-500 rounded border-gray-300 focus:ring-gray-400"
                              title="Show all responses (unchecked = only correct answers)"
                            />
                          ) : (
                            getSortIcon(header.column)
                          )}
                        </div>

                        {/* tooltip flotante (igual que antes) */}
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
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border-r border-gray-200 last:border-r-0 break-words whitespace-normal px-4 py-2 text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación (igual que antes) */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            results
          </p>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
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
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
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

export default ModelDataTable;
