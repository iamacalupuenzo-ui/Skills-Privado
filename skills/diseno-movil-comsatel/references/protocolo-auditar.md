# Protocolo AUDITAR

Se activa cuando el usuario pide revisar, auditar o «qué le falta» a una pantalla móvil ya construida o maquetada.
**Es de solo lectura**: audita y reporta; edita únicamente si el usuario aprueba los cambios al final del reporte.
Entrada: la pantalla (código, captura, APK o maqueta). Salida: hallazgos con evidencia y su arreglo.

## Fase 0 — Alcance y evidencia

1. Identificar qué se audita y con qué evidencia: código fuente, capturas, APK en un dispositivo o la maqueta.
2. Declarar qué **no se pudo verificar**. Una pantalla que no se vio en un dispositivo no se declara verificada, y
   «compila» y «analyze limpio» no equivalen a «se ve y se comporta bien».
3. Leer `references/medidas-y-reglas.md` y `references/microinteracciones.md`. Para la pantalla de mapa, también
   `references/arquitectura-pantalla-mapa.md`.

## Fase 1 — Revisión de tokens (mecánica)

Con el código a la vista, correr `node scripts/revisar-tokens.mjs <ruta-del-codigo>`. Detecta colores literales y
medidas sueltas en widgets. Cada hallazgo se revisa a mano: una excepción comentada (por ejemplo el radio de 28 dp de
la hoja) no es un fallo. Si no hay código, anotar «tokens: no verificable».

## Fase 2 — Criterios

Para cada criterio: Cumple, Parcial, No cumple, No verificable o No aplica, con la línea de código, la captura o la
medida que lo respalda. No marcar Cumple por intuición.

| # | Criterio | Cómo se verifica |
|---|---|---|
| M1 | Un solo buscador por pantalla | Contar los campos o íconos de búsqueda en la pantalla y en la hoja |
| M2 | Hoja: tres alturas, tirador con área de 48, no modal, «X» si se puede cerrar, título | Código de la hoja y captura en cada altura |
| M3 | Toda zona táctil mide al menos 48 dp | Medir el área interactiva, no el dibujo (fichas de 32 con área de 48) |
| M4 | Sin bordes en los elementos, salvo las excepciones acordadas | Buscar contornos y botones del Design System web |
| M5 | Colores, espacios y radios desde los tokens | Resultado de `revisar-tokens.mjs` |
| M6 | El estado nunca depende solo del color | Captura: ¿hay ícono o texto además del color o halo? |
| M7 | Estados completos: reposo, lista, búsqueda, detalle, sin funcionalidades, sin conexión, sin resultados | Maqueta y pantalla |
| M8 | Movimiento: curva y duración del sistema, entrada más larga que salida, respeta «reducir movimiento» | Código de cada animación |
| M9 | Un cambio de contenido no se corta en seco ni se crea otra superficie | Usar la pantalla: ¿la hoja «salta»? |
| M10 | Las zonas fijas sobre la hoja también la arrastran | Arrastrar desde el tirador, el buscador y las fichas |
| M11 | Fluidez con datos en vivo: el cambio de un dato no reconstruye toda la pantalla | Alcance de cada `ListenableBuilder`; medir en un celular real |
| M12 | Accesibilidad: nombres accesibles, foco, texto al doble sin desborde en 320×568 y 360×640 | Pruebas de accesibilidad y TalkBack (WCAG 1.4.4) |
| M13 | Lo construido coincide con la maqueta validada | Comparar captura y maqueta, estado por estado |

## Fase 3 — Informe

```
Auditoría móvil — [pantalla]
-----------------------------
Evidencia usada:    [código / capturas / APK / maqueta]
No verificado:      [lista honesta]

Crítico:    [hallazgo: qué, medida, por qué, arreglo]
Mejora:     [hallazgo: tag Alta, Media o Baja]
Cumple:     [criterios con su evidencia]
Resultado:  Listo para el alcance probado / Listo con límites / Requiere corrección
```

Crítico es lo que rompe accesibilidad, pierde información o hace inusable una zona. «No verificable» no es «Cumple».

## Trampas ya encontradas en el Home de mapa (revisar primero)

| Qué pasó | Cómo se ve | Arreglo |
|---|---|---|
| El mapa mide 0×0 al encuadrar | Todos los marcadores apilados en el centro | Esperar al primer fotograma con tamaño antes de encuadrar |
| El vehículo elegido queda detrás de la hoja | No se ve su halo ni su nombre | Centrar la cámara arriba de la hoja al elegir |
| Arrastre solo desde el cuerpo de la hoja | El tirador y el buscador no mueven la hoja | Gestos de arrastre en las zonas fijas que mueven el controlador |
| Cada modo crea una hoja nueva | La hoja «aparece» sin animar al buscar o abrir el detalle | Una sola hoja que se mueve con `animateTo` |
| Dos vistas con el mismo `ScrollController` en un `AnimatedSwitcher` | Aserción de Flutter al cambiar | Una vista persistente con hijos cambiantes y desvanecido |
| Buscador arriba y también en la hoja | Dos formas de buscar | Dejar solo el de la hoja |
| Botón de ícono del DS web | Borde cuadrado en un móvil | Botón tonal de 48 dp sin borde |
| Aviso de Unidades sin posición con la «X» aparte y con borde | La «X» no se ve o parece suelta | Una tarjeta con la «X» circular al final |
| Mosaicos de CARTO con marca «API KEY REQUIRED» | Mapa con marca de agua | Cambiar la fuente de mosaicos (DH-1239); la vista previa usa OSM |
| Vehículos de color saturado | Parecen caricaturas frente a los de Uber | Pintura neutra con halo e insignia |
| APK de depuración universal de 1,4 GB | Llena el emulador (`INSTALL_FAILED_INSUFFICIENT_STORAGE`) | Release solo arm64; desinstalar la app de depuración |
