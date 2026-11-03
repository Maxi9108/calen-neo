import { NextRequest, NextResponse } from 'next/server';
import { FastAPIEventDTO } from '@/types/calendar';
import {
  fetchAllFromGoogleSheet,
  getMemoryEvents,
  postToGoogleSheet,
  resolveGoogleSheetsUrl,
} from '@/lib/googleSheetsDb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const calendarType = searchParams.get('tipo_calendario');
  const category = searchParams.get('categoria');
  const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
  const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);

  let results: FastAPIEventDTO[] = [];
  let engine: 'google-sheets-drive' | 'neofaro-memory-bridge' =
    'neofaro-memory-bridge';

  if (sheetUrl) {
    const remote = await fetchAllFromGoogleSheet(sheetUrl);
    if (remote) {
      results = remote.eventos;
      engine = 'google-sheets-drive';
    } else {
      results = getMemoryEvents();
    }
  } else {
    results = getMemoryEvents();
  }

  if (calendarType) {
    results = results.filter((item) => item.tipo_calendario === calendarType);
  }
  if (category) {
    results = results.filter((item) => item.categoria === category);
  }

  return NextResponse.json(
    {
      status: 'ok',
      engine,
      sheetConfigured: Boolean(sheetUrl),
      count: results.length,
      data: results,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
    const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);
    const body = await request.json();

    // Soporte para sincronización por lote (batch_upsert_events o ingesta de Agente IA)
    if (Array.isArray(body.eventos)) {
      const store = getMemoryEvents();
      const normalizedBatch: FastAPIEventDTO[] = body.eventos.map(
        (evt: FastAPIEventDTO, idx: number) => ({
          ...evt,
          id:
            evt.id ||
            `evt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
          estado: evt.estado || 'pendiente',
          completado: Boolean(evt.completado),
          origen: evt.origen || 'agente_ia',
          actualizado_en: new Date().toISOString(),
        })
      );

      for (const item of normalizedBatch) {
        const existingIdx = store.findIndex((s) => s.id === item.id);
        if (existingIdx !== -1) {
          store[existingIdx] = item;
        } else {
          store.push(item);
        }
      }

      let syncedToSheet = false;
      if (sheetUrl) {
        syncedToSheet = await postToGoogleSheet(sheetUrl, {
          action: 'batch_upsert_events',
          events: normalizedBatch,
        });
      }

      return NextResponse.json(
        {
          status: 'created-batch',
          engine: syncedToSheet
            ? 'google-sheets-drive'
            : 'neofaro-memory-bridge',
          data: normalizedBatch,
        },
        { status: 201 }
      );
    }

    // Alta individual
    const dto: FastAPIEventDTO = body;
    if (!dto.titulo || !dto.fecha_inicio || !dto.tipo_calendario) {
      return NextResponse.json(
        {
          detail:
            'Campos obligatorios faltantes: titulo, fecha_inicio, tipo_calendario',
        },
        { status: 422 }
      );
    }

    const newEvent: FastAPIEventDTO = {
      ...dto,
      id:
        dto.id ||
        `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      estado: dto.estado || 'pendiente',
      completado: Boolean(dto.completado),
      origen: dto.origen || 'manual',
      actualizado_en: new Date().toISOString(),
    };

    const store = getMemoryEvents();
    store.push(newEvent);

    let syncedToSheet = false;
    if (sheetUrl) {
      syncedToSheet = await postToGoogleSheet(sheetUrl, {
        action: 'upsert_event',
        event: newEvent,
      });
    }

    return NextResponse.json(
      {
        status: 'created',
        engine: syncedToSheet ? 'google-sheets-drive' : 'neofaro-memory-bridge',
        data: newEvent,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { detail: 'Payload JSON inválido' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
    const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);
    const body: FastAPIEventDTO = await request.json();

    const store = getMemoryEvents();
    const index = store.findIndex((item) => item.id === body.id);

    const updatedEvent: FastAPIEventDTO = {
      ...(index !== -1 ? store[index] : body),
      ...body,
      actualizado_en: new Date().toISOString(),
    };

    if (index !== -1) {
      store[index] = updatedEvent;
    } else {
      store.push(updatedEvent);
    }

    let syncedToSheet = false;
    if (sheetUrl) {
      syncedToSheet = await postToGoogleSheet(sheetUrl, {
        action: 'upsert_event',
        event: updatedEvent,
      });
    }

    return NextResponse.json({
      status: 'updated',
      engine: syncedToSheet ? 'google-sheets-drive' : 'neofaro-memory-bridge',
      data: updatedEvent,
    });
  } catch {
    return NextResponse.json(
      { detail: 'Error al actualizar evento' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { detail: 'Falta parámetro id' },
        { status: 400 }
      );
    }

    const customSheetUrl = request.headers.get('X-Google-Sheets-Url');
    const sheetUrl = resolveGoogleSheetsUrl(customSheetUrl);

    const store = getMemoryEvents();
    const idx = store.findIndex((e) => e.id === id);
    if (idx !== -1) {
      store.splice(idx, 1);
    }

    let syncedToSheet = false;
    if (sheetUrl) {
      syncedToSheet = await postToGoogleSheet(sheetUrl, {
        action: 'delete_event',
        id,
      });
    }

    return NextResponse.json({
      status: 'deleted',
      engine: syncedToSheet ? 'google-sheets-drive' : 'neofaro-memory-bridge',
      id,
    });
  } catch {
    return NextResponse.json(
      { detail: 'Error al eliminar evento' },
      { status: 400 }
    );
  }
}
