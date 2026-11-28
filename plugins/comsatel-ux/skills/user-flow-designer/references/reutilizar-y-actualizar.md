# Reutilizar y actualizar

## Índice

1. Antes de crear: buscar
2. Actualizar un flujo
3. Contrastar con lo construido
4. Efecto en cadena

## 1. Antes de crear: buscar

```bash
git -C <kb> grep -l "UXR-140" origin/develop -- design/user-flows/
git -C <kb> grep -l "dsp-009" origin/develop -- design/user-flows/
```

Si otro flujo resuelve lo mismo en otro nivel (Distribuidor → Cliente → Producto) o plataforma, el
nuevo flujo lo declara como base en la sección 2, cita sus pasos con `[Reutiliza]` y lista sus
ramas en «Reutilizadas de FLW-NNN». Solo escribe lo que cambia.

## 2. Actualizar un flujo

1. Se edita el flujo existente; ni el ID ni los de sus pasos y ramas cambian (B9).
2. Un paso o rama que ya no aplica se tacha en prosa («retirada el AAAA-MM-DD por DEC-NNN»), no
   se borra: la SCR y QA pueden citarlo.
3. Una rama `[PENDIENTE: ID]` cuya pregunta se respondió pasa a tener fuente.
4. Fila nueva en `# Historial`; `generated.at` al día; `status` sigue en `draft`.
5. Si cambian las pantallas, se actualiza `screens` y se avisa a `ui-spec-writer`.

## 3. Contrastar con lo construido

Manda lo construido para estructura y flujo (decisión de Enzo). Los pasos que se observaron en el
código llevan `[Construido]` con la referencia (US, repo, ruta). Una diferencia con la historia se
convierte en rama con su marca o en pregunta en el UXR; no se pide rehacer por preferencia.

## 4. Efecto en cadena

Un cambio en el flujo puede tocar la SCR (estados, pantallas) y lo construido. Se avisa al
orquestador para que enrute el hallazgo a `ui-spec-writer`; si el paquete está en desarrollo, el
hook de `ux-a-desarrollo` lo mostrará al iniciar la sesión siguiente. Si afecta a otra área, se
emite el aviso en `avisos/` (DH-307).
