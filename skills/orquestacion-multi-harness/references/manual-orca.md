# Manual: cómo usar Orca correctamente con Codex

**¿Cómo sabes si un worker de Codex de verdad está trabajando, si Orca lo marca como «fallido»?**

## En 30 segundos

El estado de Orca no es confiable en modo terminal: un worker puede figurar `failed` y estar trabajando, o figurar `trabajando` y estar detenido. La verdad está en su terminal (`worker-read`) y en el archivo que debe entregar. Despacha siempre con `dispatch-worker.sh`, pon rutas absolutas en el spec y corrige sobre la marcha escribiendo en su terminal.

## Relato: qué pasó y qué aprendimos

En la sesión del 27 y 28 de septiembre de 2026 se despacharon unos quince workers de Codex (planes, validaciones y cargas de datos). Casi todos terminaron marcados `failed` en la etapa `agent_readiness` por *timeout*, aunque el script les había reenviado el prompt a mano y entregaron su trabajo completo. Por eso su `worker_done` llegó «rechazado»: Orca ya había cerrado ese dispatch.

El caso contrario también pasó. Una corrección de datos se despachó sin las rutas de los Excel; Codex no los encontró, se detuvo y dejó un mensaje en su terminal. Orca seguía mostrando el dispatch como vigente y Claude avisó que «seguía en curso» sin revisarlo. Enzo lo notó: no había nadie trabajando.

## Reglas de uso

### 1. Despachar

- Usa siempre `scripts/dispatch-worker.sh <run> <spec> <título> codex <modelo> <esfuerzo> "<repo>"`. Si el prompt queda pegado sin enviar, lo reenvía.
- Si el script dice `+enviado a mano`, el dispatch va a figurar `failed`: es normal. Sigue el trabajo por la terminal y el archivo entregable.
- El spec debe ser autosuficiente. Incluye **rutas absolutas** de todo archivo externo (Excel, imágenes de referencia) aunque ya se hayan usado en un dispatch anterior: cada worker nuevo empieza sin memoria.
- Si el entregable es un documento, di su ruta exacta. Ese archivo es la señal de término, no el `worker_done`.

### 2. Saber si está trabajando

- Mira la terminal: `orca orchestration worker-read --dispatch <id> --source terminal --limit 20`. `Working (Xm Ys)` = trabajando; el prompt vacío `› Ask Codex to do anything` = detenido.
- El `agentTerminalHandle` sale de `orca orchestration worker-show --dispatch <id> --json`.
- Nunca digas «sigue en curso» sin haber leído la terminal en ese momento.

### 3. Corregir o agregar requisitos a mitad de camino

- `orca orchestration send --to dispatch:<id>` falla si el dispatch figura `failed`: el worker nunca lo lee.
- Escribe directo en su terminal: `orca terminal send --terminal <handle> --text "<instrucción>" --enter --json`. Codex lo toma como un mensaje nuevo en la misma conversación y conserva el contexto.
- Si le dices «no importa si worker_done falla, deja el doc actualizado», deja de bloquearse intentando cerrar el dispatch.

### 4. Esperar el resultado sin gastar tokens

- Usa un vigilante en segundo plano que revise el entregable cada 10 s y avise al terminar.
- El vigilante debe tolerar que el archivo **desaparezca un rato**: Codex a veces lo borra antes de reescribirlo. Usa `[ -f archivo ] && …` en vez de `sed` o `grep` directos sobre el archivo, porque esos comandos terminan con error y matan al vigilante.
- La condición de término debe ser específica del cambio pedido (por ejemplo, que aparezca «Santander» tres veces), no solo que el archivo exista.

### 5. Mensajes de orquestación

- `orca orchestration check --run <run>` muestra lo pendiente; luego `--ack <deliveryId>` para marcarlo leído.
- Un `worker_done` rechazado por `inactive dispatch` no es un fallo del trabajo: compara con el archivo entregado.

## Qué sigue

- Si una instalación nueva de Orca corrige el *timeout* de `agent_readiness`, revisa si `dispatch-worker.sh` sigue siendo necesario.
- Registrar aquí cada falla nueva en el mismo formato: qué pasó, cómo se detectó y la regla.

**Pregunta de comprobación:** si Orca muestra un worker como `failed` pero su terminal dice `Working (3m 10s)`, ¿qué haces y por qué?
