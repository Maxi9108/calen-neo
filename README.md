# Calen-Neo

Aplicación web full-stack de gestión de calendarios **Académico (UNGS)**, **Scout** y **Trabajo (Laboral)** diseñada en **Next.js 14+ (App Router)**, **TypeScript** y **Tailwind CSS**.

## Características Principales

1. **Selector Dinámico de Calendarios por Flechas y Solapas**:
   - Alternancia fluida mediante flechas laterales (`←` / `→`), solapas superiores, barra lateral o atajo de teclado `Alt + ←/→`.
   - **Calendario Académico (UNGS)**: Acentos en índigo/cian vibrante, con soporte para materias de la Licenciatura en Sistemas.
   - **Calendario Scout**: Acentos en esmeralda/ámbar vibrante, con soporte por Ramas Scout (*Manada*, *Unidad*, *Caminantes*, *Rovers*, *Consejo de Grupo*).
   - **Calendario de Trabajo**: Acentos corporativos sobrios en azul pizarra/sky para sprints, entregas y ceremonias.
2. **Vistas Mensual y Semanal Interactivas (Estilo Google Calendar)**:
   - Personalización de colores por materia UNGS, rama Scout o categoría laboral.
   - 6 estilos de fondos y texturas ambientales (*Minimal Clean*, *Cuadrícula Técnica*, *Matriz de Puntos*, *Aurora Académica*, *Brisa Scout*, *Ejecutivo Sobrio*) + Modo Claro/Oscuro nativo.
3. **Gestión de Eventos de "Sábado a Sábado" y Categorías Específicas**:
   - 8 categorías nativas: `actividad`, `trabajo_practico`, `tarea`, `examen`, `final`, `charla`, `evento_con_puntos` (con barra de progreso de puntaje), `lecturas`.
   - Bloques continuos horizontales de **Sábado a Sábado** para campamentos y actividades multi-día con botón directo de check (`✓ Finalizado`).
4. **Integración con Backend FastAPI y Agente Automatizado**:
   - Capa de servicios (`src/services/eventService.ts`) con mapeadores tipados (`FastAPIEventDTO` snake_case ↔ `CalendarEvent` camelCase).
   - Simulador interactivo de payloads JSON del Agente Automatizado externo integrado en la interfaz.

