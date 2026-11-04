'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  SubCategoryTag,
} from '@/types/calendar';
import { CALENDAR_ENVIRONMENTS } from '@/config/neofaro-theme';
import {
  DAYS_OF_WEEK_ES,
  MONTHS_ES,
  getAllEventsForDate,
  getMonthWeeksMatrix,
  getSingleDayEventsForDate,
  getWeekMultiDaySegments,
  isSameDay,
  toDateKey,
} from '@/utils/dateUtils';
import { EventPill } from './EventPill';

interface MonthViewProps {
  currentDate: Date;
  activeCalendar: CalendarType;
  events: CalendarEvent[];
  subCategoryMap: Record<string, SubCategoryTag>;
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onToggleActivity?: (eventId: string, activityId: string) => void;
  onCreateAtDate: (date: Date) => void;
}

export function MonthView({
  currentDate,
  activeCalendar,
  events,
  subCategoryMap,
  onSelectEvent,
  onToggleComplete,
  onToggleActivity,
  onCreateAtDate,
}: MonthViewProps) {
  const weeks = React.useMemo(
    () => getMonthWeeksMatrix(currentDate),
    [currentDate]
  );
  const today = React.useMemo(() => new Date(), []);
  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  // Día seleccionado para el Inspector Dinámico Móvil (por defecto hoy o el 1er día con eventos del mes)
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());

  useEffect(() => {
    const now = new Date();
    if (
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear()
    ) {
      setSelectedDay(now);
      return;
    }
    const firstEventInMonth = events.find((e) => {
      const d = new Date(e.startDate);
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });
    if (firstEventInMonth) {
      setSelectedDay(new Date(firstEventInMonth.startDate));
    } else {
      setSelectedDay(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      );
    }
  }, [currentDate, activeCalendar, events]);

  const selectedDayEvents = React.useMemo(
    () => getAllEventsForDate(selectedDay, events),
    [selectedDay, events]
  );

  return (
    <div className="space-y-4">
      {/* Cuadrícula Mensual */}
      <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-neofaro-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-950/70">
          {DAYS_OF_WEEK_ES.map((dayLabel, idx) => {
            const isSaturday = idx === 6;
            const isSunday = idx === 0;
            return (
              <div
                key={dayLabel}
                className={`py-2 sm:py-2.5 px-1 sm:px-2 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider border-r last:border-r-0 border-slate-200/60 dark:border-slate-800/60 ${
                  isSaturday && activeCalendar === 'scout'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                    : isSunday || isSaturday
                    ? 'text-slate-500 dark:text-slate-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="sm:hidden">{dayLabel.slice(0, 2)}</span>
                <span className="hidden sm:inline">{dayLabel}</span>
                {isSaturday && activeCalendar === 'scout' && (
                  <span className="hidden lg:inline-block ml-1 text-[9px] px-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    Sáb Scout
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Filas semanales */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/90">
          {weeks.map((weekDays, weekIdx) => {
            const multiDaySegments = getWeekMultiDaySegments(weekDays, events);

            return (
              <div
                key={weekIdx}
                className="flex flex-col min-h-[76px] md:min-h-[142px] relative group/week"
              >
                {/* Encabezados numéricos de cada día de la semana */}
                <div className="grid grid-cols-7 divide-x divide-slate-200/60 dark:divide-slate-800/60">
                  {weekDays.map((day) => {
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isToday = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDay);
                    const isSaturday = day.getDay() === 6;
                    const allDayEvents = getAllEventsForDate(day, events);

                    return (
                      <div
                        key={toDateKey(day)}
                        onClick={() => setSelectedDay(day)}
                        onDoubleClick={() => onCreateAtDate(day)}
                        className={`px-1.5 sm:px-2 pt-1.5 pb-1 flex items-center justify-between cursor-pointer transition-colors ${
                          !isCurrentMonth
                            ? 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                            : isSelected
                            ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/[0.14]'
                            : isSaturday && activeCalendar === 'scout'
                            ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            style={
                              isToday
                                ? { backgroundColor: envMeta.accentHex }
                                : isSelected
                                ? {
                                    borderColor: envMeta.accentHex,
                                    color: envMeta.accentHex,
                                  }
                                : undefined
                            }
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                              isToday
                                ? 'text-white shadow-sm scale-105'
                                : isSelected
                                ? 'border-2 font-extrabold scale-105 bg-white dark:bg-slate-900'
                                : isCurrentMonth
                                ? 'text-slate-700 dark:text-slate-200'
                                : 'text-slate-400 dark:text-slate-600'
                            }`}
                          >
                            {day.getDate()}
                          </span>

                          {/* Indicador de cantidad de eventos en móvil */}
                          {allDayEvents.length > 0 && (
                            <span className="md:hidden text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
                              {allDayEvents.length}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateAtDate(day);
                          }}
                          className="hidden md:inline-flex opacity-0 hover:opacity-100 group-hover/week:opacity-60 p-0.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                          title={`Agregar evento el ${day.toLocaleDateString(
                            'es-AR'
                          )}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Capa de Barras Continuas Multi-Día ("Sábado a Sábado", Campamentos, Semanas intensivas) */}
                {multiDaySegments.length > 0 && (
                  <div className="grid grid-cols-7 gap-y-1 py-0.5 sm:py-1 bg-slate-50/40 dark:bg-slate-950/20">
                    {multiDaySegments.map((seg) => (
                      <div
                        key={`${seg.event.id}-w${weekIdx}`}
                        style={{
                          gridColumn: `${seg.startCol + 1} / span ${
                            seg.spanCols
                          }`,
                        }}
                        className="z-10"
                      >
                        <EventPill
                          event={seg.event}
                          subCategory={
                            seg.event.subCategoryId
                              ? subCategoryMap[seg.event.subCategoryId]
                              : undefined
                          }
                          onSelect={onSelectEvent}
                          onToggleComplete={onToggleComplete}
                          variant="continuous-bar"
                          isStart={seg.isStart}
                          isEnd={seg.isEnd}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Celdas de eventos de un solo día */}
                <div className="grid grid-cols-7 divide-x divide-slate-200/60 dark:divide-slate-800/60 flex-1">
                  {weekDays.map((day) => {
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isSelected = isSameDay(day, selectedDay);
                    const isSaturday = day.getDay() === 6;
                    const singleEvents = getSingleDayEventsForDate(day, events);

                    return (
                      <div
                        key={`cells-${toDateKey(day)}`}
                        onClick={() => setSelectedDay(day)}
                        className={`p-1 sm:p-1.5 space-y-1 sm:space-y-1.5 min-h-[42px] md:min-h-[88px] cursor-pointer transition-colors ${
                          !isCurrentMonth
                            ? 'bg-slate-50/60 dark:bg-slate-950/40'
                            : isSelected
                            ? 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08]'
                            : isSaturday && activeCalendar === 'scout'
                            ? 'bg-emerald-500/[0.02]'
                            : ''
                        }`}
                      >
                        {/* Vista compacta en celulares (< md): máx 2 píldoras + contador */}
                        <div className="md:hidden space-y-0.5">
                          {singleEvents.slice(0, 2).map((evt) => (
                            <EventPill
                              key={`mob-${evt.id}`}
                              event={evt}
                              subCategory={
                                evt.subCategoryId
                                  ? subCategoryMap[evt.subCategoryId]
                                  : undefined
                              }
                              onSelect={() => setSelectedDay(day)}
                              onToggleComplete={onToggleComplete}
                              variant="mobile-compact"
                            />
                          ))}
                          {singleEvents.length > 2 && (
                            <span className="block text-[9px] font-bold text-center text-indigo-500 dark:text-indigo-400">
                              +{singleEvents.length - 2} más
                            </span>
                          )}
                        </div>

                        {/* Vista detallada en escritorio (>= md) */}
                        <div className="hidden md:block space-y-1.5">
                          {singleEvents.map((evt) => (
                            <EventPill
                              key={evt.id}
                              event={evt}
                              subCategory={
                                evt.subCategoryId
                                  ? subCategoryMap[evt.subCategoryId]
                                  : undefined
                              }
                              onSelect={onSelectEvent}
                              onToggleComplete={onToggleComplete}
                              onToggleActivity={onToggleActivity}
                              variant="single"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel Dinámico de Agenda del Día Seleccionado (Prioritario en Celulares y Tabletas, interactivo en Escritorio) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 p-4 shadow-neofaro-md backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: envMeta.accentHex }}
              className="w-9 h-9 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-sm shrink-0"
            >
              <span className="text-[9px] uppercase leading-none opacity-85">
                {DAYS_OF_WEEK_ES[selectedDay.getDay()]}
              </span>
              <span className="text-sm leading-tight">
                {selectedDay.getDate()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Agenda del {DAYS_OF_WEEK_ES[selectedDay.getDay()]}{' '}
                  {selectedDay.getDate()} de{' '}
                  {MONTHS_ES[selectedDay.getMonth()]}
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedDayEvents.length} evento(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tocá el círculo de cualquier actividad para marcarla completada o tocala para editar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCreateAtDate(selectedDay)}
            style={{ backgroundColor: envMeta.accentHex }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar en este día</span>
          </button>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="py-6 text-center flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <CalendarIcon className="w-7 h-7 stroke-[1.5]" />
            <p className="text-xs sm:text-sm font-medium">
              No hay actividades programadas para este día en {envMeta.title}.
            </p>
            <button
              type="button"
              onClick={() => onCreateAtDate(selectedDay)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Crear actividad o bloque Sábado a Sábado aquí
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {selectedDayEvents.map((evt) => (
              <EventPill
                key={`agenda-${evt.id}`}
                event={evt}
                subCategory={
                  evt.subCategoryId
                    ? subCategoryMap[evt.subCategoryId]
                    : undefined
                }
                onSelect={onSelectEvent}
                onToggleComplete={onToggleComplete}
                onToggleActivity={onToggleActivity}
                variant="agenda-card"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
