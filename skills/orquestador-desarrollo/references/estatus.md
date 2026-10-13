# Evaluar el estatus con evidencia

Cuando pidan «¿cómo vamos?» o «evaluemos el estatus», no respondas de memoria: lee el estado real y repórtalo en este orden.

## 1. Qué está publicado

Por cada repo de `mapa-de-repos.md`:

- Estado de los MR (`abiertos`, `fusionados` con fecha y quién) por la API de GitLab.
- Versión en `develop` (`package.json`) y versión del DS que fija.
- Pipeline de `develop`: jobs `verify`, `package container image`, `delivery helm chart`, `deploy to qa`. Un MR fusionado no garantiza el despliegue.

## 2. Qué está vivo

- QA Backoffice: `GET /api/auth/me` sin sesión debe dar 401 JSON.
- QA Web Cliente: `/login` carga, `/api/auth/me` da 401 JSON y `/mfe/monitoring/remoteEntry.json` da JSON. Si alguno devuelve HTML, falta el BFF o la micro UI (ver `diagnostico-qa` en `flujo-producto`).
- Una comprobación de punta a punta con una cuenta de prueba (login, mapa o la pantalla tocada).

## 3. Qué falta y de quién depende

Separar siempre: lo que hace el usuario (fusionar, etiquetar), lo que hace el arquitecto, lo que hace Arquitectura (contratos, BFF real) y lo que hago yo.

## 4. Local

Ramas, cambios sin commit, servidores locales arriba o caídos. Un repo con cambios sin commit se dice.

## Formato de cierre

Tabla corta con MR, versión y estado; luego «Pendiente» por responsable. Lo no verificado se escribe como no verificado.
