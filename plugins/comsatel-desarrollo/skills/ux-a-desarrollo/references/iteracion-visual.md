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

## Cierre de cada iteración

Decir qué cambió y qué se midió; las pruebas del módulo con cifras; qué quedó sin verificar. Reiniciar los servidores si corrieron `ng test` o `ng build`.
