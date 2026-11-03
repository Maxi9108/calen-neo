'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Award,
  Tent,
  ArrowLeft,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { CalendarEvent, SubCategoryTag } from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  EVENT_CATEGORY_META,
  EVENT_STATUS_META,
} from '@/config/neofaro-theme';
import { formatReadableDateRange, formatShortTime } from '@/utils/dateUtils';

interface EventPillProps {
  event: CalendarEvent;
  subCategory?: SubCategoryTag;
  onSelect: (event: CalendarEvent) => void;
  onToggleComplete: (eventId: string) => void;
  variant?: 'single' | 'continuous-bar' | 'week-card' | 'mobile-compact' | 'agenda-card';
  isStart?: boolean;
  isEnd?: boolean;
}

export function EventPill({
  event,
  subCategory,
  onSelect,
  onToggleComplete,
  variant = 'single',
  isStart = true,
  isEnd = true,
}: EventPillProps) {
  const categoryMeta = EVENT_CATEGORY_META[event.category];
  const statusMeta = EVENT_STATUS_META[event.status];
  const calEnv = CALENDAR_ENVIRONMENTS[event.calendarType];

  const primaryColor =
    event.customColor || subCategory?.colorHex || calEnv.accentHex;

  // 1. Variante Ultra-Compacta para celdas de vista mensual en celulares (< md)
  if (variant === 'mobile-compact') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
        style={{
          backgroundColor: event.completed ? `${primaryColor}20` : `${primaryColor}25`,
          borderLeftColor: primaryColor,
        }}
        className={`flex items-center gap-1 px-1 py-0.5 rounded-[5px] border-l-2 text-[10px] leading-tight font-medium truncate transition-opacity ${
          event.completed
            ? 'line-through opacity-55 text-slate-500 dark:text-slate-400'
            : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  // 2. Variante Tarjeta de Agenda Móvil / Detalle Diario (amplia, clara y táctil para el pulgar)
  if (variant === 'agenda-card') {
    return (
      <div
        onClick={() => onSelect(event)}
        style={{ borderLeftColor: primaryColor }}
        className={`relative rounded-2xl border border-slate-200/90 dark:border-slate-800/90 border-l-4 bg-white dark:bg-slate-900 p-3.5 shadow-neofaro-sm active:scale-[0.99] transition-all cursor-pointer ${
          event.completed ? 'opacity-75' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(event.id);
            }}
            className={`mt-0.5 p-1 -ml-1 rounded-xl transition-colors shrink-0 ${
              event.completed
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-slate-400 hover:text-emerald-500 bg-slate-100 dark:bg-slate-800/80'
            }`}
            aria-label={
              event.completed ? 'Marcar como pendiente' : 'Marcar como completado'
            }
          >
            {event.completed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            {/* Etiquetas superiores */}
            <div className="flex items-center flex-wrap gap-1.5 mb-1">
              {event.isSaturdayToSaturday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Tent className="w-3 h-3" />
                  Sábado a Sábado
                </span>
              )}

              {subCategory && (
                <span
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
                >
                  {subCategory.shortCode} · {subCategory.name}
                </span>
              )}

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${categoryMeta.badgeBg}`}
              >
                {categoryMeta.label}
              </span>

              {event.origin === 'agente_ia' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <Sparkles className="w-2.5 h-2.5" />
                  Agente IA
                </span>
              )}
            </div>

            {/* Título */}
            <h4
              className={`text-sm font-bold text-slate-900 dark:text-white leading-snug ${
                event.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {event.title}
            </h4>

            {/* Descripción breve si existe */}
            {event.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Metadatos inferiores: Fecha/Hora, Ubicación, Puntos y Estado */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {formatReadableDateRange(event.startDate, event.endDate)}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[160px]">{event.location}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {event.category === 'evento_con_puntos' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 font-mono text-[11px] font-bold">
                    <Award className="w-3 h-3" />
                    {event.pointsEarned ?? 0}/{event.pointsMax ?? 100} pts
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusMeta.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Renderizado de Barra Continua ("Sábado a Sábado" / Multi-día)
  if (variant === 'continuous-bar') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
        style={{
          backgroundColor: event.completed ? `${primaryColor}22` : primaryColor,
          borderColor: primaryColor,
        }}
        className={`group relative flex items-center justify-between gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold cursor-pointer border transition-all duration-200 select-none ${
          isStart ? 'rounded-l-lg sm:rounded-l-xl ml-0.5 sm:ml-1' : 'rounded-l-none border-l-0'
        } ${
          isEnd ? 'rounded-r-lg sm:rounded-r-xl mr-0.5 sm:mr-1' : 'rounded-r-none border-r-0'
        } ${
          event.completed
            ? 'text-slate-700 dark:text-slate-200 opacity-85'
            : 'text-white shadow-sm hover:brightness-105'
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
          {!isStart && (
            <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 opacity-80" />
          )}

          {/* Botón directo de Check para marcar el evento de Sábado a Sábado como completado */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(event.id);
            }}
            className={`shrink-0 rounded-full p-0.5 transition-transform active:scale-90 ${
              event.completed
                ? 'text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-slate-900/90'
                : 'text-white/90 hover:text-white hover:bg-black/15'
            }`}
            title={
              event.completed
                ? 'Evento finalizado (clic para reabrir)'
                : 'Marcar evento Sábado a Sábado como finalizado'
            }
          >
            {event.completed ? (
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            ) : (
              <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </button>

          {event.isSaturdayToSaturday && (
            <span
              className={`hidden xs:inline-flex sm:inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase tracking-tight shrink-0 ${
                event.completed
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-black/20 text-white'
              }`}
            >
              <Tent className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Sáb→Sáb</span>
            </span>
          )}

          {subCategory && (
            <span
              className={`hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                event.completed
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-white/20 text-white'
              }`}
            >
              {subCategory.shortCode}
            </span>
          )}

          <span
            className={`truncate ${
              event.completed ? 'line-through opacity-80' : ''
            }`}
          >
            {event.title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {event.completed && (
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
              ✓ Finalizado
            </span>
          )}

          {!event.completed && (
            <span className="hidden lg:inline-block text-[10px] opacity-90 font-medium">
              {statusMeta.label}
            </span>
          )}

          {event.origin === 'agente_ia' && (
            <Sparkles className="hidden sm:inline w-3 h-3 shrink-0 opacity-90" />
          )}

          {!isEnd && (
            <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 opacity-80" />
          )}
        </div>
      </div>
    );
  }

  // 4. Renderizado de Tarjeta Individual de Escritorio (Vista Mensual o Semanal en pantallas >= md)
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
      style={{
        borderLeftColor: primaryColor,
      }}
      className={`group relative rounded-xl border border-slate-200/80 dark:border-slate-800/90 border-l-4 bg-white dark:bg-slate-900/95 hover:bg-slate-50/90 dark:hover:bg-slate-800/90 p-2 shadow-neofaro-sm hover:shadow-neofaro-md transition-all duration-150 cursor-pointer select-none ${
        event.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(event.id);
            }}
            className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
            title={
              event.completed
                ? 'Marcar como pendiente'
                : 'Marcar como completado/aprobado'
            }
          >
            {event.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              {subCategory && (
                <span
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                >
                  {subCategory.shortCode}
                </span>
              )}
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${categoryMeta.badgeBg}`}
              >
                {categoryMeta.shortLabel}
              </span>
              {event.origin === 'agente_ia' && (
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300"
                  title="Creado automáticamente por Agente FastAPI"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  IA
                </span>
              )}
            </div>

            <p
              className={`text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-snug ${
                variant === 'week-card' ? 'line-clamp-2' : 'truncate'
              } ${event.completed ? 'line-through text-slate-400' : ''}`}
            >
              {event.title}
            </p>
          </div>
        </div>

        {/* Punto de Estado Semántico */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${statusMeta.dotClass}`}
          title={`Estado: ${statusMeta.label}`}
        />
      </div>

      {/* Pie de tarjeta: Hora, Estado y Puntos si aplica */}
      <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="font-mono">{formatShortTime(event.startDate)}</span>

        <div className="flex items-center gap-1">
          {event.category === 'evento_con_puntos' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 font-mono font-semibold">
              <Award className="w-2.5 h-2.5" />
              {event.pointsEarned ?? 0}/{event.pointsMax ?? 100}
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
