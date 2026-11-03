"""
Referencia de Backend FastAPI para Calen-Neo
Ejecutar con: uvicorn main:app --reload --port 8000
"""
from typing import List, Literal, Optional
from datetime import datetime
from uuid import uuid4
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Calen-Neo FastAPI Backend",
    version="1.0.0",
    description="API de recepción de eventos del Agente Automatizado y sincronización con Next.js App Router",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CalendarType = Literal["academico", "scout", "trabajo"]
EventCategory = Literal[
    "actividad",
    "trabajo_practico",
    "tarea",
    "examen",
    "final",
    "charla",
    "evento_con_puntos",
    "lecturas",
]
EventStatus = Literal["pendiente", "en_proceso", "completado", "aprobado"]
EventOrigin = Literal["manual", "agente_ia", "campus_ungs", "sincronizado"]


class EventDTO(BaseModel):
    id: Optional[str] = None
    titulo: str
    descripcion: str = ""
    fecha_inicio: str
    fecha_fin: str
    tipo_calendario: CalendarType
    categoria: EventCategory
    estado: EventStatus = "pendiente"
    completado: bool = False
    origen: EventOrigin = "agente_ia"
    subcategoria_id: Optional[str] = None
    color_personalizado: Optional[str] = None
    es_sabado_a_sabado: bool = False
    puntos_obtenidos: Optional[int] = None
    puntos_maximos: Optional[int] = None
    ubicacion: Optional[str] = None
    actualizado_en: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AgentIngestPayload(BaseModel):
    agente_id: str
    fuente: str
    texto_original: Optional[str] = None
    eventos: List[EventDTO]


EVENTS_DB: List[EventDTO] = []


@app.get("/api/v1/events", response_model=List[EventDTO])
def list_events(tipo_calendario: Optional[CalendarType] = Query(default=None)):
    if tipo_calendario:
        return [e for e in EVENTS_DB if e.tipo_calendario == tipo_calendario]
    return EVENTS_DB


@app.post("/api/v1/events", response_model=EventDTO, status_code=201)
def create_event(event: EventDTO):
    event.id = event.id or f"evt-{uuid4().hex[:8]}"
    event.actualizado_en = datetime.utcnow().isoformat()
    EVENTS_DB.append(event)
    return event


@app.patch("/api/v1/events/{event_id}", response_model=EventDTO)
def update_event(event_id: str, updated: EventDTO):
    for idx, existing in enumerate(EVENTS_DB):
        if existing.id == event_id:
            updated.id = event_id
            updated.actualizado_en = datetime.utcnow().isoformat()
            EVENTS_DB[idx] = updated
            return updated
    updated.id = event_id
    EVENTS_DB.append(updated)
    return updated


@app.post("/api/v1/agent/ingest", response_model=List[EventDTO], status_code=201)
def ingest_from_agent(payload: AgentIngestPayload):
    created: List[EventDTO] = []
    for evt in payload.eventos:
        evt.id = evt.id or f"evt-agent-{uuid4().hex[:8]}"
        evt.origen = "agente_ia"
        evt.actualizado_en = datetime.utcnow().isoformat()
        EVENTS_DB.append(evt)
        created.append(evt)
    return created

