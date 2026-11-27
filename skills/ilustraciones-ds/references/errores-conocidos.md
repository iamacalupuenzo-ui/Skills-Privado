# Errores conocidos

| Síntoma | Causa | Arreglo |
| :-- | :-- | :-- |
| La carrocería sale oscura en el catálogo | Se usó un token semántico: `--color-background-brand-strongest` es casi negro en el tema claro | Usar solo `--color-primitive-*` |
| El catálogo sigue mostrando la escena vieja | Caché de Vite del servidor 4215 | Matar el servidor, borrar `.angular/cache`, levantarlo de nuevo |
| El script de reinicio del 4215 dice «no-arrancó» | Busca «Local:» en un log con códigos de color | Abrir la página; si responde, arrancó |
| Una pieza nueva sale negra | Falta su clase en `scenes.css` | Agregar la clase con sus cinco tonos |
| La escena pesa más de 50 KB | Sólidos de revolución con sombreado suave y muchos pasos | `{ steps: 20, smooth: false }` en piezas chicas, `{ steps: 48 }` en aros, sin la marca `1` de suavizado en el perfil |
| Las ruedas inflan el SVG a 68 KB | Se dibujaron con `disc` del kit | `tireOf` o `tireAlongX`: elipses exactas y una banda tangente |
| Un objeto se ve «a un lado» o tapado | Dos sólidos superpuestos en profundidad (el enchufe dentro del tomacorriente) | Separarlos en el eje que mira a la cámara, poner la cara útil hacia +x o +y y revisar a 2× |
| El brillo del vidrio casi no se ve | `G.arcOf` solo dibuja la parte que mira a la cámara | Arco propio con `G.pointOf` |
| Un reemplazo de texto con Node no aplica | Los archivos de `ui-components` tienen fin de línea CRLF | Normalizar `\n` a `\r\n` antes de buscar, o editar con la herramienta Edit |
| `rm` de `node_modules/@comsatel/ui-components` falla con «Device or resource busy» | Un `ng serve` del 4202 o 4401 sigue vivo, o un proceso retiene la carpeta | Detener los servidores; si persiste, copiar el contenido encima de la carpeta |
| La micro UI no carga en el shell después de copiar el DS | La versión del `package.json` copiado no coincide | Ponerle `1.17.0-pre.157` y borrar `.cache/native-federation` |
| Dos escenas en la misma página comparten sombra | Id de filtro fijo | El id sale de `haloId` de `SceneBase`; nunca escribir un id literal |
| La prueba de la escena no encuentra el componente | No se corrió `build:lib`: la spec importa el paquete desde `dist/` | Compilar antes de la prueba |
