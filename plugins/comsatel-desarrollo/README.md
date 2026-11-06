# comsatel-desarrollo

Flujo de desarrollo de CL2 Flotas para Claude Code: un orquestador y cinco especialistas, más el guardia de GitLab.

| Skill | Rol |
|---|---|
| `orquestador-desarrollo` | Orquestador. Decide el flujo, el orden y las puertas |
| `ux-a-desarrollo` | Baja las decisiones de UX a código |
| `angular-product-builder` | Construye pantallas y flujos con el Design System |
| `flujo-ds` | Cambia, versiona, publica y registra brechas del DS |
| `flujo-producto` | Versiona, publica y despliega productos |
| `verificar-calidad` | Pruebas, navegador, accesibilidad y servidores locales |

El guardia (`hooks/hooks.json`) se activa solo al instalar el plugin. Bloquea fusionar un MR, crear o borrar etiquetas, `npm publish`, el push a `develop`, `main` y `release`, el push forzado y mostrar el token. Pide confirmar subir una rama y abrir un MR. Los skills solo explican el proceso; el guardia lo hace cumplir.

## Instalar

```
/plugin marketplace add <ruta o URL de este repositorio>
/plugin install comsatel-desarrollo@comsatel-skills
```

Abre una sesión nueva para que cargue.

## Si ya instalaste el guardia a mano

Antes de instalar el plugin, retíralo para que no corra dos veces:

```
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs --quitar
```

## Apoyo que no viaja en el plugin

`ux-ui-orchestrator` (documentación de UX, etapa previa), `angular-developer`, `angular-new-app`, `comsatel-design-system` y `orquestacion-multi-harness`. Si faltan, el orquestador sigue con las reglas resumidas de sus referencias y avisa de lo que no pudo apoyar.

## Mantenimiento

La fuente de los skills es `skills/<nombre>/` en la raíz del repositorio. Esta carpeta `skills/` es una copia generada: no se edita a mano.

```
npm run construir-plugin -- desarrollo   # regenera la copia
npm test                                 # falla si la copia difiere de la fuente
```
