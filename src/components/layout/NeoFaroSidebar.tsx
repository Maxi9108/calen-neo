'use client';

import React, { useState } from 'react';
import {
  Radio,
  ArrowRight,
  CheckCircle2,
  Circle,
  Award,
  Tent,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Archive,
  ArchiveRestore,
  BookOpen,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  EventCategory,
  EventStatus,
  SubCategoryTag,
} from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  CALENDAR_ORDER,
  EVENT_CATEGORY_META,
  EVENT_STATUS_META,
} from '@/config/neofaro-theme';

interface NeoFaroSidebarProps {
  activeCalendar: CalendarType;
  onSelectCalendar: (cal: CalendarType) => void;
  events: CalendarEvent[];
  activeSubCategories: SubCategoryTag[];
  allSubCategoriesOfActiveCalendar?: SubCategoryTag[];
  selectedSubCategoryId: string | 'all';
  onSelectSubCategory: (id: string | 'all') => void;
  selectedCategory: EventCategory | 'all';
  onSelectCategory: (cat: EventCategory | 'all') => void;
  selectedStatus: EventStatus | 'all';
  onSelectStatus: (status: EventStatus | 'all') => void;
  onToggleEventCompleted: (eventId: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenCustomizer: () => void;
  onOpenSubjectManager?: () => void;
  onOpenMobileInstallModal?: () => void;
  onToggleArchiveSubCategory?: (id: string) => void;
  onDeleteSubCategory?: (id: string) => void;
  onResetDemoData: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function NeoFaroSidebar({
  activeCalendar,
  onSelectCalendar,
  events,
  activeSubCategories,
  allSubCategoriesOfActiveCalendar = [],
  selectedSubCategoryId,
  onSelectSubCategory,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  onToggleEventCompleted,
  onSelectEvent,
  onOpenCustomizer,
  onOpenSubjectManager,
  onOpenMobileInstallModal,
  onToggleArchiveSubCategory,
  onDeleteSubCategory,
  onResetDemoData,
  mobileOpen,
  onCloseMobile,
}: NeoFaroSidebarProps) {
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  const archivedSubCategories = React.useMemo(
    () => allSubCategoriesOfActiveCalendar.filter((s) => s.archived),
    [allSubCategoriesOfActiveCalendar]
  );

  const calendarEvents = React.useMemo(
    () => events.filter((e) => e.calendarType === activeCalendar),
    [events, activeCalendar]
  );

  // Resumen de Eventos con Puntos
  const pointsSummary = React.useMemo(() => {
    const pointEvents = calendarEvents.filter(
      (e) => e.category === 'evento_con_puntos'
    );
    const earned = pointEvents.reduce(
      (acc, cur) => acc + (cur.pointsEarned || 0),
      0
    );
    const max = pointEvents.reduce((acc, cur) => acc + (cur.pointsMax || 0), 0);
    return { count: pointEvents.length, earned, max };
  }, [calendarEvents]);

  // Eventos continuos "Sábado a Sábado"
  const satToSatEvents = React.useMemo(
    () =>
      calendarEvents.filter(
        (e) =>
          e.isSaturdayToSaturday ||
          new Date(e.endDate).getTime() - new Date(e.startDate).getTime() >=
          5 * 24 * 60 * 60 * 1000
      ),
    [calendarEvents]
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 w-72 select-none">
      {/* Cabecera de Marca Calen-Neo */}
      <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: envMeta.accentHex }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors duration-300"
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Calen-Neo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gestión Académica · Scout · Trabajo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cuerpo scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 neofaro-scrollbar">
        {/* 1. Navegador de Entornos con Flecha Indicadora */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Entornos
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Alt + ←/→
            </span>
          </div>
          <div className="space-y-1.5">
            {CALENDAR_ORDER.map((calKey) => {
              const meta = CALENDAR_ENVIRONMENTS[calKey];
              const isSelected = activeCalendar === calKey;
              const totalCount = events.filter(
                (e) => e.calendarType === calKey
              ).length;
              const completedCount = events.filter(
                (e) => e.calendarType === calKey && e.completed
              ).length;

              return (
                <button
                  key={calKey}
                  type="button"
                  onClick={() => {
                    onSelectCalendar(calKey);
                    onCloseMobile();
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${isSelected
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800/90 dark:border-slate-700 shadow-sm'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{ backgroundColor: meta.accentHex }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">
                        {meta.title}
                      </p>
                      <p
                        className={`text-[10px] truncate ${isSelected
                            ? 'text-slate-300 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-500'
                          }`}
                      >
                        {completedCount}/{totalCount} completados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelected
                          ? 'translate-x-0 text-white opacity-100'
                          : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'
                        }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Materias UNGS / Ramas Scout / Categorías Laborales (Colores personalizados) */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {envMeta.subCategoryLabel}
            </span>
            <div className="flex items-center gap-2">
              {onOpenSubjectManager && (
                <button
                  type="button"
                  onClick={onOpenSubjectManager}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  title="Dar de alta, archivar, borrar y ver cómo seguir"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Gestionar</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Colores</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectSubCategory('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedSubCategoryId === 'all'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
            >
              <span>Todas las etiquetas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900 text-slate-500">
                {calendarEvents.length}
              </span>
            </button>

            {activeSubCategories.map((sub) => {
              const isSelected = selectedSubCategoryId === sub.id;
              const count = calendarEvents.filter(
                (e) => e.subCategoryId === sub.id
              ).length;

              return (
                <div
                  key={sub.id}
                  className={`group/row flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectSubCategory(isSelected ? 'all' : sub.id)
                    }
                    className="flex items-center gap-2 truncate flex-1 text-left"
                  >
                    <span
                      style={{ backgroundColor: sub.colorHex }}
                      className="w-3 h-3 rounded-md shrink-0 ring-2 ring-offset-1 ring-transparent dark:ring-offset-slate-900"
                    />
                    <span className="truncate">{sub.name}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono opacity-75 mr-0.5">
                      {count}
                    </span>

                    {/* Botón rápido para archivar y no mostrar más */}
                    {onToggleArchiveSubCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArchiveSubCategory(sub.id);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 p-1 rounded text-slate-400 hover:text-amber-500 transition-opacity"
                        title="Archivar materia (ocultar del calendario)"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón rápido para abrir el Administrador de Materias */}
          {onOpenSubjectManager && (
            <button
              type="button"
              onClick={onOpenSubjectManager}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>+ Administrar / Archivar / Borrar</span>
            </button>
          )}

          {/* Sección de Materias Archivadas (Ocultas) */}
          {archivedSubCategories.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowArchivedSection((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1 px-1 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Archive className="w-3 h-3 text-amber-500" />
                  <span>Archivadas ({archivedSubCategories.length})</span>
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {showArchivedSection ? 'Ocultar' : 'Ver'}
                </span>
              </button>

              {showArchivedSection && (
                <div className="space-y-1 mt-1.5 pl-1">
                  {archivedSubCategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          style={{ backgroundColor: sub.colorHex }}
                          className="w-2 h-2 rounded-full shrink-0 opacity-60"
                        />
                        <span className="truncate text-slate-500 line-through">
                          {sub.name}
                        </span>
                      </div>

                      {onToggleArchiveSubCategory && (
                        <button
                          type="button"
                          onClick={() => onToggleArchiveSubCategory(sub.id)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-1"
                          title="Restaurar y mostrar en el calendario"
                        >
                          Restaurar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Eventos "Sábado a Sábado" (Seguimiento Rápido Multi-día con Check) */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Tent className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sábado a Sábado
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              {satToSatEvents.length} activos
            </span>
          </div>

          {satToSatEvents.length === 0 ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              No hay bloques de Sábado a Sábado en este calendario. Creá uno con el preset rápido.
            </p>
          ) : (
            <div className="space-y-1.5">
              {satToSatEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500/40 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onToggleEventCompleted(evt.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                    title={
                      evt.completed
                        ? 'Marcar como pendiente'
                        : 'Marcar bloque Sábado a Sábado como finalizado'
                    }
                  >
                    {evt.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(evt)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p
                      className={`text-xs font-semibold truncate ${evt.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                        }`}
                    >
                      {evt.title}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {evt.completed ? '✓ Finalizado' : 'En curso · Barra continua'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Tarjeta de Seguimiento de Eventos con Puntos */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-fuchsia-500/5 via-indigo-500/5 to-transparent border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-fuchsia-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Eventos con Puntos
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {pointsSummary.earned}/{pointsSummary.max || 100} pts
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all duration-500"
              style={{
                width: `${pointsSummary.max > 0
                    ? Math.min(
                      100,
                      Math.round(
                        (pointsSummary.earned / pointsSummary.max) * 100
                      )
                    )
                    : 0
                  }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {pointsSummary.count} actividad(es) acreditables en este entorno.
          </p>
        </div>

        {/* 5. Filtro por Categorías Específicas */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Categorías
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="text-[11px] text-indigo-500 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map(
              (catKey) => {
                const cat = EVENT_CATEGORY_META[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() =>
                      onSelectCategory(isSelected ? 'all' : catKey)
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                        : `${cat.badgeBg} hover:opacity-90`
                      }`}
                  >
                    <span
                      style={{ backgroundColor: cat.dotColor }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 6. Filtro por Estados de Eventos */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Estados de Evento
            </span>
            {selectedStatus !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectStatus('all')}
                className="text-[11px] text-indigo-500 hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(EVENT_STATUS_META) as EventStatus[]).map((stKey) => {
              const st = EVENT_STATUS_META[stKey];
              const isSelected = selectedStatus === stKey;
              return (
                <button
                  key={stKey}
                  type="button"
                  onClick={() => onSelectStatus(isSelected ? 'all' : stKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${isSelected
                      ? 'ring-2 ring-indigo-500 font-bold ' + st.badgeClass
                      : st.badgeClass + ' opacity-80 hover:opacity-100'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.dotClass}`} />
                  <span className="truncate">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Acceso directo a Instalar en Celular / APK */}
        {onOpenMobileInstallModal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenMobileInstallModal}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs font-bold shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Instalar en Celular / APK</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                App
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Pie de barra lateral */}
      <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Calen-Neo</span>
        <button
          type="button"
          onClick={onResetDemoData}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Restaurar eventos semilla originales"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restaurar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

