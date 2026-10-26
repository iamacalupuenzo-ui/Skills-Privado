# Arquitectura de micro UI (shell + remotos)

Leer cuando el repositorio destino es un shell, una micro UI o un producto nuevo
de Flotas. Es la arquitectura que Comsatel usa a nivel de sistema, no de
interfaz. Fuente: `web-backoffice` (shell) y `microui-bo-tenants` (remoto base
del que se extrae el arquetipo), revisadas el 2026-10-07. Son hechos de esas
versiones: si el repositorio dice otra cosa, manda el repositorio (B11).

## 1. Piezas y quién es dueña de qué

| Pieza | Es dueña de | No hace |
|---|---|---|
| **Shell** (host, `web-backoffice`) | Login (staff, distribuidor y por URL de tenant), sesión, asistente de primer ingreso (contraseña inicial, 2FA, términos y condiciones en una sola página con indicador de pasos), layout autenticado (cabecera y menú), marca del tenant, carga de remotos, bus de eventos | Pantallas de negocio |
| **Micro UI** (remoto) | Pantallas de un dominio, expuestas como `./Routes`, y su API | Login, sesión, cabecera, menú |
| `@comsatel/shared-core` | Contrato de eventos entre shell y remotos | Lógica de negocio |
| **BFF** | Sesión por cookie; el navegador no guarda tokens | |
| **nginx + chart de Helm** | Cabeceras de seguridad, CSP, despliegue por ambiente | |
| **Design System** | Componentes y tokens | Reglas de producto |

- Native Federation: el shell lee `mf.manifest.json` y carga cada remoto por su
  `./Routes`. Una micro UI nueva se registra en el manifiesto; no se importa el
  código de otra.
- Una micro UI **no** implementa login, no lee cookies y no pinta cabecera ni
  menú: el shell se lo da. Si la pantalla necesita saber quién es el usuario o su
  tenant, lo pide por el bus de `shared-core`.
- La marca del tenant llega como tokens del DS aplicados en `:root` en
  ejecución (`BrandingService`). Por eso los remotos solo usan tokens: un valor
  literal no cambia de marca.

## 2. Estructura mínima

- **Shell:** `core/` (sesión, guards, federación, marca), `layout/` (shell
  autenticado), `pages/` públicas (login, distribuidor, primer ingreso, mensaje) y `dev/` con
  un BFF simulado para trabajar sin backend.
- **Remoto:** `features/<dominio>/` con la pantalla, su servicio de pantalla y su
  cliente HTTP; rutas en `app.routes.ts` expuestas como `./Routes`. Aplica
  `arquitectura-proyecto.md` §3 dentro de cada feature.

## 3. Lo que el builder debe cuidar al construir

1. **Dónde va el cambio.** Antes de editar, decir si toca el shell, un remoto, el
   DS o `shared-core`. Un cambio de DS se explica y se confirma antes (el usuario
   ya corrigió una vez que se construyera sin consultar).
2. **La UI no decide arquitectura.** Interceptor HTTP, expiración de sesión (401),
   CSRF, fuente única de versión, plantilla de pipeline fijada y política de
   versión del DS en federación son decisiones de arquetipo con Arquitectura. No
   van en un cambio de interfaz: se registran como pendientes y se avisa.
3. **Un solo DS en pantalla.** Con shell y remoto cargados puede aparecer
   `NG0912` (colisión de ID de componente de `cs-icon`, `cs-button`, `cs-input`):
   el DS se carga dos veces porque sus subpaths no se comparten por federación
   (inferencia). Mientras no se resuelva en el arquetipo, no «arreglarlo» desde
   una pantalla: reportarlo.
4. **Tipografía en el shell.** El DS no fija el `body`. El shell debe declarar la
   base tipográfica y `box-sizing: border-box` (receta en
   `design-systems/comsatel-ds.md`). Sin eso todo lo que no es componente sale en
   serif y los campos se salen de su contenedor.
5. **Versión del DS.** Fijar versión exacta en shell y remoto y subirlas
   juntas; mezclarlas carga dos copias.
6. **Recorrido completo.** Una micro UI se valida dentro del shell (con el BFF
   simulado) y no solo suelta: login, menú, navegación al remoto y vuelta.

## 4. Cómo levantarlo sin tocar repositorios (receta local)

- BFF simulado del shell: `MOCK_PORT=8081 node dev/mock-bff/server.mjs`
  (el puerto 3000 puede estar ocupado por otra herramienta).
- Shell: `npx ng serve --configuration bff --port 4300` (proxya `/api` al 8081 y
  `/mfe/<remoto>` al puerto del remoto).
- Remoto: `npx ng serve --port 4201`.
- No ejecutar `npm run build` en un remoto con `ng serve` activo: comparten caché
  de federación y el servidor falla con `ngDevMode is not defined`; reiniciar lo
  arregla.
- Instalar dependencias de GitLab requiere `GITLAB_NPM_TOKEN` en el comando, sin
  guardarlo.

## 5. Antes de dar por terminado

Declarar en el cierre: pieza tocada (shell/remoto), versión del DS en cada una,
si se recorrió dentro del shell, advertencias de consola (NG0912 incluido) y las
decisiones de arquetipo que quedaron pendientes.
