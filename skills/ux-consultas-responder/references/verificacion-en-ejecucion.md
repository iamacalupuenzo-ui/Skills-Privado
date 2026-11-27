# Comprobar en ejecución lo que se afirma sobre lo construido

Leer cuando la consulta pregunta por lo que hace una pantalla construida. Regla (B9): no se describe un comportamiento solo por haber leído el código.

## Cuánto verificar

- **Un texto, una ruta o un nombre de componente:** basta `git grep` sobre la rama indicada. Decir rama y fecha.
- **Un flujo (qué pasa al guardar, al quitar, al cancelar):** probarlo en el navegador. El código no muestra el orden de los pasos ni qué se ve.
- Si no se puede probar, el punto lleva «no verificado en ejecución».

## Levantar el front local

Valores vistos el 2026-11-27 en `microui-bo-tenants` y `web-backoffice` rama `integration` (verificar vigencia en el README de cada repo). Trabajar en un `git worktree` desde `origin/integration` para no tocar el árbol de la persona, e instalar con `npm ci` (la versión de `@comsatel/ui-components` cambia entre ramas).

| Pieza | Cómo | Nota |
|---|---|---|
| Mock de la API | `MOCK_PORT=<p> node dev/mock-bff/server.mjs` desde `web-backoffice` | El proxy del shell apunta a un puerto fijo (`proxy.conf.json`): el mock debe escuchar ahí |
| Micro UI | `npx ng serve --port <p>` desde `microui-bo-tenants` | El shell la alcanza por `/mfe/microui-bo-tenants` → puerto en `proxy.conf.json` |
| Shell | `npx ng serve --port <p>` desde `web-backoffice` | Cambiar en `proxy.conf.json` el puerto de la micro UI y del mock a los elegidos |

Elegir puertos libres y distintos de los de la persona: comprobar con `netstat` quién escucha antes de levantar. Solo se detienen procesos propios (comprobar su línea de comandos).

## Cuentas y rutas del mock

El mock inicia sesión con `login_hint`: `http://admin.<distribuidor>.localhost:<puerto-shell>/api/auth/login?login_hint=<cuenta>&returnUrl=<ruta>`. Cuentas vistas: `servicios@acme` (Servicios con escritura), `servicios-sin-funcionalidades@acme`, `clientes@acme` (Clientes), `staff@comsatel` (host `localhost`, Distribuidores y Funcionalidades). `admin@acme` solo sirve para aceptar los T&C. Dar siempre la URL **completa**, nunca abreviada.

## Fallas conocidas

- **404 en archivos `_comsatel_ui_components_*.js`:** se corrió `ng build` (o `git switch`) en la carpeta que sirve `ng serve`. Reiniciar `ng serve` con la caché limpia. No volver a construir en esa carpeta.
- **Pantalla en blanco con 0 errores:** el proxy del shell apunta a otra micro UI. Comparar el `remoteEntry.json` por el shell y por el puerto propio.
- **«Browser is already in use»:** otro proceso tiene el perfil del navegador. No cerrar procesos ajenos sin permiso; pedirlo.
- **El mock guarda su estado en memoria:** reiniciarlo restaura los datos. Una fecha distinta de la del código fuente significa que alguien reprogramó.
- Si la rama aún no tiene el contrato (por ejemplo, un indicador que depende de un campo del mock), el servidor no lo mostrará aunque el código esté: decir de qué dato depende.

## Qué registrar

En el informe: qué se probó, con qué cuenta y URL, qué se vio (texto literal) y qué no se pudo probar. Las capturas se guardan fuera del repositorio.
