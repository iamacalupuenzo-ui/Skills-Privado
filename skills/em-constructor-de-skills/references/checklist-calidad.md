# Skill Builder — Checklist de calidad

24 criterios organizados en 6 categorías (C24 se agregó el 2026-09-26 y queda al final del
archivo para no renumerar los existentes; pertenece a la Categoría 2 — Orquestación).
Verificar cada uno contra el contenido real del skill — no marcar ✅ por intuición.

---

## Categoría 1: Frontmatter

**C1 — Nombre en kebab-case**
El campo `name:` coincide exactamente con el nombre de su directorio en la instalación
del agente que se está auditando (`~/.codex/skills/` o `~/.claude/skills/`).
✅ `name: react-dev` + directorio `react-dev/`
❌ `name: ReactDev` o `name: react_dev`

**C2 — Activación discriminante**
Description explica capacidad y cuándo usarla. No exige comillas ni una cuota de frases.
✅ Documenta componentes existentes; no los implementa.
❌ Ayuda con diseño: no distingue documentación de construcción.

**C3 — Entradas explícitas y metadatos compatibles**
Se entiende qué debe recibir el skill. Campos opcionales solo si los admite el cliente.
✅ Ruta o identificador del componente, con salida cuando falta.
❌ Exigir argument-hint en todos los agentes o inventar el objetivo.

**C4 — Capacidades y permisos comprobados**
Cada operación tiene una capacidad disponible y un destino autorizado.
✅ Consultar schema antes de escribir; declarar falta de acceso.
❌ Suponer que allowed-tools instala el conector o concede permisos externos.

**C5 — Complejidad proporcional**
Cada sección evita un error o cambia una decisión. No inferir effort por cantidad de modos.
✅ Mantener ejemplos específicos y externalizar detalle condicional.
❌ Agregar bloques para cumplir una cuota o recortar por cantidad de líneas.

---

## Categoría 2: Orquestación

**C6 — Guard presente y accionable**
Existe una sección GUARD que verifica contexto antes de actuar.
El guard especifica qué hacer si falla (avisar al usuario + detenerse).
❌ Guard que solo verifica pero no tiene consecuencia.

**C7 — Identidad real del destino**
Comprobar el proyecto, base o archivo solicitado, no un número arbitrario de archivos.
✅ Leer identificador del manifiesto o destino de la relación.
❌ Dar por correcto el proyecto porque existe package.json.

**C8 — Modo declarado en primera línea**
La sección de Detección de modo indica que se debe declarar el modo activo antes de actuar.
Verificar que el Formato de respuesta también lo requiere.

**C9 — Cada modo tiene protocolo completo**
Todo modo listado en la tabla tiene un bloque de protocolo con fases numeradas.
❌ Modo listado en la tabla pero sin protocolo → comportamiento indefinido.

**C10 — Autorización proporcional**
El diagnóstico aprobado permite corregir dentro de ese alcance sin otra confirmación rutinaria.
✅ Consultar un borrado o destino nuevo no autorizado.
❌ Publicar porque se pidió editar, o repetir la entrevista tras aprobar el cambio.

**C11 — Cierre definido por modo**
Cada modo tiene un bloque de cierre con formato fijo que define qué información entrega.
✅ Bloque con archivos creados, resultado de validación, próximo paso.
❌ Skill que termina sin reportar qué hizo.

---

## Categoría 3: Referencias

**C12 — SKILL.md cita referencias que existen**
Para cada `references/nombre.md` citado en el SKILL.md:
```powershell
$nombre = "[nombre-skill]"
$roots = @(
  (Join-Path $env:USERPROFILE ".codex\skills\$nombre"),
  (Join-Path $env:USERPROFILE ".claude\skills\$nombre")
)
$skillRoot = $roots | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
Test-Path -LiteralPath (Join-Path $skillRoot "references\[archivo].md")
```
❌ Citar `references/inventory.md` sin que el archivo exista.

**C13 — Conocimiento conservado y lectura progresiva**
El principal contiene lo común; recursos condicionales conservan procedimientos y ejemplos.
✅ Cada bloque movido tiene destino y momento de lectura.
❌ Resumir las referencias hasta perder sus decisiones; las líneas no miden calidad.

**C14 — Referencias alcanzables**
Cada recurso mantenido tiene un consumidor y condición de lectura.
✅ Índice al inicio o ruta desde el modo correspondiente.
❌ Recurso importante aislado, sin forma de que el agente lo consulte.

---

## Categoría 4: Bloqueantes

**C15 — Riesgos cubiertos**
Los controles responden a fallos concretos; no existe un mínimo universal de bloqueantes.
✅ Conservación, aislamiento, datos incompletos y reintentos tratados cuando aplican.
❌ Siete reglas de presentación pero ninguna protección ante borrado.

**C16 — Reglas localizables y coherentes**
Numerar cuando permita referenciarlas. Definición y ejemplos deben ser compatibles.
✅ Una regla con condición, acción y consecuencia.
❌ Añadir otra regla opuesta sin modificar la anterior.

**C17 — Bloqueantes concretos y con consecuencia**
Cada bloqueante describe una acción específica prohibida y qué pasaría si se viola.
✅ "B3 — overflow-hidden: nunca usar en containers con dropdowns → corta el menú absolutamente posicionado"
❌ "B3 — Calidad del código: siempre escribir código limpio"

---

## Categoría 5: Formato y completitud

**C18 — Formato de respuesta definido**
Existe una sección "Formato de respuesta" que especifica:
- Cómo declarar el modo
- Idioma y tono
- Al menos una restricción específica (sin emojis, máximo N preguntas por turno, etc.)

**C19 — Portabilidad y configuración**
Separar convenciones generales de rutas, IDs y memorias del equipo.
✅ Configuración con procedencia y verificación de vigencia.
❌ Dependencia obligatoria de una memoria ausente en otra laptop.

**C20 — Distribución explícita**
Editar, instalar, registrar y publicar son operaciones independientes.
✅ Reportar qué destinos se verificaron y cuáles no fueron solicitados.
❌ Dar por instalado por existir una fila en Notion, o registrar sin pedido.

---

## Categoría 6: Racionalización, alerta temprana y eficiencia de contexto

**C21 — Casos positivos y recuperación de experiencia**
Probar entradas realistas y comparar resultado observable con lo esperado.
✅ Corrección aprobada, con alcance preservado y ejemplos vigentes.
❌ Aprobar solo porque existe una tabla de racionalizaciones.

**C22 — Casos negativos y alertas**
Comprobar falta de acceso, ambigüedad, contradicciones y resultados inciertos cuando aplican.
✅ Detener escritura ante destino incorrecto; inspeccionar antes de repetir tras timeout.
❌ Datos ausentes convertidos en cero o éxito.

**C23 — Ejecución y verificación honesta**
Probar código nuevo en aislamiento; validar el paquete con el agente objetivo cuando sea posible.
✅ Distinguir formato válido, pruebas locales e integración real pendiente.
❌ Declarar compatibilidad total solo porque el archivo aparece en el inventario.

---

## Categoría 2 (continuación): C24

**C24 — Operaciones deterministas evaluadas para script**
Para cada procedimiento del SKILL.md o sus references que sea una secuencia mecánica
repetida (resolver un ejecutable, parsear un JSON de estado, calcular un umbral, verificar
una condición booleana), hay evidencia de que se evaluó extraerla a `scripts/` — ya sea
como script real con contrato y prueba de caso de fallo (ver `patterns-catalog.md`,
Patrón 19), o una nota explícita de por qué no aplica (ej. requiere juicio no determinista).
✅ El skill tiene un script con contrato comentado y su caso negativo probado.
❌ Una secuencia de comandos idéntica se repite en dos protocolos distintos como prosa,
   sin que se haya considerado extraerla.
No fuerces un script donde no hay operación determinista real — inventar código de ejemplo
no ejecutable para cumplir esta casilla es peor que omitirla (ver antipatrón en
skill-anatomy.md, sección 12).

## Resultado

Para cada criterio: Cumple / Parcial / No cumple / No verificable / No aplica,
más archivo/sección o resultado de prueba. No sumar convenciones como porcentaje de calidad.

- Listo para el alcance probado: pruebas aplicables satisfactorias, sin fallos críticos.
- Listo con límites: comprobación local satisfactoria e integración pendiente identificada.
- Requiere corrección: pérdida de información, escritura fuera de alcance, resultado incorrecto
  o referencia indispensable irresoluble.

No verificable no equivale a Cumple. Los ejemplos no prueban ejecución por sí solos.
En una modificación pequeña comprobar lo afectado; en una refactorización, lista completa.
