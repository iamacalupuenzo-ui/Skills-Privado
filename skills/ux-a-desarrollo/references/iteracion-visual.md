# Iterar el diseño con capturas

El responsable de diseño ajusta con capturas anotadas (cajas, medidas en píxeles, flechas). Ritmo de trabajo que funcionó:

## Reparto

- **Pequeño** (espaciado, tamaño, orden, un texto, quitar una etiqueta): se aplica directo y se verifica en el navegador en el mismo turno.
- **Grande** (modelo de datos, contrato del mock, un componente nuevo): se delega con un encargo escrito (`orquestacion-multi-harness`), con pruebas del módulo, y se verifica al volver.
- Un cambio que toca el DS no se hace sin confirmación (`flujo-ds`).

## Cómo leer una captura

- Una medida en la captura (por ejemplo «13 px», «9 px») es lo **actual**; el responsable dice cuál debe ser. Si dice «24 px de alto y de ancho», preguntar o inferir con la imagen si es relleno hacia los bordes o separación entre elementos; si hay duda, aplicar la lectura más probable y decirlo para que la corrija.
- Escala de tokens de espaciado: 2, 4, 6, 8, 12, 16, 20, 24, 32 px (y padding hasta 48). Un valor entre dos se redondea al token más cercano y se avisa.
- «Que se vea como el piloto»: abrir el piloto, medir y copiar el patrón, no la medida a ojo.

## Verificar siempre en el navegador

1. Recargar con la sesión vigente; si el mock se reinició, la sesión se pierde y hay que ingresar de nuevo.
2. Un clic sintético (`element.click()` por script) puede no abrir popovers ni diálogos que cierran al perder el foco: usar un clic real del navegador.
3. Un diálogo `beforeunload` por cambios sin guardar aparece al recargar: aceptarlo y repetir.
4. Medir con `getBoundingClientRect` y estilos computados cuando la captura habla de píxeles.
5. Probar el caso con el elemento aparecido (por ejemplo, un botón que solo existe con otro valor) y con el elemento ausente.

## Servidores de prueba: fallas conocidas

1. **No correr `ng build` (ni cambiar de rama) en la carpeta que sirve `ng serve`.** Reemplaza los archivos que el servidor tiene indexados y los módulos compartidos dan 404. Reiniciar `ng serve` con la caché limpia. Para comprobar que compila, usar otra copia de trabajo.
2. **El proxy del shell apunta a un puerto fijo** (`proxy.conf.json`) para el mock y para cada micro UI. Si el mock o la micro UI escuchan en otro, la pantalla carga sin datos o en blanco. Comparar el `remoteEntry.json` pedido por el shell con el del puerto propio.
3. **Una rama que cambia el proxy lo reescribe al cambiar de rama.** Releer el archivo después de cambiar de rama.
4. **Usar puertos distintos de los de la persona** y detener solo procesos propios (comprobar su línea de comandos antes).
5. **Dar siempre la URL completa** de cada pantalla, con el `login_hint` de la cuenta correcta; `admin@acme` solo sirve para los T&C.
6. Lo que dibuja una pantalla puede depender del contrato del mock: si el campo no existe en el mock de esa rama, no se verá aunque el código esté. Decir de qué dato depende.

## Cierre de cada iteración

Decir qué cambió y qué se midió; las pruebas del módulo con cifras; qué quedó sin verificar. Reiniciar los servidores si corrieron `ng test` o `ng build`.
