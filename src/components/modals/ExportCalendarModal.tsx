'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  SubCategoryTag,
} from '@/types/calendar';
import { CALENDAR_ENVIRONMENTS } from '@/config/neofaro-theme';
import {
  generateICalendar,
  generateCalendarCSV,
  generateDetailedReportMarkdown,
  triggerFileDownload,
} from '@/utils/exportAndPrompts';

interface ExportCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalendar: CalendarType;
  events: CalendarEvent[];
  subCategories: SubCategoryTag[];
  subCategoryMap: Record<string, SubCategoryTag>;
}

export function ExportCalendarModal({
  isOpen,
  onClose,
  activeCalendar,
  events,
  subCategories,
  subCategoryMap,
}: ExportCalendarModalProps) {
  const [scope, setScope] = useState<'selected' | 'all'>('selected');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  // Eventos a exportar según el ámbito seleccionado
  const exportEvents = React.useMemo(() => {
    if (scope === 'selected') {
      return events.filter((e) => e.calendarType === activeCalendar);
    }
    return events;
  }, [scope, events, activeCalendar]);

  if (!isOpen) return null;

  const notifySuccess = (filename: string) => {
    setDownloadSuccess(`¡${filename} descargado exitosamente!`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadICS = () => {
    const filename =
      scope === 'selected'
        ? `Calen-Neo-${envMeta.id}.ics`
        : 'Calen-Neo-Agenda-Completa.ics';
    const content = generateICalendar(exportEvents);
    triggerFileDownload(filename, content, 'text/calendar;charset=utf-8');
    notifySuccess(filename);
  };

  const handleDownloadCSV = () => {
    const filename =
      scope === 'selected'
        ? `Calen-Neo-${envMeta.id}.csv`
        : 'Calen-Neo-Agenda-Completa.csv';
    const content = generateCalendarCSV(exportEvents, subCategoryMap);
    triggerFileDownload(filename, content, 'text/csv;charset=utf-8');
    notifySuccess(filename);
  };

  const handleDownloadMarkdown = () => {
    const title =
      scope === 'selected'
        ? `Informe Detallado: ${envMeta.title} (${envMeta.institutionTag})`
        : 'Informe Detallado Completo: Todos los Calendarios (UNGS, Scout, Trabajo)';
    const filename =
      scope === 'selected'
        ? `Detalle-${envMeta.id}.md`
        : 'Detalle-Completo-Calen-Neo.md';
    const content = generateDetailedReportMarkdown(
      title,
      exportEvents,
      subCategoryMap
    );
    triggerFileDownload(filename, content, 'text/markdown;charset=utf-8');
    notifySuccess(filename);
  };

  const handleDownloadJSON = () => {
    const filename =
      scope === 'selected'
        ? `Backup-${envMeta.id}.json`
        : 'Backup-Completo-Calen-Neo.json';
    const payload = {
      calenNeoVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      scope,
      calendarType: scope === 'selected' ? activeCalendar : 'all',
      totalEventos: exportEvents.length,
      eventos: exportEvents,
      materias: subCategories.filter(
        (s) => scope === 'all' || s.calendarType === activeCalendar
      ),
    };
    triggerFileDownload(
      filename,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    notifySuccess(filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Exportar y Descargar Calendario
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descargá el calendario actual o todos completos con todos los detalles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">
          {/* Selector de Ámbito: Calendario Seleccionado vs Todos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              ¿Qué deseas descargar?
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('selected')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scope === 'selected'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Solo Calendario Activo
                  </span>
                  {scope === 'selected' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {envMeta.title} ({events.filter((e) => e.calendarType === activeCalendar).length} eventos)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scope === 'all'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Todos los Calendarios
                  </span>
                  {scope === 'all' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Académico, Scout y Trabajo ({events.length} eventos completos)
                </p>
              </button>
            </div>
          </div>

          {/* Formatos de Descarga con detalles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Selecciona el Formato de Descarga:
            </label>

            <div className="space-y-2.5">
              {/* Formato 1: iCalendar (.ics) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      iCalendar estándar (.ics)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Importa tus eventos directamente en Google Calendar, Apple Calendar o Outlook.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadICS}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .ics</span>
                </button>
              </div>

              {/* Formato 2: Excel / Sheets (.csv) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Planilla de Cálculo (.csv)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tabla estructurada con ID, fechas, puntos, estado y descripción para Excel y Google Sheets.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .csv</span>
                </button>
              </div>

              {/* Formato 3: Informe Detallado Markdown (.md) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Informe Detallado Completo (.md)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Documento legible con resumen de estadísticas, materias, estados, puntos y notas de cada evento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .md</span>
                </button>
              </div>

              {/* Formato 4: Copia de Seguridad JSON (.json) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Copia de Seguridad JSON (.json)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Exportación estructurada de toda la base de datos con metadata técnica.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .json</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner de confirmación */}
          {downloadSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
