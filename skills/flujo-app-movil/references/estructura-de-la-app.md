# Estructura de la app y patrones de acceso

Estado de la base al 2026-10-29 (MR !1 de `flotas-movil`). Releer el repositorio antes de afirmarlo.

## Carpetas

```
lib/
  main.dart                      punto de entrada; aquí se inyecta el repositorio
  app.dart                       tema, navegación raíz y sesión
  core/auth/                     contrato AuthRepository y su implementación demo
  features/auth/                 arranque, bienvenida, login, validaciones
  features/home/                 pantalla autenticada provisional
test/                            recorrido de acceso y validaciones
```

`core/` guarda lo que comparte toda la app (sesión, red, contratos). Cada pantalla de producto vive en
`features/<tema>/`. Las pantallas dependen de contratos, no de un servidor concreto.

## El contrato de autenticación

`AuthRepository` expone `signIn({email, password})`. Lanza `InvalidCredentialsException` si las credenciales
no son correctas y cualquier otra excepción si no se pudo completar (red o servidor). La pantalla muestra:

- un mensaje **genérico** para credenciales inválidas («El correo o la contraseña no son correctos»), para no revelar cuál de los dos falló;
- otro, distinto, para fallos de red o de servidor, porque la persona sí puede reintentar.

La implementación de hoy, `DemoAuthRepository`, acepta una cuenta fija y simula la espera: es de demostración
y se reemplaza por el cliente del BFF (`flotas-movil-bff`).

## Recorrido de acceso

Arranque (`CsSplash`) → bienvenida (`CsWelcomeTemplate` con `CsFleetIllustration`) → inicio de sesión
(`CsAuthTemplate`). La bienvenida reemplaza al arranque; el login se abre encima y se vuelve con la flecha o el
gesto atrás. Al iniciar sesión se cierran las pantallas del acceso y la raíz pasa a la app autenticada.

- Validación al enviar, antes de llamar al servidor: correo válido y contraseña no vacía (`LoginValidators`).
- Un solo botón principal («Ingresar») con estado de envío; enlaces para lo demás.
- El `AppBar` de la pantalla de login impone su propio estilo de barra de estado: se fija según el tema para que
  la hora y los íconos se lean en claro y oscuro.
- El logo va a la izquierda en las pantallas de acceso; solo el arranque lo centra.

## Qué es de demostración (reemplazar)

- `DemoAuthRepository` y la línea «Demostración: …» de la pantalla de login.
- `HomeScreen`: la pantalla provisional «Sesión iniciada».
- La sesión en `app.dart`: un booleano en memoria; falta persistirla (almacenamiento seguro, renovación del token).
- Los botones «Soporte técnico» y «¿Olvidaste tu contraseña?», que no hacen nada.

## Identidad de la app

- Android: `applicationId` y `namespace` `pe.com.comsatel.flotas_movil`; nombre visible «C-Flotas».
- iOS: carpeta `ios/` generada, nombre visible «C-Flotas»; no se ha compilado ni probado.
- Pendientes: ícono de la app y arranque nativo (hoy se ve el logo de Flutter unos instantes antes de la app).
- La app se crea con `flutter create --org pe.com.comsatel --project-name flotas_movil --platforms android,ios .`.
