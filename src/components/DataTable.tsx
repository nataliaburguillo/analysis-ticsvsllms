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
  onModelClick?: (
    modelName: string,
    logprobs?: string,
    noDoubt?: string
  ) => void;
}

// Extender ColumnMeta para tooltip (igual que antes)
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    getTooltip?: () => string;
  }
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  headers,
  onModelClick,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFTYes, setShowFTYes] = useState(true); // checkbox FT (mismo comportamiento que antes)

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
      model: pick(["model"]),
      ft: pick(["ft"]),
      method: pick(["method", "metodo", "método"]),
      questions: pick(["questions", "preguntas", "n"]),
      pctAcc: pick([
        "% correct answers",
        "% aciertos",
        "aciertos %",
        "porcentaje aciertos",
        "correct answers",
      ]),
      pctScore: pick([
        "% corrected score",
        "% puntuación corregida",
        "% puntuacion corregida",
        "puntuacion %",
        "corrected score",
      ]),
      noDoubt: pick(["no doubt", "nodoubt", "doubt"]),
      logprobs: pick(["logprobs", "log probs", "logprobabilities"]),
    };
  }, [headers]);

  // ===== filtro FT (igual UX que antes: marcado = todo, desmarcado = solo FT=No) =====
  const filteredData = useMemo(() => {
    if (showFTYes) return data;
    return data.filter((row) => {
      const ftValue = String(row[H.ft] ?? "").toLowerCase();
      return ftValue === "no" || ftValue === "false" || ftValue === "0";
    });
  }, [data, showFTYes, H.ft]);

  // ===== definición de columnas (solo cambiadas las que son) =====
  const columns = useMemo(() => {
    return [
      {
        accessorKey: H.model,
        header: "Model",
        cell: (info: {
          getValue: () => unknown;
          row: { original: DataRow };
        }) => {
          const cellValue = String(info.getValue() ?? "");
          const rowData = info.row.original;
          const logprobs = String(rowData[H.logprobs] ?? "");
          const noDoubt = String(rowData[H.noDoubt] ?? "");

          return (
            <button
              onClick={() => onModelClick?.(cellValue, logprobs, noDoubt)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 transition-colors"
              title={`Ver detalles de ${cellValue}`}
            >
              {cellValue}
            </button>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () =>
            "Nombre del modelo base (haz clic para ver detalles)",
        },
      },
      {
        accessorKey: H.ft,
        header: "FT",
        cell: (info: { getValue: () => unknown }) => {
          const v = String(info.getValue() ?? "").toLowerCase();
          const isFT = v === "yes" || v === "true" || v === "1";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isFT
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
              }`}
              title={isFT ? "Fine-tuned" : "No fine-tuned"}
            >
              {isFT ? "Yes" : "No"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () =>
            "Indica si el modelo está fine-tuned (desmarca para ver solo FT=No)",
        },
      },
      {
        accessorKey: H.method,
        header: "Method",
        cell: (info: { getValue: () => unknown }) => {
          const cellValue = String(info.getValue() ?? "base");
          return (
            <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
              {cellValue}
            </code>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () => "Subvariante / método (carpeta dentro del modelo)",
        },
      },
      {
        accessorKey: H.questions,
        header: "Questions",
        cell: (info: { getValue: () => unknown }) => {
          const n = Number(info.getValue() ?? 0);
          return (
            <span className="text-sm tabular-nums text-black">
              {Number.isFinite(n) ? n.toLocaleString("en-US") : "-"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Número de preguntas evaluadas" },
      },
      {
        accessorKey: H.pctAcc,
        header: "% Correct answers",
        cell: (info: { getValue: () => unknown }) => {
          const val = Number(info.getValue() ?? 0);
          const pct = Number.isFinite(val) ? val : 0;

          // Determinar color según el porcentaje
          let colorClass = "";
          if (pct >= 75) {
            colorClass =
              "bg-green-50 text-green-800 ring-1 ring-inset ring-green-200";
          } else if (pct >= 50) {
            colorClass =
              "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200";
          } else {
            colorClass =
              "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200";
          }

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${colorClass}`}
            >
              {pct.toFixed(2)}%
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: { getTooltip: () => "Aciertos / Questions · 100" },
      },
      {
        accessorKey: H.pctScore,
        header: "% Corrected Score",
        cell: (info: { getValue: () => unknown }) => {
          const val = Number(info.getValue() ?? 0);
          const pct = Number.isFinite(val) ? val : 0;

          // Determinar color según el porcentaje
          let colorClass = "";
          if (pct >= 75) {
            colorClass =
              "bg-green-50 text-green-800 ring-1 ring-inset ring-green-200";
          } else if (pct >= 50) {
            colorClass =
              "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200";
          } else {
            colorClass =
              "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200";
          }

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${colorClass}`}
            >
              {pct.toFixed(2)}%
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () =>
            "Corrección por fallo: (+1 acierto, 0 blanco, penalización por fallo) / Questions · 100",
        },
      },
      {
        accessorKey: H.noDoubt,
        header: "No Doubt",
        cell: (info: { getValue: () => unknown }) => {
          const v = String(info.getValue() ?? "").toLowerCase();
          const isNoDoubt =
            v === "yes" ||
            v === "sí" ||
            v === "si" ||
            v === "true" ||
            v === "1";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isNoDoubt
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200"
              }`}
              title={isNoDoubt ? "Sin incertidumbre" : "Con incertidumbre"}
            >
              {isNoDoubt ? "Sí" : "No"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () =>
            "Indica si el modelo tenía opción de no responder, y no inventar en caso de duda",
        },
      },
      {
        accessorKey: H.logprobs,
        header: "Logprobs",
        cell: (info: { getValue: () => unknown }) => {
          const v = String(info.getValue() ?? "").toLowerCase();
          const hasLogprobs =
            v === "yes" ||
            v === "sí" ||
            v === "si" ||
            v === "true" ||
            v === "1";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                hasLogprobs
                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                  : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200"
              }`}
              title={
                hasLogprobs ? "Con log probabilities" : "Sin log probabilities"
              }
            >
              {hasLogprobs ? "Sí" : "No"}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          getTooltip: () =>
            "Indica si se utilizaron log probabilities en la evaluación",
        },
      },
    ];
  }, [H, onModelClick]);

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
                    const isFTColumn = headerName === "ft";

                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 last:border-r-0 relative group"
                        onClick={
                          !isFTColumn
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

                          {/* checkbox FT en la cabecera (igual UX que antes) */}
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

export default DataTable;
