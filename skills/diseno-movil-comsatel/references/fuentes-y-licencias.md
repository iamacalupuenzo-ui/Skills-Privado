# Fuentes y licencias

Leer antes de afirmar una cifra con su fuente, de actualizar una medida o de usar material de un tercero. Este skill
está escrito con palabras del equipo: no copia texto de terceros. Las cifras (hechos) y las ideas no tienen
copyright; la redacción sí.

## 1. De dónde sale cada grupo de cifras

| Grupo | Fuente | Cómo se obtuvo | Fecha |
|---|---|---|---|
| Hoja inferior, rejilla, márgenes, movimiento, barra de navegación (Base) | Uber Base: [Sheet](https://base.uber.com/6d2425e9f/p/033e0d-sheet), [Dimensions](https://base.uber.com/6d2425e9f/p/598458-dimensions), [Bottom navigation](https://base.uber.com/6d2425e9f/p/1413a0-bottom-navigation) | Navegador (las páginas cargan con JavaScript; un lector de texto solo ve el título). Los valores que Base muestra solo en imágenes (radio de la hoja, alto de los botones, tipografía) no se pudieron leer | 24-nov-2026 |
| Medidas de Material 3 (hoja, tarjeta, buscador, zonas táctiles, resortes) | Skill `m3-expressive` (abhixv, MIT), commit `797764c24eb5f96d601f022bb9d3c8167140af7f`, vendorizado en este repositorio con su `LICENSE` | Lectura de sus referencias | 25-nov-2026 |
| Barras superiores de Material 3 (tipos, alineación) | [Documentación de Android sobre app bars](https://developer.android.com/develop/ui/compose/components/app-bars) | Lectura directa | 24-nov-2026 |
| Tiempos de animación y modelo disparador-respuesta | Skill `micro-interactions` (solinkz, MIT), commit `3796c3e5c2762989b6ff4d761b88224c6a94b418`, vendorizado con su `LICENSE` | Lectura | 25-nov-2026 |
| Arquitectura de otras apps de mapa | Prensa y páginas de producto (Uber Newsroom, 9to5Google, Android Central, soporte de Apple, MacRumors, TechCrunch, Xataka) | Un agente de investigación; cada celda quedó marcada como verificada o inferida | 24-nov-2026 |
| Tokens del sistema (`Cs*`) | `lib/src/tokens/cs_tokens.g.dart` de `mobile-ui-components`, etiqueta `flutter-v0.1.0` | Lectura del código | 24-nov-2026 |

La página de especificaciones de Material 3 (`m3.material.io/components/.../specs`) devolvió 404 al intentar leerla
directamente: las cifras de M3 de este skill vienen de las referencias vendorizadas, no de ese sitio.

## 2. Skills de terceros

| Skill | Licencia | Qué se hizo |
|---|---|---|
| `m3-expressive` | MIT (abhixv) | Vendorizado sin modificar en `skills/m3-expressive/`, solo texto |
| `micro-interactions` | MIT (solinkz) | Vendorizado sin modificar en `skills/micro-interactions/` |
| `anatomy` | MIT | Ya estaba vendorizado |
| `apple-design` (dickwu) y `mobile-app-ui-design` (ceorkm) | **Sin licencia declarada** | **No se copian ni se adaptan.** Se instalan solo en local, desde su origen. Ver `docs/skills-de-terceros-sin-licencia.md` |

Regla: solo se copia o adapta lo que declara una licencia que lo permita; con MIT se conserva el aviso de copyright y
se anota qué se cambió. Las páginas de las Human Interface Guidelines de Apple no se copian: se enlazan en
[developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines).
Para Apple, escribir un resumen propio con el enlace a la página.

## 3. Cómo actualizar una cifra

1. Volver a leer la fuente y anotar la fecha.
2. Cambiar la fila de `references/medidas-y-reglas.md` con su etiqueta de origen.
3. Si la cifra afecta algo ya construido, abrir un hallazgo de auditoría (criterio M13), no corregir el código a ciegas.
4. Un dato recordado y no leído se escribe «Sin verificar».
