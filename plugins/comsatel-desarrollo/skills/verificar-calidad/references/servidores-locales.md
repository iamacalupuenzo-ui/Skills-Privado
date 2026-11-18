# Servidores locales

Ver puertos y comandos en el mapa de repos del orquestador.

## Puertos (verificados el 2026-11-17)

Antes de levantar: `python <carpeta del skill>/scripts/puertos_libres.py` (código 1 si alguno está ocupado; dice PID, proceso y comando).

| Puerto | Qué | Trampa |
|---|---|---|
| 8082 | Mock del BFF de Web Cliente | — |
| 4400 | Shell de Web Cliente (4401 en otra copia) | — |
| 4202 | Micro UI de Monitoreo | El proxy del Shell del Backoffice manda `/mfe/microui-bo-feature-flags` al 4202 |
| 3000 | Servidor MCP de draw.io | El mock del Backoffice usa el 3000 por defecto: `MOCK_PORT=3001` y `proxy.conf.json` al 3001 solo en local, sin commit (el Shell no acepta `--proxy-config`) |
| 4200 | Shell del Backoffice | — |
| 4201 | Micro UI de Distribuidores (bo-tenants) | — |
| 4203 | Libre para otra micro UI del Backoffice | — |

## Un solo frente a la vez

No corras suites de varios repos en paralelo ni una suite junto a un build del mismo repo: la carga produce fallos falsos. Si una prueba falla con carga, repítela sola; `puertas.py` lo hace y la marca «inestable».

## Receta de reinicio

Receta de reinicio que funciona en Windows con Git Bash:

```bash
for p in 4300 4201 8081; do
  pid=$(netstat -ano | grep ":$p " | grep LISTENING | awk '{print $5}' | head -1)
  [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1
done
(cd web-backoffice && MOCK_PORT=8081 nohup node dev/mock-bff/server.mjs >/dev/null 2>&1 &)
(cd web-backoffice && nohup npx ng serve --configuration bff --port 4300 >/dev/null 2>&1 &)
(cd microui-bo-tenants && nohup npx ng serve --port 4201 >/dev/null 2>&1 &)
```

## Esperar a que estén listos

Sondear con `curl -sf` hasta que respondan; **sin `sleep` largo encadenado**: usar un bucle `until` con el comando de comprobación. Una micro UI está lista cuando `GET http://localhost:4201/remoteEntry.json` da 200; el Shell, cuando `GET http://localhost:4300/` da 200. El primer arranque tarda entre 20 y 45 s.

## Qué los rompe

- `ng test` y `ng build` en el mismo repo: reiniciar siempre después.
- Cambiar de rama sin reiniciar (el servidor sirve los archivos de la rama anterior).
- `npm install` del DS con el servidor del 4200 arriba: el enlace de `node_modules/@comsatel/ui-components` queda roto (EBUSY); detener primero.

## Comprobaciones

- Mock del Backoffice (8081): `GET /api/auth/login-config` responde `{"staff":"form"}` por el proxy del Shell; directo al 8081 responde 401 sin sesión (es normal, no es una falla).
- Mock de Web Cliente (8082): `GET /api/auth/me` sin sesión responde 401.
- Reiniciar un mock borra su estado: se pierde la sesión del navegador y los datos creados (por ejemplo, un Distribuidor de prueba).

## Cuentas de prueba (mock local)

Backoffice: `staff@comsatel` / `staff`; `lectura@comsatel` solo lectura; distribuidor con código `acme` y contraseña `acme` (usuarios `ninguno@`, `todo@`, `identidad@acme`; 2FA `A7K2M9`). Web Cliente: `con-unidades@acme.test` / `flotas`. Piloto: `administrador@demo.com` / `Flota2026!`.
