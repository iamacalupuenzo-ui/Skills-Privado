# Descubrimiento y plan de producto

Antes de escribir UI, convertir la necesidad en un plan breve. El plan no finge
ser investigación de usuarios validada: separar hechos aportados, decisiones
confirmadas, inferencias e hipótesis que requieren dirección.

## Plan mínimo por característica

```text
Característica: [nombre]
Usuario y contexto: [rol, momento operativo, dispositivo]
Resultado y métrica: [tarea que completa y cómo se sabrá]
Alcance / no alcance: [incluye, excluye]
Flujo principal: [inicio → decisión → acción → resultado]
Estados: [carga, vacío, datos, error, sin permisos, offline o desactualizado]
Reglas y permisos: [roles, validación, acciones irreversibles]
Notificaciones: [evento, severidad, canal, destinatario, acción, persistencia]
Accesibilidad y responsive: [teclado, lector, foco, móvil]
Riesgos y dependencias: [API, datos, mapas, autenticación, decisión pendiente]
Plan técnico: [rutas, core/layout/features, componentes públicos, pruebas]
```

## Casuísticas que no se omiten

- Inicio de sesión: credenciales inválidas, bloqueo temporal, red caída,
  recuperación, envío duplicado, sesión expirada y redirección segura.
- Datos: carga inicial, recarga, cero resultados, permisos insuficientes,
  dato obsoleto, formato largo, paginación y error recuperable.
- Acciones: progreso visible, éxito, fallo accionable, reintento seguro,
  cancelación y confirmación cuando corresponda.
- Roles: lo que se ve, lo que se puede hacer y qué ocurre si cambia el permiso
  durante el flujo.
- Notificaciones: evitar alertar por cada evento; distinguir información de
  estado, aviso accionable, alerta urgente e historial persistente.

Una pregunta solo bloquea cuando cambia reglas de negocio, audiencia,
persistencia, seguridad, fuente de datos o la definición de éxito. En los
demás casos declarar la suposición y continuar si el usuario pidió construir.
