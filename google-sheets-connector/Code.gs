/**
 * ============================================================================
 * CONECTOR GOOGLE SHEETS PARA CALEN-NEO · VERCEL 24/7
 * ============================================================================
 * INSTRUCCIONES DE INSTALACIÓN EN TU GOOGLE DRIVE (Toma 2 minutos):
 *
 * 1. Creá una hoja de cálculo nueva en tu Google Drive (ej: "Calen-Neo DB").
 * 2. En el menú superior, abrí: Extensiones -> Apps Script.
 * 3. Borrá el código que aparece por defecto y pegá todo este archivo.
 * 4. Hacé clic en el ícono de Guardar (💾) y ejecutá una vez la función
 *    `inicializarHojasCalenNeo` desde el botón "Ejecutar" arriba para que cree
 *    las pestañas y columnas automáticamente.
 * 5. Hacé clic en el botón azul "Implementar" (arriba a la derecha) ->
 *    "Nueva implementación".
 * 6. En "Selecciona el tipo", elegí "Aplicación web" (Web App):
 *    - Ejecutar como: "Yo" (tu cuenta de Google).
 *    - Quién tiene acceso: "Cualquier persona" (para que Vercel y tu Agente
 *      puedan leer/escribir mediante la URL HTTPS).
 * 7. Copiá la "URL de la aplicación web" (termina en /exec) y pegala en Vercel
 *    como variable de entorno:
 *    GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
 *    (También podés pegarla directamente desde el panel "Google Drive / Sheets"
 *    dentro de la aplicación web Calen-Neo).
 * ============================================================================
 */

const SHEET_EVENTS = 'Eventos';
const SHEET_SUBCATEGORIES = 'Subcategorias';
const SHEET_CONFIG = 'Configuracion';

const EVENT_HEADERS = [
  'id',
  'titulo',
  'descripcion',
  'fecha_inicio',
  'fecha_fin',
  'tipo_calendario',
  'categoria',
  'estado',
  'completado',
  'origen',
  'subcategoria_id',
  'color_personalizado',
  'es_sabado_a_sabado',
  'puntos_obtenidos',
  'puntos_maximos',
  'ubicacion',
  'actualizado_en'
];

const SUBCAT_HEADERS = [
  'id',
  'calendarType',
  'name',
  'shortCode',
  'colorHex',
  'description'
];

const CONFIG_HEADERS = [
  'clave',
  'valor',
  'actualizado_en'
];

function inicializarHojasCalenNeo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_EVENTS, EVENT_HEADERS, '#4F46E5');
  ensureSheet(ss, SHEET_SUBCATEGORIES, SUBCAT_HEADERS, '#10B981');
  ensureSheet(ss, SHEET_CONFIG, CONFIG_HEADERS, '#0284C7');
}

// Alias para compatibilidad
function inicializarHojasNeoFaro() {
  inicializarHojasCalenNeo();
}

function ensureSheet(ss, name, headers, headerHex) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerHex);
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resource = (e && e.parameter && e.parameter.resource) || 'all';

  const eventsSheet = ensureSheet(ss, SHEET_EVENTS, EVENT_HEADERS, '#4F46E5');
  const subcatSheet = ensureSheet(ss, SHEET_SUBCATEGORIES, SUBCAT_HEADERS, '#10B981');
  const configSheet = ensureSheet(ss, SHEET_CONFIG, CONFIG_HEADERS, '#0284C7');

  const responsePayload = {
    status: 'ok',
    engine: 'Google-Sheets-Drive-CalenNeo',
    eventos: readSheetRows(eventsSheet, EVENT_HEADERS).map(normalizeEventRow),
    subcategorias: readSheetRows(subcatSheet, SUBCAT_HEADERS),
    configuracion: readSheetRows(configSheet, CONFIG_HEADERS)
  };

  if (resource === 'events') {
    return jsonResponse({ status: 'ok', data: responsePayload.eventos });
  }

  return jsonResponse(responsePayload);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);
    const action = body.action || 'upsert_event';

    if (action === 'upsert_event') {
      const sheet = ensureSheet(ss, SHEET_EVENTS, EVENT_HEADERS, '#4F46E5');
      const evt = body.event;
      upsertRowById(sheet, EVENT_HEADERS, 'id', evt);
      return jsonResponse({ status: 'ok', action: action, data: evt });
    }

    if (action === 'batch_upsert_events') {
      const sheet = ensureSheet(ss, SHEET_EVENTS, EVENT_HEADERS, '#4F46E5');
      const list = body.events || [];
      for (var i = 0; i < list.length; i++) {
        upsertRowById(sheet, EVENT_HEADERS, 'id', list[i]);
      }
      return jsonResponse({ status: 'ok', count: list.length, data: list });
    }

    if (action === 'delete_event') {
      const sheet = ensureSheet(ss, SHEET_EVENTS, EVENT_HEADERS, '#4F46E5');
      deleteRowById(sheet, 'id', body.id);
      return jsonResponse({ status: 'ok', deletedId: body.id });
    }

    if (action === 'save_preferences') {
      if (Array.isArray(body.subcategorias)) {
        const subSheet = ensureSheet(ss, SHEET_SUBCATEGORIES, SUBCAT_HEADERS, '#10B981');
        replaceAllRows(subSheet, SUBCAT_HEADERS, body.subcategorias);
      }
      if (Array.isArray(body.configuracion)) {
        const cfgSheet = ensureSheet(ss, SHEET_CONFIG, CONFIG_HEADERS, '#0284C7');
        replaceAllRows(cfgSheet, CONFIG_HEADERS, body.configuracion);
      }
      return jsonResponse({ status: 'ok', action: 'save_preferences' });
    }

    return jsonResponse({ status: 'error', message: 'Acción no reconocida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: String(err) });
  }
}

function readSheetRows(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const rows = [];
  for (var r = 0; r < values.length; r++) {
    const rowObj = {};
    let hasId = false;
    for (var c = 0; c < headers.length; c++) {
      const key = headers[c];
      const val = values[r][c];
      if (c === 0 && val !== '' && val !== null) hasId = true;
      rowObj[key] = val;
    }
    if (hasId) rows.push(rowObj);
  }
  return rows;
}

function normalizeEventRow(row) {
  return {
    id: String(row.id || ''),
    titulo: String(row.titulo || ''),
    descripcion: String(row.descripcion || ''),
    fecha_inicio: String(row.fecha_inicio || ''),
    fecha_fin: String(row.fecha_fin || ''),
    tipo_calendario: String(row.tipo_calendario || 'academico'),
    categoria: String(row.categoria || 'actividad'),
    estado: String(row.estado || 'pendiente'),
    completado: row.completado === true || String(row.completado).toLowerCase() === 'true',
    origen: String(row.origen || 'manual'),
    subcategoria_id: row.subcategoria_id ? String(row.subcategoria_id) : null,
    color_personalizado: row.color_personalizado ? String(row.color_personalizado) : null,
    es_sabado_a_sabado:
      row.es_sabado_a_sabado === true ||
      String(row.es_sabado_a_sabado).toLowerCase() === 'true',
    puntos_obtenidos:
      row.puntos_obtenidos !== '' && row.puntos_obtenidos !== null
        ? Number(row.puntos_obtenidos)
        : null,
    puntos_maximos:
      row.puntos_maximos !== '' && row.puntos_maximos !== null
        ? Number(row.puntos_maximos)
        : null,
    ubicacion: row.ubicacion ? String(row.ubicacion) : null,
    actualizado_en: String(row.actualizado_en || new Date().toISOString())
  };
}

function upsertRowById(sheet, headers, idKey, obj) {
  const lastRow = sheet.getLastRow();
  const rowArray = headers.map(function (h) {
    const v = obj[h];
    return v === undefined || v === null ? '' : v;
  });

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(obj[idKey])) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowArray]);
        return;
      }
    }
  }
  sheet.appendRow(rowArray);
}

function deleteRowById(sheet, idKey, targetId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(targetId)) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function replaceAllRows(sheet, headers, items) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }
  if (!items || items.length === 0) return;
  const matrix = items.map(function (item) {
    return headers.map(function (h) {
      const v = item[h];
      return v === undefined || v === null ? '' : v;
    });
  });
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

