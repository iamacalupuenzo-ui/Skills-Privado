---
name: flujo-app-movil
description: >
  Flujo de trabajo dentro de la app móvil de Comsatel (`flotas-movil`, Flutter para Android e
  iOS): construir o cambiar una pantalla o un flujo con la biblioteca de componentes, mantener la
  estructura `core/` y `features/`, conectar los datos detrás de un contrato (`AuthRepository`),
  actualizar la versión de la biblioteca que la app usa y entregar por MR. Úsalo cuando pidan
  "construye esta pantalla en la app móvil", "agrega el flujo de recuperar contraseña", "conecta
  el login al BFF", "actualiza la biblioteca en la app" o "sube la app móvil". No cambia
  componentes (usa flujo-ds-movil), no verifica en el emulador (usa verificar-movil) y no es para
  web (usa flujo-producto).
metadata:
  version: "1.0.0"
---

# Flujo de la app móvil

Trabajas dentro de `flotas-movil`. Su `README.md` manda sobre este skill: dice qué es de
demostración, qué falta y las reglas para construir pantallas. La primera versión es una **base
para que el equipo de desarrollo la refactorice**: la estructura y la navegación son propuestas,
no decisiones cerradas; se respetan mientras nadie las cambie y se proponen cambios, no se imponen.

## Referencias disponibles

- `references/estructura-de-la-app.md` — carpetas, el contrato de autenticación, patrones de las pantallas de acceso y qué es de demostración. Leer antes de crear una pantalla.
- `references/dependencia-de-la-biblioteca.md` — cómo la app usa `comsatel_ui_flutter`, cómo se actualiza el `ref` y cómo resolver `pub get` con credenciales sin escribirlas. Leer al tocar `pubspec.yaml`.

## GUARD — verificar contexto

1. Estás en `flotas-movil` (existen `pubspec.yaml` con `name: flotas_movil`, `lib/core/` y `lib/features/`). Si no, derivar a `flujo-ds-movil`.
2. Leer `README.md`, la rama y los MR abiertos. Confirmar qué versión de la biblioteca fija `pubspec.lock`.
3. Confirmar que existe la UX de la pantalla (requisitos, flujo, pantalla). Si falta, derivar a `em-orquestador-ux`; lo pendiente del PO queda en un documento, nunca como rótulo en la interfaz.
4. **Si falta un componente `Cs*`, parar y preguntar (B1).** No se inventa un envoltorio ni se aproxima con un widget suelto.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `PANTALLA` | «construye/cambia» una pantalla o un flujo | Rama `feature/`, carpeta en `lib/features/`, solo componentes `Cs*` |
| `DATOS` | «conecta», «llama al BFF», «guarda la sesión» | Detrás de un contrato en `lib/core/`; la pantalla no conoce el servidor |
| `DEPENDENCIA` | «actualiza la biblioteca», salió una versión nueva | `references/dependencia-de-la-biblioteca.md` |
| `ARRANQUE` | «crea el proyecto», «agrega iOS», «cambia el nombre de la app» | Reglas de `references/estructura-de-la-app.md`; confirmar antes |

## Cómo se construye una pantalla

- **Un solo punto de verdad para los datos:** la pantalla recibe un contrato (`AuthRepository` u otro) y no importa un cliente HTTP. Así se prueba con un repositorio falso y se cambia la implementación sin tocar la pantalla.
- **Componentes y tokens del sistema:** `Cs*`, `context.cs.<rol>`, `CsGap`, `CsPadding`, `CsTextStyles`. Texto de apoyo y de marca con roles `...Aa`. Ningún color ni medida suelta.
- **Pantallas de acceso:** `CsAuthTemplate` y `CsWelcomeTemplate`; el logo va a la izquierda, sobre el mismo borde que el texto. Validación al enviar, un solo botón principal, mensaje genérico ante credenciales inválidas y otro, distinto, ante un fallo de red.
- **Estados que toda pantalla cubre:** cargando, vacío, con error de validación, con error del servidor y éxito; en claro y oscuro, con letra al doble de tamaño y sin movimiento si se pidió reducirlo.
- **Teclado:** `textInputAction` correcto (`next` y `done`), `AutofillGroup` en formularios de acceso, correo y contraseña sin corrección automática ni sugerencias, y que la pantalla se desplace cuando aparece el teclado.
- **Navegación:** la de la base es mínima (`Navigator` con una raíz que cambia según la sesión). Si se adopta un paquete de rutas, se acuerda con el equipo antes.
- **Pruebas:** cada pantalla con su prueba de recorrido (validación, error, éxito) usando un repositorio falso. `flutter analyze` y `flutter test` sin hallazgos.

## Controles que deben pasar antes de dar un cambio por terminado

- `dart format`, `flutter analyze` sin hallazgos y `flutter test` en verde, con cifras reales.
- Probado en el emulador (`verificar-movil`), en claro y oscuro, con una captura por estado y sin inventar lo que no se vio.
- El `README.md` al día: lo de demostración que se reemplazó sale de la lista; lo nuevo que queda por hacer entra.

## Comportamientos bloqueantes

- **B1 — Si el componente no existe, se detiene y se pregunta.** Si se confirma que falta, se construye en la biblioteca (`flujo-ds-movil`) y la app lo usa después.
- **B2 — La pantalla no conoce el servidor.** Todo acceso a datos va detrás de un contrato; una pantalla que importa un cliente HTTP se devuelve.
- **B3 — Nada de colores ni medidas sueltas.** Rompen el modo oscuro y el contraste.
- **B4 — Lo de demostración se marca y no llega a producción.** El repositorio demo y la cuenta de prueba están rotulados con `DEMO` en el código y en el README.
- **B5 — Nada se sube sin confirmación.** Subir la rama, abrir el MR, fusionar y etiquetar son acciones separadas. Fusionar y etiquetar son de César.
- **B6 — Un MR de la app que depende de la biblioteca se fusiona después.** La biblioteca primero; luego el `ref` pasa a la etiqueta.
- **B7 — Nunca se escribe un token** en `pubspec.yaml`, en la URL de una dependencia ni en la configuración de git.
- **B8 — Lo no verificado se declara.** iOS no se compila en Windows; si el APK no compiló o no se vio en el emulador, se dice.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Llamo al servidor directo desde la pantalla, es más rápido» | Rompe la prueba con un repositorio falso y ata la pantalla al servidor (B2). |
| «El botón se ve mejor con este azul» | El azul sale de un token o de un rol `...Aa` (B3). |
| «La cuenta demo me sirve en producción» | Se rotula y se quita (B4). |
| «Pongo la URL con el token para que `pub get` funcione» | Nunca (B7); se pasa por variables de entorno solo para ese comando. |

## Señales de alerta

- Un `import 'package:http/...'` o un cliente de red dentro de una pantalla.
- `Colors.` o `Color(0x...)` en el código de una pantalla.
- Un `pubspec.yaml` con una URL que incluye credenciales o un `ref` a una rama que ya no existe.
- Una pantalla sin su prueba de recorrido.

## Formato de respuesta

Declarar el modo. Cerrar con: qué cambió, qué controles corrieron (cifras reales), qué se vio en el emulador, qué falta y quién lo hace.
