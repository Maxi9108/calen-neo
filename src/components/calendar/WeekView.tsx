'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Clock, Tent } from 'lucide-react';
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
  getSingleDayEventsForDate,
  getWeekDays,
  getWeekMultiDaySegments,
  isSameDay,
  toDateKey,
} from '@/utils/dateUtils';
import { EventPill } from './EventPill';

interface WeekViewProps {
  currentDate: Date;
  activeCalendar: CalendarType;
  events: CalendarEvent[];
  subCategoryMap: Record<string, SubCategoryTag>;
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onToggleActivity?: (eventId: string, activityId: string) => void;
  onCreateAtDate: (date: Date) => void;
}

const TIME_BLOCKS = [
  {
    id: 'morning',
    label: 'Mañana',
    range: '08:00 – 12:59',
    minHour: 0,
    maxHour: 12,
  },
  {
    id: 'afternoon',
    label: 'Tarde',
    range: '13:00 – 17:59',
    minHour: 13,
    maxHour: 17,
  },
  {
    id: 'evening',
    label: 'Noche / Vespertino',
    range: '18:00 – 23:59',
    minHour: 18,
    maxHour: 23,
  },
];

export function WeekView({
  currentDate,
  activeCalendar,
  events,
  subCategoryMap,
  onSelectEvent,
  onToggleComplete,
  onToggleActivity,
  onCreateAtDate,
}: WeekViewProps) {
  const weekDays = React.useMemo(() => getWeekDays(currentDate), [currentDate]);
  const multiDaySegments = React.useMemo(
    () => getWeekMultiDaySegments(weekDays, events),
    [weekDays, events]
  );
  const today = React.useMemo(() => new Date(), []);
  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(
    () => currentDate
  );

  useEffect(() => {
    setSelectedMobileDay(currentDate);
  }, [currentDate]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-neofaro-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm">
      {/* Cabecera Semanal Táctil (7 Días) */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-950/70 divide-x divide-slate-200/60 dark:divide-slate-800/60">
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          const isSelectedMobile = isSameDay(day, selectedMobileDay);
          const isSaturday = idx === 6;
          const dayCount = getAllEventsForDate(day, events).length;

          return (
            <div
              key={toDateKey(day)}
              onClick={() => setSelectedMobileDay(day)}
              onDoubleClick={() => onCreateAtDate(day)}
              className={`p-2 sm:p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isSelectedMobile
                  ? 'bg-indigo-500/10 md:bg-transparent'
                  : isSaturday && activeCalendar === 'scout'
                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span className="sm:hidden">
                  {DAYS_OF_WEEK_ES[idx].slice(0, 2)}
                </span>
                <span className="hidden sm:inline">{DAYS_OF_WEEK_ES[idx]}</span>
              </span>
              <span
                style={
                  isToday
                    ? { backgroundColor: envMeta.accentHex }
                    : isSelectedMobile
                    ? {
                        borderColor: envMeta.accentHex,
                        color: envMeta.accentHex,
                      }
                    : undefined
                }
                className={`mt-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                  isToday
                    ? 'text-white shadow-sm'
                    : isSelectedMobile
                    ? 'border-2 md:border-0 bg-white dark:bg-slate-900 md:bg-transparent'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {day.getDate()}
              </span>
              {dayCount > 0 && (
                <span
                  style={{ backgroundColor: envMeta.accentHex }}
                  className="md:hidden mt-1 w-1.5 h-1.5 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Banda Superior de Eventos Continuos ("Sábado a Sábado" / Multi-día) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-950/40 px-1 py-2">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Tent className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sábado a Sábado / Multi-día</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {multiDaySegments.length} activo(s)
          </span>
        </div>

        {multiDaySegments.length === 0 ? (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 px-2 py-0.5">
            Sin barras continuas de varios días en esta semana.
          </p>
        ) : (
          <div className="grid grid-cols-7 gap-y-1.5">
            {multiDaySegments.map((seg) => (
              <div
                key={`week-span-${seg.event.id}`}
                style={{
                  gridColumn: `${seg.startCol + 1} / span ${seg.spanCols}`,
                }}
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
      </div>

      {/* VISTA SEMANAL PARA CELULARES (< md): Franjas Horarias del Día Seleccionado con tarjetas amplias */}
      <div className="md:hidden p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {DAYS_OF_WEEK_ES[selectedMobileDay.getDay()]}{' '}
              {selectedMobileDay.getDate()} de{' '}
              {MONTHS_ES[selectedMobileDay.getMonth()]}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tocá otro día arriba para cambiar de columna semanal
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCreateAtDate(selectedMobileDay)}
            style={{ backgroundColor: envMeta.accentHex }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {TIME_BLOCKS.map((block) => {
          const blockEvents = getSingleDayEventsForDate(
            selectedMobileDay,
            events
          ).filter((evt) => {
            const hour = new Date(evt.startDate).getHours();
            return hour >= block.minHour && hour <= block.maxHour;
          });

          return (
            <div
              key={`mob-block-${block.id}`}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-slate-900/60"
            >
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {block.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {block.range}
                </span>
              </div>

              <div className="p-2.5 space-y-2">
                {blockEvents.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(selectedMobileDay);
                      d.setHours(Math.max(9, block.minHour), 0, 0, 0);
                      onCreateAtDate(d);
                    }}
                    className="w-full py-2 text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    + Agregar actividad en la {block.label.toLowerCase()}
                  </button>
                ) : (
                  blockEvents.map((evt) => (
                    <EventPill
                      key={`mob-wk-${evt.id}`}
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA SEMANAL DE ESCRITORIO (>= md): Matriz de 7 Columnas x Franjas Horarias */}
      <div className="hidden md:block divide-y divide-slate-200/80 dark:divide-slate-800/90">
        {TIME_BLOCKS.map((block) => (
          <div key={block.id} className="flex flex-col">
            <div className="px-3 py-1.5 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{block.label}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {block.range}
              </span>
            </div>

            <div className="grid grid-cols-7 divide-x divide-slate-200/60 dark:divide-slate-800/60 min-h-[135px]">
              {weekDays.map((day) => {
                const dayEvents = getSingleDayEventsForDate(day, events).filter(
                  (evt) => {
                    const hour = new Date(evt.startDate).getHours();
                    return hour >= block.minHour && hour <= block.maxHour;
                  }
                );

                return (
                  <div
                    key={`${block.id}-${toDateKey(day)}`}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(Math.max(9, block.minHour), 0, 0, 0);
                      onCreateAtDate(d);
                    }}
                    className="p-2 space-y-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group/cell"
                  >
                    {dayEvents.map((evt) => (
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
                        variant="week-card"
                      />
                    ))}

                    {dayEvents.length === 0 && (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity py-4">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <Plus className="w-3 h-3" /> Agregar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
