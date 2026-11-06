# Auditoría de arquitectura de un repositorio Angular

Modo AUDITAR: revisar un repositorio existente contra sus propias reglas, contra
la guía oficial de Angular (`angular-moderno.md`) y contra el patrón de pantalla
de `arquitectura-proyecto.md`, y entregar un backlog priorizado. **No edita
código.** Las mejoras se aplican después, una a una, con aprobación del usuario.

## Principios

1. **Evidencia, no opinión.** Cada hallazgo lleva una medida o un fragmento
   reproducible (comando, archivo y línea). Sin evidencia no hay hallazgo.
2. **Reglas del repositorio primero.** Lo que el repositorio decidió a
   propósito (por ejemplo plantilla inline) es una desviación consciente, no un
   hallazgo. Se anota en la sección "Decisiones conscientes".
3. **Sin ejecutar lo prohibido.** Si el repositorio prohíbe build, `tsc` o
   pruebas sin pedido, la auditoría usa solo lectura del código y comandos de
   búsqueda. Las mediciones de abajo no compilan nada.
4. **Un hallazgo, una acción.** El backlog se ordena por impacto sobre el
   costo, y cada ítem se puede aprobar o rechazar por separado.
5. **Sin reescritura masiva.** Una mejora que toca más de una pantalla se
   propone por etapas, empezando por la que se toca de todos modos.

## Mediciones reproducibles

Ejecutar desde `src/app` (adaptar la ruta). Son solo lectura.

| Qué mide | Comando (Git Bash / Linux) | Regla contra la que se compara |
|---|---|---|
| Archivos largos | `find . -name "*.ts" ! -name "*.spec.ts" -print0 \| xargs -0 wc -l \| sort -rn \| head -15` | Ningún archivo nuevo cerca de 300 líneas; un servicio que crece vuelve a violar la regla de estructura |
| Cobertura de pruebas | `find . -name "*.spec.ts" \| wc -l` frente a `grep -rl "@Component(" --include=*.ts . \| wc -l` | Pruebas de servicios de negocio y de flujos críticos |
| Decoradores vs funciones | `grep -rnE "@Input\(\|@Output\(" --include=*.ts .` frente a `grep -rnE "\binput(\.required)?[<(]\|\boutput[<(]" --include=*.ts .` | Código nuevo con `input()`/`output()` |
| Sintaxis antigua | `grep -rnE "\*ngIf\|\*ngFor\|\*ngSwitch" --include=*.ts .` | Solo `@if`/`@for`/`@switch` |
| Host por decorador | `grep -rnE "@HostBinding\|@HostListener" --include=*.ts .` | Propiedad `host` |
| Efectos que propagan estado | `grep -rn -A6 "effect(" --include=*.ts . \| grep -E "effect\(\|\.set\(\|\.update\("` | Regla "CRITICAL" de `effects.md`: usar `computed`/`linkedSignal` |
| Detección de cambios | `grep -rl "ChangeDetectionStrategy.OnPush" --include=*.ts .` frente al total de componentes | `OnPush` es prerrequisito de zoneless |
| Colores fijos | `grep -rnE "#[0-9a-fA-F]{3,8}\b" --include=*.ts --include=*.css .` | Tokens del Design System; una excepción justificada (mapas, SVG) se anota |
| Restilizar componentes ajenos | `grep -rn "ng-deep" --include=*.ts .` | Prohibido por el contrato público del DS |
| Frontera de mutaciones | Buscar en el servicio de pantalla llamadas a `create`/`update`/`close`/`annul`/`attach`/`remove` del servicio de datos | Solo el servicio de transiciones muta |
| Quién inyecta el servicio de transiciones | `grep -rln "TransitionsService" --include=*.ts .` | Solo el servicio de pantalla |
| Acoplamiento entre features | `grep -rln "<ServicioDeDatosDeOtraFeature>" --include=*.ts .` | Un componente de una feature no lee el servicio de datos de otra sin una frontera explícita |
| Temporizadores sueltos | `grep -rnE "setTimeout\|setInterval" --include=*.ts .` | Cada uno con limpieza y motivo; preferir señales o `effect` con `onCleanup` |
| Ruido | `grep -rn "console\." --include=*.ts .` y `grep -rnE ": any\b\|as any\b" --include=*.ts .` | Cero en producción |

## Qué revisar además de las mediciones (lectura)

- **Servicio de pantalla que crece.** Un servicio de pantalla con decenas de
  métodos casi idénticos (abrir, cerrar, confirmar, error de campo por cada
  diálogo) es la señal de que el estado de diálogos debe salir a su propia
  pieza. Contar métodos y agrupar por diálogo.
- **Componentes de tabla o de mapa con lógica de negocio** dentro.
- **Reglas de negocio duplicadas** en dos lugares (por ejemplo la misma función
  de contrato calculada distinto en dos componentes).
- **Estados de UI faltantes**: carga, vacío, error, permisos, recuperación.
- **Accesibilidad**: nombre accesible de cada control, foco tras abrir y cerrar
  un diálogo, anuncio de errores.
- **Datos simulados** claramente etiquetados y aislados detrás del servicio de
  datos, con la misma forma de resultado que tendrá el cliente real.

## Formato del informe

Documento de lectura corta (tope de cinco minutos):

1. **Una pregunta antes de leer**, cuya respuesta está en el texto.
2. **En 30 segundos**: máximo tres líneas, conclusión primero.
3. **Qué está bien** (con evidencia), para no perder lo que funciona.
4. **Hallazgos priorizados**: ID, evidencia, regla incumplida, riesgo, acción
   propuesta, esfuerzo (S/M/L) y si necesita decisión del usuario.
5. **Decisiones conscientes** del repositorio que no son hallazgos.
6. **Orden sugerido de aplicación**, empezando por lo que se toca de todos modos.
7. **Una pregunta de comprobación** al cierre.

Se guarda en el documento de arquitectura del repositorio (en FleetOperations,
`docs/`) con fecha en el nombre, y se enlaza desde su `CLAUDE.md` si pasa a ser
regla.

## Después de la auditoría

Cada mejora aprobada se aplica como un cambio pequeño y revisable: una regla, un
archivo o una pantalla por vez, verificada según las reglas del repositorio, y el
informe se actualiza marcando el ítem como aplicado. Si una mejora cambia una
regla del repositorio (por ejemplo, pasar todo el código nuevo a `input()`), se
registra primero en su `CLAUDE.md` para que la próxima sesión la encuentre.
