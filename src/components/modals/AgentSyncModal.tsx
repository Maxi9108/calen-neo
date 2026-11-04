'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Cpu,
  Send,
  CheckCircle2,
  Server,
  Code2,
  Sparkles,
  Database,
  CloudUpload,
  FileSpreadsheet,
  FileText,
  Upload,
  CheckSquare,
  Square,
  Tent,
  Award,
  ArrowLeft,
  Wand2,
  Trash2,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  EventCategory,
  EventStatus,
  FastAPIAgentIngestRequest,
  SubCategoryTag,
} from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  CALENDAR_ORDER,
  EVENT_CATEGORY_META,
  EVENT_STATUS_META,
} from '@/config/neofaro-theme';
import { BackendConnectionMode } from '@/services/eventService';
import { getNextSaturdayToSaturdayRange } from '@/utils/dateUtils';
import {
  AnalyzedCandidateEvent,
  analyzeDocumentOrText,
  SAMPLE_TEXTS_BY_CALENDAR,
} from '@/utils/documentAnalyzer';
import { VercelAgentChatPanel } from './VercelAgentChatPanel';

interface AgentSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalendar: CalendarType;
  subCategories: SubCategoryTag[];
  backendMode: BackendConnectionMode;
  googleSheetsUrl: string;
  onUpdateGoogleSheetsUrl: (url: string) => Promise<void>;
  onPushAllToGoogleSheets: (overrideUrl?: string) => Promise<boolean>;
  onIngestPayload: (
    payload: FastAPIAgentIngestRequest
  ) => Promise<CalendarEvent[]>;
}

export function AgentSyncModal({
  isOpen,
  onClose,
  activeCalendar,
  subCategories,
  backendMode,
  googleSheetsUrl,
  onUpdateGoogleSheetsUrl,
  onPushAllToGoogleSheets,
  onIngestPayload,
}: AgentSyncModalProps) {
  const [activeTab, setActiveTab] = useState<
    'analyzer' | 'ai-sdk-chat' | 'sheets' | 'agent'
  >('analyzer');

  // Estado del Analizador de Texto / Documentos
  const [rawText, setRawText] = useState<string>(
    () => SAMPLE_TEXTS_BY_CALENDAR[activeCalendar].text
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<AnalyzedCandidateEvent[]>([]);
  const [analysisStep, setAnalysisStep] = useState<'input' | 'review'>('input');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [confirmedCount, setConfirmedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado de Google Sheets
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(googleSheetsUrl);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<
    'idle' | 'syncing' | 'ok' | 'error'
  >('idle');

  // Estado del Simulador JSON FastAPI
  const defaultSample = React.useMemo(() => {
    const satRange = getNextSaturdayToSaturdayRange(new Date());
    const samplePayload: FastAPIAgentIngestRequest = {
      agente_id: 'calen-neo-autonomous-agent',
      fuente:
        activeCalendar === 'academico'
          ? 'moodle-campus-ungs-scraper'
          : activeCalendar === 'scout'
          ? 'whatsapp-consejo-grupo-parser'
          : 'jira-linear-webhook-sync',
      eventos: [
        activeCalendar === 'scout'
          ? {
              titulo: 'Raid y Acantonamiento Inter-Ramas (Sábado a Sábado)',
              descripcion:
                'Detectado por el agente desde el acta del Consejo de Grupo.',
              fecha_inicio: satRange.startDate,
              fecha_fin: satRange.endDate,
              tipo_calendario: 'scout',
              categoria: 'actividad',
              estado: 'pendiente',
              completado: false,
              origen: 'agente_ia',
              subcategoria_id: 'scout-caminantes',
              es_sabado_a_sabado: true,
              ubicacion: 'Parque Pereyra Iraola',
            }
          : activeCalendar === 'academico'
          ? {
              titulo: 'Defensa Coloquio TP Integrador + Puntos Extra',
              descripcion:
                'Extraído automáticamente del aula virtual UNGS.',
              fecha_inicio: satRange.startDate,
              fecha_fin: satRange.startDate,
              tipo_calendario: 'academico',
              categoria: 'evento_con_puntos',
              estado: 'en_proceso',
              completado: false,
              origen: 'agente_ia',
              subcategoria_id: 'ungs-prog3',
              puntos_obtenidos: 20,
              puntos_maximos: 25,
              ubicacion: 'Laboratorio 7104 · UNGS',
            }
          : {
              titulo: 'Despliegue Microservicio FastAPI v1.2 en Producción',
              descripcion: 'Sincronizado por el agente de CI/CD.',
              fecha_inicio: satRange.startDate,
              fecha_fin: satRange.startDate,
              tipo_calendario: 'trabajo',
              categoria: 'tarea',
              estado: 'pendiente',
              completado: false,
              origen: 'agente_ia',
              subcategoria_id: 'work-ops',
              ubicacion: 'Cluster Cloud / Prod',
            },
      ],
    };
    return JSON.stringify(samplePayload, null, 2);
  }, [activeCalendar]);

  const [jsonInput, setJsonInput] = useState<string>(defaultSample);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [keyPointsToConsider, setKeyPointsToConsider] = useState<string[]>([]);

  React.useEffect(() => {
    setSheetUrlInput(googleSheetsUrl);
  }, [googleSheetsUrl, isOpen]);

  React.useEffect(() => {
    setJsonInput(defaultSample);
    setErrorMsg(null);
    setSuccessCount(null);
  }, [defaultSample, isOpen]);

  if (!isOpen) return null;

  // Subir documento (.txt, .md, .csv, .ics, .json, .pdf o imagen)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setConfirmedCount(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImagePreviewUrl(dataUrl);
        setRawText(
          `[Documento / Apunte Visual: ${file.name}]\n- Extraer temas, entregas y conceptos a tener en cuenta de la imagen.\n- Recomendar calendario de estudio para los temas identificados.`
        );
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
      try {
        const textContent = await file.text();
        setRawText(textContent);
      } catch {
        setRawText(`[Archivo cargado: ${file.name}]`);
      }
    }
  };

  // Generar recomendación de calendario cuando el texto no tiene fechas o es un temario
  const handleGenerateRecommendedSchedule = () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.replace(/^[-*•0-9.)\s]+/, '').trim())
      .filter((l) => l.length > 3 && !l.startsWith('[') && !l.startsWith('#'))
      .slice(0, 5);

    const topics = lines.length > 0 ? lines : [
      'Conceptos fundamentales y teoría',
      'Resolución de ejercicios prácticos',
      'Casos de estudio y diseño',
      'Repaso general y simulación de examen',
    ];

    const today = new Date();
    const generatedCandidates: AnalyzedCandidateEvent[] = topics.map((topic, index) => {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + (index + 1) * 3); // Cada 3 días

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');

      const start = `${yyyy}-${mm}-${dd}T19:00`;
      const end = `${yyyy}-${mm}-${dd}T20:30`;

      return {
        tempId: `cand-rec-${Date.now().toString(36)}-${index}`,
        sourceSnippet: topic,
        confidence: 'alta' as const,
        detectedReasons: ['Calendario de estudio recomendado automáticamente por el sistema'],
        selected: true,
        dto: {
          titulo: `Sesión de Estudio: ${topic}`,
          descripcion: `Bloque de práctica recomendado para consolidar: "${topic}".`,
          fecha_inicio: start,
          fecha_fin: end,
          tipo_calendario: activeCalendar,
          categoria: 'tarea',
          estado: 'pendiente',
          completado: false,
          origen: 'agente_ia',
          subcategoria_id: subCategories.find((s) => s.calendarType === activeCalendar)?.id,
        },
      };
    });

    setCandidates(generatedCandidates);
    setAnalysisStep('review');
  };

  // Ejecutar análisis del texto o documento
  const handleRunAnalysis = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    setConfirmedCount(null);

    // Extraer lista de puntos a tener en cuenta
    const considerations = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 6 && !l.startsWith('#') && !l.startsWith('['))
      .slice(0, 6);
    setKeyPointsToConsider(considerations);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          defaultCalendar: activeCalendar,
          subCategories,
          fileName: uploadedFileName || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      } else {
        const fallback = analyzeDocumentOrText(
          rawText,
          activeCalendar,
          subCategories,
          new Date(),
          uploadedFileName || undefined
        );
        setCandidates(fallback);
      }
      setAnalysisStep('review');
    } catch {
      const fallback = analyzeDocumentOrText(
        rawText,
        activeCalendar,
        subCategories,
        new Date(),
        uploadedFileName || undefined
      );
      setCandidates(fallback);
      setAnalysisStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Actualizar un candidato antes de confirmar
  const handleUpdateCandidate = (
    tempId: string,
    updater: (prev: AnalyzedCandidateEvent) => AnalyzedCandidateEvent
  ) => {
    setCandidates((prev) =>
      prev.map((item) => (item.tempId === tempId ? updater(item) : item))
    );
  };

  // Confirmar e incorporar los eventos seleccionados por el usuario
  const handleConfirmSelectedCandidates = async () => {
    const selectedList = candidates.filter((c) => c.selected);
    if (selectedList.length === 0) return;

    setIsSending(true);
    try {
      const payload: FastAPIAgentIngestRequest = {
        agente_id: 'calen-neo-document-analyzer',
        fuente: uploadedFileName || 'texto-analizado-confirmado',
        texto_original: rawText,
        eventos: selectedList.map((c) => c.dto),
      };
      const created = await onIngestPayload(payload);
      setConfirmedCount(created.length);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAndPushSheets = async () => {
    setSheetSyncStatus('syncing');
    await onUpdateGoogleSheetsUrl(sheetUrlInput);
    const ok = await onPushAllToGoogleSheets(sheetUrlInput);
    setSheetSyncStatus(ok ? 'ok' : 'error');
  };

  const handleSendAgentPayload = async () => {
    setErrorMsg(null);
    setSuccessCount(null);
    setIsSending(true);
    try {
      const parsed: FastAPIAgentIngestRequest = JSON.parse(jsonInput);
      if (!parsed.eventos || !Array.isArray(parsed.eventos)) {
        throw new Error(
          'El JSON debe incluir un arreglo "eventos" con el contrato FastAPIEventDTO.'
        );
      }
      const created = await onIngestPayload(parsed);
      setSuccessCount(created.length);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al parsear el JSON'
      );
    } finally {
      setIsSending(false);
    }
  };

  const selectedCandidatesCount = candidates.filter((c) => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-slide-fade">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl neofaro-scrollbar">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-violet-600" />

        {/* Cabecera fija */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Analizador de Documentos · Google Sheets & IA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extraé fechas de textos o archivos, confirmá lo detectado y sincronizá con tu Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Solapas del Modal */}
        <div className="px-4 sm:px-6 pt-3 flex gap-1 sm:gap-2 border-b border-slate-200/70 dark:border-slate-800 overflow-x-auto neofaro-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('analyzer')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analyzer'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Analizar Texto / Doc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai-sdk-chat')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai-sdk-chat'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Chat Agente (Vercel AI SDK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Google Sheet (Drive 24/7)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'agent'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>4. Webhook JSON / FastAPI</span>
          </button>
        </div>

        {/* ==================== SOLAPA 2: CHAT AGENTE VERCEL AI SDK ==================== */}
        {activeTab === 'ai-sdk-chat' && (
          <div className="p-4 sm:p-6">
            <VercelAgentChatPanel onIngestConfirmedEvents={onIngestPayload} />
          </div>
        )}

        {/* ==================== SOLAPA 1: ANALIZADOR DE TEXTO / DOCUMENTO ==================== */}
        {activeTab === 'analyzer' && (
          <div className="p-4 sm:p-6 space-y-4">
            {analysisStep === 'input' ? (
              <>
                {/* Zona de Carga de Archivo + Ejemplos Rápidos */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.csv,.tsv,.ics,.json,.pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadedFileName
                          ? `Archivo: ${uploadedFileName}`
                          : 'Subir Documento (PDF, Imagen, TXT, CSV)'}
                      </span>
                    </button>

                    {uploadedFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName(null);
                          setImagePreviewUrl(null);
                        }}
                        className="text-xs text-slate-400 hover:text-rose-500"
                      >
                        Quitar archivo
                      </button>
                    )}
                  </div>

                  {/* Plantillas de prueba de 1 clic */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">
                      Probar con:
                    </span>
                    {CALENDAR_ORDER.map((calKey) => (
                      <button
                        key={calKey}
                        type="button"
                        onClick={() => {
                          setUploadedFileName(null);
                          setImagePreviewUrl(null);
                          setRawText(SAMPLE_TEXTS_BY_CALENDAR[calKey].text);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {calKey === 'academico'
                          ? 'Cronograma UNGS'
                          : calKey === 'scout'
                          ? 'Acta Scout'
                          : 'Minuta Trabajo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Previsualización si se cargó una imagen */}
                {imagePreviewUrl && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Documento cargado"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                    />
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-bold">Imagen / Apunte visual cargado</p>
                      <p className="text-[11px] text-slate-400">
                        El sistema analizará el texto y propondrá los temas clave y un calendario recomendado.
                      </p>
                    </div>
                  </div>
                )}

                {/* Área de Texto para pegar o editar el contenido del documento */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Pegá el texto del cronograma, temario, apuntes, WhatsApp o contenido a estudiar
                  </label>
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Pegá aquí fechas de parciales UNGS, temario que quieres aprender, cronograma de campamento o tareas laborales..."
                    className="w-full p-3.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Si tu documento no tiene fechas fijas, podés solicitar que recomiende un calendario de estudio automáticamente.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!rawText.trim()}
                      onClick={handleGenerateRecommendedSchedule}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all shrink-0"
                      title="Si no hay fechas fijas, distribuye los temas en un calendario sugerido"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Recomendar Calendario</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAnalyzing || !rawText.trim()}
                      onClick={handleRunAnalysis}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition-all shrink-0"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>
                        {isAnalyzing
                          ? 'Analizando...'
                          : 'Analizar e Identificar Eventos'}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* PASO 2: EXPOSICIÓN DE LO IDENTIFICADO Y CONFIRMACIÓN DEL USUARIO */
              <div className="space-y-4 animate-slide-fade">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Se identificaron {candidates.length} evento(s) en el texto/documento
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Revisá los datos detectados, modificá lo que necesites y marcá los que quieras confirmar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisStep('input');
                      setConfirmedCount(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Editar texto original</span>
                  </button>
                </div>

                {/* Lista de Puntos Clave a Tener en Cuenta detectados */}
                {keyPointsToConsider.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Lista de lo que debes tener en cuenta (conceptos y requisitos extraídos):
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc">
                      {keyPointsToConsider.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {candidates.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 space-y-3">
                    <p>No se detectaron fechas fijas en este texto.</p>
                    <button
                      type="button"
                      onClick={handleGenerateRecommendedSchedule}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recomendar Calendario de Estudio con estos temas</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 neofaro-scrollbar">
                    {candidates.map((cand) => {
                      const envMeta =
                        CALENDAR_ENVIRONMENTS[cand.dto.tipo_calendario];
                      const calSubs = subCategories.filter(
                        (s) => s.calendarType === cand.dto.tipo_calendario
                      );

                      return (
                        <div
                          key={cand.tempId}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            cand.selected
                              ? 'bg-white dark:bg-slate-900 border-indigo-500/40 shadow-neofaro-sm'
                              : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                          }`}
                        >
                          {/* Fila superior: Checkbox de Confirmación + Razones detectadas + Botón descartar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCandidate(cand.tempId, (prev) => ({
                                  ...prev,
                                  selected: !prev.selected,
                                }))
                              }
                              className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                            >
                              {cand.selected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                              <span>
                                {cand.selected
                                  ? 'Confirmado para importar'
                                  : 'Descartado (no se importará)'}
                              </span>
                            </button>

                            <div className="flex items-center flex-wrap gap-1">
                              {cand.detectedReasons.map((reason, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {reason}
                                </span>
                              ))}

                              <button
                                type="button"
                                onClick={() =>
                                  setCandidates((prev) =>
                                    prev.filter((i) => i.tempId !== cand.tempId)
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-rose-500"
                                title="Eliminar de la lista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Fragmento original expuesto */}
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 px-2.5 py-1.5 rounded-lg mb-3 truncate">
                            Texto origen: &ldquo;{cand.sourceSnippet}&rdquo;
                          </p>

                          {/* Campos editables para que el usuario ajuste antes de confirmar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Título Identificado
                              </label>
                              <input
                                type="text"
                                value={cand.dto.titulo}
                                onChange={(e) =>
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        titulo: e.target.value,
                                      },
                                    })
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Calendario Destino
                              </label>
                              <select
                                value={cand.dto.tipo_calendario}
                                onChange={(e) => {
                                  const nextCal = e.target
                                    .value as CalendarType;
                                  const firstSub = subCategories.find(
                                    (s) => s.calendarType === nextCal
                                  );
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        tipo_calendario: nextCal,
                                        subcategoria_id: firstSub?.id || null,
                                      },
                                    })
                                  );
                                }}
                                style={{ borderColor: envMeta.accentHex }}
                                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              >
                                <option value="academico">
                                  Académico UNGS
                                </option>
                                <option value="scout">Scout</option>
                                <option value="trabajo">Trabajo</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Categoría Detectada
                              </label>
                              <select
                                value={cand.dto.categoria}
                                onChange={(e) =>
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        categoria: e.target
                                          .value as EventCategory,
                                      },
                                    })
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              >
                                {(
                                  Object.keys(
                                    EVENT_CATEGORY_META
                                  ) as EventCategory[]
                                ).map((catKey) => (
                                  <option key={catKey} value={catKey}>
                                    {EVENT_CATEGORY_META[catKey].label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                {envMeta.subCategoryLabel}
                              </label>
                              <select
                                value={cand.dto.subcategoria_id || ''}
                                onChange={(e) =>
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        subcategoria_id:
                                          e.target.value || null,
                                      },
                                    })
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              >
                                <option value="">Sin etiqueta</option>
                                {calSubs.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.shortCode} · {sub.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Estado Inicial
                              </label>
                              <select
                                value={cand.dto.estado}
                                onChange={(e) => {
                                  const st = e.target.value as EventStatus;
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        estado: st,
                                        completado:
                                          st === 'completado' ||
                                          st === 'aprobado',
                                      },
                                    })
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              >
                                {(
                                  Object.keys(
                                    EVENT_STATUS_META
                                  ) as EventStatus[]
                                ).map((stKey) => (
                                  <option key={stKey} value={stKey}>
                                    {EVENT_STATUS_META[stKey].label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Fecha y Hora Inicio
                              </label>
                              <input
                                type="datetime-local"
                                value={cand.dto.fecha_inicio.slice(0, 16)}
                                onChange={(e) =>
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        fecha_inicio: e.target.value,
                                      },
                                    })
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                Fecha y Hora Fin
                              </label>
                              <input
                                type="datetime-local"
                                value={cand.dto.fecha_fin.slice(0, 16)}
                                onChange={(e) =>
                                  handleUpdateCandidate(
                                    cand.tempId,
                                    (prev) => ({
                                      ...prev,
                                      dto: {
                                        ...prev.dto,
                                        fecha_fin: e.target.value,
                                      },
                                    })
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(cand.dto.es_sabado_a_sabado)}
                                  onChange={(e) =>
                                    handleUpdateCandidate(
                                      cand.tempId,
                                      (prev) => ({
                                        ...prev,
                                        dto: {
                                          ...prev.dto,
                                          es_sabado_a_sabado: e.target.checked,
                                        },
                                      })
                                    )
                                  }
                                  className="rounded text-emerald-600"
                                />
                                <Tent className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Sábado a Sábado</span>
                              </label>

                              {cand.dto.categoria === 'evento_con_puntos' && (
                                <div className="flex items-center gap-1 text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
                                  <Award className="w-3.5 h-3.5" />
                                  <input
                                    type="number"
                                    value={cand.dto.puntos_maximos ?? 100}
                                    onChange={(e) =>
                                      handleUpdateCandidate(
                                        cand.tempId,
                                        (prev) => ({
                                          ...prev,
                                          dto: {
                                            ...prev.dto,
                                            puntos_maximos: Number(
                                              e.target.value
                                            ),
                                          },
                                        })
                                      )
                                    }
                                    className="w-14 px-1.5 py-0.5 text-xs rounded border border-fuchsia-500/40 bg-white dark:bg-slate-900"
                                  />
                                  <span>pts</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {confirmedCount !== null && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      ¡Confirmado! Se agregaron {confirmedCount} evento(s) al calendario y se sincronizaron con tu almacenamiento.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCandidates((prev) =>
                          prev.map((c) => ({ ...c, selected: true }))
                        )
                      }
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Seleccionar todos
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCandidates((prev) =>
                          prev.map((c) => ({ ...c, selected: false }))
                        )
                      }
                      className="text-xs font-semibold text-slate-500 hover:underline"
                    >
                      Deseleccionar todos
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      disabled={isSending || selectedCandidatesCount === 0}
                      onClick={handleConfirmSelectedCandidates}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSending
                          ? 'Guardando...'
                          : `Confirmar e Incorporar (${selectedCandidatesCount})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SOLAPA 2: GOOGLE SHEETS EN DRIVE (24/7) ==================== */}
        {activeTab === 'sheets' && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Estado de Persistencia en Google Drive
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {backendMode === 'google-sheets-drive'
                    ? '● Conectado a tu Google Sheet'
                    : '○ Modo Local / Pendiente de URL'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cada vez que confirmás eventos desde un documento, creás o marcás una actividad (UNGS, Scout o Trabajo), modificás colores o cambiás fondos desde el celular o la PC en Vercel, se guarda en tiempo real en 3 pestañas de tu propio Google Sheet: <strong>Eventos</strong>, <strong>Subcategorias</strong> y <strong>Configuracion</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                URL de tu Web App de Google Sheets (Apps Script)
              </label>
              <input
                type="url"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {sheetSyncStatus === 'ok' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  ¡Tus eventos, materias UNGS, ramas Scout y colores se guardaron en tu Google Sheet de Drive!
                </span>
              </div>
            )}

            {sheetSyncStatus === 'error' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                Verificá que la URL comience con{' '}
                <code className="font-mono">https://script.google.com/</code> y que en Google Apps Script hayas elegido acceso &ldquo;Cualquier persona&rdquo;.
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">
                Cómo vincular tu hoja de Google Drive en 2 minutos:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  Creá una hoja nueva en tu Google Drive y abrí{' '}
                  <strong>Extensiones → Apps Script</strong>.
                </li>
                <li>
                  Pegá el código de{' '}
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">
                    google-sheets-connector/Code.gs
                  </code>{' '}
                  y ejecutá <code className="font-mono">inicializarHojasCalenNeo</code>.
                </li>
                <li>
                  Tocá <strong>Implementar → Nueva implementación → Aplicación web</strong> (Acceso: <em>Cualquier persona</em>) y pegá la URL arriba.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={sheetSyncStatus === 'syncing'}
                onClick={handleSaveAndPushSheets}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <CloudUpload className="w-4 h-4" />
                <span>
                  {sheetSyncStatus === 'syncing'
                    ? 'Sincronizando con Google Drive...'
                    : 'Vincular y Volcar Datos Actuales al Sheet'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SOLAPA 3: WEBHOOK JSON / FASTAPI ==================== */}
        {activeTab === 'agent' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Server className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Destino de Datos</span>
                </div>
                <p className="text-xs font-mono mt-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {backendMode === 'google-sheets-drive'
                    ? '● Google Sheets (Drive)'
                    : '● API Serverless Next.js'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Endpoint Vercel 24/7</span>
                </div>
                <p className="text-[11px] font-mono mt-1 text-slate-500 dark:text-slate-400">
                  POST /api/events
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span>Contrato DTO</span>
                </div>
                <p className="text-[11px] font-mono mt-1 text-slate-500 dark:text-slate-400">
                  FastAPI + Google Sheets
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Payload JSON del Agente Automatizado
                </label>
                <span className="text-[11px] font-mono text-violet-500">
                  Guarda en Calendario + Google Sheet
                </span>
              </div>

              <textarea
                rows={10}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3.5 rounded-xl font-mono text-xs bg-slate-950 text-emerald-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {successCount !== null && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  ¡Se inyectaron {successCount} evento(s) del Agente y se sincronizaron con tu almacenamiento!
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendAgentPayload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSending
                    ? 'Procesando payload...'
                    : 'Simular POST del Agente Externo'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
