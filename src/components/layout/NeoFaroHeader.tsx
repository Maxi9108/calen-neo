'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Compass,
  Briefcase,
  Calendar as CalendarIcon,
  Columns,
  Palette,
  Cpu,
  Sun,
  Moon,
  Plus,
  Search,
  Layers,
  Menu,
  X,
  BookOpen,
  Bot,
  Download,
} from 'lucide-react';
import { CalendarType, CalendarViewMode } from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  CALENDAR_ORDER,
} from '@/config/neofaro-theme';
import { MONTHS_ES, getWeekDays } from '@/utils/dateUtils';
import { BackendConnectionMode } from '@/services/eventService';

interface NeoFaroHeaderProps {
  activeCalendar: CalendarType;
  onSelectCalendar: (cal: CalendarType) => void;
  onPrevCalendar: () => void;
  onNextCalendar: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  currentDate: Date;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showAllCalendarsOverlay: boolean;
  onToggleAllCalendars: () => void;
  onOpenNewEvent: () => void;
  onOpenCustomizer: () => void;
  onOpenAgentModal: () => void;
  onOpenSubjectManager?: () => void;
  onOpenCoachModal?: () => void;
  onOpenExportModal?: () => void;
  onToggleMobileSidebar: () => void;
  backendMode: BackendConnectionMode;
  isSyncing: boolean;
}

const CALENDAR_ICONS: Record<CalendarType, React.ReactNode> = {
  academico: <GraduationCap className="w-4 h-4 shrink-0" />,
  scout: <Compass className="w-4 h-4 shrink-0" />,
  trabajo: <Briefcase className="w-4 h-4 shrink-0" />,
};

export function NeoFaroHeader({
  activeCalendar,
  onSelectCalendar,
  onPrevCalendar,
  onNextCalendar,
  viewMode,
  onViewModeChange,
  currentDate,
  onPrevPeriod,
  onNextPeriod,
  onToday,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  showAllCalendarsOverlay,
  onToggleAllCalendars,
  onOpenNewEvent,
  onOpenCustomizer,
  onOpenAgentModal,
  onOpenSubjectManager,
  onOpenCoachModal,
  onOpenExportModal,
  onToggleMobileSidebar,
  backendMode,
  isSyncing,
}: NeoFaroHeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];
  const currentIdx = CALENDAR_ORDER.indexOf(activeCalendar);
  const prevCal =
    CALENDAR_ENVIRONMENTS[
      CALENDAR_ORDER[
        (currentIdx - 1 + CALENDAR_ORDER.length) % CALENDAR_ORDER.length
      ]
    ];
  const nextCal =
    CALENDAR_ENVIRONMENTS[
      CALENDAR_ORDER[(currentIdx + 1) % CALENDAR_ORDER.length]
    ];

  const periodTitle = React.useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    const week = getWeekDays(currentDate);
    const first = week[0];
    const last = week[6];
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()}–${last.getDate()} ${MONTHS_ES[
        first.getMonth()
      ].slice(0, 3)} ${first.getFullYear()}`;
    }
    return `${first.getDate()} ${MONTHS_ES[first.getMonth()].slice(
      0,
      3
    )} – ${last.getDate()} ${MONTHS_ES[last.getMonth()].slice(0, 3)}`;
  }, [currentDate, viewMode]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-300">
      {/* Franja superior de acento ambiental NeoFaro */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${envMeta.headerGradient} transition-all duration-500`}
      />

      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-col gap-2.5">
        {/* Fila 1: Identidad + Selector de Calendarios por Flechas + Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Sub-fila Superior en Móvil: Botón Menú + Título del Calendario + Acciones Rápidas */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0"
                aria-label="Abrir menú y filtros"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${envMeta.badgeClasses} transition-all duration-300 truncate`}
                  >
                    {CALENDAR_ICONS[activeCalendar]}
                    <span className="truncate">{envMeta.institutionTag}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {currentIdx + 1}/{CALENDAR_ORDER.length}
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {envMeta.title}
                </h1>
              </div>
            </div>

            {/* Acciones Rápidas Móvil (Materias/Roadmap, Coach, Descargar, Búsqueda, Modo Claro/Oscuro, + Nuevo) */}
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              {onOpenSubjectManager && (
                <button
                  type="button"
                  onClick={onOpenSubjectManager}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs"
                  aria-label="Gestionar Materias y Roadmap"
                  title="Materias, Altas, Bajas, Archivo y Roadmap"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Materias</span>
                </button>
              )}

              {onOpenCoachModal && (
                <button
                  type="button"
                  onClick={onOpenCoachModal}
                  className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                  aria-label="Coach y Rutinas"
                  title="Coach & Rutinas"
                >
                  <Bot className="w-4 h-4" />
                </button>
              )}

              {onOpenExportModal && (
                <button
                  type="button"
                  onClick={onOpenExportModal}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                  aria-label="Descargar agenda"
                  title="Descargar agenda (.ics, .csv, .md)"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className={`p-2 rounded-xl border transition-all ${
                  mobileSearchOpen || searchQuery
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                }`}
                aria-label="Buscar eventos"
              >
                {mobileSearchOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                aria-label="Alternar tema"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenNewEvent}
                style={{ backgroundColor: envMeta.accentHex }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo</span>
              </button>
            </div>
          </div>

          {/* Selector Dinámico de Calendarios con Flechas Indicadoras (Adaptado a Pulgar en Móvil y Escritorio) */}
          <div className="w-full lg:w-auto flex items-center justify-between gap-1 bg-slate-100/95 dark:bg-slate-950/95 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-inner">
            <button
              type="button"
              onClick={onPrevCalendar}
              title={`Anterior: ${prevCal.title}`}
              className="group flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0"
              aria-label={`Cambiar a ${prevCal.title}`}
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden xl:inline text-[11px] text-slate-400">
                {prevCal.id === 'academico'
                  ? 'UNGS'
                  : prevCal.id === 'scout'
                  ? 'Scout'
                  : 'Trabajo'}
              </span>
            </button>

            <div className="flex-1 flex items-center gap-1">
              {CALENDAR_ORDER.map((calKey) => {
                const item = CALENDAR_ENVIRONMENTS[calKey];
                const isActive = activeCalendar === calKey;
                return (
                  <button
                    key={calKey}
                    type="button"
                    onClick={() => onSelectCalendar(calKey)}
                    className={`flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? `${item.activeTabClasses} scale-[1.01]`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    {CALENDAR_ICONS[calKey]}
                    <span className="truncate">
                      {calKey === 'academico' ? (
                        <>
                          <span className="sm:hidden">UNGS</span>
                          <span className="hidden sm:inline">Académico UNGS</span>
                        </>
                      ) : calKey === 'scout' ? (
                        'Scout'
                      ) : (
                        'Trabajo'
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onNextCalendar}
              title={`Siguiente: ${nextCal.title}`}
              className="group flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0"
              aria-label={`Cambiar a ${nextCal.title}`}
            >
              <span className="hidden xl:inline text-[11px] text-slate-400">
                {nextCal.id === 'academico'
                  ? 'UNGS'
                  : nextCal.id === 'scout'
                  ? 'Scout'
                  : 'Trabajo'}
              </span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Derecha en Escritorio (lg+): Estado FastAPI, Personalización, Tema y Nuevo Evento */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {onOpenCoachModal && (
              <button
                type="button"
                onClick={onOpenCoachModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm"
                title="Coach de Estudio, Rutinas (Gym/Trabajo) y Prompts Gemini"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Coach & Rutinas</span>
              </button>
            )}

            {onOpenSubjectManager && (
              <button
                type="button"
                onClick={onOpenSubjectManager}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="Gestor de Materias, altas, bajas, archivo y Roadmap"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>{envMeta.subCategoryLabel} & Roadmap</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAgentModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
              title="Conexión con Google Sheets (Drive) 24/7 y Agente Automatizado"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSyncing
                    ? 'bg-amber-400 animate-ping'
                    : backendMode === 'google-sheets-drive' ||
                      backendMode === 'fastapi-live'
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500'
                }`}
              />
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {backendMode === 'google-sheets-drive'
                  ? 'Analizar Doc · Sheets 24/7'
                  : backendMode === 'fastapi-live'
                  ? 'Analizar Doc · FastAPI'
                  : 'Analizar Texto / Doc'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Personalizar colores de materias/ramas y fondos"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>Estilos y Colores</span>
            </button>

            {onOpenExportModal && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
                title="Descargar calendario seleccionado o todos completos con detalles"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Descargar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Alternar modo claro/oscuro"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenNewEvent}
              style={{ backgroundColor: envMeta.accentHex }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Desplegable en Móvil */}
        {mobileSearchOpen && (
          <div className="lg:hidden relative animate-slide-fade">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar materia, TP, campamento o tarea..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Fila 2: Navegación de Mes/Semana y Conmutador de Vista */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
          {/* Controles de fecha */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-neofaro-sm shrink-0">
              <button
                type="button"
                onClick={onPrevPeriod}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
                aria-label="Periodo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToday}
                className="px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={onNextPeriod}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
                aria-label="Periodo siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
              {periodTitle}
            </h2>
          </div>

          {/* Buscador en escritorio + Superponer + Conmutador Mensual/Semanal */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden lg:block relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar materia, TP, campamento..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-56 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={onToggleAllCalendars}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                showAllCalendarsOverlay
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Superponer eventos de los 3 calendarios simultáneamente"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3 en 1</span>
            </button>

            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange('month')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Mes</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('week')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
