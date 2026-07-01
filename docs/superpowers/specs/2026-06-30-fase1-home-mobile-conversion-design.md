# Fase 1 — Home mobile-first + conversión · Design Spec

> **Fecha:** 30 JUN 2026
> **Register:** brand (sitio público — el diseño ES el producto)
> **Skill de diseño:** impeccable (dirección aprobada por el usuario)
> **Restricción firme:** se preserva la identidad — **misma paleta y mismas tipografías** actuales. Se mejora composición, jerarquía, legibilidad y conversión, no el color ni las fuentes.

Esta es la **Fase 1 de un rediseño mobile por fases** (ver "Roadmap" al final). Cada fase es su propio ciclo diseño → plan → implementación.

---

## 1. Contexto y diagnóstico

DeliDanis (pastelería artesanal premium en Santiago) lleva meses en línea **sin generar ventas por la web**. El diagnóstico, hecho observando el sitio real en viewport mobile (375–430px):

- **Tráfico 100% mobile y "tibio":** casi no hay tráfico orgánico; la gente entra porque alguien comparte el link en grupos de WhatsApp. Ya tienen intención, y aun así se van sin pedir. → El problema no es SEO (fase aparte), es que **la experiencia mobile no lleva a la acción**.
- **Hero ilegible (crítico):** `components/public/Hero.tsx` centra el contenido verticalmente sobre la parte más recargada de la foto, con un degradado **lateral** (`from-dark/40 … to-transparent`) débil. El titular y la propuesta de valor casi no se leen. En 2 segundos el visitante no entiende qué se ofrece.
- **El hero "no encaja" (alto):** los stats de confianza quedan abajo y **chocan con el botón flotante de WhatsApp**; hay aire mal repartido.
- **Convertir cuesta demasiado (crítico, se aborda en Fase 3):** `/agendar` es un wizard de 5 pasos que termina en pago. No hay atajo liviano ni salida contextual a WhatsApp.
- **WhatsApp:** ya hay prefill por ruta en `components/public/WhatsAppButton.tsx` (bien), pero es un botón flotante solitario que en mobile compite con el contenido.
- **Inconsistencia visual (medio):** emojis mezclados con estética premium; copy con acentos rotos ("Pasteleria", "cumpleanos", "disenos").
- **No hay overflow horizontal** en la home (`scrollWidth == innerWidth`); los "descuadres" percibidos son de legibilidad, aire y elementos cortados, no scroll lateral.

## 2. Objetivo

Que un visitante mobile entienda la propuesta y confíe **en 2 segundos**, y tenga el siguiente paso —**cotizar en la web o escribir por WhatsApp**— siempre visible y sin fricción. Éxito = pedidos y contactos de WhatsApp originados desde la home.

## 3. Alcance

**Dentro:** toda la página de inicio en mobile (hero, destacados, servicios, testimonios, CTA final), más las **primitivas de conversión compartidas** (barra de acción fija, WhatsApp contextual) y los **fundamentos mobile** que reutilizarán las fases siguientes.

**Fuera (otras fases):**
- Catálogo, tarjeta de producto y modal de detalle → **Fase 2**.
- Rediseño del wizard de agendar/cotizar → **Fase 3**.
- Resto de páginas (nosotros, contacto, galería, testimonios, seguimiento) → **Fase 4**.
- SEO / tráfico orgánico → fuera del roadmap de responsive.

**No-goals:** no se cambia la paleta ni las tipografías; no se rehace el desktop (solo se verifica que no rompa); no se toca lógica de negocio/datos.

## 4. Dirección visual (aprobada)

- **Estrategia de color:** *Restrained* sobre la paleta actual — terracota `#D4847C` (`primary`), dorado `#B8860B` (`accent`), crema `#F7F3EF` (`secondary`), carbón `#3D3D3D` (`dark`). Sin dark mode.
- **Hero — dirección A ("foto protagonista"):** foto full-bleed con **scrim vertical calibrado** (contraste AA garantizado), contenido **anclado en el tercio inferior** (alcance del pulgar).
- **Acento cálido y personal:** integrar la frase **"para tu celebración"** en **Cormorant Garamond itálica** (la fuente `accent` que ya existe en el sistema — sin sumar tipografías). Es el único elemento rescatado de la exploración libre; aporta el "hay una persona real detrás" sin romper identidad.
- **Escena que fija las decisiones:** una persona con el celular en un grupo de WhatsApp, decidiendo en 30 segundos si le confía la torta de su matrimonio a un negocio artesanal → alto contraste, calidez humana, foto apetitosa.

## 5. Layout y jerarquía

### 5.1 Hero (`components/public/Hero.tsx`)
- Mantener `h-[100svh]` con `min-h`; usar unidades `svh/dvh` para que **encaje sin cortes** con la barra del navegador mobile. Reservar espacio inferior para la barra de acción fija (que no se solape con stats).
- **Reemplazar el overlay lateral** por un **scrim vertical** de abajo hacia arriba, más fuerte en la zona del texto, calibrado para AA (cuerpo ≥4.5:1, titular ≥3:1) manteniendo la torta visible arriba.
- **Anclar el contenido abajo** (no `justify-center`): eyebrow → H1 → subtítulo corto → acento *"para tu celebración"* (Cormorant itálica) → CTA primario "Cotiza tu torta" → CTA secundario "Ver catálogo" → franja de confianza compacta (150+ eventos · 5,0 · 3 años) que ya no choca con nada.
- **Copy:** titular propuesto **"Tortas hechas a mano *para tu celebración*"** (ajustable); subtítulo corto en voz chilena/neutra, primera persona donde calce. Corregir acentos rotos ("Pastelería", "cumpleaños", "diseños"). Sin emojis, sin em-dash.
- **Motion:** conservar la coreografía GSAP de entrada (reveal de imagen, máscara de títulos, stagger de stats) adaptada al nuevo anclaje; mantener la rama `prefers-reduced-motion` ya existente. La reveal debe realzar contenido ya visible por defecto, no ocultarlo.

### 5.2 Fundamentos mobile compartidos
- **Contenedor mobile** con **padding horizontal simétrico y centrado** (base para eliminar la sensación de "descentrado" en todas las secciones; el arreglo de las tarjetas del catálogo con padding asimétrico 16/0 es Fase 2, pero la primitiva se define aquí).
- **`safe-area-inset`** para elementos fijos (barra de acción, WhatsApp) — respeta notch y barra inferior.
- **Targets táctiles ≥44px**; uso a una mano.
- **Limpieza de emojis** en los componentes visibles de la home (aprovechar el trabajo pendiente de la auditoría fase 1, acotado a lo que renderiza la home).

### 5.3 Secciones (destacados / servicios / testimonios / CTA)
- Ritmo de espaciado consistente (usar las utilidades `section-padding` de `app/globals.css`), tipografía legible, imágenes protagonistas. Verificar que ninguna sección corte contenido ni descentre en 320–430px.

## 6. Barra de acción fija (nueva primitiva)
- En **mobile**, barra inferior fija con **Cotizar** (`primary`, → `/cotizar`) + **WhatsApp** (verde `#25D366`), respetando `safe-area-inset-bottom`.
- **Reemplaza el botón flotante solitario de WhatsApp en mobile** (no ambos, para no duplicar la salida). En **desktop** se mantiene el flotante actual (`components/public/WhatsAppButton.tsx`).
- Aparece tras pasar el hero (para no tapar el CTA del hero); transición suave con alternativa para `prefers-reduced-motion`.
- z-index dentro de una escala semántica (por debajo de modales/menú móvil).

## 7. WhatsApp con contexto
- Reutilizar `getWhatsAppMessage(pathname)` ya existente. En la home, mensaje cálido: *"Hola DeliDanis, vengo de la web y quiero cotizar una torta para mi evento."*
- El prefill **por producto** (torta específica que miraba) es **Fase 2**.

## 8. Estados clave
- **Carga de imágenes:** blur-up / placeholder sin salto de layout (CLS ≈ 0). La imagen del hero es `priority`.
- **`prefers-reduced-motion`:** alternativa (crossfade/instantáneo) en hero y barra.
- **Imagen rota:** fallback con color de marca, nunca bloque vacío roto.
- **320px y 430px:** sin overflow, sin texto cortado, sin solapes.
- **Teclado abierto / barra fija:** la barra no debe tapar campos (relevante al enlazar a cotizar).

## 9. Accesibilidad
- Contraste WCAG AA: cuerpo ≥4.5:1, texto grande ≥3:1 — **verificado sobre el scrim del hero** (el punto que hoy falla).
- Foco visible (ya hay `:focus-visible` global), labels verbo+objeto, `aria-label` en la barra y WhatsApp.
- Respetar `prefers-reduced-motion` en toda animación nueva.

## 10. Mapa de impacto (archivos)
| Archivo | Cambio |
|---|---|
| `components/public/Hero.tsx` | Scrim vertical AA, contenido anclado abajo, acento "para tu celebración" (Cormorant itálica), copy/acentos, reserva de espacio para barra fija |
| `components/public/WhatsAppButton.tsx` | Flotante → **solo desktop**; mensaje home |
| **Nuevo** `components/public/MobileActionBar.tsx` (nombre tentativo) | Barra fija Cotizar + WhatsApp, safe-area, aparición tras hero |
| `app/(public)/page.tsx` | Montar la barra de acción fija |
| `app/globals.css` / contenedor | Primitiva de contenedor mobile centrado + `safe-area` |
| `components/public/FeaturedProducts.tsx`, `ServicesSection.tsx`, `TestimonialsCarousel.tsx`, `CTASection.tsx` | Verificación/ajuste de aire, legibilidad y limpieza de emojis en mobile |

*(El desglose exacto por pasos lo produce el plan de implementación — writing-plans.)*

## 11. Referencias impeccable para implementación
`layout.md` (ritmo/jerarquía) · `animate.md` (coreografía hero + barra con reduced-motion) · `adapt.md` (breakpoints/safe-area) · `clarify.md` (copy/labels).

## 12. Verificación (al implementar)
- `npm run build` sin errores de TypeScript.
- Screenshot mobile (375 y 430px): hero legible, propuesta clara, stats sin solaparse, barra fija visible tras scroll.
- Contraste medido del texto del hero ≥ AA.
- `scrollWidth == innerWidth` en toda la home; sin texto cortado en 320px.
- Desktop sin regresiones visibles.

## 13. Roadmap (fases siguientes, fuera de este spec)
- **Fase 2 — Catálogo + detalle:** tarjetas descentradas (padding 16/0), card mobile, modal de detalle con descripción completa (hoja deslizable), WhatsApp por producto.
- **Fase 3 — Flujo de pedido:** repensar el wizard de 5 pasos para mobile, cotización rápida, WhatsApp como salida fácil.
- **Fase 4 — Resto de páginas públicas:** pulido y consistencia.
