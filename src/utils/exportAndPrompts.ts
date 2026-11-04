import { CalendarEvent, SubCategoryTag, SyllabusTopic } from '@/types/calendar';

/**
 * Convierte una fecha ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm) al formato UTC compacto de iCalendar (YYYYMMDDTHHmmssZ)
 */
function toICalDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const clean = dateStr.replace(/[-:]/g, '');
    return clean.includes('T') ? `${clean}00Z` : `${clean}T000000Z`;
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Genera el contenido de un archivo .ics estándar para importar en Google Calendar / Apple Calendar
 * incluyendo la lista de actividades del evento y enlaces de videos/recursos en la descripción.
 */
export function generateICalendar(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calen-Neo//Gestor de Calendarios UNGS Scout Trabajo//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calen-Neo Agenda',
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
  ];

  events.forEach((evt) => {
    const dtStart = toICalDate(evt.startDate);
    const dtEnd = toICalDate(evt.endDate || evt.startDate);
    const created = toICalDate(evt.updatedAt || new Date().toISOString());

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}@calen-neo.app`);
    lines.push(`DTSTAMP:${created}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${evt.title.replace(/\n/g, ' ')}`);

    let desc = evt.description ? evt.description.replace(/\n/g, '\\n') : '';
    if (evt.activities && evt.activities.length > 0) {
      const actLines = evt.activities.map((a) => {
        const mark = a.completed ? '[X]' : '[ ]';
        const lnks = (a.links || []).map((l) => `${l.title}: ${l.url}`).join(' | ');
        return `\\n${mark} ${a.title}${a.time ? ` (${a.time})` : ''}${lnks ? ` -> ${lnks}` : ''}`;
      });
      desc += (desc ? '\\n\\nActividades:\\n' : 'Actividades:\\n') + actLines.join('\\n');
    }

    if (desc) {
      lines.push(`DESCRIPTION:${desc}`);
    }
    if (evt.location) {
      lines.push(`LOCATION:${evt.location.replace(/\n/g, ' ')}`);
    }
    lines.push(`STATUS:${evt.completed ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push(`CATEGORIES:${evt.calendarType.toUpperCase()},${evt.category.toUpperCase()}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Dispara la descarga de un archivo de texto en el navegador del usuario
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera prompts especializados y estructurados para practicar o profundizar con Gemini o Google NotebookLM
 */
export function generateGeminiStudyPrompt(
  subjectName: string,
  topicTitle: string,
  mode: 'deep_dive' | 'exam_prep' | 'code_practice' | 'flashcards' | 'notebooklm'
): string {
  switch (mode) {
    case 'deep_dive':
      return `Actúa como un profesor universitario senior y experto pedagógico en la materia "${subjectName}".

Mi objetivo es dominar profundamente el tema: "${topicTitle}".

Por favor genera:
1. Explicación conceptual clara con analogías de la vida real.
2. Fundamentos teóricos e intuición matemática/algorítmica detrás del concepto.
3. 2 casos prácticos de aplicación real en la industria o proyectos de software.
4. Las trampas o errores conceptuales más frecuentes que cometen los estudiantes en los exámenes y cómo evitarlos.
5. Pregunta de autoevaluación para verificar que comprendí el tema.`;

    case 'exam_prep':
      return `Actúa como docente evaluador de la materia universitaria "${subjectName}".

Voy a rendir un examen sobre el tema: "${topicTitle}".

Por favor simula una sesión de entrenamiento intensivo:
1. Dame 3 preguntas de examen tipo parcial (1 teórica conceptual, 1 de análisis crítico y 1 problema práctico con resolución paso a paso).
2. Primero preséntame solo las preguntas y pídeme que te responda.
3. Luego de que te responda, califícame del 1 al 10 con feedback constructivo indicando en qué conceptos debo hacer hincapié.`;

    case 'code_practice':
      return `Actúa como un Tech Lead e instructor de código en "${subjectName}".

Quiero practicar y consolidar el tema: "${topicTitle}".

Genera:
1. Un ejercicio práctico de programación paso a paso (en TypeScript, Python o Java según corresponda).
2. Estructura inicial del código con comentarios 'TODO'.
3. Casos de prueba (Edge cases) que mi solución debe pasar.
4. Solución óptima comentada explicando complejidad temporal y espacial Big-O.`;

    case 'flashcards':
      return `Genera un set de 8 tarjetas de estudio (Flashcards) de alta retención nemotécnica para Google NotebookLM / Anki sobre:
Materia: "${subjectName}"
Tema: "${topicTitle}"

Formato por tarjeta:
- FRENTE: Pregunta concisa y directa.
- DORSO: Respuesta precisa, clave y fácil de recordar.
- MNEMOTECNIA / TIP: Regla o asociación mental rápida.`;

    case 'notebooklm':
      return `Genera una Guía de Estudio y Fuentes de Aprendizaje estructurada para subir como Nota de Investigación en Google NotebookLM:

Materia: ${subjectName}
Tema Central: ${topicTitle}

Estructura requerida:
- Resumen Ejecutivo (Glosario de términos clave)
- Mapa Mental de sub-conceptos
- Cronograma de práctica recomendado (Día 1 a Día 5)
- Preguntas clave para hacerle al asistente de NotebookLM al subir apuntes y bibliografía`;
  }
}

/**
 * Exporta el Roadmap de una materia a formato Markdown legible
 */
export function exportRoadmapMarkdown(subject: SubCategoryTag, relatedEvents: CalendarEvent[]): string {
  const completedCount = (subject.syllabusTopics || []).filter((t) => t.completed).length;
  const totalCount = (subject.syllabusTopics || []).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  let md = `# Plan de Estudio y Roadmap: ${subject.name} (${subject.shortCode})\n\n`;
  md += `**Entorno:** ${subject.calendarType.toUpperCase()} | **Progreso:** ${completedCount}/${totalCount} temas (${percent}%)\n\n`;
  if (subject.description) {
    md += `> ${subject.description}\n\n`;
  }

  md += `## 📋 Temario y Checklist de "Cómo Seguir"\n\n`;
  if (subject.syllabusTopics && subject.syllabusTopics.length > 0) {
    subject.syllabusTopics.forEach((t, i) => {
      const check = t.completed ? '[x]' : '[ ]';
      const prio = t.priority ? `(Prioridad: ${t.priority.toUpperCase()})` : '';
      const hours = t.targetHours ? `~${t.targetHours}h` : '';
      md += `${i + 1}. ${check} **${t.title}** ${prio} ${hours}\n`;
      if (t.notes) {
        md += `   - *Nota:* ${t.notes}\n`;
      }
    });
  } else {
    md += `*No hay temas cargados aún en esta materia.*\n`;
  }

  md += `\n## 📅 Eventos y Fechas Próximas en Agenda\n\n`;
  if (relatedEvents.length > 0) {
    relatedEvents.forEach((evt) => {
      const statusIcon = evt.completed ? '✅' : '⏳';
      md += `- ${statusIcon} **${evt.title}** (${evt.startDate.replace('T', ' ')}): ${evt.category} - Estado: ${evt.status}\n`;
      if (evt.description) md += `  ${evt.description}\n`;
    });
  } else {
    md += `*No hay eventos agendados para esta materia.*\n`;
  }

  return md;
}

/**
 * Genera un archivo CSV estructurado listo para abrir en Microsoft Excel o Google Sheets
 */
export function generateCalendarCSV(
  events: CalendarEvent[],
  subCategoryMap: Record<string, SubCategoryTag>
): string {
  const headers = [
    'ID',
    'Titulo',
    'Entorno',
    'Materia / Categoria',
    'Tipo de Evento',
    'Estado',
    'Completado',
    'Fecha Inicio',
    'Fecha Fin',
    'Puntos Obtenidos',
    'Puntos Maximos',
    'Ubicacion',
    'Actividades',
    'Descripcion',
  ];

  const escapeCSV = (str: string | null | undefined): string => {
    if (!str) return '""';
    const clean = str.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = events.map((e) => {
    const sub = e.subCategoryId ? subCategoryMap[e.subCategoryId] : null;
    const subName = sub ? `${sub.name} (${sub.shortCode})` : 'General';
    const actsSummary = (e.activities || [])
      .map((a) => `${a.completed ? '[X]' : '[ ]'} ${a.title}`)
      .join('; ');

    return [
      escapeCSV(e.id),
      escapeCSV(e.title),
      escapeCSV(e.calendarType.toUpperCase()),
      escapeCSV(subName),
      escapeCSV(e.category),
      escapeCSV(e.status),
      e.completed ? '"SI"' : '"NO"',
      escapeCSV(e.startDate.replace('T', ' ')),
      escapeCSV(e.endDate.replace('T', ' ')),
      e.pointsEarned !== undefined && e.pointsEarned !== null ? e.pointsEarned : '',
      e.pointsMax !== undefined && e.pointsMax !== null ? e.pointsMax : '',
      escapeCSV(e.location || ''),
      escapeCSV(actsSummary),
      escapeCSV(e.description || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Genera un Informe Detallado Completo con todos los datos en formato Markdown
 */
export function generateDetailedReportMarkdown(
  title: string,
  events: CalendarEvent[],
  subCategoryMap: Record<string, SubCategoryTag>
): string {
  const now = new Date().toLocaleString('es-AR');
  const completed = events.filter((e) => e.completed).length;
  const pending = events.filter((e) => !e.completed).length;

  let md = `# ${title}\n\n`;
  md += `*Generado por Calen-Neo el ${now}*\n\n`;
  md += `### Resumen General:\n`;
  md += `- **Total de Eventos:** ${events.length}\n`;
  md += `- **Completados / Aprobados:** ${completed}\n`;
  md += `- **Pendientes / En Proceso:** ${pending}\n\n`;
  md += `---\n\n`;

  // Agrupar por Entorno
  const environments: ('academico' | 'scout' | 'trabajo')[] = ['academico', 'scout', 'trabajo'];
  const envTitles = {
    academico: '🎓 Calendario Académico (UNGS)',
    scout: '🧭 Calendario Scout',
    trabajo: '💼 Calendario de Trabajo',
  };

  environments.forEach((env) => {
    const envEvents = events.filter((e) => e.calendarType === env);
    if (envEvents.length === 0) return;

    md += `## ${envTitles[env]} (${envEvents.length} eventos)\n\n`;

    envEvents.forEach((evt, idx) => {
      const sub = evt.subCategoryId ? subCategoryMap[evt.subCategoryId] : null;
      const subLabel = sub ? `[${sub.name}]` : '';
      const check = evt.completed ? '✅ COMPLETADO' : '⏳ PENDIENTE';
      const sat = evt.isSaturdayToSaturday ? '⛺ [Sábado a Sábado]' : '';
      const pts =
        evt.pointsMax !== undefined && evt.pointsMax !== null
          ? `🏆 Puntaje: ${evt.pointsEarned ?? 0}/${evt.pointsMax} pts`
          : '';

      md += `### ${idx + 1}. ${evt.title} ${subLabel}\n`;
      md += `- **Estado:** ${check} (${evt.status.toUpperCase()}) ${sat}\n`;
      md += `- **Categoría:** ${evt.category}\n`;
      md += `- **Horario:** Desde ${evt.startDate.replace('T', ' ')} hasta ${evt.endDate.replace('T', ' ')}\n`;
      if (pts) md += `- **Puntos:** ${pts}\n`;
      if (evt.location) md += `- **Ubicación:** ${evt.location}\n`;
      if (evt.description) md += `- **Descripción:** ${evt.description}\n`;

      if (evt.activities && evt.activities.length > 0) {
        const doneActs = evt.activities.filter((a) => a.completed).length;
        md += `- **Actividades del Evento (${doneActs}/${evt.activities.length} completadas):**\n`;
        evt.activities.forEach((act) => {
          const actCheck = act.completed ? '[x]' : '[ ]';
          const time = act.time ? ` *(${act.time})*` : '';
          const lnks = (act.links || [])
            .map((l) => `[${l.title}](${l.url})`)
            .join(' · ');
          md += `  - ${actCheck} **${act.title}**${time}${act.description ? `: ${act.description}` : ''}${lnks ? ` (Recursos: ${lnks})` : ''}\n`;
        });
      }

      md += `\n`;
    });

    md += `---\n\n`;
  });

  return md;
}
