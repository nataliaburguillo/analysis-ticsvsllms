"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";

// ===== Carga de datos =====
import gemmaRaw from "../data/respuestas_gemma2-9b-it_evaluacion_temario.json";
import gpt4Raw from "../data/respuestas_gpt-4.1-mini_evaluacion_temario.json";
import mistralRaw from "../data/respuestas_mistral-saba-24b_evaluacion_temario.json";
import o4miniRaw from "../data/respuestas_o4-mini_evaluacion_temario.json";
import llamaRaw from "../data/respuestas_llama-4-scout-17b-16e-instruct_evaluacion_temario.json";

type Modelo = "gemma" | "mistral" | "llama" | "gpt4" | "o4mini";

type RowRecord = Record<string, string | number | boolean | null | undefined>;
type ModeloJson = { headers: string[]; data: RowRecord[] };

const MODELS: Record<Modelo, RowRecord[]> = {
  gemma: (gemmaRaw as ModeloJson).data ?? [],
  gpt4: (gpt4Raw as ModeloJson).data ?? [],
  mistral: (mistralRaw as ModeloJson).data ?? [],
  o4mini: (o4miniRaw as ModeloJson).data ?? [],
  llama: (llamaRaw as ModeloJson).data ?? [],
};

// ===== Tipos =====
interface TemaStats {
  tema: string;
  bloque?: string;
  aciertos: number;
  fallos: number;
  blanco: number;
  total: number;
  accuracyPct: number; // aciertos / (total - blanco) * 100
}

interface ChaptersTableProps {
  selectedModel?: Modelo;
}

// ===== Extiende meta de columnas (para tooltips) =====
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    tooltip?: string;
  }
}

// ===== Helpers =====
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
  row: { original: TemaStats },
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

// ===== Componente =====
const ChaptersTable: React.FC<ChaptersTableProps> = ({
  selectedModel = "gemma",
}) => {
  const [currentModel, setCurrentModel] = useState<Modelo>(selectedModel);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Agrupar por Tema
  const rows: TemaStats[] = useMemo(() => {
    const data = MODELS[currentModel] ?? [];
    const grouped: Record<
      string,
      Omit<TemaStats, "tema" | "accuracyPct"> & { bloque?: string }
    > = {};

    data.forEach((item) => {
      const tema = item["Tema"] ? String(item["Tema"]) : "Sin tema";
      if (!grouped[tema]) {
        grouped[tema] = {
          aciertos: 0,
          fallos: 0,
          blanco: 0,
          total: 0,
          bloque: (item["Bloque"] as string | undefined) ?? "",
        };
      }
      grouped[tema].total += 1;

      const respuestaVacia =
        item["Respuesta Modelo"] === "" || item["Respuesta Modelo"] == null;
      const aciertoEstricto = item["Acierto"] === true;
      if (respuestaVacia) {
        grouped[tema].blanco += 1;
      } else if (aciertoEstricto) {
        grouped[tema].aciertos += 1;
      } else {
        grouped[tema].fallos += 1;
      }
    });

    return Object.entries(grouped).map(([tema, s]) => {
      const denom = s.total - s.blanco;
      const accuracy = denom > 0 ? (s.aciertos / denom) * 100 : 0;
      return { tema, bloque: s.bloque ?? "", ...s, accuracyPct: accuracy };
    });
  }, [currentModel]);

  const columns: ColumnDef<TemaStats>[] = useMemo(
    () => [
      {
        accessorKey: "tema",
        header: "Tema",
        enableSorting: true,
        enableColumnFilter: true,
        meta: { tooltip: "Nombre del tema del temario" },
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900">
            {String(info.getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "bloque",
        header: "Bloque",
        meta: { tooltip: "Bloque temático de la pregunta" },
        cell: ({ getValue }) => {
          const cellValue = String(getValue() ?? "");
          let colorClass = "bg-gray-100 text-gray-700";
          if (cellValue.startsWith("A"))
            colorClass = "bg-indigo-50 text-indigo-700";
          else if (cellValue.startsWith("B"))
            colorClass = "bg-sky-50 text-sky-700";
          return (
            <span
              className={`text-xs font-mono px-2 py-1 rounded ${colorClass}`}
            >
              {cellValue}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: "aciertos",
        header: "Aciertos",
        enableSorting: true,
        meta: { tooltip: "Respuestas correctas" },
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {Number(getValue() ?? 0).toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "fallos",
        header: "Fallos",
        enableSorting: true,
        meta: { tooltip: "Respuestas incorrectas" },
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {Number(getValue() ?? 0).toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "blanco",
        header: "En blanco",
        enableSorting: true,
        meta: { tooltip: "Respuestas no contestadas en la forma correcta" },
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {Number(getValue() ?? 0).toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        enableSorting: true,
        meta: { tooltip: "Total de preguntas por tema" },
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {Number(getValue() ?? 0).toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "accuracyPct",
        header: "% Accuracy",
        enableSorting: true,
        meta: { tooltip: "Aciertos / (Total - Blancos) · 100" },
        cell: ({ getValue }) => {
          const pct = Number(getValue() ?? 0);
          const colorClass =
            pct >= 75
              ? "bg-green-50 text-green-800 ring-1 ring-inset ring-green-200"
              : pct >= 50
              ? "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200"
              : "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${colorClass}`}
            >
              {pct.toFixed(2)}%
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: customGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const getSortIcon = (column: {
    getIsSorted: () => false | "asc" | "desc";
  }) => {
    const sortDirection = column.getIsSorted();
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 ml-1" />;
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4 ml-1" />;
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  if (rows.length === 0) {
    return (
      <div className="p-6">
        <ModelSelector currentModel={currentModel} onChange={setCurrentModel} />
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <ModelSelector currentModel={currentModel} onChange={setCurrentModel} />

      {/* Filtro global */}
      <div className="mb-4 mt-3 flex justify-center">
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
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const tooltip = header.column.columnDef.meta?.tooltip;
                    const headerLabel = String(header.column.columnDef.header);
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 last:border-r-0 relative group"
                        onClick={header.column.getToggleSortingHandler()}
                        title={tooltip}
                      >
                        <div className="flex items-center">
                          <span className="relative">
                            {tooltip && (
                              <Info className="h-2.5 w-2.5 absolute -top-1 -left-2 text-gray-400 opacity-70" />
                            )}
                            {headerLabel}
                          </span>
                          {getSortIcon(header.column)}
                        </div>
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
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
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

      {/* Paginación */}
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

export default ChaptersTable;

// ====== Subcomponente: selector de modelo ======
const MODEL_LABELS: Record<Modelo, string> = {
  gemma: "Gemma 2-9b-it",
  gpt4: "GPT-4.1-mini",
  mistral: "Mistral Saba-24b",
  o4mini: "O4-mini",
  llama: "Llama 4 Scout-17b-16e",
};

const ModelSelector: React.FC<{
  currentModel: Modelo;
  onChange: (m: Modelo) => void;
}> = ({ currentModel, onChange }) => {
  const models: Modelo[] = ["gemma", "llama", "gpt4", "mistral", "o4mini"];
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-medium text-slate-700 text-sm">Modelo:</span>
      <div className="flex gap-1">
        {models.map((m) => {
          const active = currentModel === m;
          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 hover:font-bold hover:shadow-2xl
                ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm !font-bold"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              style={{
                letterSpacing: "0.01em",
              }}
            >
              {MODEL_LABELS[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
