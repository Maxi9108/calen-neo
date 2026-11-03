import {
  buildInitialSeedEvents,
  DEFAULT_SUBCATEGORIES,
} from '@/config/neofaro-theme';
import { mapCalendarEventToFastAPI } from '@/services/eventService';
import {
  BackgroundStyleId,
  CalendarType,
  FastAPIEventDTO,
  SubCategoryTag,
} from '@/types/calendar';

export interface SheetConfigRecord {
  clave: string;
  valor: string;
  actualizado_en?: string;
}

// Almacenamiento en memoria de respaldo cuando aún no se configuró GOOGLE_SHEETS_WEBHOOK_URL
let memoryEvents: FastAPIEventDTO[] | null = null;
let memorySubCategories: SubCategoryTag[] | null = null;
let memoryBackgrounds: Record<CalendarType, BackgroundStyleId> = {
  academico: 'neofaro-aurora',
  scout: 'neofaro-scout-topo',
  trabajo: 'neofaro-exec',
};

export function getMemoryEvents(): FastAPIEventDTO[] {
  if (!memoryEvents) {
    memoryEvents = buildInitialSeedEvents(new Date()).map((evt) =>
      mapCalendarEventToFastAPI(evt)
    );
  }
  return memoryEvents;
}

export function getMemorySubCategories(): SubCategoryTag[] {
  if (!memorySubCategories) {
    memorySubCategories = [...DEFAULT_SUBCATEGORIES];
  }
  return memorySubCategories;
}

export function getMemoryBackgrounds(): Record<CalendarType, BackgroundStyleId> {
  return memoryBackgrounds;
}

export function setMemoryPreferences(
  subCategories?: SubCategoryTag[],
  backgrounds?: Record<CalendarType, BackgroundStyleId>
) {
  if (subCategories) {
    memorySubCategories = subCategories;
  }
  if (backgrounds) {
    memoryBackgrounds = backgrounds;
  }
}

/**
 * Resuelve la URL del conector Google Sheets (Apps Script Web App)
 * desde el header personalizado o desde las variables de entorno en Vercel.
 */
export function resolveGoogleSheetsUrl(customHeaderUrl?: string | null): string | null {
  const fromHeader = customHeaderUrl?.trim();
  if (fromHeader && fromHeader.startsWith('https://script.google.com/')) {
    return fromHeader;
  }
  const fromEnv =
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
  if (fromEnv && fromEnv.trim().startsWith('https://script.google.com/')) {
    return fromEnv.trim();
  }
  return null;
}

/**
 * Lee todos los datos (Eventos, Subcategorías y Configuración) desde Google Sheets en Drive.
 */
export async function fetchAllFromGoogleSheet(sheetUrl: string): Promise<{
  eventos: FastAPIEventDTO[];
  subcategorias: SubCategoryTag[];
  configuracion: SheetConfigRecord[];
} | null> {
  try {
    const res = await fetch(`${sheetUrl}?resource=all`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.status === 'ok') {
      return {
        eventos: Array.isArray(data.eventos) ? data.eventos : [],
        subcategorias: Array.isArray(data.subcategorias)
          ? data.subcategorias
          : [],
        configuracion: Array.isArray(data.configuracion)
          ? data.configuracion
          : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Envía una operación de escritura (upsert_event, batch_upsert_events, delete_event, save_preferences)
 * al Google Sheet en Google Drive.
 */
export async function postToGoogleSheet(
  sheetUrl: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      redirect: 'follow',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

