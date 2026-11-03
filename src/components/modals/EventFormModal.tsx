'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tent,
  Award,
  CheckCircle2,
  Trash2,
  MapPin,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  EventCategory,
  EventOrigin,
  EventStatus,
  SubCategoryTag,
} from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  CALENDAR_ORDER,
  EVENT_CATEGORY_META,
  EVENT_ORIGIN_META,
  EVENT_STATUS_META,
  PRESET_COLOR_SWATCHES,
} from '@/config/neofaro-theme';
import { getNextSaturdayToSaturdayRange } from '@/utils/dateUtils';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvent?: CalendarEvent | null;
  defaultDate?: Date | null;
  activeCalendar: CalendarType;
  subCategories: SubCategoryTag[];
  onSave: (
    eventData: Omit<CalendarEvent, 'id'> & { id?: string }
  ) => Promise<CalendarEvent>;
  onDelete?: (eventId: string) => void;
}

export function EventFormModal({
  isOpen,
  onClose,
  initialEvent,
  defaultDate,
  activeCalendar,
  subCategories,
  onSave,
  onDelete,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [calendarType, setCalendarType] =
    useState<CalendarType>(activeCalendar);
  const [category, setCategory] = useState<EventCategory>('actividad');
  const [status, setStatus] = useState<EventStatus>('pendiente');
  const [completed, setCompleted] = useState<boolean>(false);
  const [origin, setOrigin] = useState<EventOrigin>('manual');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('');
  const [isSaturdayToSaturday, setIsSaturdayToSaturday] =
    useState<boolean>(false);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [pointsMax, setPointsMax] = useState<number>(100);
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const availableSubCategories = React.useMemo(
    () => subCategories.filter((s) => s.calendarType === calendarType),
    [subCategories, calendarType]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description);
      setCalendarType(initialEvent.calendarType);
      setCategory(initialEvent.category);
      setStatus(initialEvent.status);
      setCompleted(initialEvent.completed);
      setOrigin(initialEvent.origin);
      setSubCategoryId(initialEvent.subCategoryId || '');
      setCustomColor(initialEvent.customColor || '');
      setIsSaturdayToSaturday(Boolean(initialEvent.isSaturdayToSaturday));
      setPointsEarned(initialEvent.pointsEarned ?? 0);
      setPointsMax(initialEvent.pointsMax ?? 100);
      setLocation(initialEvent.location || '');
      setStartDate(initialEvent.startDate.slice(0, 16));
      setEndDate(initialEvent.endDate.slice(0, 16));
    } else {
      const base = defaultDate || new Date();
      const yyyy = base.getFullYear();
      const mm = String(base.getMonth() + 1).padStart(2, '0');
      const dd = String(base.getDate()).padStart(2, '0');

      setTitle('');
      setDescription('');
      setCalendarType(activeCalendar);
      setCategory(
        activeCalendar === 'academico'
          ? 'trabajo_practico'
          : activeCalendar === 'scout'
          ? 'actividad'
          : 'tarea'
      );
      setStatus('pendiente');
      setCompleted(false);
      setOrigin('manual');
      const firstSub = subCategories.find(
        (s) => s.calendarType === activeCalendar
      );
      setSubCategoryId(firstSub?.id || '');
      setCustomColor('');
      setIsSaturdayToSaturday(false);
      setPointsEarned(0);
      setPointsMax(100);
      setLocation('');
      setStartDate(`${yyyy}-${mm}-${dd}T09:00`);
      setEndDate(`${yyyy}-${mm}-${dd}T11:00`);
    }
  }, [isOpen, initialEvent, defaultDate, activeCalendar, subCategories]);

  if (!isOpen) return null;

  const handleApplySaturdayToSaturdayPreset = () => {
    const range = getNextSaturdayToSaturdayRange(defaultDate || new Date());
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setIsSaturdayToSaturday(true);
    if (!title) {
      setTitle('Campamento / Actividad de Sábado a Sábado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...(initialEvent ? { id: initialEvent.id } : {}),
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate: endDate || startDate,
        calendarType,
        category,
        status: completed && status === 'pendiente' ? 'completado' : status,
        completed:
          completed || status === 'completado' || status === 'aprobado',
        origin,
        subCategoryId: subCategoryId || undefined,
        customColor: customColor || undefined,
        isSaturdayToSaturday,
        pointsEarned:
          category === 'evento_con_puntos' ? Number(pointsEarned) : undefined,
        pointsMax:
          category === 'evento_con_puntos' ? Number(pointsMax) : undefined,
        location: location.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const envMeta = CALENDAR_ENVIRONMENTS[calendarType];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-slide-fade">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl neofaro-scrollbar">
        {/* Barra superior de acento */}
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${envMeta.headerGradient}`}
        />

        {/* Cabecera */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envMeta.badgeClasses}`}
            >
              {envMeta.title}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {initialEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selector de Calendario destino */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Calendario de Destino
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CALENDAR_ORDER.map((calKey) => {
                const meta = CALENDAR_ENVIRONMENTS[calKey];
                const isSelected = calendarType === calKey;
                return (
                  <button
                    key={calKey}
                    type="button"
                    onClick={() => {
                      setCalendarType(calKey);
                      const firstSub = subCategories.find(
                        (s) => s.calendarType === calKey
                      );
                      setSubCategoryId(firstSub?.id || '');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? `${meta.activeTabClasses}`
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {calKey === 'academico'
                      ? 'Académico (UNGS)'
                      : calKey === 'scout'
                      ? 'Scout'
                      : 'Trabajo'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título y Materia / Rama / Categoría Laboral */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título del Evento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Entrega TP Grafos / Campamento de Verano..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {envMeta.subCategoryLabel}
              </label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Sin etiqueta específica</option>
                {availableSubCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.shortCode} · {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoría Específica (8 tipos admitidos) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Categoría del Evento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map(
                (catKey) => {
                  const cat = EVENT_CATEGORY_META[catKey];
                  const active = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: cat.dotColor }}
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                      />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Panel Especial si es "Evento con Puntos" */}
          {category === 'evento_con_puntos' && (
            <div className="p-4 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/25 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">
                <Award className="w-4 h-4" />
                <span>Seguimiento de Evento con Puntos / Créditos</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Puntos Obtenidos / Actuales
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Puntos Objetivo / Máximos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pointsMax}
                    onChange={(e) => setPointsMax(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gestión de Fechas + Preset "Sábado a Sábado" */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                <span>Fechas y Formato Multi-Día (Sábado a Sábado)</span>
              </div>

              <button
                type="button"
                onClick={handleApplySaturdayToSaturdayPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
              >
                <Tent className="w-3.5 h-3.5" />
                <span>Autocompletar Sábado a Sábado (8 días)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Inicio
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSaturdayToSaturday}
                onChange={(e) => setIsSaturdayToSaturday(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mostrar como barra continua <strong>&ldquo;Sábado a Sábado&rdquo;</strong> en el calendario con check de finalización
              </span>
            </label>
          </div>

          {/* Estados del Evento + Check de Finalizado + Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estado del Evento
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(EVENT_STATUS_META) as EventStatus[]).map(
                  (stKey) => {
                    const st = EVENT_STATUS_META[stKey];
                    const isSelected = status === stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => {
                          setStatus(stKey);
                          if (stKey === 'completado' || stKey === 'aprobado') {
                            setCompleted(true);
                          } else {
                            setCompleted(false);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? `${st.badgeClass} ring-2 ring-indigo-500/40`
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${st.dotClass}`}
                        />
                        <span>{st.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Origen del Registro
                </label>
                <div className="relative">
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as EventOrigin)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {(Object.keys(EVENT_ORIGIN_META) as EventOrigin[]).map(
                      (orgKey) => (
                        <option key={orgKey} value={orgKey}>
                          {EVENT_ORIGIN_META[orgKey].label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !completed;
                  setCompleted(next);
                  if (next && status === 'pendiente') {
                    setStatus('completado');
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  completed
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completed
                    ? '✓ Marcado como Completado / Finalizado'
                    : 'Marcar Evento como Finalizado'}
                </span>
              </button>
            </div>
          </div>

          {/* Ubicación, Color personalizado y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ubicación / Aula / Campo Scout
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Módulo 7 UNGS / Campo Escuela..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Personalizado Opcional
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomColor('')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                    customColor === ''
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  Auto
                </button>
                {PRESET_COLOR_SWATCHES.slice(0, 8).map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCustomColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      customColor === hex
                        ? 'scale-125 ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900'
                        : ' opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción / Notas / Bibliografía
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de la entrega, lista de equipo para el campamento o notas procesadas por el agente..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Botonera inferior */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            {initialEvent && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialEvent.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Sincronizado con contrato FastAPI DTO</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: envMeta.accentHex }}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting
                  ? 'Guardando...'
                  : initialEvent
                  ? 'Guardar Cambios'
                  : 'Crear Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

