import {
  CalendarType,
  EventCategory,
  EventStatus,
  FastAPIEventDTO,
  SubCategoryTag,
} from '@/types/calendar';

export interface AnalyzedCandidateEvent {
  tempId: string;
  selected: boolean;
  confidence: 'alta' | 'media';
  sourceSnippet: string;
  detectedReasons: string[];
  dto: FastAPIEventDTO;
}

const MONTH_NAMES_MAP: Record<string, number> = {
  enero: 0,
  ene: 0,
  febrero: 1,
  feb: 1,
  marzo: 2,
  mar: 2,
  abril: 3,
  abr: 3,
  mayo: 4,
  may: 4,
  junio: 5,
  jun: 5,
  julio: 6,
  jul: 6,
  agosto: 7,
  ago: 7,
  septiembre: 8,
  setiembre: 8,
  sep: 8,
  set: 8,
  octubre: 9,
  oct: 9,
  noviembre: 10,
  nov: 10,
  diciembre: 11,
  dic: 11,
};

/**
 * Parsea archivos .ics (iCalendar de Moodle UNGS / Google Calendar)
 */
function parseIcsContent(
  icsText: string,
  defaultCalendar: CalendarType
): AnalyzedCandidateEvent[] {
  const candidates: AnalyzedCandidateEvent[] = [];
  const blocks = icsText.split('BEGIN:VEVENT').slice(1);

  blocks.forEach((block, idx) => {
    const summaryMatch = block.match(/SUMMARY(?:;[^:]*)?:(.+)/i);
    const descMatch = block.match(/DESCRIPTION(?:;[^:]*)?:(.+)/i);
    const dtStartMatch = block.match(/DTSTART(?:;[^:]*)?:(\d{8}(?:T\d{4,6}Z?)?)/i);
    const dtEndMatch = block.match(/DTEND(?:;[^:]*)?:(\d{8}(?:T\d{4,6}Z?)?)/i);
    const locMatch = block.match(/LOCATION(?:;[^:]*)?:(.+)/i);

    if (!summaryMatch || !dtStartMatch) return;

    const parseIcsDate = (raw: string): string => {
      const clean = raw.trim();
      const y = clean.slice(0, 4);
      const m = clean.slice(4, 6);
      const d = clean.slice(6, 8);
      const hh = clean.length >= 11 ? clean.slice(9, 11) : '09';
      const mm = clean.length >= 13 ? clean.slice(11, 13) : '00';
      return `${y}-${m}-${d}T${hh}:${mm}`;
    };

    const title = summaryMatch[1].trim().replace(/\\,/g, ',');
    const description = descMatch
      ? descMatch[1].trim().replace(/\\n/g, ' ').replace(/\\,/g, ',')
      : '';
    const startIso = parseIcsDate(dtStartMatch[1]);
    const endIso = dtEndMatch ? parseIcsDate(dtEndMatch[1]) : startIso;
    const location = locMatch ? locMatch[1].trim() : null;

    const classification = classifyLineSemantics(
      `${title} ${description}`,
      defaultCalendar,
      []
    );

    candidates.push({
      tempId: `cand-ics-${Date.now()}-${idx}`,
      selected: true,
      confidence: 'alta',
      sourceSnippet: `Archivo .ICS: ${title} (${startIso.slice(0, 10)})`,
      detectedReasons: ['Evento iCalendar (.ics)', ...classification.reasons],
      dto: {
        titulo: title,
        descripcion: description,
        fecha_inicio: startIso,
        fecha_fin: endIso,
        tipo_calendario: classification.calendarType,
        categoria: classification.category,
        estado: classification.status,
        completado:
          classification.status === 'completado' ||
          classification.status === 'aprobado',
        origen: 'agente_ia',
        subcategoria_id: classification.subCategoryId,
        es_sabado_a_sabado: classification.isSatToSat,
        puntos_obtenidos: classification.pointsEarned,
        puntos_maximos: classification.pointsMax,
        ubicacion: location,
      },
    });
  });

  return candidates;
}

/**
 * Clasifica semánticamente un fragmento de texto en español determinando:
 * - Calendario (Académico UNGS, Scout, Trabajo)
 * - Categoría (TP, Examen, Final, Charla, Evento con Puntos, Lecturas, Tarea, Actividad)
 * - Materia / Rama / Área asociada
 * - Puntaje si menciona puntos o créditos
 * - Si es un bloque "Sábado a Sábado"
 */
function classifyLineSemantics(
  text: string,
  fallbackCalendar: CalendarType,
  subCategories: SubCategoryTag[]
): {
  calendarType: CalendarType;
  category: EventCategory;
  status: EventStatus;
  subCategoryId: string | null;
  isSatToSat: boolean;
  pointsEarned: number | null;
  pointsMax: number | null;
  location: string | null;
  reasons: string[];
} {
  const lower = text.toLowerCase();
  const reasons: string[] = [];

  // 1. Detectar Calendario (Académico UNGS vs Scout vs Trabajo)
  let calendarType: CalendarType = fallbackCalendar;
  if (
    /\b(ungs|parcial|recuperatorio|final|tp\d*|trabajo pr[aá]ctico|c[aá]tedra|m[oó]dulo \d|coloquio|lectura|bibliograf[ií]a|programaci[oó]n|ingenier[ií]a de software|sistemas operativos|verificaci[oó]n)\b/i.test(
      lower
    )
  ) {
    calendarType = 'academico';
    reasons.push('Entorno: Académico UNGS');
  } else if (
    /\b(scout|campamento|acantonamiento|manada|lobatos|unidad scout|caminantes|rovers|patrulla|fog[oó]n|raid|consejo de grupo|s[aá]bado a s[aá]bado|insignia)\b/i.test(
      lower
    )
  ) {
    calendarType = 'scout';
    reasons.push('Entorno: Scout');
  } else if (
    /\b(sprint|daily|release|deploy|producci[oó]n|cliente|stakeholder|okr|reuni[oó]n laboral|guardia|pull request|backend|fastapi)\b/i.test(
      lower
    )
  ) {
    calendarType = 'trabajo';
    reasons.push('Entorno: Trabajo');
  }

  // 2. Detectar Categoría (8 categorías admitidas)
  let category: EventCategory =
    calendarType === 'academico'
      ? 'tarea'
      : calendarType === 'scout'
      ? 'actividad'
      : 'tarea';

  // Detectar si menciona puntos o créditos
  const pointsMatch = lower.match(
    /(\d+)\s*(?:\/|de)\s*(\d+)\s*(?:puntos|pts|cr[eé]ditos)|(\d+)\s*(?:puntos|pts|cr[eé]ditos)/i
  );
  let pointsEarned: number | null = null;
  let pointsMax: number | null = null;

  if (pointsMatch) {
    category = 'evento_con_puntos';
    if (pointsMatch[1] && pointsMatch[2]) {
      pointsEarned = Number(pointsMatch[1]);
      pointsMax = Number(pointsMatch[2]);
    } else if (pointsMatch[3]) {
      pointsEarned = 0;
      pointsMax = Number(pointsMatch[3]);
    }
    reasons.push(`Evento con Puntos (${pointsMax} pts)`);
  } else if (/\b(final|mesa de examen|examen final|defensa final)\b/i.test(lower)) {
    category = 'final';
    reasons.push('Categoría: Examen Final');
  } else if (
    /\b(parcial|recuperatorio|examen|evaluaci[oó]n|simulacro)\b/i.test(lower)
  ) {
    category = 'examen';
    reasons.push('Categoría: Examen / Parcial');
  } else if (
    /\b(tp\s*\d*|trabajo pr[aá]ctico|entrega de tp|laboratorio)\b/i.test(lower)
  ) {
    category = 'trabajo_practico';
    reasons.push('Categoría: Trabajo Práctico');
  } else if (
    /\b(lectura|leer|cap[ií]tulo|bibliograf[ií]a|paper|apunte)\b/i.test(lower)
  ) {
    category = 'lecturas';
    reasons.push('Categoría: Lecturas');
  } else if (
    /\b(charla|seminario|conferencia|reuni[oó]n|consejo|demo|presentaci[oó]n|fog[oó]n)\b/i.test(
      lower
    )
  ) {
    category = 'charla';
    reasons.push('Categoría: Charla / Reunión');
  } else if (
    /\b(campamento|raid|acantonamiento|salida|jornada|taller|actividad|servicio)\b/i.test(
      lower
    )
  ) {
    category = 'actividad';
    reasons.push('Categoría: Actividad');
  } else if (/\b(tarea|ejercicio|gu[ií]a|ticket|fix|desarrollo)\b/i.test(lower)) {
    category = 'tarea';
    reasons.push('Categoría: Tarea');
  }

  // 3. Detectar "Sábado a Sábado" o campamento multi-día
  const isSatToSat =
    /\b(s[aá]bado a s[aá]bado|sab a sab|campamento|8 d[ií]as|semana completa)\b/i.test(
      lower
    );
  if (isSatToSat) {
    reasons.push('Formato: Bloque Sábado a Sábado');
  }

  // 4. Detectar Estado (pendiente, en_proceso, completado, aprobado)
  let status: EventStatus = 'pendiente';
  if (/\b(aprobado|aprobada|acredita2|acreditado|promocionado)\b/i.test(lower)) {
    status = 'aprobado';
  } else if (
    /\b(completado|completada|finalizado|finalizada|entregado|hecho|listo)\b/i.test(
      lower
    )
  ) {
    status = 'completado';
  } else if (/\b(en proceso|en curso|avanzando|haciendo)\b/i.test(lower)) {
    status = 'en_proceso';
  }

  // 5. Detectar Materia UNGS / Rama Scout / Área Laboral
  let matchedSubCategoryId: string | null = null;
  const calSubs = subCategories.filter((s) => s.calendarType === calendarType);

  for (const sub of calSubs) {
    const nameTokens = sub.name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);
    const codeLower = sub.shortCode.toLowerCase();
    if (
      lower.includes(codeLower) ||
      nameTokens.some((tok) => lower.includes(tok))
    ) {
      matchedSubCategoryId = sub.id;
      reasons.push(`Etiqueta: ${sub.shortCode}`);
      break;
    }
  }

  if (!matchedSubCategoryId && calSubs.length > 0) {
    matchedSubCategoryId = calSubs[0].id;
  }

  // 6. Detectar Ubicación si aparece "Aula ...", "Módulo ...", "Sede ...", "Lugar: ..."
  let location: string | null = null;
  const locMatch = text.match(
    /(?:aula\s+[\w\d-]+|m[oó]dulo\s+\d+|laboratorio\s+[\w\d-]+|campo\s+escuela[^,.;]*|sede\s+[^,.;]*|lugar:\s*([^,.;]+))/i
  );
  if (locMatch) {
    location = (locMatch[1] || locMatch[0]).trim();
  }

  return {
    calendarType,
    category,
    status,
    subCategoryId: matchedSubCategoryId,
    isSatToSat,
    pointsEarned,
    pointsMax,
    location,
    reasons,
  };
}

/**
 * Extrae fechas y rangos de fechas en español desde una línea de texto.
 * Soporta:
 * - "del 7 al 14 de noviembre" / "del 07/11 al 14/11"
 * - "14/11/2026" o "14/11" o "2026-11-14"
 * - "14 de noviembre"
 * - Horarios como "14:00 a 18:00", "de 9 a 13 hs", "18:30hs"
 */
function extractDatesFromLine(
  line: string,
  referenceDate: Date,
  forceSatToSat: boolean
): { startDate: string; endDate: string; foundExplicitDate: boolean } {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();

  // Horarios opcionales en la línea
  let startHour = 9;
  let startMin = 0;
  let endHour = 11;
  let endMin = 0;

  const timeRangeMatch = line.match(
    /(\d{1,2})(?::(\d{2}))?\s*(?:a|-|hasta las?)\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs|horas|h)?/i
  );
  const singleTimeMatch = line.match(/(\d{1,2}):(\d{2})\s*(?:hs|horas|h)?/i);

  if (timeRangeMatch && Number(timeRangeMatch[1]) <= 23 && Number(timeRangeMatch[3]) <= 23) {
    // Verificar que no sea un rango de días tipo "del 7 al 14"
    const beforeText = line.slice(0, timeRangeMatch.index || 0).toLowerCase();
    if (!beforeText.endsWith('del ')) {
      startHour = Number(timeRangeMatch[1]);
      startMin = timeRangeMatch[2] ? Number(timeRangeMatch[2]) : 0;
      endHour = Number(timeRangeMatch[3]);
      endMin = timeRangeMatch[4] ? Number(timeRangeMatch[4]) : 0;
    }
  } else if (singleTimeMatch && Number(singleTimeMatch[1]) <= 23) {
    startHour = Number(singleTimeMatch[1]);
    startMin = Number(singleTimeMatch[2]);
    endHour = Math.min(23, startHour + 2);
    endMin = startMin;
  }

  const fmt = (y: number, m: number, d: number, hh: number, mm: number) => {
    const dt = new Date(y, m, d, hh, mm);
    const yyyy = dt.getFullYear();
    const mon = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hStr = String(dt.getHours()).padStart(2, '0');
    const mStr = String(dt.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mon}-${day}T${hStr}:${mStr}`;
  };

  // Caso 1: Rango "del X al Y de [mes]" (ej: "del 7 al 14 de noviembre")
  const spanMonthMatch = line.match(
    /del\s+(\d{1,2})\s+(?:de\s+[a-záéíóú]+\s+)?al\s+(\d{1,2})\s+de\s+([a-záéíóú]+)/i
  );
  if (spanMonthMatch) {
    const d1 = Number(spanMonthMatch[1]);
    const d2 = Number(spanMonthMatch[2]);
    const mName = spanMonthMatch[3].toLowerCase();
    const monthIdx =
      MONTH_NAMES_MAP[mName] !== undefined ? MONTH_NAMES_MAP[mName] : refMonth;
    return {
      startDate: fmt(refYear, monthIdx, d1, startHour, startMin),
      endDate: fmt(refYear, monthIdx, d2, 18, 0),
      foundExplicitDate: true,
    };
  }

  // Caso 2: Rango numérico "del DD/MM al DD/MM" o "DD/MM al DD/MM"
  const spanSlashMatch = line.match(
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:al|-|hasta)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (spanSlashMatch) {
    const d1 = Number(spanSlashMatch[1]);
    const m1 = Number(spanSlashMatch[2]) - 1;
    const y1 = spanSlashMatch[3]
      ? Number(spanSlashMatch[3].length === 2 ? `20${spanSlashMatch[3]}` : spanSlashMatch[3])
      : refYear;
    const d2 = Number(spanSlashMatch[4]);
    const m2 = Number(spanSlashMatch[5]) - 1;
    const y2 = spanSlashMatch[6]
      ? Number(spanSlashMatch[6].length === 2 ? `20${spanSlashMatch[6]}` : spanSlashMatch[6])
      : y1;

    return {
      startDate: fmt(y1, m1, d1, startHour, startMin),
      endDate: fmt(y2, m2, d2, 18, 0),
      foundExplicitDate: true,
    };
  }

  // Caso 3: Fecha ISO "YYYY-MM-DD"
  const isoMatch = line.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    const endD = forceSatToSat ? d + 7 : d;
    return {
      startDate: fmt(y, m, d, startHour, startMin),
      endDate: fmt(y, m, endD, forceSatToSat ? 18 : endHour, endMin),
      foundExplicitDate: true,
    };
  }

  // Caso 4: Fecha "DD de [mes] (de YYYY)"
  const naturalDateMatch = line.match(
    /(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i
  );
  if (naturalDateMatch) {
    const d = Number(naturalDateMatch[1]);
    const mName = naturalDateMatch[2].toLowerCase();
    const m = MONTH_NAMES_MAP[mName];
    if (m !== undefined) {
      const y = naturalDateMatch[3] ? Number(naturalDateMatch[3]) : refYear;
      const endD = forceSatToSat ? d + 7 : d;
      return {
        startDate: fmt(y, m, d, startHour, startMin),
        endDate: fmt(y, m, endD, forceSatToSat ? 18 : endHour, endMin),
        foundExplicitDate: true,
      };
    }
  }

  // Caso 5: Fecha "DD/MM(/YYYY)"
  const slashDateMatch = line.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashDateMatch) {
    const d = Number(slashDateMatch[1]);
    const m = Number(slashDateMatch[2]) - 1;
    if (d >= 1 && d <= 31 && m >= 0 && m <= 11) {
      const y = slashDateMatch[3]
        ? Number(
            slashDateMatch[3].length === 2
              ? `20${slashDateMatch[3]}`
              : slashDateMatch[3]
          )
        : refYear;
      const endD = forceSatToSat ? d + 7 : d;
      return {
        startDate: fmt(y, m, d, startHour, startMin),
        endDate: fmt(y, m, endD, forceSatToSat ? 18 : endHour, endMin),
        foundExplicitDate: true,
      };
    }
  }

  // Fallback: si menciona "sábado" o forceSatToSat, buscar el próximo sábado del mes actual
  const dayOfWeek = referenceDate.getDay();
  const daysUntilSat = (6 - dayOfWeek + 7) % 7;
  const baseDay = referenceDate.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat);
  const endDay = forceSatToSat ? baseDay + 7 : baseDay;

  return {
    startDate: fmt(refYear, refMonth, baseDay, startHour, startMin),
    endDate: fmt(refYear, refMonth, endDay, forceSatToSat ? 18 : endHour, endMin),
    foundExplicitDate: false,
  };
}

/**
 * Limpia prefijos de viñetas y fechas al principio para obtener un título limpio.
 */
function extractCleanTitle(rawLine: string): string {
  let cleaned = rawLine
    .replace(/^[\s•*+>-]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();

  // Si tiene dos puntos después de una fecha corta (ej. "14/11: Segundo Parcial...")
  const datePrefixMatch = cleaned.match(
    /^(?:s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes)?\s*(?:del\s+\d{1,2}\s+al\s+\d{1,2}\s+de\s+[a-záéíóú]+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{1,2}\s+de\s+[a-záéíóú]+)\s*[-:–]\s*(.+)$/i
  );
  if (datePrefixMatch && datePrefixMatch[1].trim().length >= 4) {
    cleaned = datePrefixMatch[1].trim();
  }

  if (cleaned.length > 95) {
    return cleaned.slice(0, 92).trim() + '...';
  }
  return cleaned;
}

/**
 * Función principal que analiza cualquier texto libre o contenido de documento
 * (.txt, .md, .csv, .ics, .json) y devuelve la lista de candidatos detectados
 * para que el usuario los revise, edite y confirme.
 */
export function analyzeDocumentOrText(
  rawText: string,
  defaultCalendar: CalendarType,
  subCategories: SubCategoryTag[],
  referenceDate: Date = new Date(),
  fileName?: string
): AnalyzedCandidateEvent[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1. Si es un archivo iCalendar (.ics)
  if (
    trimmed.includes('BEGIN:VCALENDAR') ||
    (fileName && fileName.toLowerCase().endsWith('.ics'))
  ) {
    return parseIcsContent(trimmed, defaultCalendar);
  }

  // 2. Si es un JSON con eventos
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list: FastAPIEventDTO[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.eventos)
        ? parsed.eventos
        : [];
      if (list.length > 0) {
        return list.map((dto, i) => ({
          tempId: `cand-json-${Date.now()}-${i}`,
          selected: true,
          confidence: 'alta',
          sourceSnippet: `Registro JSON #${i + 1}: ${dto.titulo}`,
          detectedReasons: ['Estructura JSON directa'],
          dto: {
            ...dto,
            tipo_calendario: dto.tipo_calendario || defaultCalendar,
            categoria: dto.categoria || 'actividad',
            estado: dto.estado || 'pendiente',
            completado: Boolean(dto.completado),
            origen: 'agente_ia',
          },
        }));
      }
    } catch {
      // Continuar con el análisis de texto natural
    }
  }

  // 3. Análisis línea por línea / bloque por bloque en lenguaje natural o CSV
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 6);

  const candidates: AnalyzedCandidateEvent[] = [];

  lines.forEach((line, idx) => {
    // Ignorar encabezados puros o separadores
    if (/^[=#\-_*]{4,}$/.test(line)) return;
    if (
      /^id[,;\t]titulo[,;\t]/i.test(line) ||
      /^fecha[,;\t]actividad/i.test(line)
    ) {
      return;
    }

    const semantics = classifyLineSemantics(
      line,
      defaultCalendar,
      subCategories
    );
    const dateInfo = extractDatesFromLine(
      line,
      referenceDate,
      semantics.isSatToSat
    );

    // Determinar si la línea tiene suficiente señal de ser un evento/actividad
    const hasActionKeywords =
      semantics.reasons.length > 0 ||
      dateInfo.foundExplicitDate ||
      /\b(entrega|parcial|examen|final|tp|campamento|reuni[oó]n|charla|taller|lectura|sprint|demo|s[aá]bado|actividad| puntos)\b/i.test(
        line
      );

    if (!hasActionKeywords && lines.length > 3) {
      return;
    }

    const title = extractCleanTitle(line);

    // Verificar si la fecha calculada es efectivamente de Sábado a Sábado
    const sDate = new Date(dateInfo.startDate);
    const eDate = new Date(dateInfo.endDate);
    const diffDays = Math.round(
      (eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isSatToSatConfirmed =
      semantics.isSatToSat ||
      (sDate.getDay() === 6 && eDate.getDay() === 6 && diffDays >= 6);

    candidates.push({
      tempId: `cand-${Date.now()}-${idx}`,
      selected: true,
      confidence: dateInfo.foundExplicitDate ? 'alta' : 'media',
      sourceSnippet: line,
      detectedReasons: [
        ...(dateInfo.foundExplicitDate
          ? ['Fecha explícita detectada']
          : ['Fecha sugerida (editable)']),
        ...semantics.reasons,
      ],
      dto: {
        titulo: title,
        descripcion: `Extraído del documento/texto: "${line}"`,
        fecha_inicio: dateInfo.startDate,
        fecha_fin: dateInfo.endDate,
        tipo_calendario: semantics.calendarType,
        categoria: semantics.category,
        estado: semantics.status,
        completado:
          semantics.status === 'completado' || semantics.status === 'aprobado',
        origen: 'agente_ia',
        subcategoria_id: semantics.subCategoryId,
        es_sabado_a_sabado: isSatToSatConfirmed,
        puntos_obtenidos: semantics.pointsEarned,
        puntos_maximos: semantics.pointsMax,
        ubicacion: semantics.location,
      },
    });
  });

  return candidates;
}

export const SAMPLE_TEXTS_BY_CALENDAR: Record<
  CalendarType,
  { label: string; text: string }
> = {
  academico: {
    label: 'Ejemplo Cronograma UNGS',
    text: `- 06/11 18:00 a 22:00: Entrega TP Integrador de Programación III en Laboratorio 7104.
- 12/11 14:00 a 18:00: Segundo Parcial de Ingeniería de Software I en Aula 7024.
- 16/11 10:00 a 13:00: Seminario de Verificación Formal e IA en UNGS (Acredita 25 puntos de créditos académicos).
- 20/11 09:00 a 12:00: Lectura obligatoria capítulos 5 y 6 de Sistemas Operativos y Redes.
- 27/11 09:00 a 13:00: Mesa de Examen Final de Especificación y Verif. de SW en Módulo 7.`,
  },
  scout: {
    label: 'Ejemplo Acta / WhatsApp Scout',
    text: `- Del 07/11 al 14/11: Campamento Anual de Verano de Sábado a Sábado para todo el Consejo de Grupo en Campo Escuela Necochea.
- 15/11 19:00 a 21:00: Charla informativa de padres y entrega de fichas médicas de Rama Manada en Sede del Grupo.
- 21/11 14:00 a 18:30: Torneo de Especialidades y Pistas de Unidad Scout (Otorga 50/100 puntos de progresión).
- Del 21/11 al 28/11: Semana de Servicio Comunitario y Logística Rover de Sábado a Sábado con Rama Rovers.`,
  },
  trabajo: {
    label: 'Ejemplo Minuta Laboral / Sprint',
    text: `- 05/11 10:00 a 11:30: Reunión de Arquitectura y despliegue de endpoints FastAPI en Producción.
- 11/11 15:00 a 16:30: Demo de Release Q4 con Stakeholders y validación de UI Calen-Neo.
- 18/11 09:00 a 18:00: Entrega de OKR Trimestral de Seguridad Cloud (Suma 80/100 puntos de bono anual).
- 24/11 14:00 a 17:00: Capacitación interna de optimización Next.js y Vercel Serverless.`,
  },
};

