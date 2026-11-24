import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  alertCircleOutline,
  arrowDownOutline,
  checkmarkCircleOutline,
  closeOutline,
  layersOutline,
  locationOutline,
  menuOutline,
  searchOutline,
  swapVerticalOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  FilterOption,
  Incident,
  IncidentPriority,
  SortOption,
} from '../types/incident';

/* ------------------------------------------------------------------ */
/* Datos y constantes                                                  */
/* ------------------------------------------------------------------ */

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-101',
    title: 'Fallo de enlace en Switch Rack B',
    location: 'Aula 204 - Redes',
    description: 'Pérdida intermitente de paquetes en puertos Gigabit 12 al 16.',
    priority: 'alta',
    status: 'pendiente',
    createdAt: '09:15',
  },
  {
    id: 'INC-102',
    title: 'Actualización de imágenes Docker',
    location: 'Laboratorio DAM 2',
    description: 'Desplegar imagen base Node 22 Alpine en estaciones de trabajo.',
    priority: 'media',
    status: 'pendiente',
    createdAt: '10:30',
  },
  {
    id: 'INC-103',
    title: 'Calibración de proyector láser',
    location: 'Aula Magna',
    description: 'Ajuste trapezoidal y verificación de entrada HDMI.',
    priority: 'baja',
    status: 'resuelta',
    createdAt: 'Ayer',
  },
  {
    id: 'INC-104',
    title: 'Licencias de Android Studio caducadas',
    location: 'Laboratorio DAM 1',
    description: 'El emulador no arranca en 6 equipos por SDK sin actualizar.',
    priority: 'alta',
    status: 'pendiente',
    createdAt: '11:02',
  },
  {
    id: 'INC-105',
    title: 'Ratón y teclado sin respuesta',
    location: 'Aula 101',
    description: 'Puesto 14: periféricos USB no reconocidos tras reinicio.',
    priority: 'baja',
    status: 'pendiente',
    createdAt: '11:40',
  },
  {
    id: 'INC-106',
    title: 'Punto de acceso Wi-Fi saturado',
    location: 'Biblioteca',
    description: 'Más de 80 clientes conectados; caídas en horas punta.',
    priority: 'media',
    status: 'resuelta',
    createdAt: 'Ayer',
  },
];

const PRIORITY_BG: Record<IncidentPriority, string> = {
  alta: 'bg-brutal-red',
  media: 'bg-brutal-yellow',
  baja: 'bg-brutal-lime',
};

const PRIORITY_ORDER: Record<IncidentPriority, number> = { alta: 0, media: 1, baja: 2 };
const PRIORITIES: IncidentPriority[] = ['alta', 'media', 'baja'];

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'panel', label: 'Panel' },
  { id: 'incidencias', label: 'Incidencias' },
];

/* ------------------------------------------------------------------ */
/* Subcomponente: título de sección numerado                           */
/* ------------------------------------------------------------------ */

interface SectionTitleProps {
  number: string;
  title: string;
  subtitle: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ number, title, subtitle }) => (
  <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex items-end gap-4">
      <span className="border-4 border-brutal-ink bg-brutal-ink px-2 py-1 font-mono text-sm font-bold text-brutal-yellow">
        {number}
      </span>
      <h2 className="font-display text-4xl uppercase leading-none sm:text-5xl lg:text-6xl">
        {title}
      </h2>
    </div>
    <p className="font-mono text-sm font-bold uppercase">{subtitle}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Componente Home                                                     */
/* ------------------------------------------------------------------ */

const Home: React.FC = () => {
  // Datos y controles de la interfaz
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todas');
  const [sortBy, setSortBy] = useState<SortOption>('reciente');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Formulario controlado del modal
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IncidentPriority>('media');
  const [formError, setFormError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Datos derivados (memoizados) ---------- */

  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((i) => i.status === 'pendiente').length;
    const resolved = incidents.filter((i) => i.status === 'resuelta').length;
    const critical = incidents.filter(
      (i) => i.status === 'pendiente' && i.priority === 'alta'
    ).length;
    const resolvedPct = total === 0 ? 0 : Math.round((resolved / total) * 100);
    return { total, pending, resolved, critical, resolvedPct };
  }, [incidents]);

  const kpis: {
    key: FilterOption;
    label: string;
    value: number;
    icon: string;
    bg: string;
  }[] = [
    { key: 'todas', label: 'Total', value: metrics.total, icon: layersOutline, bg: 'bg-white' },
    { key: 'pendiente', label: 'Pendientes', value: metrics.pending, icon: timeOutline, bg: 'bg-brutal-yellow' },
    { key: 'criticas', label: 'Críticas', value: metrics.critical, icon: alertCircleOutline, bg: 'bg-brutal-red' },
    { key: 'resuelta', label: 'Resueltas', value: metrics.resolved, icon: checkmarkCircleOutline, bg: 'bg-brutal-lime' },
  ];

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = incidents.filter((item) => {
      const matchesFilter =
        activeFilter === 'todas' ||
        (activeFilter === 'criticas'
          ? item.status === 'pendiente' && item.priority === 'alta'
          : item.status === activeFilter);
      const matchesQuery =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    if (sortBy === 'prioridad') {
      return [...result].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    }
    return result;
  }, [incidents, activeFilter, searchQuery, sortBy]);

  const tickerItems =
    incidents.filter((i) => i.status === 'pendiente').length > 0
      ? incidents
          .filter((i) => i.status === 'pendiente')
          .map((i) => `${i.id} · ${i.title}`)
      : ['Sin incidencias pendientes', 'Todo en orden'];

  /* ---------- Efectos ---------- */

  // Ocultar el toast automáticamente
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Cancelar la confirmación de borrado si no se pulsa de nuevo en 3 s
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = window.setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteId]);

  // Modal: foco automático y cierre con la tecla Escape
  useEffect(() => {
    if (!isModalOpen) return;
    titleInputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  /* ---------- Manejadores ---------- */

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openModal = () => {
    setFormError(null);
    setMenuOpen(false);
    setIsModalOpen(true);
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      setToast('Datos sincronizados');
      event.detail.complete();
    }, 700);
  };

  const handleFilterFromKpi = (key: FilterOption) => {
    setActiveFilter(key);
    scrollToSection('incidencias');
  };

  const handleToggleStatus = (id: string) => {
    const target = incidents.find((i) => i.id === id);
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'pendiente' ? 'resuelta' : 'pendiente' }
          : item
      )
    );
    setToast(target?.status === 'pendiente' ? `${id} resuelta ✔` : `${id} reabierta`);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setIncidents((prev) => prev.filter((item) => item.id !== id));
    setConfirmDeleteId(null);
    setToast(`${id} eliminada`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('todas');
  };

  const handleCreateIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setFormError('El título y la ubicación son obligatorios');
      return;
    }
    const newIncident: Incident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      location: location.trim(),
      description: description.trim() || 'Sin observaciones adicionales.',
      priority,
      status: 'pendiente',
      createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
    setIncidents((prev) => [newIncident, ...prev]);
    setTitle('');
    setLocation('');
    setDescription('');
    setPriority('media');
    setFormError(null);
    setIsModalOpen(false);
    setToast(`${newIncident.id} registrada`);
  };

  /* ---------- Render ---------- */

  return (
    <IonPage>
      {/* ================= CABECERA ================= */}
      <IonHeader className="ion-no-border">
        <div className="border-b-4 border-brutal-ink bg-brutal-cream font-body text-brutal-ink">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:h-20">
            <button
              type="button"
              onClick={() => scrollToSection('inicio')}
              className="group flex items-center gap-1"
              aria-label="Ir al inicio"
            >
              <span className="border-4 border-brutal-ink bg-brutal-yellow px-2 py-1 font-display text-lg leading-none shadow-brutal-sm transition-transform duration-200 group-hover:-rotate-6 md:text-2xl">
                SMART
              </span>
              <span className="font-display text-lg md:text-2xl">LAB_</span>
            </button>

            {/* Navegación escritorio / tablet */}
            <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="border-4 border-transparent px-3 py-1 font-bold uppercase transition-all hover:border-brutal-ink hover:bg-white hover:shadow-brutal-sm"
                >
                  {item.label}
                </button>
              ))}
              <span className="ml-2 border-4 border-brutal-ink bg-brutal-ink px-3 py-1 font-mono text-sm font-bold text-brutal-yellow">
                PEND: {metrics.pending}
              </span>
              <button type="button" onClick={openModal} className="brutal-btn ml-2 bg-brutal-pink px-4 py-2 text-sm">
                <IonIcon icon={addOutline} aria-hidden="true" />
                Nueva
              </button>
            </nav>

            {/* Controles móvil */}
            <div className="flex items-center gap-3 md:hidden">
              <span className="border-4 border-brutal-ink bg-brutal-ink px-2 py-0.5 font-mono text-xs font-bold text-brutal-yellow">
                {metrics.pending}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="brutal-icon-btn bg-white"
                aria-expanded={menuOpen}
                aria-controls="menu-movil"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <IonIcon icon={menuOpen ? closeOutline : menuOutline} />
              </button>
            </div>
          </div>

          {/* Menú desplegable móvil */}
          {menuOpen && (
            <nav
              id="menu-movil"
              className="border-t-4 border-brutal-ink bg-brutal-yellow md:hidden motion-safe:animate-pop"
              aria-label="Navegación móvil"
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full border-b-4 border-brutal-ink px-4 py-4 text-left font-display text-2xl uppercase transition-colors hover:bg-white"
                >
                  {item.label} →
                </button>
              ))}
              <button
                type="button"
                onClick={openModal}
                className="block w-full bg-brutal-pink px-4 py-4 text-left font-display text-2xl uppercase"
              >
                + Nueva incidencia
              </button>
            </nav>
          )}
        </div>
      </IonHeader>

      <IonContent fullscreen>
        {/* Gesto táctil Pull-to-Refresh (móvil/tablet) */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Desliza para actualizar" refreshingText="Sincronizando..." />
        </IonRefresher>

        <div className="min-h-[100vh] bg-brutal-cream font-body text-brutal-ink">
          {/* ================= HERO (100vh − cabecera) ================= */}
          <section
            id="inicio"
            className="grid min-h-[calc(100vh-4rem)] grid-rows-[1fr_auto] md:min-h-[calc(100vh-5rem)]"
          >
            <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
              <div>
                <p className="mb-6 inline-flex items-center gap-2 border-4 border-brutal-ink bg-white px-3 py-1 font-mono text-xs font-bold uppercase shadow-brutal-sm sm:text-sm">
                  <span className="h-3 w-3 border-2 border-brutal-ink bg-brutal-red motion-safe:animate-pulse" />
                  Monitor en directo · Aulas del centro
                </p>

                <h1 className="font-display text-[clamp(2.75rem,10vw,7.5rem)] uppercase leading-[0.88] tracking-tight">
                  Todo fallo,{' '}
                  <span className="mt-2 inline-block -rotate-1 border-4 border-brutal-ink bg-brutal-pink px-3 shadow-brutal">
                    a la vista.
                  </span>
                </h1>

                <p className="mt-8 max-w-xl text-lg font-medium sm:text-xl">
                  Registra, filtra y resuelve las incidencias técnicas de las aulas desde cualquier
                  dispositivo. Sin sombras suaves ni degradados: solo información.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button type="button" onClick={openModal} className="brutal-btn bg-brutal-pink">
                    <IonIcon icon={addOutline} aria-hidden="true" />
                    Nueva incidencia
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('incidencias')}
                    className="brutal-btn bg-white"
                  >
                    Ver listado
                    <IonIcon icon={arrowDownOutline} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Tarjeta destacada: críticas + progreso */}
              <div className="relative mx-auto w-full max-w-md">
                <span className="absolute -right-2 -top-5 z-10 rotate-6 border-4 border-brutal-ink bg-brutal-lime px-3 py-1 font-mono text-xs font-bold uppercase shadow-brutal-sm">
                  v1.0 · DAM 0488
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterFromKpi('criticas')}
                  className="brutal-card block w-full -rotate-2 bg-brutal-blue p-6 text-left text-white transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] sm:p-8"
                  aria-label={`Ver ${metrics.critical} incidencias críticas`}
                >
                  <p className="font-mono text-sm font-bold uppercase">Críticas abiertas</p>
                  <p className="font-display text-[clamp(5rem,18vw,10rem)] leading-none">
                    {metrics.critical}
                  </p>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between font-mono text-sm font-bold uppercase">
                      <span>Resuelto</span>
                      <span>{metrics.resolvedPct}%</span>
                    </div>
                    <div className="h-6 border-4 border-brutal-ink bg-white">
                      <div
                        className="h-full bg-brutal-lime transition-all duration-700"
                        style={{ width: `${metrics.resolvedPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Marquesina animada (se pausa al pasar el ratón) */}
            <div className="overflow-hidden border-y-4 border-brutal-ink bg-brutal-ink py-3 text-brutal-yellow">
              <div className="flex w-max motion-safe:animate-marquee hover:[animation-play-state:paused]" aria-hidden="true">
                {[...tickerItems, ...tickerItems].map((text, index) => (
                  <span key={`${text}-${index}`} className="mx-6 whitespace-nowrap font-mono text-sm font-bold uppercase sm:text-base">
                    ✱ {text}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================= PANEL KPI (60vh) ================= */}
          <section id="panel" className="flex min-h-[60vh] flex-col justify-center border-b-4 border-brutal-ink bg-white">
            <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
              <SectionTitle number="01" title="Panel" subtitle="Pulsa una tarjeta para filtrar ↓" />
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {kpis.map((kpi) => {
                  const isActive = activeFilter === kpi.key;
                  return (
                    <button
                      key={kpi.key}
                      type="button"
                      onClick={() => handleFilterFromKpi(kpi.key)}
                      aria-pressed={isActive}
                      className={`group flex min-h-[20vh] flex-col justify-between border-4 border-brutal-ink p-4 text-left transition-all duration-150 sm:p-6 ${kpi.bg} ${
                        isActive
                          ? 'translate-x-[6px] translate-y-[6px] shadow-none'
                          : 'shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase sm:text-sm">{kpi.label}</span>
                        <IonIcon icon={kpi.icon} className="text-2xl transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
                      </div>
                      <p className="mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl">{kpi.value}</p>
                      <span className="mt-3 font-mono text-xs font-bold uppercase underline-offset-4 group-hover:underline">
                        {isActive ? '● Filtro activo' : 'Filtrar →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================= LISTADO (100vh) ================= */}
          <section id="incidencias" className="min-h-[100vh]">
            <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
              <SectionTitle
                number="02"
                title="Incidencias"
                subtitle={`${filteredIncidents.length} de ${incidents.length} visibles`}
              />

              {/* Barra de herramientas: búsqueda + filtros + orden */}
              <div className="brutal-card mb-10 flex flex-col gap-4 bg-white p-4 lg:flex-row lg:items-center">
                <label className="relative block flex-1">
                  <span className="sr-only">Buscar incidencias</span>
                  <IonIcon
                    icon={searchOutline}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Código, título o aula..."
                    className="brutal-input pl-12"
                  />
                </label>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
                  {kpis.map((kpi) => {
                    const isActive = activeFilter === kpi.key;
                    return (
                      <button
                        key={kpi.key}
                        type="button"
                        onClick={() => setActiveFilter(kpi.key)}
                        aria-pressed={isActive}
                        className={`border-4 border-brutal-ink px-3 py-2 font-mono text-xs font-bold uppercase transition-colors sm:text-sm ${
                          isActive ? 'bg-brutal-ink text-brutal-yellow' : 'bg-white hover:bg-brutal-yellow'
                        }`}
                      >
                        {kpi.label} ({kpi.value})
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setSortBy((s) => (s === 'reciente' ? 'prioridad' : 'reciente'))}
                  className="brutal-btn bg-brutal-blue px-4 py-2 text-sm text-white"
                  aria-label={`Ordenar por ${sortBy === 'reciente' ? 'prioridad' : 'recientes'}`}
                >
                  <IonIcon icon={swapVerticalOutline} aria-hidden="true" />
                  {sortBy === 'reciente' ? 'Recientes' : 'Prioridad'}
                </button>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 border-4 border-dashed border-brutal-ink bg-white p-8 text-center">
                  <p className="font-display text-4xl uppercase sm:text-5xl">Nada por aquí</p>
                  <p className="font-mono text-sm font-bold uppercase">Ninguna incidencia coincide con el filtro</p>
                  <button type="button" onClick={resetFilters} className="brutal-btn bg-brutal-yellow">
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredIncidents.map((incident) => {
                    const isResolved = incident.status === 'resuelta';
                    const isConfirming = confirmDeleteId === incident.id;
                    return (
                      <article
                        key={incident.id}
                        className={`brutal-card flex flex-col bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-lg motion-safe:animate-pop ${
                          isResolved ? 'opacity-75' : ''
                        }`}
                      >
                        <header
                          className={`flex items-center justify-between border-b-4 border-brutal-ink px-4 py-2 ${PRIORITY_BG[incident.priority]}`}
                        >
                          <span className="font-mono text-sm font-bold">{incident.id}</span>
                          <span className="border-2 border-brutal-ink bg-white px-2 font-mono text-xs font-bold uppercase">
                            {incident.priority}
                          </span>
                        </header>

                        <div className="flex flex-1 flex-col p-4">
                          <p className="flex items-center gap-1 font-mono text-xs font-bold uppercase">
                            <IonIcon icon={timeOutline} aria-hidden="true" />
                            {incident.createdAt}
                          </p>
                          <h3
                            className={`mt-2 font-display text-xl uppercase leading-tight ${
                              isResolved ? 'line-through decoration-4' : ''
                            }`}
                          >
                            {incident.title}
                          </h3>
                          <p className="mt-2 flex-1 text-sm font-medium text-neutral-700">{incident.description}</p>
                          <p className="mt-4 flex items-center gap-1 text-sm font-bold">
                            <IonIcon icon={locationOutline} aria-hidden="true" />
                            {incident.location}
                          </p>
                        </div>

                        <footer className="grid grid-cols-[1fr_auto] border-t-4 border-brutal-ink">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(incident.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase transition-colors sm:text-sm ${
                              isResolved ? 'bg-brutal-lime hover:bg-white' : 'bg-white hover:bg-brutal-lime'
                            }`}
                          >
                            <IonIcon icon={checkmarkCircleOutline} aria-hidden="true" />
                            {isResolved ? 'Resuelta · Reabrir' : 'Marcar resuelta'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(incident.id)}
                            className={`flex items-center gap-2 border-l-4 border-brutal-ink px-4 py-3 font-mono text-xs font-bold uppercase transition-colors sm:text-sm ${
                              isConfirming ? 'bg-brutal-red text-white' : 'bg-white hover:bg-brutal-red hover:text-white'
                            }`}
                            aria-label={isConfirming ? `Confirmar eliminación de ${incident.id}` : `Eliminar ${incident.id}`}
                          >
                            <IonIcon icon={trashOutline} aria-hidden="true" />
                            {isConfirming && '¿Seguro?'}
                          </button>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ================= PIE (30vh) ================= */}
          <footer className="flex min-h-[30vh] items-end border-t-4 border-brutal-ink bg-brutal-ink px-4 pb-24 pt-10 text-brutal-cream sm:px-6 md:pb-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-none text-brutal-yellow">SMARTLAB_</p>
              <p className="font-mono text-sm font-bold uppercase leading-relaxed">
                React · Ionic · Tailwind CSS
                <br />
                Desplegado en Vercel · Desarrollo de Interfaces (0488)
              </p>
            </div>
          </footer>
        </div>

        {/* ================= ELEMENTOS FIJOS ================= */}

        {/* Botón flotante de alta */}
        <button
          slot="fixed"
          type="button"
          onClick={openModal}
          aria-label="Registrar nueva incidencia"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center border-4 border-brutal-ink bg-brutal-pink text-3xl text-brutal-ink shadow-brutal transition-all duration-150 hover:-rotate-6 hover:scale-105 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none md:h-16 md:w-16"
        >
          <IonIcon icon={addOutline} />
        </button>

        {/* Indicador de breakpoint (útil para las capturas RWD del PDF) */}
        <div
          slot="fixed"
          className="pointer-events-none fixed bottom-5 left-5 z-40 border-4 border-brutal-ink bg-white px-2 py-1 font-mono text-xs font-bold uppercase shadow-brutal-sm"
          aria-hidden="true"
        >
          <span className="md:hidden">📱 Mobile</span>
          <span className="hidden md:inline lg:hidden">📟 Tablet</span>
          <span className="hidden lg:inline">🖥 Desktop</span>
        </div>

        {/* Toast */}
        {toast && (
          <div slot="fixed" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8">
            <div
              role="status"
              aria-live="polite"
              className="border-4 border-brutal-ink bg-brutal-yellow px-5 py-3 font-mono text-sm font-bold uppercase shadow-brutal motion-safe:animate-slide-up"
            >
              {toast}
            </div>
          </div>
        )}

        {/* Modal de nueva incidencia */}
        {isModalOpen && (
          <div
            slot="fixed"
            className="fixed inset-0 z-50 flex items-end justify-center bg-brutal-ink/60 sm:items-center sm:p-6"
            onClick={() => setIsModalOpen(false)}
          >
            <form
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateIncident}
              className="brutal-card max-h-[90vh] w-full overflow-y-auto bg-brutal-cream font-body text-brutal-ink motion-safe:animate-slide-up sm:max-w-lg"
              noValidate
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b-4 border-brutal-ink bg-brutal-yellow px-5 py-4">
                <h2 id="modal-title" className="font-display text-2xl uppercase">
                  Nueva incidencia
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="brutal-icon-btn bg-white"
                  aria-label="Cerrar formulario"
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label htmlFor="inc-title" className="brutal-label">Título *</label>
                  <input
                    id="inc-title"
                    ref={titleInputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Error de compilación en SDK"
                    className="brutal-input"
                  />
                </div>

                <div>
                  <label htmlFor="inc-location" className="brutal-label">Aula o ubicación *</label>
                  <input
                    id="inc-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Laboratorio 102"
                    className="brutal-input"
                  />
                </div>

                <fieldset>
                  <legend className="brutal-label">Prioridad</legend>
                  <div className="grid grid-cols-3 gap-3">
                    {PRIORITIES.map((p) => {
                      const selected = priority === p;
                      return (
                        <label
                          key={p}
                          className={`cursor-pointer border-4 border-brutal-ink px-2 py-3 text-center font-mono text-sm font-bold uppercase transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brutal-blue ${
                            selected
                              ? `${PRIORITY_BG[p]} translate-x-[3px] translate-y-[3px]`
                              : 'bg-white shadow-brutal-sm hover:bg-neutral-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            value={p}
                            checked={selected}
                            onChange={() => setPriority(p)}
                            className="sr-only"
                          />
                          {p}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="inc-desc" className="brutal-label">Descripción técnica</label>
                  <textarea
                    id="inc-desc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalla los síntomas observados..."
                    className="brutal-input resize-y"
                  />
                </div>

                {formError && (
                  <p role="alert" className="border-4 border-brutal-ink bg-brutal-red px-3 py-2 font-mono text-sm font-bold uppercase text-white">
                    {formError}
                  </p>
                )}

                <button type="submit" className="brutal-btn w-full bg-brutal-pink">
                  Guardar incidencia
                </button>
              </div>
            </form>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;