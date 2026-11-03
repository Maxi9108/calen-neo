import { CalendarEvent } from '@/types/calendar';

export const DAYS_OF_WEEK_ES = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
];

export const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Devuelve una matriz de semanas (6 filas x 7 columnas = 42 días)
 * para construir la vista mensual estilo Google Calendar.
 */
export function getMonthWeeksMatrix(currentDate: Date): Date[][] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo ... 6 = Sábado

  const gridStartDate = new Date(year, month, 1 - startDayOfWeek);
  const weeks: Date[][] = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const week: Date[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const offset = weekIndex * 7 + dayIndex;
      const cellDate = new Date(
        gridStartDate.getFullYear(),
        gridStartDate.getMonth(),
        gridStartDate.getDate() + offset
      );
      week.push(cellDate);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Devuelve los 7 días de la semana correspondiente a la fecha seleccionada.
 */
export function getWeekDays(currentDate: Date): Date[] {
  const dayOfWeek = currentDate.getDay();
  const sunday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - dayOfWeek
  );

  return Array.from({ length: 7 }, (_, idx) => {
    return new Date(
      sunday.getFullYear(),
      sunday.getMonth(),
      sunday.getDate() + idx
    );
  });
}

/**
 * Determina si un evento abarca múltiples días (ej. "Sábado a Sábado" o más de 1 día calendario).
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  if (event.isSaturdayToSaturday) return true;
  const s = startOfDay(new Date(event.startDate));
  const e = startOfDay(new Date(event.endDate));
  return e.getTime() > s.getTime();
}

export interface WeekSpanSegment {
  event: CalendarEvent;
  startCol: number; // 0..6
  spanCols: number; // 1..7
  isStart: boolean;
  isEnd: boolean;
  lane: number;
}

/**
 * Calcula los segmentos de barras continuas horizontales para una semana de 7 días.
 * Ideal para renderizar eventos de "Sábado a Sábado" o de varios días sin solaparse.
 */
export function getWeekMultiDaySegments(
  weekDays: Date[],
  events: CalendarEvent[]
): WeekSpanSegment[] {
  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = endOfDay(weekDays[6]);

  const multiDayEvents = events.filter((evt) => {
    if (!isMultiDayEvent(evt)) return false;
    const evtStart = startOfDay(new Date(evt.startDate));
    const evtEnd = endOfDay(new Date(evt.endDate));
    return evtStart <= weekEnd && evtEnd >= weekStart;
  });

  // Ordenar por fecha de inicio y mayor duración primero
  multiDayEvents.sort((a, b) => {
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    if (aStart !== bStart) return aStart - bStart;
    const aDur = new Date(a.endDate).getTime() - aStart;
    const bDur = new Date(b.endDate).getTime() - bStart;
    return bDur - aDur;
  });

  const lanes: boolean[][] = [];
  const segments: WeekSpanSegment[] = [];

  for (const evt of multiDayEvents) {
    const evtStart = startOfDay(new Date(evt.startDate));
    const evtEnd = startOfDay(new Date(evt.endDate));

    let startCol = 0;
    let endCol = 6;

    for (let i = 0; i < 7; i++) {
      const d = startOfDay(weekDays[i]);
      if (d.getTime() === evtStart.getTime()) {
        startCol = i;
      }
      if (d.getTime() === evtEnd.getTime()) {
        endCol = i;
      }
    }

    if (evtStart < weekStart) startCol = 0;
    if (evtEnd > startOfDay(weekDays[6])) endCol = 6;

    const spanCols = Math.max(1, endCol - startCol + 1);
    const isStart = evtStart >= weekStart;
    const isEnd = evtEnd <= startOfDay(weekDays[6]);

    // Asignar carril (lane) libre para evitar colisiones visuales
    let assignedLane = 0;
    while (true) {
      if (!lanes[assignedLane]) {
        lanes[assignedLane] = Array(7).fill(false);
      }
      let canFit = true;
      for (let c = startCol; c <= endCol; c++) {
        if (lanes[assignedLane][c]) {
          canFit = false;
          break;
        }
      }
      if (canFit) {
        for (let c = startCol; c <= endCol; c++) {
          lanes[assignedLane][c] = true;
        }
        break;
      }
      assignedLane++;
    }

    segments.push({
      event: evt,
      startCol,
      spanCols,
      isStart,
      isEnd,
      lane: assignedLane,
    });
  }

  return segments;
}

/**
 * Obtiene eventos de un solo día que corresponden a una fecha específica.
 */
export function getSingleDayEventsForDate(
  date: Date,
  events: CalendarEvent[]
): CalendarEvent[] {
  const target = startOfDay(date);
  return events
    .filter((evt) => {
      if (isMultiDayEvent(evt)) return false;
      const evtDate = startOfDay(new Date(evt.startDate));
      return evtDate.getTime() === target.getTime();
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
}

/**
 * Obtiene TODOS los eventos activos en una fecha específica (incluyendo bloques continuos
 * "Sábado a Sábado" que atraviesan ese día y eventos puntuales del día).
 */
export function getAllEventsForDate(
  date: Date,
  events: CalendarEvent[]
): CalendarEvent[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return events
    .filter((evt) => {
      const evtStart = startOfDay(new Date(evt.startDate));
      const evtEnd = endOfDay(new Date(evt.endDate));
      return evtStart <= dayEnd && evtEnd >= dayStart;
    })
    .sort((a, b) => {
      const aMulti = isMultiDayEvent(a) ? 0 : 1;
      const bMulti = isMultiDayEvent(b) ? 0 : 1;
      if (aMulti !== bMulti) return aMulti - bMulti;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
}

/**
 * Genera el próximo rango de "Sábado a Sábado" (8 días inclusive) a partir de una fecha de referencia.
 */
export function getNextSaturdayToSaturdayRange(baseDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const d = new Date(baseDate);
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const firstSaturday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + daysUntilSaturday,
    8,
    30
  );
  const nextSaturday = new Date(
    firstSaturday.getFullYear(),
    firstSaturday.getMonth(),
    firstSaturday.getDate() + 7,
    18,
    0
  );

  const fmt = (dt: Date) => {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  return {
    startDate: fmt(firstSaturday),
    endDate: fmt(nextSaturday),
  };
}

export function formatShortTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatReadableDateRange(
  startIso: string,
  endIso: string
): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';

  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
  };

  if (isSameDay(s, e)) {
    return `${s.toLocaleDateString('es-AR', opts)} · ${formatShortTime(
      startIso
    )} - ${formatShortTime(endIso)}`;
  }

  return `${s.toLocaleDateString('es-AR', opts)} → ${e.toLocaleDateString(
    'es-AR',
    opts
  )}`;
}

