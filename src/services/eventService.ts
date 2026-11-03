import {
  BackgroundStyleId,
  CalendarEvent,
  CalendarType,
  FastAPIAgentIngestRequest,
  FastAPIEventDTO,
  SubCategoryTag,
} from '@/types/calendar';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'neofaro-dev-token-2026';

export type BackendConnectionMode =
  | 'google-sheets-drive'
  | 'fastapi-live'
  | 'nextjs-bridge'
  | 'offline-cache';

/**
 * Convierte el DTO snake_case proveniente de FastAPI o Google Sheets
 * al modelo camelCase tipado utilizado por los componentes de Next.js.
 */
export function mapFastAPIToCalendarEvent(dto: FastAPIEventDTO): CalendarEvent {
  const start = new Date(dto.fecha_inicio);
  const end = new Date(dto.fecha_fin);
  const diffDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const autoDetectedSatToSat =
    start.getDay() === 6 && end.getDay() === 6 && diffDays >= 6;

  return {
    id:
      dto.id ||
      `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: dto.titulo,
    description: dto.descripcion || '',
    startDate: dto.fecha_inicio,
    endDate: dto.fecha_fin,
    calendarType: dto.tipo_calendario,
    category: dto.categoria,
    status:
      dto.completado && dto.estado === 'pendiente' ? 'completado' : dto.estado,
    completed: Boolean(
      dto.completado ||
        dto.estado === 'completado' ||
        dto.estado === 'aprobado'
    ),
    origin: dto.origen || 'agente_ia',
    subCategoryId: dto.subcategoria_id ?? undefined,
    customColor: dto.color_personalizado ?? undefined,
    isSaturdayToSaturday:
      dto.es_sabado_a_sabado !== undefined
        ? dto.es_sabado_a_sabado
        : autoDetectedSatToSat,
    pointsEarned:
      dto.puntos_obtenidos !== null && dto.puntos_obtenidos !== undefined
        ? Number(dto.puntos_obtenidos)
        : undefined,
    pointsMax:
      dto.puntos_maximos !== null && dto.puntos_maximos !== undefined
        ? Number(dto.puntos_maximos)
        : undefined,
    location: dto.ubicacion ?? undefined,
    updatedAt: dto.actualizado_en || new Date().toISOString(),
  };
}

/**
 * Convierte un evento del Frontend Next.js al esquema exacto esperado por Google Sheets y FastAPI.
 */
export function mapCalendarEventToFastAPI(
  event: Omit<CalendarEvent, 'id'> & { id?: string }
): FastAPIEventDTO {
  return {
    ...(event.id ? { id: event.id } : {}),
    titulo: event.title,
    descripcion: event.description,
    fecha_inicio: event.startDate,
    fecha_fin: event.endDate,
    tipo_calendario: event.calendarType,
    categoria: event.category,
    estado: event.status,
    completado: event.completed,
    origen: event.origin,
    subcategoria_id: event.subCategoryId ?? null,
    color_personalizado: event.customColor ?? null,
    es_sabado_a_sabado: Boolean(event.isSaturdayToSaturday),
    puntos_obtenidos: event.pointsEarned ?? null,
    puntos_maximos: event.pointsMax ?? null,
    ubicacion: event.location ?? null,
    actualizado_en: new Date().toISOString(),
  };
}

function getHeaders(customSheetUrl?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-CalenNeo-Token': API_KEY,
  };
  if (customSheetUrl && customSheetUrl.trim()) {
    headers['X-Google-Sheets-Url'] = customSheetUrl.trim();
  }
  return headers;
}

/**
 * GET /api/events
 * Prioriza Google Sheets en Drive (vía Serverless Route Handler en Vercel) o FastAPI si está configurado.
 */
export async function fetchEventsFromBackend(
  calendarType?: CalendarType,
  customSheetUrl?: string
): Promise<{ events: CalendarEvent[]; mode: BackendConnectionMode }> {
  const query = calendarType ? `?tipo_calendario=${calendarType}` : '';

  // 1. Consultar endpoint Serverless de Next.js (/api/events -> conectado a Google Sheets en Drive)
  try {
    const bridgeResponse = await fetch(`/api/events${query}`, {
      method: 'GET',
      headers: getHeaders(customSheetUrl),
      cache: 'no-store',
    });

    if (bridgeResponse.ok) {
      const payload: {
        engine?: string;
        data: FastAPIEventDTO[];
      } = await bridgeResponse.json();
      const mode: BackendConnectionMode =
        payload.engine === 'google-sheets-drive'
          ? 'google-sheets-drive'
          : 'nextjs-bridge';
      return {
        events: (payload.data || []).map(mapFastAPIToCalendarEvent),
        mode,
      };
    }
  } catch {
    // Si falla el bridge, intentar FastAPI directo si existe URL
  }

  // 2. Intento directo a FastAPI si está definido
  if (FASTAPI_BASE_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);

      const response = await fetch(`${FASTAPI_BASE_URL}/events${query}`, {
        method: 'GET',
        headers: getHeaders(customSheetUrl),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data: FastAPIEventDTO[] = await response.json();
        return {
          events: data.map(mapFastAPIToCalendarEvent),
          mode: 'fastapi-live',
        };
      }
    } catch {
      // ignore
    }
  }

  return { events: [], mode: 'offline-cache' };
}

/**
 * POST /api/events
 * Guarda un nuevo evento en Google Sheets (Drive) y/o FastAPI.
 */
export async function createEventInBackend(
  eventData: Omit<CalendarEvent, 'id'>,
  customSheetUrl?: string
): Promise<{ event: CalendarEvent; mode: BackendConnectionMode }> {
  const dto = mapCalendarEventToFastAPI(eventData);

  try {
    const bridgeRes = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(customSheetUrl),
      body: JSON.stringify(dto),
    });

    if (bridgeRes.ok) {
      const result: { engine?: string; data: FastAPIEventDTO } =
        await bridgeRes.json();
      return {
        event: mapFastAPIToCalendarEvent(result.data),
        mode:
          result.engine === 'google-sheets-drive'
            ? 'google-sheets-drive'
            : 'nextjs-bridge',
      };
    }
  } catch {
    // Fallback local
  }

  return {
    event: mapFastAPIToCalendarEvent({
      ...dto,
      id: `evt-local-${Date.now()}`,
    }),
    mode: 'offline-cache',
  };
}

/**
 * PATCH /api/events
 * Actualiza un evento existente en Google Sheets (Drive).
 */
export async function updateEventInBackend(
  event: CalendarEvent,
  customSheetUrl?: string
): Promise<{ event: CalendarEvent; mode: BackendConnectionMode }> {
  const dto = mapCalendarEventToFastAPI(event);

  try {
    const bridgeRes = await fetch('/api/events', {
      method: 'PATCH',
      headers: getHeaders(customSheetUrl),
      body: JSON.stringify(dto),
    });
    if (bridgeRes.ok) {
      const result: { engine?: string; data: FastAPIEventDTO } =
        await bridgeRes.json();
      return {
        event: mapFastAPIToCalendarEvent(result.data),
        mode:
          result.engine === 'google-sheets-drive'
            ? 'google-sheets-drive'
            : 'nextjs-bridge',
      };
    }
  } catch {
    // Fallback local
  }

  return { event, mode: 'offline-cache' };
}

/**
 * DELETE /api/events?id=...
 * Elimina un evento de Google Sheets (Drive).
 */
export async function deleteEventFromBackend(
  eventId: string,
  customSheetUrl?: string
): Promise<{ mode: BackendConnectionMode }> {
  try {
    const res = await fetch(
      `/api/events?id=${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: getHeaders(customSheetUrl),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        mode:
          data.engine === 'google-sheets-drive'
            ? 'google-sheets-drive'
            : 'nextjs-bridge',
      };
    }
  } catch {
    // ignore
  }
  return { mode: 'offline-cache' };
}

/**
 * POST /api/events (Batch / Agente IA)
 * Ingesta un lote de eventos procesados por el Agente Automatizado y los persiste en Google Sheets.
 */
export async function ingestAgentPayloadToBackend(
  payload: FastAPIAgentIngestRequest,
  customSheetUrl?: string
): Promise<{ events: CalendarEvent[]; mode: BackendConnectionMode }> {
  try {
    const bridgeRes = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(customSheetUrl),
      body: JSON.stringify({
        agente_id: payload.agente_id,
        fuente: payload.fuente,
        eventos: payload.eventos,
      }),
    });

    if (bridgeRes.ok) {
      const result: { engine?: string; data: FastAPIEventDTO[] } =
        await bridgeRes.json();
      return {
        events: (result.data || []).map(mapFastAPIToCalendarEvent),
        mode:
          result.engine === 'google-sheets-drive'
            ? 'google-sheets-drive'
            : 'nextjs-bridge',
      };
    }
  } catch {
    // Fallback local
  }

  const mappedEvents = payload.eventos.map((dto, idx) =>
    mapFastAPIToCalendarEvent({
      ...dto,
      id: dto.id || `evt-agent-${Date.now()}-${idx}`,
      origen: dto.origen || 'agente_ia',
    })
  );

  return {
    events: mappedEvents,
    mode: 'offline-cache',
  };
}

/**
 * Sincroniza Subcategorías (Materias UNGS / Ramas Scout / Áreas Laborales) y Fondos con Google Sheets.
 */
export async function savePreferencesToBackend(
  subCategories: SubCategoryTag[],
  backgroundByCalendar: Record<CalendarType, BackgroundStyleId>,
  customSheetUrl?: string
): Promise<BackendConnectionMode> {
  try {
    const res = await fetch('/api/preferences', {
      method: 'POST',
      headers: getHeaders(customSheetUrl),
      body: JSON.stringify({ subCategories, backgroundByCalendar }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.engine === 'google-sheets-drive'
        ? 'google-sheets-drive'
        : 'nextjs-bridge';
    }
  } catch {
    // ignore
  }
  return 'offline-cache';
}

export async function fetchPreferencesFromBackend(
  customSheetUrl?: string
): Promise<{
  subCategories?: SubCategoryTag[];
  backgroundByCalendar?: Record<CalendarType, BackgroundStyleId>;
  mode: BackendConnectionMode;
} | null> {
  try {
    const res = await fetch('/api/preferences', {
      method: 'GET',
      headers: getHeaders(customSheetUrl),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return {
        subCategories: data.subCategories,
        backgroundByCalendar: data.backgroundByCalendar,
        mode:
          data.engine === 'google-sheets-drive'
            ? 'google-sheets-drive'
            : 'nextjs-bridge',
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Sincroniza el estado completo actual (todos los eventos + materias/ramas + fondos) hacia Google Sheets en Drive.
 */
export async function pushAllStateToGoogleSheets(
  events: CalendarEvent[],
  subCategories: SubCategoryTag[],
  backgroundByCalendar: Record<CalendarType, BackgroundStyleId>,
  customSheetUrl?: string
): Promise<{ ok: boolean; mode: BackendConnectionMode }> {
  const dtos = events.map((e) => mapCalendarEventToFastAPI(e));

  const [, modePref] = await Promise.all([
    fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(customSheetUrl),
      body: JSON.stringify({ eventos: dtos }),
    }),
    savePreferencesToBackend(
      subCategories,
      backgroundByCalendar,
      customSheetUrl
    ),
  ]);

  return {
    ok: modePref === 'google-sheets-drive',
    mode: modePref,
  };
}
