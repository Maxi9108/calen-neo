export type CalendarType = 'academico' | 'scout' | 'trabajo';

export type CalendarViewMode = 'month' | 'week';

export type EventCategory =
  | 'actividad'
  | 'trabajo_practico'
  | 'tarea'
  | 'examen'
  | 'final'
  | 'charla'
  | 'evento_con_puntos'
  | 'lecturas';

export type EventStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'completado'
  | 'aprobado';

export type EventOrigin =
  | 'manual'
  | 'agente_ia'
  | 'campus_ungs'
  | 'sincronizado';

export type BackgroundStyleId =
  | 'neofaro-clean'
  | 'neofaro-grid'
  | 'neofaro-dots'
  | 'neofaro-aurora'
  | 'neofaro-scout-topo'
  | 'neofaro-exec';

/**
 * Representa una Materia (UNGS), Rama Scout o Categoría/Área Laboral
 * con soporte de color personalizable por el usuario.
 */
export interface SubCategoryTag {
  id: string;
  calendarType: CalendarType;
  name: string;
  shortCode: string;
  colorHex: string;
  description?: string;
}

/**
 * Modelo de Evento en el Frontend (Next.js / TypeScript)
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  /** Formato ISO: YYYY-MM-DDTHH:mm o YYYY-MM-DD */
  startDate: string;
  /** Formato ISO: YYYY-MM-DDTHH:mm o YYYY-MM-DD */
  endDate: string;
  calendarType: CalendarType;
  category: EventCategory;
  status: EventStatus;
  completed: boolean;
  origin: EventOrigin;
  /** Materia UNGS, Rama Scout o Área Laboral asociada */
  subCategoryId?: string;
  /** Color personalizado opcional para sobreescribir el de la materia/rama */
  customColor?: string;
  /** Indica si es un evento continuo de varios días estilo "Sábado a Sábado" (Campamento / Raid / Semana intensiva) */
  isSaturdayToSaturday?: boolean;
  /** Seguimiento de puntaje para la categoría "evento_con_puntos" */
  pointsEarned?: number;
  pointsMax?: number;
  location?: string;
  updatedAt?: string;
}

/**
 * Contrato DTO recibido/enviado al Backend FastAPI
 * Mapea exactamente los campos requeridos por el agente automatizado externo.
 */
export interface FastAPIEventDTO {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_calendario: CalendarType;
  categoria: EventCategory;
  estado: EventStatus;
  completado: boolean;
  origen: EventOrigin;
  subcategoria_id?: string | null;
  color_personalizado?: string | null;
  es_sabado_a_sabado?: boolean;
  puntos_obtenidos?: number | null;
  puntos_maximos?: number | null;
  ubicacion?: string | null;
  actualizado_en?: string;
}

export interface FastAPIAgentIngestRequest {
  agente_id: string;
  fuente: string;
  texto_original?: string;
  eventos: FastAPIEventDTO[];
}

export interface CalendarEnvironmentMeta {
  id: CalendarType;
  title: string;
  subtitle: string;
  institutionTag: string;
  subCategoryLabel: string;
  accentHex: string;
  badgeClasses: string;
  activeTabClasses: string;
  ringClasses: string;
  glowClass: string;
  headerGradient: string;
}

