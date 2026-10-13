#!/usr/bin/env node
// Fallback de references/clarity-check.md: corre el mismo chequeo de claridad
// contra jev, pero via Vercel AI Gateway (AI_GATEWAY_API_KEY) en vez de la API
// directa de TypeSafe. Se usa solo cuando la API directa falla o TYPESAFE_API_KEY
// no está seteada.
//
// Uso: node vercel-clarity-fallback.mjs '<problema>' '<correccion>'
// Salida: JSON por stdout con { score, probabilities } o { error }.

import { experimental_evaluate as evaluate } from 'ai';

const [problema, correccion] = process.argv.slice(2);

if (!problema || !correccion) {
  console.log(JSON.stringify({ error: 'faltan argumentos: problema, correccion' }));
  process.exit(1);
}

if (!process.env.AI_GATEWAY_API_KEY) {
  console.log(JSON.stringify({ error: 'AI_GATEWAY_API_KEY no está seteada' }));
  process.exit(1);
}

try {
  const result = await evaluate({
    model: 'typesafe-ai/jev',
    state: { problema, correccion },
    questions: {
      claridad: {
        type: 'score',
        instructions:
          '¿Qué tan claro y accionable es `problema` + `correccion` para que un desarrollador lo resuelva sin pedir más contexto?',
        criteria: [
          'No queda claro qué está mal ni qué se espera.',
          'Se entiende el problema pero falta referencia (componente, valor esperado).',
          'Se entiende el problema y hay alguna referencia, pero falta severidad o impacto.',
          'Problema, referencia e impacto claros; falta prioridad explícita.',
          'Problema, referencia, valor esperado, impacto y prioridad, todo explícito y verificable.',
        ],
      },
    },
  });
  console.log(JSON.stringify(result.claridad ?? result));
} catch (err) {
  console.log(JSON.stringify({ error: String(err?.message ?? err) }));
  process.exit(1);
}
