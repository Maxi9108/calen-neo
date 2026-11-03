import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllFromGoogleSheet,
  getMemoryBackgrounds,
  getMemorySubCategories,
  postToGoogleSheet,
  resolveGoogleSheetsUrl,
  setMemoryPreferences,
} from '@/lib/googleSheetsDb';
import {
  BackgroundStyleId,
  CalendarType,
  SubCategoryTag,
} from '@/types/calendar';

export async function GET(request: NextRequest) {
  const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
  const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);

  if (sheetUrl) {
    const remote = await fetchAllFromGoogleSheet(sheetUrl);
    if (remote) {
      const backgrounds: Record<CalendarType, BackgroundStyleId> = {
        ...getMemoryBackgrounds(),
      };
      for (const row of remote.configuracion) {
        if (
          row.clave === 'bg_academico' ||
          row.clave === 'bg_scout' ||
          row.clave === 'bg_trabajo'
        ) {
          const cal = row.clave.replace('bg_', '') as CalendarType;
          backgrounds[cal] = row.valor as BackgroundStyleId;
        }
      }

      return NextResponse.json({
        status: 'ok',
        engine: 'google-sheets-drive',
        subCategories:
          remote.subcategorias.length > 0
            ? remote.subcategorias
            : getMemorySubCategories(),
        backgroundByCalendar: backgrounds,
      });
    }
  }

  return NextResponse.json({
    status: 'ok',
    engine: 'neofaro-memory-bridge',
    subCategories: getMemorySubCategories(),
    backgroundByCalendar: getMemoryBackgrounds(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
    const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);
    const body: {
      subCategories?: SubCategoryTag[];
      backgroundByCalendar?: Record<CalendarType, BackgroundStyleId>;
    } = await request.json();

    setMemoryPreferences(body.subCategories, body.backgroundByCalendar);

    let syncedToSheet = false;
    if (sheetUrl) {
      const configRows = body.backgroundByCalendar
        ? Object.entries(body.backgroundByCalendar).map(([cal, bg]) => ({
            clave: `bg_${cal}`,
            valor: bg,
            actualizado_en: new Date().toISOString(),
          }))
        : [];

      syncedToSheet = await postToGoogleSheet(sheetUrl, {
        action: 'save_preferences',
        subcategorias: body.subCategories,
        configuracion: configRows,
      });
    }

    return NextResponse.json({
      status: 'saved',
      engine: syncedToSheet ? 'google-sheets-drive' : 'neofaro-memory-bridge',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Error al guardar preferencias en Google Sheets' },
      { status: 400 }
    );
  }
}

