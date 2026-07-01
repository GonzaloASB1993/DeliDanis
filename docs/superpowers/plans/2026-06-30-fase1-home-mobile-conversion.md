# Fase 1 — Home mobile-first + conversión · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer la home de DeliDanis mobile-first para que el visitante entienda la propuesta y confíe en 2 segundos, con "Cotizar" y "WhatsApp" siempre a mano.

**Architecture:** Ediciones quirúrgicas sobre componentes existentes (`Hero`, `WhatsAppButton`, secciones de la home) + un componente nuevo `MobileActionBar`. Se preservan paleta y tipografías; se mejora scrim, anclaje, contraste, copy y las primitivas de conversión. Verificación por build + screenshots/medición en viewport mobile (no hay suite de tests unitarios de UI; la verificación es visual y de contraste, ejecutada con las herramientas de preview).

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, GSAP.

**Spec de referencia:** `docs/superpowers/specs/2026-06-30-fase1-home-mobile-conversion-design.md`

**Restricción firme:** NO cambiar paleta (`primary #D4847C`, `accent #B8860B`, `secondary #F7F3EF`, `dark #3D3D3D`) ni tipografías (`font-display` Playfair, `font-accent` Cormorant, `font-body` Inter). El acento "para tu celebración" usa `font-accent` en itálica (ya existe).

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `app/globals.css` | Utilidad `.pb-safe` (safe-area) reutilizable por elementos fijos |
| `components/public/Hero.tsx` | Scrim vertical AA, contenido anclado abajo, acento "para tu celebración", copy corregido, espacio para la barra fija |
| `components/public/MobileActionBar.tsx` | **Nuevo.** Barra fija mobile: Cotizar + WhatsApp, safe-area, aparece tras el hero, reduced-motion |
| `components/public/WhatsAppButton.tsx` | Flotante pasa a **solo desktop** |
| `app/(public)/page.tsx` | Montar `<MobileActionBar />` |
| `components/public/ServicesSection.tsx`, `CTASection.tsx` | Sentence-case CTAs + verificación de aire mobile (limpieza acotada a lo visible en la home) |

---

## Preparación

- [ ] **Step 0: Servidor de desarrollo corriendo en viewport mobile**

Usa la herramienta de preview (no Bash) para levantar "Next.js Dev" y fijar viewport mobile (375×812). Deja el `serverId` a mano para todas las verificaciones.
Expected: la home carga en `http://localhost:3000/`.

---

### Task 1: Utilidad safe-area compartida

**Files:**
- Modify: `app/globals.css` (dentro de `@layer utilities`)

- [ ] **Step 1: Agregar la utilidad `.pb-safe`**

En `app/globals.css`, dentro del bloque `@layer utilities { … }` (después de `.glass-dark`), agregar:

```css
  /* Safe-area inferior para elementos fijos (barra de acción, botones) */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
```

- [ ] **Step 2: Verificar que compila**

Run (Bash): `npm run build`
Expected: build sin errores de CSS/TypeScript.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(mobile): add safe-area utility for fixed elements"
```

---

### Task 2: `MobileActionBar` — barra fija Cotizar + WhatsApp

**Files:**
- Create: `components/public/MobileActionBar.tsx`

- [ ] **Step 1: Crear el componente**

Crear `components/public/MobileActionBar.tsx` con este contenido exacto:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const WA_PHONE = '56939282764' // +56 9 3928 2764

function waMessage(pathname: string): string {
  if (pathname === '/') {
    return 'Hola DeliDanis, vengo de la web y quiero cotizar una torta para mi evento'
  }
  if (pathname === '/catalogo') {
    return 'Hola DeliDanis, estoy viendo el catálogo y quiero cotizar'
  }
  return 'Hola DeliDanis, quiero cotizar un pedido'
}

export function MobileActionBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  // Aparece tras pasar ~60% del hero, para no tapar el CTA del hero.
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const waHref = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waMessage(pathname))}`

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="pb-safe flex gap-2 border-t border-border bg-white/95 px-3 pt-2 pb-2 backdrop-blur-md shadow-[0_-4px_20px_rgba(61,61,61,0.08)]">
        <Link
          href="/cotizar"
          className="flex flex-1 items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Cotiza tu torta
        </Link>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila**

Run (Bash): `npm run build`
Expected: build sin errores; sin warnings de tipos.

- [ ] **Step 3: Commit**

```bash
git add components/public/MobileActionBar.tsx
git commit -m "feat(mobile): add fixed action bar (Cotizar + WhatsApp)"
```

---

### Task 3: WhatsApp flotante → solo desktop

**Files:**
- Modify: `components/public/WhatsAppButton.tsx:31-34`

- [ ] **Step 1: Ocultar el flotante en mobile**

En el `className` del `<button>` (línea ~33), agregar `hidden lg:block` al inicio. Debe quedar:

```tsx
      className="hidden lg:block fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
```

Razón: en mobile la salida a WhatsApp vive en `MobileActionBar`; el flotante solo en desktop evita duplicar la acción.

- [ ] **Step 2: Verificar en preview (mobile y desktop)**

Con la herramienta de preview en 375px, recargar `/`: el botón verde redondo flotante NO debe aparecer.
Cambiar viewport a 1280px y recargar: el flotante SÍ aparece abajo a la derecha.

- [ ] **Step 3: Commit**

```bash
git add components/public/WhatsAppButton.tsx
git commit -m "feat(mobile): hide floating WhatsApp on mobile (action bar covers it)"
```

---

### Task 4: Montar la barra de acción en la home

**Files:**
- Modify: `app/(public)/page.tsx:1-49`

- [ ] **Step 1: Importar y montar `MobileActionBar`**

En `app/(public)/page.tsx`, agregar el import junto a los demás de `@/components/public`:

```tsx
import { MobileActionBar } from '@/components/public/MobileActionBar'
```

Y dentro del `<main className="overflow-x-hidden">`, después de `<WhatsAppButton />`, agregar:

```tsx
      {/* Barra de acción fija mobile - Cotizar + WhatsApp siempre a mano */}
      <MobileActionBar />
```

- [ ] **Step 2: Verificar aparición tras scroll (preview, 375px)**

Recargar `/`. Al inicio (sobre el hero) la barra está oculta. Tras hacer scroll ~60% de la altura de pantalla, la barra sube desde abajo con "Cotiza tu torta" + "WhatsApp".
Run (preview_eval): `window.scrollTo(0, window.innerHeight); document.querySelector('.pb-safe') ? 'bar-present' : 'missing'`
Expected: `bar-present` y visible en el screenshot.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat(mobile): mount fixed action bar on home"
```

---

### Task 5: Rehacer el hero — scrim AA, anclaje abajo, acento y copy

**Files:**
- Modify: `components/public/Hero.tsx`

- [ ] **Step 1: Reemplazar el overlay lateral por un scrim vertical**

En `components/public/Hero.tsx`, reemplazar el contenido del div `ref={overlayRef}` (líneas ~182-190):

```tsx
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10"
      >
        {/* Left side: gradient for text readability — lighter so cake stays visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/40 via-dark/15 to-transparent" />
        {/* Bottom: subtle gradient for stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/30 via-transparent to-transparent" />
      </div>
```

por:

```tsx
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10"
      >
        {/* Scrim vertical: fuerte abajo (zona de texto), transparente arriba (la torta se ve) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        {/* Toque superior para legibilidad del navbar/badge */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
      </div>
```

- [ ] **Step 2: Anclar el contenido abajo y reservar espacio para la barra fija**

Reemplazar (línea ~193):

```tsx
      <div className="relative z-20 h-full flex flex-col justify-center">
```

por:

```tsx
      <div className="relative z-20 h-full flex flex-col justify-end pb-24 sm:pb-16 lg:justify-center lg:pb-0">
```

Razón: en mobile el contenido se ancla al tercio inferior (alcance del pulgar) con espacio para la barra; en `lg` vuelve a centrarse como en desktop.

- [ ] **Step 3: Corregir copy/acentos del badge**

Reemplazar (línea ~202):

```tsx
                <span className="text-white/90 font-medium">Pasteleria artesanal en Santiago</span>
```

por:

```tsx
                <span className="text-white/90 font-medium">Pastelería artesanal en Santiago</span>
```

- [ ] **Step 4: Nuevo titular + acento "para tu celebración"**

Reemplazar el `<h1>` completo (líneas ~206-218):

```tsx
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform">
                    Tortas para tu
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform">
                    <span className="text-primary-light">evento</span>{' '}
                    en Santiago
                  </span>
                </span>
              </h1>
```

por:

```tsx
              <h1 className="font-display text-[2.5rem] leading-[1.04] sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 tracking-tight">
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform">
                    Tortas hechas a mano
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform font-accent italic font-medium text-primary-light">
                    para tu celebración
                  </span>
                </span>
              </h1>
```

- [ ] **Step 5: Subtítulo más corto y legible + acentos**

Reemplazar el `<p data-hero-subtitle>` (líneas ~221-228):

```tsx
              <p
                data-hero-subtitle
                className="text-lg lg:text-xl text-white/80 mb-8 max-w-lg leading-relaxed"
              >
                DeliDanis hace tortas a pedido para{' '}
                <span className="text-white font-medium">matrimonios, cumpleanos y eventos</span>.{' '}
                Cotiza sin compromiso y elige entre nuestros sabores y disenos.
              </p>
```

por:

```tsx
              <p
                data-hero-subtitle
                className="text-base sm:text-lg lg:text-xl text-white/85 mb-7 max-w-md leading-relaxed"
              >
                A pedido para{' '}
                <span className="text-white font-medium">matrimonios, cumpleaños y quinceañeros</span>.
                Te ayudo a elegir sabor y diseño sin compromiso.
              </p>
```

- [ ] **Step 6: Sentence-case del segundo CTA**

Reemplazar (línea ~258): `Ver catalogo` por `Ver catálogo`.

- [ ] **Step 7: Verificar contraste AA del texto del hero (preview, 375px)**

Recargar `/`. Run (preview_eval) para medir el fondo bajo el subtítulo:

```js
(() => {
  const el = document.querySelector('[data-hero-subtitle]')
  const r = el.getBoundingClientRect()
  return JSON.stringify({ top: Math.round(r.top), color: getComputedStyle(el).color })
})()
```

Verificación visual: el titular, "para tu celebración" (en dorado/rosa itálica) y el subtítulo se leen con claridad sobre la foto. Si algún texto queda flojo, subir el scrim inferior de `from-black/85` a `from-black/90`. Objetivo: cuerpo ≥4.5:1, titular ≥3:1.

- [ ] **Step 8: Verificar que el hero "encaja" y los stats no chocan**

Screenshot en 375×812 y en 320px de ancho: el hero ocupa la pantalla sin cortes; los stats (150+, 5,0, 3 años) se ven completos y NO se solapan con nada. Al hacer scroll aparece la barra fija sin tapar los stats del hero.

- [ ] **Step 9: Verificar reduced-motion**

Run (preview_eval): `matchMedia('(prefers-reduced-motion: reduce)').matches` — si tu entorno lo permite, emula reduced-motion y recarga: el contenido del hero debe verse completo y estático (sin quedar oculto). La rama `prefersReducedMotion` ya existente en `Hero.tsx` cubre esto; confirmar que el nuevo `<h1>`/acento quedan visibles.

- [ ] **Step 10: Commit**

```bash
git add components/public/Hero.tsx
git commit -m "feat(mobile): legible hero — vertical scrim, bottom-anchored content, warm accent, copy fixes"
```

---

### Task 6: Limpieza acotada de CTAs en secciones de la home

**Files:**
- Modify: `components/public/ServicesSection.tsx`
- Modify: `components/public/CTASection.tsx`

- [ ] **Step 1: Sentence-case de CTAs de servicios**

En `components/public/ServicesSection.tsx`, en el array `services`, reemplazar:
- `ctaText: 'Ver Catálogo',` → `ctaText: 'Ver catálogo',`
- `ctaText: 'Ver Cócteles',` → `ctaText: 'Ver cócteles',`
- `ctaText: 'Ver Pastelería',` → `ctaText: 'Ver pastelería',`

(Si algún texto no existe literalmente, buscar `ctaText:` en el archivo y aplicar sentence-case a cada valor.)

- [ ] **Step 2: Sentence-case de CTAs del cierre**

En `components/public/CTASection.tsx`, buscar y reemplazar:
- `Reservar mi Fecha` → `Reservar mi fecha`
- `Solicitar Cotización` → `Solicitar cotización`

(Aplicar solo a los que existan; buscar con `grep -n` antes.)

- [ ] **Step 3: Verificar aire y legibilidad de las secciones (preview, 375px)**

Hacer scroll por toda la home en 375px y 320px: destacados, servicios, testimonios y cierre deben verse centrados, sin texto cortado ni overflow, con las CTAs en sentence-case.
Run (preview_eval): `document.documentElement.scrollWidth === window.innerWidth ? 'no-overflow' : 'OVERFLOW'`
Expected: `no-overflow`.

- [ ] **Step 4: Commit**

```bash
git add components/public/ServicesSection.tsx components/public/CTASection.tsx
git commit -m "fix(mobile): sentence-case section CTAs on home"
```

---

### Task 7: Verificación integral de la Fase 1

**Files:** (sin cambios de código salvo ajustes menores que surjan)

- [ ] **Step 1: Build limpio**

Run (Bash): `npm run build`
Expected: sin errores de TypeScript ni de build.

- [ ] **Step 2: Barrido mobile 320 / 375 / 430**

Con la herramienta de preview, para cada ancho (320, 375, 430):
- `/` carga sin overflow horizontal (`scrollWidth === innerWidth`).
- Hero legible, propuesta clara, stats completos sin solapes.
- Barra fija aparece tras scroll con Cotizar + WhatsApp, respeta la zona inferior.
- Sin texto cortado en ninguna sección.

- [ ] **Step 3: Chequeo desktop (1280px)**

`/` en 1280px: sin regresiones — hero centrado como antes, WhatsApp flotante presente, barra fija oculta (`lg:hidden`).

- [ ] **Step 4: Screenshots de evidencia**

Capturar `/` en 375px (hero + con barra tras scroll) y en 1280px para dejar constancia del antes/después.

- [ ] **Step 5: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "chore(mobile): fase 1 verification tweaks"
```

---

## Self-Review (cobertura del spec)

- **Hero ilegible → §5.1:** Task 5 (scrim vertical AA, anclaje abajo, contraste verificado). ✔
- **"Encaja" / stats que chocan → §1,§5.1:** Task 5 Step 8 + reserva de espacio para la barra. ✔
- **Acento "para tu celebración" (Cormorant itálica) → §4:** Task 5 Step 4 (`font-accent italic`). ✔
- **Barra de acción fija → §6:** Tasks 2 y 4. ✔
- **WhatsApp contextual + flotante solo desktop → §6,§7:** Tasks 2 (mensaje) y 3. ✔
- **Fundamentos: safe-area → §5.2:** Task 1 (`.pb-safe`) usada por la barra. ✔
- **Copy/acentos, sin emojis en home → §5.1,§5.3:** Task 5 (badge/subtítulo/CTA) + Task 6 (CTAs de secciones). ✔
- **Estados (reduced-motion, overflow, 320/430) → §8:** Task 5 Step 9, Task 6 Step 3, Task 7 Step 2. ✔
- **Accesibilidad AA → §9:** Task 5 Step 7. ✔
- **Sin cambio de paleta/tipografías (restricción):** ningún task toca `tailwind.config`/tokens de color ni fuentes. ✔

**Nota sobre fundamentos mobile:** el contenedor con padding simétrico (arreglo del catálogo con padding 16/0) pertenece a **Fase 2**; en Fase 1 solo se define `.pb-safe`, que es lo que la home necesita. La home ya no presenta overflow (verificado en diagnóstico), por lo que no requiere un contenedor nuevo en esta fase.
