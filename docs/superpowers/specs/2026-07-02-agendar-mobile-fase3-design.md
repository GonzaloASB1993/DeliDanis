# Fase 3 — Agendar mobile + jerarquía CTA "Agendar" · Design Spec

> **Fecha:** 02 JUL 2026
> **Register:** brand (sitio público)
> **Restricción firme:** no se toca la integración de pago (MercadoPago); no se agrega salida a WhatsApp dentro del wizard; `/cotizar` sigue existiendo como página independiente.

Esta es la **Fase 3 del roadmap de rediseño mobile** (ver Fase 1: home, Fase 2: catálogo, ya implementadas). Cubre dos frentes relacionados: la jerarquía de llamados a la acción del sitio (Agendar vs Cotizar) y el rediseño del wizard de `/agendar`.

---

## 1. Contexto y diagnóstico

El usuario reportó que el agendamiento mobile "es un fiasco": se ve descuadrado y, más grave, **en un punto no se pueden ver los botones y no se puede seguir avanzando** — un bloqueo real de conversión, no solo estética.

Investigación del código actual (`app/(public)/agendar/page.tsx`, 916 líneas, un solo archivo con 5 pasos):

- **Bug bloqueante 1:** `components/public/ServiceCategorySelector.tsx` no tiene ningún botón de volver/cancelar. Los botones de navegación del paso "Servicios" (`Atrás`/`Continuar`) solo se renderizan cuando `!showServiceForm && !showServiceSelector`. Al tocar "Agregar servicio" (o "Agregar otro servicio"), `showServiceSelector` pasa a `true`, los botones de navegación desaparecen, y el selector de categoría no ofrece ninguna salida hasta elegir Torta/Coctelería/Pastelería. Es un callejón sin salida real.
- **Bug bloqueante 2:** la barra fija del carrito en mobile (`components/public/ServiceCart.tsx`, "Ver Pedido", `fixed bottom-0`) no reserva espacio en el documento. La página no agrega padding inferior compensatorio, por lo que esa barra puede solaparse con el botón "Continuar" del paso activo.
- **Diagnóstico visual:** el wizard además usa emojis en el indicador de pasos (🎊🛍️📋📞💳) y en `EventTypeSelector.tsx` (💍👑🎈🕊️⛪👶💼💝) — inconsistente con el resto del sitio, ya migrado a SVG. En desktop, los componentes (padding, tamaños de texto, tarjetas de 5-6rem) son más grandes de lo necesario, forzando scroll para ver contenido que podría caber en el viewport.
- **Jerarquía de conversión invertida:** hoy el sitio invita más a "Cotizar" (formulario ligero sin pago, `/cotizar`) que a "Agendar" (el flujo real de reserva con pago, `/agendar`), en navbar, hero y barra de acción mobile — pese a que Agendar es la conversión que el negocio realmente quiere.

## 2. Objetivo

1. Que "Agendar" sea la llamada a la acción principal en todo el sitio público (navbar, hero, barra de acción mobile), relegando "Cotizar" a un canal secundario que sigue existiendo pero no compite por protagonismo.
2. Que el wizard de agendamiento se pueda completar en mobile sin bloqueos, con menos pasos, menos densidad visual, y sin indicador de progreso pesado.

## 3. Alcance

**Dentro:**
- Copy y destino de los CTA en `components/layout/Navbar.tsx`, `components/public/Hero.tsx`, `components/public/MobileActionBar.tsx`.
- Corrección de los dos bugs bloqueantes.
- Consolidación del wizard de 5 a 3 pasos.
- Eliminación del indicador de progreso visual (barra + iconos), reemplazado por un texto mínimo "Paso X de 3".
- Conversión del selector de tipo de evento de grid de tarjetas a dropdown, dentro del paso "Detalles".
- Reducción de tamaños/espaciados en todo el wizard (mobile y desktop) para menos scroll.
- Limpieza de emojis en los componentes tocados.

**Fuera:**
- Integración de pago (MercadoPago): sin cambios en la lógica, solo en el layout donde vive dentro del paso combinado.
- Salida a WhatsApp dentro del wizard: no se agrega.
- La página `/cotizar`: sin cambios, sigue existiendo tal cual.
- Validaciones de formulario existentes (email, teléfono, nombre, dirección, ciudad): se conservan tal cual, solo cambia dónde se renderizan.

**No-goals:** no se rediseña `BookingCalendar.tsx`, `TortaServiceForm.tsx`, `CocktailServiceForm.tsx` ni `PastryServiceForm.tsx` en profundidad — solo se ajustan tamaños/espaciados si el contenido lo requiere para caber sin scroll excesivo; su lógica de negocio no cambia.

## 4. Jerarquía CTA — Agendar como principal

| Componente | Antes | Después |
|---|---|---|
| `Navbar.tsx` (línea ~189-192) | Botón "Cotiza gratis" → `/cotizar` | Botón **"Agenda ahora"** → `/agendar` |
| `Hero.tsx` (línea ~266-271) | CTA primario "Cotiza tu torta" → `/cotizar`; secundario "Ver catálogo" | CTA primario **"Agenda tu torta"** → `/agendar`; secundario "Ver catálogo" sin cambios. Se elimina el botón de cotizar del hero. |
| `MobileActionBar.tsx` (línea ~41-44) | Botón primario "Cotiza tu torta" → `/cotizar` | Botón primario **"Agenda tu torta"** → `/agendar` |

El mensaje de WhatsApp prellenado en `MobileActionBar.tsx` (`waMessage`) se ajusta para reflejar la intención de agendar en vez de cotizar donde aplique (ruta `/`), manteniendo el resto de la lógica por-ruta intacta.

## 5. Wizard de agendamiento — estructura de 3 pasos

| Paso | Contenido |
|---|---|
| **1. Servicios** | Igual que hoy: selector de categoría → formulario del servicio → carrito. Se corrige el bug de navegación (ver §6). |
| **2. Detalles** | Tipo de evento (nuevo: `<Select>` dropdown, usando el array `eventTypes` ya existente en `EventTypeSelector.tsx`, reutilizado en vez de duplicado) + Fecha (`BookingCalendar`) + Horario (AM/PM) + Tipo de entrega (Recoger/Delivery). |
| **3. Contacto + Pago** | Un solo paso: los campos de contacto (nombre, apellido, email, teléfono, y dirección/ciudad si `deliveryType === 'delivery'`) arriba; al validar esos campos (mismo `validateContactForm` existente), la sección de pago (señales de confianza, resumen, opciones de depósito/total) aparece debajo, en la misma pantalla — sin navegar a otra vista. |

**Renumeración de `currentStep`:** el store `useBookingStoreMulti` pasa de manejar 5 valores (1-5) a 3 (1-3). El paso 3 unifica lo que hoy son los pasos 4 y 5.

## 6. Corrección de bugs bloqueantes

- **`ServiceCategorySelector.tsx`:** agregar un botón "Atrás" (o ícono X) visible que invoque un callback `onCancel` nuevo, devolviendo `showServiceSelector` a `false` sin seleccionar categoría. Se pasa el callback desde `page.tsx`.
- **Barra fija del carrito mobile (`ServiceCart.tsx`):** el contenido de la página debe reservar `padding-bottom` igual a la altura real de esa barra cuando `hasServices` es `true`, para que el botón "Continuar" del paso activo nunca quede tapado. Alternativa equivalente: los botones de navegación de cada paso pasan a ser ellos mismos parte de una franja inferior fija por encima del carrito (mismo principio de capas usado en la home con `MobileActionBar`), eligiendo la opción más simple durante la implementación.

## 7. Indicador de progreso

Se elimina la barra visual con iconos y porcentaje (líneas ~344-383 de `page.tsx`). Queda un texto mínimo: `Paso {currentStep} de 3`, sin barra de progreso ni casillas, consistente con el pedido explícito del usuario de restar protagonismo a este elemento.

## 8. Densidad visual — mobile y desktop

- Reducir paddings de `<Card>` (`p-6 md:p-8` → evaluar `p-5 md:p-6`), tamaños de `<h2>` de paso (`text-3xl` → `text-2xl` o `text-xl` según paso), y espaciados verticales (`space-y-6` → `space-y-4` donde el contenido lo permita).
- Meta en desktop: cada paso debe caber en el viewport típico (~800-900px de alto) sin scroll, dentro de lo razonable según cuánto contenido tenga (el paso 3 combinado, con contacto+pago, es el más denso y puede requerir scroll parcial — se prioriza que no haya scroll *innecesario* por espaciados excesivos, no se garantiza cero scroll a toda costa).
- `EventTypeSelector.tsx` deja de usarse como grid de tarjetas en el wizard (se reemplaza por `<Select>` en el paso Detalles); el archivo se mantiene si se usa en otro lado, o se adapta según lo que encuentre la implementación.
- Limpieza de emojis: iconos del indicador de progreso (ya eliminado) y del `eventTypes` array (💍👑🎈🕊️⛪👶💼💝) — al pasar a `<Select>`, los emojis en las opciones de texto se eliminan (un `<option>` de HTML no soporta iconos SVG; se usa solo el nombre).

## 9. Accesibilidad y estados

- Targets táctiles ≥44px en todos los botones nuevos/modificados.
- El nuevo botón "Atrás" del selector de categoría necesita `aria-label` claro.
- Mantener `prefers-reduced-motion` donde ya existan transiciones.
- Estados de error de validación (email, teléfono, etc.) se conservan exactamente igual, solo cambia su ubicación dentro del paso combinado.

## 10. Mapa de archivos

| Archivo | Cambio |
|---|---|
| `components/layout/Navbar.tsx` | CTA "Cotiza gratis" → "Agenda ahora", `/agendar` |
| `components/public/Hero.tsx` | CTA primario → "Agenda tu torta", `/agendar`; quitar botón cotizar |
| `components/public/MobileActionBar.tsx` | CTA primario → "Agenda tu torta", `/agendar`; ajuste de copy WhatsApp en ruta `/` |
| `app/(public)/agendar/page.tsx` | Renumeración de pasos (5→3), fusión de Contacto+Pago, eliminación de indicador visual, integración de dropdown de tipo de evento en paso Detalles, reducción de tamaños/espaciados, fix de padding para la barra del carrito |
| `components/public/ServiceCategorySelector.tsx` | Agregar botón "Atrás"/cancelar + prop `onCancel` |
| `components/public/EventTypeSelector.tsx` | El array `eventTypes` se reutiliza para poblar un `<Select>`; el componente de grid deja de usarse en el wizard |
| `stores/bookingStoreMulti` (o donde viva) | Ajustar rango válido de `currentStep` de 1-5 a 1-3 |

*(El desglose exacto por pasos lo produce el plan de implementación.)*

## 11. Verificación (al implementar)

- `npm run build` sin errores.
- Flujo completo en mobile (375-430px): Servicios → agregar servicio sin quedar atascado en el selector de categoría → Detalles con dropdown de evento → Contacto+Pago en una sola pantalla → pago real de MercadoPago sin tocar su lógica.
- Confirmar que la barra fija del carrito nunca tapa el botón "Continuar" en ningún paso.
- Confirmar navbar/hero/barra de acción apuntan a `/agendar` con el copy nuevo, en mobile y desktop.
- Captura de cada paso en desktop (~1280px) verificando reducción de scroll.
