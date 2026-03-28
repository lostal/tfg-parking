# Filosofía de código: mmasias

Este documento recoge los principios de diseño y código del profesor Manuel Masias ([@mmasias](https://github.com/mmasias)), tutor de este TFG. Cualquier IA o desarrollador que trabaje en este proyecto debe leerlo antes de proponer cambios.

---

## La idea central

> "La mayoría de 'patrones' y 'principios' que la industria vende como 'buenas prácticas' son simplemente **sentido común con marca registrada**."

- **SOLID** = Que cada cosa haga una sola cosa
- **DRY** = No copies código
- **KISS** = No compliques lo simple
- **YAGNI** = No construyas lo que no necesitas
- **Clean Code** = Escribe código legible

Todo esto es obvio si piensas antes de programar. El problema no es no conocer los principios — es no aplicar el sentido común.

---

## Reglas prácticas

### Antes de escribir código

1. **Lee el problema** despacio. Modela la realidad antes de abrir el editor.
2. **Busca lo que ya existe**. El mejor código es el que no tienes que escribir.
3. **Pregunta**: ¿realmente necesito esto ahora? Si la respuesta no es un "sí" claro, no lo hagas (YAGNI).

### Al escribir código

**Tamaño:**

- Métodos: 10–25 líneas máximo
- Parámetros: 2–3 como mucho
- Clases/archivos: 200–500 líneas
- Complejidad ciclomática: por debajo de 10–15

**Nombrado:**

- Si un nombre necesita un comentario, el nombre no revela su intención — cámbialo
- La consistencia en el nombrado no es estética: es un mecanismo de detección de anomalías. Cuando se rompe, algo cambió
- Un buen sistema de nombrado puede documentar la arquitectura completa sin abrir un solo archivo

**Comentarios:**

- Buenos: los que aclaran _por qué_, no _qué_
- Malos: los que repiten lo que el código ya dice, los que documentan código que debería eliminarse
- Regla: "No comentes código malo, reescríbelo" — Kernighan & Plaugher

**Código muerto:**

- Bórralo sin piedad. El código muerto "se endurece rápido, hace imposible entender la arquitectura y se propaga exponencialmente"
- Si no se usa, no existe. Git guarda la historia.

### Al revisar código

Busca estos síntomas (code smells):

| Síntoma                                  | Señal                                         |
| ---------------------------------------- | --------------------------------------------- |
| Lógica duplicada                         | Viola DRY — extrae una función o módulo       |
| Clase/función que hace demasiado         | Viola SRP — divide                            |
| Parámetro que nunca se usa               | YAGNI — elimínalo                             |
| Comentario que explica código complicado | KISS — simplifica el código, no el comentario |
| Fichero importado pero no usado          | Código muerto — bórralo                       |
| Dos ficheros casi idénticos              | DRY — parametriza                             |

---

## Lo que NO hacer en este proyecto

### No sobrediseñes

Este proyecto es un TFG para una empresa mediana. No es Netflix, no es un banco, no es un sistema distribuido a escala planetaria. Dimensiona las soluciones al problema real.

Señales de sobrediseño:

- Abstracciones para casos que aún no existen
- Factories de factories de builders
- Interfaces con un solo implementor
- "Esto lo necesitaremos en el futuro" — YAGNI

### No uses patrones para parecer senior

El código que necesita un framework de explicación para justificar que es bueno, probablemente no lo es. Si alguien pregunta "¿por qué está hecho así?" y la respuesta es "porque aplica el patrón X del libro Y", algo falla.

La respuesta correcta siempre es una razón del negocio o del problema.

### No añadas lo que no te pidan

- No refactorices lo que no tocas
- No añadas manejo de errores para casos imposibles
- No pongas comentarios en código que no cambiaste
- No diseñes para requisitos hipotéticos

---

## Lo que SÍ hacer

### Composición sobre herencia

Prefiere componer comportamiento pasando configuración a funciones o clases, en lugar de crear jerarquías de herencia. La composición es flexible; la herencia es rígida.

Ejemplo concreto de este proyecto: las acciones de cesión y calendario de parking y oficinas son idénticas salvo el tipo de recurso. En lugar de duplicar o heredar, se parametrizan con una factory que recibe `resourceType`.

### Una fuente de verdad

Cada pieza de conocimiento debe tener una sola representación en el sistema. Si cambias una regla de negocio, deberías tocar un archivo, no diez.

### Falla rápido y en voz alta

Valida en los bordes del sistema (entrada del usuario, APIs externas). Una vez dentro, confía en el código. No valides lo que ya sabes que es correcto.

### El código cuenta la historia del problema

Lee el código como si fuera prosa. Si no se entiende a qué problema responde, hay algo mal — no en el lector, sino en el código.

---

## Aplicación concreta en este proyecto

Este proyecto ya aplica estos principios. Al proponer cambios:

1. **No toques lo que funciona bien**: `actionClient`, la capa de queries, las validaciones Zod, `env.ts`, `audit.ts` están calibrados correctamente.

2. **Antes de crear un archivo nuevo**, busca si hay uno que ya hace algo parecido. Este proyecto tiene `src/lib/` como repositorio de lógica compartida.

3. **Antes de duplicar lógica** entre `parking/` y `oficinas/`, comprueba si se puede parametrizar. Ambos módulos comparten el mismo modelo de datos con `resourceType` como discriminante.

4. **Al revisar código muerto**: si un archivo, función o export tiene cero importaciones en el proyecto, se borra. Sin discusión.

5. **Los errores de build y lint son bloqueantes**. `pnpm check` = typecheck + lint + format + test. Todo tiene que pasar antes de proponer un commit. El CI además corre `pnpm build`.

---

## Referencia

Los repos más relevantes de mmasias para entender esta filosofía:

- `mmasias/idsw2` — Ingeniería de Software II: diseño modular, SOLID, cohesión, acoplamiento, legibilidad
- `mmasias/mmasias` — Reflexiones personales, el manifiesto `2Think.md`, la serie "La Cojudez"

Cita que resume todo:

> "Lo que importa: pensar antes de programar. Leer el problema despacio. Modelar la realidad fielmente. Escribir código que cuente la historia. Aprender de los errores. Desarrollar el propio criterio.
>
> Lo que NO necesitas: frameworks pomposos. Jerga académica innecesaria. Patrones para problemas que no tienes."
