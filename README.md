# SmartLab Monitor — React + Ionic + Tailwind CSS (Home brutalista)

Proyecto del módulo **Desarrollo de Interfaces (Código 0488)** — 2.º CFGS DAM.

## Estructura

- `src/pages/Home.tsx`: componente **Home** responsive en estilo brutalista (cabecera con menú móvil, hero a pantalla completa, panel KPI, listado filtrable, modal de alta, toast y botón flotante).
- `src/types/incident.ts`: tipos de dominio (`Incident`, `FilterOption`, `SortOption`...).
- `src/theme/variables.css`: directivas `@tailwind`, variables de Ionic y componentes `@apply` (`.brutal-btn`, `.brutal-card`, `.brutal-input`...).
- `tailwind.config.js`: paleta, tipografías, sombras duras y animaciones propias.
- `vercel.json`: configuración de despliegue en Vercel (SPA con rewrites).

## Puesta en marcha (Node.js >= 20)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera /dist
```

## Despliegue en Vercel

**Opción A — desde GitHub (recomendada)**
1. Sube el proyecto a un repositorio de GitHub.
2. En https://vercel.com → *Add New… → Project* → importa el repositorio.
3. Vercel detecta **Vite**: Build `npm run build`, Output `dist`. Pulsa *Deploy*.

**Opción B — desde la terminal**
```bash
npm i -g vercel
vercel          # primer despliegue (preview)
vercel --prod   # despliegue de producción
```

## Checklist de la entrega

### RWD (mobile-first, breakpoints de Tailwind)
| Vista   | Ancho       | Cambios visibles |
|---------|-------------|------------------|
| Mobile  | < 768 px    | Menú hamburguesa, hero en 1 columna, KPIs 2×2, tarjetas en 1 columna |
| Tablet  | 768–1023 px | Navegación horizontal, KPIs 2×2, tarjetas en 2 columnas |
| Desktop | ≥ 1024 px   | Hero en 2 columnas, KPIs 1×4, barra de herramientas en fila, 3 columnas (≥1280 px) |

Abajo a la izquierda hay un indicador (📱 Mobile / 📟 Tablet / 🖥 Desktop) para que se vea en las capturas.
Capturas: Chrome DevTools → *Toggle device toolbar* (Ctrl+Shift+M) con 375 px, 768 px y 1440 px.

### Brutalismo
- Bordes negros gruesos (`border-4`) y **sombras duras sin difuminado** (`shadow-brutal` = `6px 6px 0 #000`).
- Colores planos y saturados (amarillo, rosa, azul, lima, rojo) sobre crema, sin degradados.
- Tipografía pesada en mayúsculas (*Archivo Black*) + monoespaciada (*Space Mono*).
- Elementos rotados (`-rotate-2`, `rotate-6`), esquinas rectas y retícula visible con bordes.

### Interacciones
- Botones que "se hunden" en su sombra al pasar el ratón y al pulsar (`hover:translate` + `active:shadow-none`).
- Menú hamburguesa desplegable en móvil y navegación con scroll suave a cada sección.
- Tarjetas KPI clicables que filtran el listado; búsqueda en vivo; filtros por estado; orden por prioridad.
- Marcar resuelta / reabrir y borrado con doble confirmación ("¿Seguro?").
- Modal de alta con validación, foco automático, cierre con `Esc` o clic fuera.
- Toast de confirmación, marquesina animada (se pausa con hover), Pull-to-Refresh de Ionic.
- Animaciones con `motion-safe:` (respetan *prefers-reduced-motion*).

### Layout con vh
- Hero: `min-h-[calc(100vh-4rem)]` (100vh menos la cabecera) con la marquesina pegada al final de la primera pantalla.
- Panel KPI: `min-h-[60vh]`, tarjetas `min-h-[20vh]`.
- Listado: `min-h-[100vh]`; estado vacío `min-h-[40vh]`.
- Pie: `min-h-[30vh]`; modal: `max-h-[90vh]` con scroll interno.

## Docker (opcional)

```bash
docker build -t smartlab-ionic-tw:1.0 .
docker run -d -p 8080:80 --name smartlab-container smartlab-ionic-tw:1.0
```