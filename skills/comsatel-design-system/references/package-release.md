# Publicación verificable de Comsatel DS

Este protocolo aplica solo a quien mantiene `@comsatel/ui-components`. No se usa
para instalar o consumir la librería en una aplicación Angular.

Desde 2026-10-01 la librería vive solo en GitLab corporativo:
`https://project.comsatel.com.pe/comsatel/development/products/clocator2/webs/componentes-ui/ui-components`.
El repositorio de GitHub `iamacalupuenzo-ui/Comsatel-DS` y el paquete
`@iamacalupuenzo-ui/comsatel-ds` quedaron congelados: no se publica ni se
corrige nada ahí.

## Separación de responsabilidades

Un merge publica código fuente; el paquete lo publica el pipeline de GitLab
cuando se sube un tag de versión. Son pasos, permisos y evidencias distintos. No
afirmar que una versión está disponible para consumidores hasta que el Package
Registry responda con esa versión exacta.

- **Quien desarrolla:** rama `feature/*` → merge request a `develop`. El
  pipeline `verify` corre en cada MR. No crea tags ni publica.
- **Quien libera (Cesar Quevedo hoy):** fusiona `develop` → `release`, crea el
  tag `ds-v<versión>` sobre un commit de `release` y el job `publish` del
  pipeline publica con `CI_JOB_TOKEN`. No hay token personal de escritura.
- **Consumidor:** lee el registro de instancia
  `https://project.comsatel.com.pe/api/v4/packages/npm/` con un token propio
  (`read_package_registry` o `read_api`) en la variable de entorno
  `GITLAB_NPM_TOKEN`; el `.npmrc` versionado solo la referencia. Sin token,
  GitLab responde `404`, no `401`.

## Preparar una versión (en la rama del MR)

1. Subir la versión en `projects/comsatel-ds/package.json` (semver: corrección
   = parche, componente o API nueva = menor).
2. Crear `docs/releases/<versión>.md` con Estado, Resumen, Cambios, Impacto para
   consumidores y Verificación. Nunca editar una nota de una versión ya publicada.
3. Ejecutar `npm run check:docs`, `npm run build:lib`, `npm run verify:package`
   y `npm run test:ci`. El MR repite los mismos gates.
4. Si hay dos MR abiertos que suben versión, el segundo en fusionarse tendrá
   conflicto en `projects/comsatel-ds/package.json`: queda la versión mayor y su
   nota de release menciona lo que incluye.

## Publicación y evidencia

La publica el pipeline al subir el tag; no se ejecuta `npm publish` a mano. El
job verifica que el tag coincida con la versión del `package.json` y que apunte
a un commit de `release`. Luego confirmar desde una máquina consumidora:

```powershell
npm view @comsatel/ui-components@<version> version --registry=https://project.comsatel.com.pe/api/v4/packages/npm/
```

Reportar por separado el MR, el commit en `release`, el tag, el job `publish` y
la respuesta del registro.

## Diagnóstico de bloqueos

| Evidencia | Causa probable | Acción |
| --- | --- | --- |
| `404` al instalar o en `npm view` | Falta `GITLAB_NPM_TOKEN` en el proceso, o el token no tiene `read_package_registry`/`read_api`. | Comparar presencia, no valor, de la variable de usuario y del proceso; reiniciar la terminal o el editor que ejecuta npm. |
| El job `publish` falla con «no coincide con la versión» | El tag no es `ds-v` + la versión del `package.json`. | Borrar el tag local, corregir y volver a crearlo; no tocar la versión publicada. |
| El job `publish` falla con «no apunta a un commit de release» | El tag se creó sobre `develop` o una rama de feature. | Crear el tag sobre el commit fusionado en `release`. |
| El MR está fusionado y el consumidor no ve la versión | El código llegó a `develop`, pero falta release y tag. | No subir la versión en la aplicación consumidora hasta que el registro la muestre. |
| La versión ya existe | Los paquetes no se sobrescriben. | Subir una versión nueva, con su nota de release, y repetir los gates. |
