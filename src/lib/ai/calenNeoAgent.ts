import {
  ToolLoopAgent,
  tool,
  isStepCount,
  InferAgentUIMessage,
  generateText,
  Output,
  gateway,
} from 'ai';
import { z } from 'zod';
import {
  fetchAllFromGoogleSheet,
  getMemoryEvents,
  postToGoogleSheet,
  resolveGoogleSheetsUrl,
} from '@/lib/googleSheetsDb';
import { FastAPIEventDTO, SubCategoryTag } from '@/types/calendar';
import { DEFAULT_SUBCATEGORIES } from '@/config/neofaro-theme';
import {
  AnalyzedCandidateEvent,
  analyzeDocumentOrText,
} from '@/utils/documentAnalyzer';

/**
 * Modelo enrutado a través de Vercel AI Gateway (soporta OIDC en Vercel y AI_GATEWAY_API_KEY).
 */
export const CALEN_NEO_MODEL_ID =
  process.env.AI_GATEWAY_MODEL || 'google/gemini-3.8-flash';

export const candidateEventSchema = z.object({
  titulo: z.string().describe('Título claro y conciso del evento o actividad'),
  descripcion: z
    .string()
    .describe('Descripción o notas adicionales extraídas del documento'),
  fecha_inicio: z
    .string()
    .describe('Fecha y hora de inicio en formato ISO YYYY-MM-DDTHH:mm'),
  fecha_fin: z
    .string()
    .describe('Fecha y hora de fin en formato ISO YYYY-MM-DDTHH:mm'),
  tipo_calendario: z
    .enum(['academico', 'scout', 'trabajo'])
    .describe('Calendario al que pertenece: academico (UNGS), scout o trabajo'),
  categoria: z
    .enum([
      'actividad',
      'trabajo_practico',
      'tarea',
      'examen',
      'final',
      'charla',
      'evento_con_puntos',
      'lecturas',
    ])
    .describe('Categoría específica del evento'),
  estado: z
    .enum(['pendiente', 'en_proceso', 'completado', 'aprobado'])
    .describe('Estado inicial sugerido'),
  subcategoria_id: z
    .string()
    .nullable()
    .describe(
      'ID de la materia UNGS (ej. ungs-prog3, ungs-inge1, ungs-evs, ungs-sor), rama Scout (scout-manada, scout-unidad, scout-caminantes, scout-rovers, scout-grupo) o área laboral (work-dev, work-ops, work-release, work-training)'
    ),
  es_sabado_a_sabado: z
    .boolean()
    .describe(
      'True si es un campamento, raid o actividad multi-día de Sábado a Sábado'
    ),
  puntos_obtenidos: z
    .number()
    .nullable()
    .describe('Puntos obtenidos si es evento_con_puntos, o null'),
  puntos_maximos: z
    .number()
    .nullable()
    .describe('Puntos máximos u objetivo si es evento_con_puntos, o null'),
  ubicacion: z
    .string()
    .nullable()
    .describe('Aula, módulo UNGS, campo escuela scout o sala de reunión'),
  fragmento_origen: z
    .string()
    .describe('Cita o fragmento original del texto donde se identificó'),
  razones_deteccion: z
    .array(z.string())
    .describe(
      'Lista breve de motivos por los que se clasificó así (ej. "Fecha explícita", "Entorno: Scout", "Bloque Sábado a Sábado")'
    ),
});

/**
 * Agente principal construido con ToolLoopAgent de Vercel AI SDK (v7).
 * Permite analizar textos/documentos, proponer eventos para confirmación del usuario,
 * consultar la agenda actual y guardar eventos en Google Sheets (Drive).
 */
export const calenNeoAgent = new ToolLoopAgent({
  model: gateway(CALEN_NEO_MODEL_ID),
  instructions: `Eres el Agente Inteligente de Calen-Neo, experto en gestionar tres calendarios:
1. Calendario Académico (Universidad Nacional de General Sarmiento - UNGS): materias como Programación III (ungs-prog3), Ingeniería de Software I (ungs-inge1), Especificación y Verificación de SW (ungs-evs), Sistemas Operativos y Redes (ungs-sor) y Seminarios con puntos (ungs-creditos).
2. Calendario Scout: ramas Manada (scout-manada), Unidad Scout (scout-unidad), Caminantes (scout-caminantes), Rovers (scout-rovers) y Consejo de Grupo (scout-grupo). Soporta especialmente eventos continuos de "Sábado a Sábado" (campamentos de 8 días, raids y servicios).
3. Calendario de Trabajo: Desarrollo & Sprints (work-dev), Arquitectura & Backend API (work-ops), Releases & Demos (work-release) y Capacitación & OKRs (work-training).

Reglas de comportamiento:
- Responde siempre en español rioplatense claro, conciso y estructurado.
- Cuando el usuario pegue un texto, cronograma o documento para analizar, utiliza la herramienta "extractAndProposeEvents" para identificar cada evento y exponerlos de forma estructurada para que el usuario pueda revisarlos y confirmarlos.
- Cuando el usuario consulte qué eventos tiene pendientes o agendados, utiliza "listCalendarEvents".
- Cuando el usuario pida agendar directamente un evento confirmado, utiliza "createCalendarEvent".`,
  stopWhen: isStepCount(10),
  tools: {
    extractAndProposeEvents: tool({
      description:
        'Analiza un texto o documento y extrae una lista de eventos propuestos (con fechas, calendario, categoría, puntos y detección de Sábado a Sábado) para exponerlos al usuario y que pueda confirmarlos.',
      inputSchema: z.object({
        sourceText: z
          .string()
          .describe('Texto original del documento o mensaje analizado'),
        proposedEvents: z
          .array(candidateEventSchema)
          .describe('Lista de eventos identificados en el texto'),
      }),
      execute: async ({ sourceText, proposedEvents }) => {
        return {
          status: 'awaiting_user_confirmation',
          sourceLength: sourceText.length,
          detectedCount: proposedEvents.length,
          proposedEvents,
        };
      },
    }),

    listCalendarEvents: tool({
      description:
        'Consulta los eventos actuales guardados en el calendario / Google Sheet filtrando opcionalmente por tipo de calendario o estado.',
      inputSchema: z.object({
        tipo_calendario: z
          .enum(['academico', 'scout', 'trabajo'])
          .optional()
          .describe('Filtrar por calendario específico'),
        estado: z
          .enum(['pendiente', 'en_proceso', 'completado', 'aprobado'])
          .optional()
          .describe('Filtrar por estado del evento'),
      }),
      execute: async ({ tipo_calendario, estado }) => {
        const sheetUrl = resolveGoogleSheetsUrl();
        let events: FastAPIEventDTO[] = [];

        if (sheetUrl) {
          const remote = await fetchAllFromGoogleSheet(sheetUrl);
          events = remote ? remote.eventos : getMemoryEvents();
        } else {
          events = getMemoryEvents();
        }

        if (tipo_calendario) {
          events = events.filter((e) => e.tipo_calendario === tipo_calendario);
        }
        if (estado) {
          events = events.filter((e) => e.estado === estado);
        }

        return {
          total: events.length,
          events: events.slice(0, 20),
        };
      },
    }),

    createCalendarEvent: tool({
      description:
        'Crea y guarda un evento confirmado directamente en el calendario y en el Google Sheet del usuario.',
      inputSchema: candidateEventSchema,
      execute: async (input) => {
        const newEvent: FastAPIEventDTO = {
          id: `evt-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          titulo: input.titulo,
          descripcion: input.descripcion,
          fecha_inicio: input.fecha_inicio,
          fecha_fin: input.fecha_fin,
          tipo_calendario: input.tipo_calendario,
          categoria: input.categoria,
          estado: input.estado,
          completado:
            input.estado === 'completado' || input.estado === 'aprobado',
          origen: 'agente_ia',
          subcategoria_id: input.subcategoria_id,
          es_sabado_a_sabado: input.es_sabado_a_sabado,
          puntos_obtenidos: input.puntos_obtenidos,
          puntos_maximos: input.puntos_maximos,
          ubicacion: input.ubicacion,
          actualizado_en: new Date().toISOString(),
        };

        const store = getMemoryEvents();
        store.push(newEvent);

        const sheetUrl = resolveGoogleSheetsUrl();
        let persistedToDrive = false;
        if (sheetUrl) {
          persistedToDrive = await postToGoogleSheet(sheetUrl, {
            action: 'upsert_event',
            event: newEvent,
          });
        }

        return {
          status: 'created',
          persistedToDrive,
          event: newEvent,
        };
      },
    }),
  },
});

export type CalenNeoAgentUIMessage = InferAgentUIMessage<typeof calenNeoAgent>;

/**
 * Analiza un documento o texto libre utilizando `generateText` + `Output.object()`
 * de Vercel AI SDK cuando AI Gateway está configurado, con fallback automático al
 * analizador heurístico local si no hay credenciales de Gateway en local.
 */
export async function analyzeTextWithAISDK(
  text: string,
  defaultCalendar: 'academico' | 'scout' | 'trabajo',
  subCategories: SubCategoryTag[] = DEFAULT_SUBCATEGORIES,
  fileName?: string
): Promise<{
  candidates: AnalyzedCandidateEvent[];
  engine: 'vercel-ai-sdk' | 'local-heuristic';
}> {
  const hasGatewayAuth = Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  );

  if (hasGatewayAuth) {
    try {
      const subcatsSummary = subCategories
        .map((s) => `${s.id} (${s.calendarType}: ${s.name})`)
        .join(', ');

      const { output } = await generateText({
        model: gateway(CALEN_NEO_MODEL_ID),
        output: Output.object({
          schema: z.object({
            events: z.array(candidateEventSchema),
          }),
        }),
        prompt: `Analiza el siguiente documento o texto (fecha actual de referencia: ${new Date()
          .toISOString()
          .slice(0, 10)}, calendario activo por defecto: ${defaultCalendar}).
Subcategorías disponibles: ${subcatsSummary}.

Extrae todos los eventos, entregas, parciales, finales, charlas, lecturas, eventos con puntos o campamentos (marcando es_sabado_a_sabado=true si abarca de sábado a sábado o varios días de campamento).

Texto a analizar:
"""
${text}
"""`,
      });

      if (output && Array.isArray(output.events) && output.events.length > 0) {
        const mapped: AnalyzedCandidateEvent[] = output.events.map(
          (item, idx) => ({
            tempId: `ai-sdk-${Date.now()}-${idx}`,
            selected: true,
            confidence: 'alta',
            sourceSnippet: item.fragmento_origen || item.titulo,
            detectedReasons:
              item.razones_deteccion.length > 0
                ? ['Vercel AI SDK', ...item.razones_deteccion]
                : ['Extraído con Vercel AI SDK'],
            dto: {
              titulo: item.titulo,
              descripcion: item.descripcion,
              fecha_inicio: item.fecha_inicio,
              fecha_fin: item.fecha_fin,
              tipo_calendario: item.tipo_calendario,
              categoria: item.categoria,
              estado: item.estado,
              completado:
                item.estado === 'completado' || item.estado === 'aprobado',
              origen: 'agente_ia',
              subcategoria_id: item.subcategoria_id,
              es_sabado_a_sabado: item.es_sabado_a_sabado,
              puntos_obtenidos: item.puntos_obtenidos,
              puntos_maximos: item.puntos_maximos,
              ubicacion: item.ubicacion,
            },
          })
        );

        return {
          candidates: mapped,
          engine: 'vercel-ai-sdk',
        };
      }
    } catch {
      // Fallback transparente al motor heurístico local
    }
  }

  const localCandidates = analyzeDocumentOrText(
    text,
    defaultCalendar,
    subCategories,
    new Date(),
    fileName
  );

  return {
    candidates: localCandidates,
    engine: 'local-heuristic',
  };
}

