'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Tent,
  Award,
  Sparkles,
  Plus,
  SlidersHorizontal,
  Palette,
  Cpu,
  ArrowRightLeft,
} from 'lucide-react';
import { useCalendarState } from '@/hooks/useCalendarState';
import {
  BACKGROUND_STYLES,
  CALENDAR_ENVIRONMENTS,
} from '@/config/neofaro-theme';
import { CalendarEvent } from '@/types/calendar';
import { NeoFaroSidebar } from '@/components/layout/NeoFaroSidebar';
import { NeoFaroHeader } from '@/components/layout/NeoFaroHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { EventFormModal } from '@/components/modals/EventFormModal';
import { CustomizerModal } from '@/components/modals/CustomizerModal';
import { AgentSyncModal } from '@/components/modals/AgentSyncModal';

export function CalendarContainer() {
  const {
    activeCalendar,
    selectCalendar,
    goToPreviousCalendar,
    goToNextCalendar,
    viewMode,
    setViewMode,
    currentDate,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    darkMode,
    setDarkMode,
    events,
    filteredEvents,
    subCategories,
    activeSubCategories,
    subCategoryMap,
    activeBackgroundStyle,
    setActiveBackgroundStyle,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    searchQuery,
    setSearchQuery,
    showAllCalendarsOverlay,
    setShowAllCalendarsOverlay,
    addOrUpdateEvent,
    toggleEventCompleted,
    deleteEvent,
    ingestFromAgent,
    updateSubCategoryColor,
    addSubCategoryTag,
    resetDemoData,
    backendMode,
    isSyncing,
    googleSheetsUrl,
    updateGoogleSheetsUrl,
    pushCurrentStateToGoogleSheets,
  } = useCalendarState();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [modalDefaultDate, setModalDefaultDate] = useState<Date | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Atajos de teclado Alt + Flecha Izquierda / Derecha para cambiar entre Calendario Académico, Scout y Trabajo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousCalendar();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextCalendar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousCalendar, goToNextCalendar]);

  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];
  const bgMeta = BACKGROUND_STYLES[activeBackgroundStyle];

  // Métricas rápidas del calendario activo
  const stats = React.useMemo(() => {
    const pending = filteredEvents.filter(
      (e) => e.status === 'pendiente'
    ).length;
    const inProgress = filteredEvents.filter(
      (e) => e.status === 'en_proceso'
    ).length;
    const done = filteredEvents.filter(
      (e) =>
        e.completed || e.status === 'completado' || e.status === 'aprobado'
    ).length;
    const satToSat = filteredEvents.filter(
      (e) => e.isSaturdayToSaturday
    ).length;
    const aiInjected = filteredEvents.filter(
      (e) => e.origin === 'agente_ia'
    ).length;
    return { pending, inProgress, done, satToSat, aiInjected };
  }, [filteredEvents]);

  const handleOpenNewEvent = (date?: Date) => {
    setSelectedEvent(null);
    setModalDefaultDate(date || new Date());
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setModalDefaultDate(null);
    setIsEventModalOpen(true);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedSubCategoryId !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen flex bg-neofaro-bg-light dark:bg-neofaro-bg-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Barra Lateral NeoFaro (Fija en Desktop, Drawer en Celular) */}
      <NeoFaroSidebar
        activeCalendar={activeCalendar}
        onSelectCalendar={selectCalendar}
        events={events}
        activeSubCategories={activeSubCategories}
        selectedSubCategoryId={selectedSubCategoryId}
        onSelectSubCategory={setSelectedSubCategoryId}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onToggleEventCompleted={toggleEventCompleted}
        onSelectEvent={handleSelectEvent}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onResetDemoData={resetDemoData}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Área Principal con Fondo Ambiental Personalizable */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${bgMeta.containerClass} transition-all duration-300`}
      >
        <NeoFaroHeader
          activeCalendar={activeCalendar}
          onSelectCalendar={selectCalendar}
          onPrevCalendar={goToPreviousCalendar}
          onNextCalendar={goToNextCalendar}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentDate={currentDate}
          onPrevPeriod={goToPreviousPeriod}
          onNextPeriod={goToNextPeriod}
          onToday={goToToday}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showAllCalendarsOverlay={showAllCalendarsOverlay}
          onToggleAllCalendars={() =>
            setShowAllCalendarsOverlay((prev) => !prev)
          }
          onOpenNewEvent={() => handleOpenNewEvent()}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenAgentModal={() => setIsAgentModalOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          backendMode={backendMode}
          isSyncing={isSyncing}
        />

        {/* Contenido Principal del Calendario (con margen inferior extra en móvil para la barra de navegación táctil) */}
        <main
          key={activeCalendar}
          className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 space-y-3 sm:space-y-4 animate-slide-fade"
        >
          {/* Cinta Deslizable de Métricas en Celular / Grilla de 5 Columnas en Escritorio */}
          <div className="flex sm:grid sm:grid-cols-5 gap-2.5 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 neofaro-scrollbar">
            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === 'pendiente' ? 'all' : 'pendiente'
                )
              }
              className={`min-w-[130px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border text-left shadow-neofaro-sm flex items-center justify-between transition-all shrink-0 ${selectedStatus === 'pendiente'
                  ? 'border-amber-500 ring-2 ring-amber-500/25'
                  : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
            >
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Pendientes
                </p>
                <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/70 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === 'en_proceso' ? 'all' : 'en_proceso'
                )
              }
              className={`min-w-[130px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border text-left shadow-neofaro-sm flex items-center justify-between transition-all shrink-0 ${selectedStatus === 'en_proceso'
                  ? 'border-sky-500 ring-2 ring-sky-500/25'
                  : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
            >
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  En Proceso
                </p>
                <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400">
                  {stats.inProgress}
                </p>
              </div>
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500/70 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === 'completado' ? 'all' : 'completado'
                )
              }
              className={`min-w-[140px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border text-left shadow-neofaro-sm flex items-center justify-between transition-all shrink-0 ${selectedStatus === 'completado'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/25'
                  : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
            >
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Completados
                </p>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.done}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/70 shrink-0" />
            </button>

            <div className="min-w-[140px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-neofaro-sm flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Sábado a Sábado
                </p>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.satToSat}
                </p>
              </div>
              <Tent className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/70 shrink-0" />
            </div>

            <button
              type="button"
              onClick={() => setIsAgentModalOpen(true)}
              className="min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-violet-500/50 text-left shadow-neofaro-sm flex items-center justify-between transition-all shrink-0"
            >
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Vía Agente IA
                </p>
                <p className="text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">
                  {stats.aiInjected}
                </p>
              </div>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500/70 shrink-0" />
            </button>
          </div>

          {/* Cinta Deslizable de Etiquetas (Materias UNGS / Ramas Scout / Categorías Laborales) */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/70 dark:border-slate-800/80 overflow-x-auto neofaro-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                {envMeta.subCategoryLabel}:
              </span>

              <button
                type="button"
                onClick={() => setSelectedSubCategoryId('all')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${selectedSubCategoryId === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
              >
                Todas
              </button>

              {activeSubCategories.map((sub) => {
                const isSelected = selectedSubCategoryId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      setSelectedSubCategoryId(isSelected ? 'all' : sub.id)
                    }
                    style={{
                      borderColor: isSelected ? sub.colorHex : undefined,
                      backgroundColor: isSelected
                        ? `${sub.colorHex}20`
                        : undefined,
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${isSelected
                        ? 'text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span
                      style={{ backgroundColor: sub.colorHex }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="sm:hidden">{sub.shortCode}</span>
                    <span className="hidden sm:inline">{sub.name}</span>
                  </button>
                );
              })}
            </div>

            {activeCalendar === 'scout' && (
              <button
                type="button"
                onClick={() => handleOpenNewEvent()}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                <Tent className="w-3.5 h-3.5" />
                <Plus className="w-3 h-3" />
                <span>Nuevo Sábado a Sábado</span>
              </button>
            )}
          </div>

          {/* Grilla Interactiva del Calendario (Mensual o Semanal) */}
          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              activeCalendar={activeCalendar}
              events={filteredEvents}
              subCategoryMap={subCategoryMap}
              onSelectEvent={handleSelectEvent}
              onToggleComplete={toggleEventCompleted}
              onCreateAtDate={(date) => handleOpenNewEvent(date)}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              activeCalendar={activeCalendar}
              events={filteredEvents}
              subCategoryMap={subCategoryMap}
              onSelectEvent={handleSelectEvent}
              onToggleComplete={toggleEventCompleted}
              onCreateAtDate={(date) => handleOpenNewEvent(date)}
            />
          )}
        </main>
      </div>

      {/* Barra de Navegación Inferior Táctil para Celulares (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={goToNextCalendar}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Cambiar Cal</span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleOpenNewEvent()}
              style={{ backgroundColor: envMeta.accentHex }}
              className="w-12 h-12 -mt-4 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all border-4 border-white dark:border-slate-900"
              aria-label="Crear nuevo evento"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          >
            <Palette className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] font-semibold mt-0.5">Colores</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAgentModalOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          >
            <Cpu className="w-5 h-5 text-violet-500" />
            <span className="text-[10px] font-semibold mt-0.5">Analizar Doc</span>
            <span
              className={`absolute top-1 right-4 w-2 h-2 rounded-full ${
                backendMode === 'google-sheets-drive' ||
                backendMode === 'fastapi-live'
                  ? 'bg-emerald-500'
                  : 'bg-cyan-500'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Modal Crear / Editar Evento */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        initialEvent={selectedEvent}
        defaultDate={modalDefaultDate}
        activeCalendar={activeCalendar}
        subCategories={subCategories}
        onSave={addOrUpdateEvent}
        onDelete={deleteEvent}
      />

      {/* Modal Personalizador de Colores y Fondos */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        activeCalendar={activeCalendar}
        subCategories={activeSubCategories}
        onUpdateSubCategoryColor={updateSubCategoryColor}
        onAddSubCategory={addSubCategoryTag}
        activeBackgroundStyle={activeBackgroundStyle}
        onSelectBackgroundStyle={setActiveBackgroundStyle}
      />

      {/* Modal Inspector y Simulador de Google Sheets (Drive) & Agente FastAPI */}
      <AgentSyncModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        activeCalendar={activeCalendar}
        subCategories={subCategories}
        backendMode={backendMode}
        googleSheetsUrl={googleSheetsUrl}
        onUpdateGoogleSheetsUrl={updateGoogleSheetsUrl}
        onPushAllToGoogleSheets={pushCurrentStateToGoogleSheets}
        onIngestPayload={ingestFromAgent}
      />
    </div>
  );
}
