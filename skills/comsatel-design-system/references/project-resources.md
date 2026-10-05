# Comsatel Design System — Recursos de proyecto

Mapa de fuentes externas al skill. Usarlo para decidir **qué leer y cuándo**;
no sustituye `token-architecture.md`, `page-pattern.md` ni las demás referencias
internas del skill.

## Rutas de trabajo

Desde 2026-10-01 la fuente única es el repositorio de GitLab `ui-components`
(paquete `@comsatel/ui-components`). Las copias anteriores quedaron marcadas en
el nombre de la carpeta y no se editan: `Sistema-Diseño-Comsatel (DEPRECATED)`
(GitHub `iamacalupuenzo-ui/Comsatel-DS`, congelado), `Boveda\Monday\Comsatel-DS (ANTIGUO)`
y `C:\Investigacion\Comsatel-DS-Angular (ANTIGUO)`.

| Recurso | Ruta | Cuándo leerlo | Uso permitido |
|---|---|---|---|
| Workspace Angular | `C:/Users/emacalupu/Documents/00 - Proyectos Enzo - V1/ui-components` (origin GitLab, rama `develop`) | Siempre, al validar el GUARD | Proyecto de destino y fuente de tokens, componentes y páginas reales. Solo accesible con red corporativa o VPN. |
| Reglas del repositorio | `[workspace]/AGENTS.md` | Antes de cualquier cambio | Reglas de trabajo, idioma y gates del repositorio; mandan sobre este skill. |
| README del workspace | `[workspace]/README.md` | Onboarding, comandos o estructura general | Entender el proyecto no sustituye el schema ni los archivos reales. |
| README de la librería | `[workspace]/projects/comsatel-ds/README.md` | Cambios de API, publicación o consumo de la librería | Contexto de la librería Angular. |
| Notas de versión | `[workspace]/docs/releases/<versión>.md` | Cambios de API, versión, paquete o publicación | Evidencia breve obligatoria de resumen, impacto para consumidores y verificación; la versión coincide con `projects/comsatel-ds/package.json` y se valida con `npm run check:release-notes`. |
| Registro de paquetes | `https://project.comsatel.com.pe/api/v4/packages/npm/` y `references/package-release.md` | Antes de declarar instalable una versión | El registro, no solo el repositorio Git, confirma que el artefacto existe. Lo publica el pipeline al subir el tag `ds-v<versión>`. |
| Pipeline | `[workspace]/.gitlab-ci.yml` | Dudas sobre qué se verifica o cómo se publica | Job `verify` en cada MR y en `develop`/`release`/`main`; job `publish` solo con tag `ds-v<versión>` sobre `release`. |
| Guía de aplicación consumidora | `[workspace]/docs/consumer-angular.md` | Construir una pantalla de producto o iniciar una plataforma Angular | Define el límite librería/aplicación, bootstrap limpio, instalación y estructura `core`/`layout`/`features`; no copiar demos ni fuentes de Comsatel DS. |
| Decisión PrimeNG | `[workspace]/PRIMENG_PLAN.md` | Cualquier decisión sobre PrimeNG, otra librería UI o el motor de Modal/Menu/Toast/Table | Historial y límite de decisión: las librerías UI de terceros no se instalan. |
| Código Angular | `[workspace]/projects/comsatel-ds/<entrada>/src/` | Auditoría o reconstrucción de un componente | Fuente de verdad de implementación Angular; cada componente es una entrada por subpath (ver `entry-points.md`). |
| Páginas Angular | `[workspace]/src/app/pages/` | Cuando se modifica una demo o documentación | Verificar el patrón real de página y las composiciones ya existentes. |
| Navegación y rutas Angular | `[workspace]/src/app/lib/nav.ts` y `src/app/app.routes.ts` | Alta de componente o página | Confirmar que el catálogo y la ruta se actualizan de forma coherente. |
| Referencia React | `C:/Users/emacalupu/Documents/Boveda/Monday/Sistema-de-dise-o-Comsatel` | Portar o comparar paridad | Solo estructura, API, comportamiento y edge cases; nunca tokens, valores ni sintaxis literal. |
| Gaps y prioridad React | `COMPONENT_GAPS.md` de la referencia React | Elegir el siguiente componente o revisar paridad | No está en este equipo (verificado 2026-10-05): pedir la ruta o trabajar con `component-inventory.md`. |
| Componente y guía React | `src/components/ui/<componente>.tsx` y `src/components/docs/<Componente>PageContent.tsx` dentro de la referencia React | PORTAR un componente concreto | Extraer estructura, props, estados y secciones de documentación. |
| Producto C-Locater | `C:/Users/emacalupu/Documents/Proyectos/CLocater/C-Locater` | Solo en modo EXTRAER | Referencia de uso real, layout y comportamiento; nunca tokens ni implementación copiada. |

## Regla de lectura

No existe actualmente un archivo independiente llamado “Component Guides”. Para este
skill, su función la cumplen tres niveles: `component-inventory.md` para el estado de
Angular, `COMPONENT_GAPS.md` para paridad y prioridad entre proyectos, y el archivo
real del componente o de su página de documentación para el detalle concreto.

Antes de una tarea, leer solo los recursos que correspondan al modo y componente. Si
una ruta no existe, detener esa parte del trabajo e informarlo; no sustituirla por una
referencia parecida ni deducir su contenido.
