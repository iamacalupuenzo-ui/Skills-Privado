# Reglas

## Índice

1. Reglas de bloqueo en detalle
2. Racionalizaciones comunes
3. Señales de alerta

## 1. Reglas de bloqueo en detalle

| Regla | Qué exige | Por qué |
|---|---|---|
| B1 | Informe de inicio del ciclo y sincronización comprobada al cerrar | El que diseña no se valida a sí mismo |
| B2 | `requirements` con HU y UXR existentes | Sin eso el UXR aparece «sin flujo» y la trazabilidad se corta |
| B3 | Marca en cada paso y rama | Desarrollo y QA distinguen regla, reutilizado, construido y propuesta |
| B4 | La rama pendiente apunta a su pregunta | El flujo no decide por el PO |
| B5 | `screens` declarado | `ui-spec-writer` especifica justo esas pantallas |
| B6 | FLW y SCR coinciden | La compuerta G2 lo exige; si no, hay pantallas huérfanas |
| B7 | Sin layout, componentes ni textos finales | Son de la SCR y de UX writing; en el flujo envejecen |
| B8 | Citar las ramas del flujo base | Copiarlas duplica el mantenimiento y diverge |
| B9 | IDs permanentes; lo retirado se fecha | SCR, casos de QA y UXS citan esos IDs |
| B10 | `draft` y `dsp-NNN` | La aprobación es humana; la etiqueta mete el flujo en la UXS |

## 2. Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Las excepciones las pone la pantalla» | La SCR especifica cómo se ven; cuáles existen lo decide el flujo (`ramas-y-marcas.md`, sección 4). |
| «Copio las ramas del Distribuidor, es más rápido» | Cítalas en «Reutilizadas»; dos copias se separan con el primer cambio (B8). |
| «La pregunta del PO es obvia, dejo la rama resuelta» | Márcala `[PENDIENTE: ID]` con la propuesta en el UXR (B4). |
| «Pongo el texto del botón para que se entienda» | Escribe la intención; el texto final es de UX writing (B7). |
| «Dejo `screens` vacío hasta tener las SCR» | Resérvalas ahora; la fase 3 las especifica (B5). |
| «Renumero las ramas para que queden ordenadas» | Rompe las citas de la SCR y de QA (B9). |

## 3. Señales de alerta

- Un flujo sin rama de permiso, de error al guardar o de datos vacíos, sin decir por qué no aplica.
- Un paso que nombra un componente `cs-*`, una medida o un color.
- Un `[PENDIENTE]` sin ID de pregunta.
- Un UXR del paquete que ningún flujo lista en `requirements`.
- Una SCR que declara `flow:` con este flujo y no está en `screens`.
- Un diagrama que no muestra las ramas de error.
