"use client";

import React, { useState, useMemo, useEffect } from "react";

// Importa los datos de todos los modelos
import gemmaRaw from "../data/respuestas_gemma2-9b-it_evaluacion_temario.json";
import gpt4Raw from "../data/respuestas_gpt-4.1-mini_evaluacion_temario.json";
import mistralRaw from "../data/respuestas_mistral-saba-24b_evaluacion_temario.json";
import o4miniRaw from "../data/respuestas_o4-mini_evaluacion_temario.json";
import preguntasRaw from "../data/preguntas_evaluacion.json";

type RowRecord = Record<string, string | number | boolean | null | undefined>;
type ModeloJson = { headers: string[]; data: RowRecord[] };

const MODELS = [
  {
    key: "gemma",
    label: "Gemma 2-9b-it",
    data: (gemmaRaw as ModeloJson).data ?? [],
  },
  {
    key: "gpt4",
    label: "GPT-4.1-mini",
    data: (gpt4Raw as ModeloJson).data ?? [],
  },
  {
    key: "mistral",
    label: "Mistral Saba-24b",
    data: (mistralRaw as ModeloJson).data ?? [],
  },
  {
    key: "o4mini",
    label: "O4-mini",
    data: (o4miniRaw as ModeloJson).data ?? [],
  },
];

// Carga preguntas base
const preguntasData = (preguntasRaw as ModeloJson).data ?? [];

function getAllQuestions() {
  return preguntasData.map((row) => ({
    ID: row["ID"],
    Pregunta: row["Texto Pregunta"] ?? "",
    Opciones: parseOpciones(String(row["Respuestas"] ?? "")),
    RespuestaCorrecta: row["Respuesta Correcta"] ?? "",
    Tema: row["Tema"] ?? "",
    Bloque: row["Bloque"] ?? "",
    Año: row["Año"] ?? "",
  }));
}

// Convierte el string de opciones en objeto {a:..., b:..., ...}
function parseOpciones(respuestas: string) {
  const opciones: Record<string, string> = {};
  respuestas.split("\n").forEach((line) => {
    const match = line.match(/^([a-d])\)\s*(.*)$/i);
    if (match) {
      opciones[match[1].toLowerCase()] = match[2];
    }
  });
  return opciones;
}

interface CompareModelsProps {
  onBack?: () => void;
}

const COLOR_MAP: Record<string, string> = {
  true: "bg-green-100 text-green-700 border-green-300",
  false: "bg-red-100 text-red-700 border-red-300",
  "": "bg-gray-50 text-gray-400 border-gray-200",
};

export default function CompareModels({ onBack }: CompareModelsProps) {
  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Extraer bloques únicos
  const bloques = useMemo(
    () =>
      Array.from(
        new Set(allQuestions.map((q) => String(q.Bloque)).filter(Boolean))
      ).sort(),
    [allQuestions]
  );

  // Estado para bloque y tema seleccionados
  const [selectedBloque, setSelectedBloque] = useState<string>(
    bloques[0] || ""
  );

  // Temas únicos para el bloque seleccionado
  const temas = useMemo(
    () =>
      Array.from(
        new Set(
          allQuestions
            .filter((q) => q.Bloque === selectedBloque)
            .map((q) => String(q.Tema))
            .filter(Boolean)
        )
      ).sort((a, b) => Number(a) - Number(b)),
    [allQuestions, selectedBloque]
  );

  // Estado para tema seleccionado
  const [selectedTema, setSelectedTema] = useState<string>("");

  // Sincroniza el tema seleccionado cuando cambian los temas disponibles
  useEffect(() => {
    if (!temas.includes(selectedTema)) {
      setSelectedTema(temas[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBloque, temas.join(",")]);

  // Filtrar preguntas por bloque y tema, y ordenarlas por ID
  const filteredQuestions = useMemo(
    () =>
      allQuestions
        .filter(
          (q) =>
            String(q.Bloque) === selectedBloque &&
            String(q.Tema) === selectedTema
        )
        .sort((a, b) => Number(a.ID) - Number(b.ID)),
    [allQuestions, selectedBloque, selectedTema]
  );

  // Estado para pregunta actual
  const [current, setCurrent] = useState(0);

  // Reinicia el índice de pregunta cuando cambia el filtro
  useEffect(() => {
    setCurrent(0);
  }, [selectedTema, selectedBloque, filteredQuestions.length]);

  const currentQ = filteredQuestions[current];

  // Recoge la respuesta de cada modelo para la pregunta actual
  const modelAnswers = useMemo(
    () =>
      currentQ
        ? MODELS.map((model) => {
            const row =
              model.data.find(
                (r) =>
                  String(r["ID"] ?? r["CustomId"] ?? "") === String(currentQ.ID)
              ) || {};
            return {
              key: model.key,
              label: model.label,
              respuesta: row["Respuesta Modelo"] ?? "",
              acierto: row["Acierto"] ?? "",
              respuestaCompleta: row["Respuesta Completa"] ?? "",
            };
          })
        : [],
    [currentQ]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shadow border border-slate-200"
        >
          ← Volver
        </button>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-slate-700">
            Bloque:
            <select
              className="ml-2 px-2 py-1 rounded border border-slate-300 bg-white text-slate-800"
              value={selectedBloque}
              onChange={(e) => setSelectedBloque(e.target.value)}
            >
              {bloques.map((bloque) => (
                <option key={bloque} value={bloque}>
                  {bloque}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Tema:
            <select
              className="ml-2 px-2 py-1 rounded border border-slate-300 bg-white text-slate-800"
              value={selectedTema}
              onChange={(e) => setSelectedTema(e.target.value)}
            >
              {temas.map((tema) => (
                <option key={tema} value={tema}>
                  {tema}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-600">
            Pregunta {current + 1} de {filteredQuestions.length}
          </span>
          <button
            onClick={() =>
              setCurrent((c) => Math.min(filteredQuestions.length - 1, c + 1))
            }
            disabled={current === filteredQuestions.length - 1}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {currentQ ? (
        <>
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 mb-6">
            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Tema</div>
                <div className="text-base font-semibold text-blue-700">
                  {currentQ.Tema}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Bloque</div>
                <div className="text-base font-semibold text-indigo-700">
                  {currentQ.Bloque}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">ID</div>
                <div className="text-base font-semibold text-slate-700">
                  {currentQ.ID}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  Respuesta correcta
                </div>
                <div className="text-base font-semibold text-green-700">
                  {currentQ.RespuestaCorrecta}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs text-slate-500 font-medium mb-1">
                Pregunta
              </div>
              <div className="text-slate-800 font-medium">
                {currentQ.Pregunta}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs text-slate-500 font-medium mb-1">
                Opciones
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(currentQ.Opciones).map(([letra, texto]) => (
                  <div
                    key={letra}
                    className={`rounded px-3 py-2 border ${
                      letra === currentQ.RespuestaCorrecta
                        ? "border-green-400 bg-green-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-slate-500 mr-2">
                      {letra.toUpperCase()}.
                    </span>
                    <span className="text-slate-700 text-sm">{texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Respuestas de los modelos
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {modelAnswers.map((ans) => (
                <div
                  key={ans.key}
                  className={`rounded-lg border px-4 py-3 flex flex-col items-center text-center ${
                    COLOR_MAP[String(ans.acierto)]
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                    {ans.label}
                  </div>
                  <div className="text-2xl font-bold">
                    {ans.respuesta || <span className="text-gray-400">–</span>}
                  </div>
                  <div className="text-xs mt-1 mb-2">
                    {ans.acierto === true || ans.acierto === "true"
                      ? "Acierto"
                      : ans.acierto === false || ans.acierto === "false"
                      ? "Fallo"
                      : "Sin respuesta"}
                  </div>
                  <div className="text-xs text-slate-600 text-left max-h-32 overflow-y-auto border-t pt-2 w-full">
                    <span className="block font-semibold text-slate-500 mb-1">
                      Respuesta completa:
                    </span>
                    <span className="whitespace-pre-line">
                      {ans.respuestaCompleta || (
                        <span className="text-gray-400">Sin explicación</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-slate-500 py-12">
          No hay preguntas para este filtro.
        </div>
      )}
    </div>
  );
}
