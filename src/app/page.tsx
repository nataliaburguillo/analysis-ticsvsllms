"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import DataTable from "@/components/DataTable";
import ChaptersTable from "@/components/ChaptersTable";
import ModelDataTable from "@/components/ModelDataTable";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";

import benchmarkData from "@/data/resumen_modelos.json";
import gpt from "@/data/respuestas_gpt-4.1-mini_evaluacion.json";
import gpt_logprobs from "@/data/respuestas_gpt-4.1-mini_evaluacion_v2_logprobs.json";
import gpt_no_option_logprobs from "@/data/respuestas_gpt-4.1-mini_evaluacion_v2_with_no_option_logprobs.json";
import mistral from "@/data/respuestas_mistral-saba-24b_evaluacion.json";
import gemma from "@/data/respuestas_gemma2-9b-it_evaluacion.json";
import o4 from "@/data/respuestas_o4-mini_evaluacion.json";

// Fila genérica (coincide con tu JSON)
type DataRow = Record<string, string | number | boolean | null | undefined>;

// (Si no lo usas, mejor elimina por completo para evitar warning)
// const MODEL_OPTIONS = [
//   { key: "gemma", label: "Gemma 2-9b-it" },
//   { key: "gpt4", label: "GPT-4.1-mini" },
//   { key: "mistral", label: "Mistral Saba-24b" },
// ];

type ModelData = {
  data: DataRow[];
  headers: string[];
};

export default function Home() {
  const { data, headers } = benchmarkData as {
    data: DataRow[];
    headers: string[];
  };

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  // El setter no se usa: renómbralo a _ para evitar no-unused-vars
  const [selectedModelForTopics, _setSelectedModelForTopics] = useState<
    "gemma" | "gpt4" | "mistral"
  >("gemma");

  // Mapeo de modelos a sus datasets
  const modelDataMap: Record<string, ModelData> = {
    "gpt-4.1-mini": gpt as ModelData,
    "gpt-4.1-mini_logprobs": gpt_logprobs as ModelData,
    "gpt-4.1-mini_no_option": gpt_no_option_logprobs as ModelData,
    "mistral-saba-24b": mistral as ModelData,
    "gemma2-9b-it": gemma as ModelData,
    "o4-mini": o4 as ModelData,
  };

  const handleModelClick = (
    modelName: string,
    logprobs?: string,
    noDoubt?: string
  ) => {
    if (modelName.includes("gpt-4.1-mini")) {
      const hasLogprobs =
        logprobs?.toLowerCase() === "sí" || logprobs?.toLowerCase() === "yes";
      const hasNoDoubt =
        noDoubt?.toLowerCase() === "sí" || noDoubt?.toLowerCase() === "yes";

      const key =
        hasLogprobs && hasNoDoubt
          ? "gpt-4.1-mini_no_option"
          : hasLogprobs
          ? "gpt-4.1-mini_logprobs"
          : "gpt-4.1-mini";

      setSelectedModel(key);
    } else {
      setSelectedModel(modelName);
    }
  };

  const handleBackClick = () => {
    setSelectedModel(null);
    setShowTopics(false);
  };

  const getModelData = (modelName: string): ModelData => {
    const exact = modelDataMap[modelName];
    if (exact) return exact;

    for (const [key, value] of Object.entries(modelDataMap)) {
      if (key.includes(modelName) || modelName.includes(key.split("_")[0])) {
        return value;
      }
    }
    return { data: [], headers: [] };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <motion.header
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedModel && (
                  <button
                    onClick={handleBackClick}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Volver al resumen"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {showTopics
                      ? "Accuracy por temas"
                      : selectedModel
                      ? `Detalles: ${selectedModel}`
                      : "TIC-QA Benchmark"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {showTopics
                      ? "Porcentaje de acierto por tema y modelo"
                      : selectedModel
                      ? "Respuestas detalladas del modelo"
                      : "Evaluación de LLMs en preguntas TIC"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {!selectedModel && (
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors ${
                      showTopics
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 hover:bg-blue-100 text-blue-700"
                    }`}
                    onClick={() => setShowTopics((prev) => !prev)}
                  >
                    Por temas
                  </button>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-blue-700 font-medium">
                    {
                      // únicos en la primera columna (sin `any`)
                      new Set(
                        data.map(
                          (row) =>
                            row[headers[0]] as
                              | string
                              | number
                              | boolean
                              | null
                              | undefined
                        )
                      ).size
                    }
                  </span>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.section
            key={selectedModel || (showTopics ? "topics" : "summary")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-8">
                {showTopics ? (
                  <ChaptersTable selectedModel={selectedModelForTopics} />
                ) : selectedModel ? (
                  <ModelDataTable
                    data={getModelData(selectedModel).data}
                    headers={getModelData(selectedModel).headers}
                  />
                ) : (
                  <DataTable
                    data={data}
                    headers={headers}
                    onModelClick={handleModelClick}
                  />
                )}
              </div>
            </div>
          </motion.section>

          <motion.footer
            className="mt-16 pt-8 border-t border-slate-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center">
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">
                  Natalia Burguillo Martín
                </span>{" "}
                • Diseño de un Marco e Implementación de Evaluación para Grandes
                Modelos de Lenguaje en el Ámbito de las Tecnologías de la
                Información y las Comunicaciones • TFG ETSIT UPM
              </p>
            </div>
          </motion.footer>
        </div>
      </div>
    </main>
  );
}
