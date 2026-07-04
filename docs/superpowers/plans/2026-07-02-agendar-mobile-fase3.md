# Fase 3 — Agendar mobile + jerarquía CTA Agendar · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que "Agendar" sea la llamada a la acción principal del sitio, y reconstruir el wizard de `/agendar` de 5 a 3 pasos, corrigiendo dos bugs bloqueantes reales y reduciendo la densidad visual.

**Architecture:** Ediciones quirúrgicas sobre componentes existentes (`Navbar`, `Hero`, `MobileActionBar`, `bookingStoreMulti`, `ServiceCategorySelector`) más una reescritura del cuerpo JSX de `app/(public)/agendar/page.tsx` (los handlers/imports se ajustan aparte de la reescritura visual). No se toca la integración de pago (MercadoPago) ni `/cotizar`.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand (bookingStoreMulti).

**Spec de referencia:** `docs/superpowers/specs/2026-07-02-agendar-mobile-fase3-design.md`

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `components/layout/Navbar.tsx` | CTA "Agenda ahora" → `/agendar` |
| `components/public/Hero.tsx` | CTA primario "Agenda tu torta" → `/agendar`; se quita el botón de cotizar |
| `components/public/MobileActionBar.tsx` | CTA primario "Agenda tu torta" → `/agendar`; ajuste de copy WhatsApp en home |
| `stores/bookingStoreMulti.ts` | Rango de `currentStep` de 1-5 a 1-3 |
| `components/public/ServiceCategorySelector.tsx` | Nuevo prop `onCancel` + botón "Atrás"; reduce densidad |
| `components/public/ServiceCart.tsx` | Corrige la condición `currentStep === 2` (numeración vieja) a `currentStep === 1` (Servicios es ahora el paso 1) |
| `app/(public)/agendar/page.tsx` | Renumeración de pasos, fusión Detalles+Evento y Contacto+Pago, elimina indicador de progreso visual, fix de padding del carrito, reduce densidad |

---

## Preparación

- [ ] **Step 0: Servidor de desarrollo en viewport mobile**

Usa la herramienta de preview (no Bash) para levantar "Next.js Dev" y fijar viewport mobile (375×812) para verificar cada tarea. Ten también a mano 1280×800 para revisar desktop en la verificación final.

---

### Task 1: CTA "Agenda ahora" en el navbar

**Files:**
- Modify: `components/layout/Navbar.tsx:189-193`

- [ ] **Step 1: Cambiar destino y copy del botón CTA**

Encontrar:
```tsx
              <Link
                href="/cotizar"
                className="bg-primary text-white hover:bg-primary-hover rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.97]"
              >
                Cotiza gratis
              </Link>
```
Reemplazar por:
```tsx
              <Link
                href="/agendar"
                className="bg-primary text-white hover:bg-primary-hover rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.97]"
              >
                Agenda ahora
              </Link>
```

- [ ] **Step 2: Verificar en preview (desktop, 1280px)**

Recargar `/`. El botón superior derecho debe decir "Agenda ahora" y llevar a `/agendar` al hacer click.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat(cta): navbar CTA points to /agendar instead of /cotizar"
```

---

### Task 2: CTA "Agenda tu torta" en el Hero

**Files:**
- Modify: `components/public/Hero.tsx` (bloque de botones del hero, cerca de la línea 266-283)

- [ ] **Step 1: Leer el bloque actual de botones para confirmar el texto exacto**

Buscar en `components/public/Hero.tsx` el bloque que contiene:
```tsx
                <Link href="/cotizar" className="group">
```
y el `<Link href="/catalogo" className="group">` inmediatamente después. Confirmar el contenido exacto del primer `<Button>` (debe decir `<span>Cotiza tu torta</span>`).

- [ ] **Step 2: Reemplazar el CTA primario**

Encontrar:
```tsx
                <Link href="/cotizar" className="group">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <span>Cotiza tu torta</span>
```
Reemplazar por:
```tsx
                <Link href="/agendar" className="group">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <span>Agenda tu torta</span>
```

(El resto del `<Button>` —el ícono de flecha y su cierre— no cambia; solo cambian el `href` y el texto del `<span>`.)

- [ ] **Step 3: Verificar que el botón "Ver catálogo" sigue igual**

Confirmar que el segundo `<Link href="/catalogo" ...>` con el botón secundario "Ver catálogo" no se modificó. No debe quedar ningún tercer botón de "Cotizar" en el hero.

- [ ] **Step 4: Verificar en preview (mobile 375px y desktop 1280px)**

El botón primario del hero debe decir "Agenda tu torta" y apuntar a `/agendar`. Debe seguir habiendo exactamente 2 botones (Agenda tu torta + Ver catálogo).

- [ ] **Step 5: Commit**

```bash
git add components/public/Hero.tsx
git commit -m "feat(cta): hero primary CTA is Agenda tu torta -> /agendar"
```

---

### Task 3: CTA "Agenda tu torta" en la barra de acción mobile

**Files:**
- Modify: `components/public/MobileActionBar.tsx`

- [ ] **Step 1: Actualizar el mensaje de WhatsApp para la home**

Encontrar (dentro de la función `waMessage`):
```tsx
  if (pathname === '/') {
    return 'Hola DeliDanis, vengo de la web y quiero cotizar una torta para mi evento'
  }
```
Reemplazar por:
```tsx
  if (pathname === '/') {
    return 'Hola DeliDanis, vengo de la web y quiero agendar una torta para mi evento'
  }
```

- [ ] **Step 2: Cambiar el botón primario**

Encontrar:
```tsx
        <Link
          href="/cotizar"
          className="flex flex-1 items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Cotiza tu torta
        </Link>
```
Reemplazar por:
```tsx
        <Link
          href="/agendar"
          className="flex flex-1 items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Agenda tu torta
        </Link>
```

- [ ] **Step 3: Verificar en preview (mobile 375px)**

En `/`, hacer scroll hasta que aparezca la barra de acción fija. Debe decir "Agenda tu torta" y llevar a `/agendar`.

- [ ] **Step 4: Commit**

```bash
git add components/public/MobileActionBar.tsx
git commit -m "feat(cta): mobile action bar primary CTA is Agenda tu torta -> /agendar"
```

---

### Task 4: Reducir el wizard de 5 a 3 pasos en el store

**Files:**
- Modify: `stores/bookingStoreMulti.ts:360-373`

- [ ] **Step 1: Cambiar el límite superior de `nextStep`**

Encontrar:
```tsx
  nextStep: () => {
```
Ubicar dentro de esa función la línea:
```tsx
      currentStep: Math.min(state.currentStep + 1, 5),
```
Reemplazar por:
```tsx
      currentStep: Math.min(state.currentStep + 1, 3),
```

- [ ] **Step 2: Confirmar que `prevStep` ya tiene el límite inferior correcto**

Confirmar que existe (sin cambios):
```tsx
      currentStep: Math.max(state.currentStep - 1, 1),
```
Este límite inferior (1) no cambia.

- [ ] **Step 3: Verificar que compila**

Run: `npm run build`
Expected: sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add stores/bookingStoreMulti.ts
git commit -m "fix(agendar): reduce wizard step bounds from 5 to 3"
```

---

### Task 5: Arreglar el bug bloqueante de `ServiceCategorySelector` (sin botón de volver)

**Files:**
- Modify: `components/public/ServiceCategorySelector.tsx`

- [ ] **Step 1: Agregar el prop `onCancel` a la interfaz**

Encontrar:
```tsx
interface ServiceCategorySelectorProps {
  selectedCategory: ServiceType | null
  onSelectCategory: (type: ServiceType) => void
}

export function ServiceCategorySelector({
  selectedCategory,
  onSelectCategory,
}: ServiceCategorySelectorProps) {
```
Reemplazar por:
```tsx
interface ServiceCategorySelectorProps {
  selectedCategory: ServiceType | null
  onSelectCategory: (type: ServiceType) => void
  onCancel: () => void
}

export function ServiceCategorySelector({
  selectedCategory,
  onSelectCategory,
  onCancel,
}: ServiceCategorySelectorProps) {
```

- [ ] **Step 2: Agregar el botón "Atrás" antes de la grilla de categorías, y reducir densidad de las tarjetas**

Encontrar:
```tsx
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCategories.map((category) => (
          <button
            key={category.type}
            onClick={() => onSelectCategory(category.type)}
            className={cn(
              'relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105',
              selectedCategory === category.type
                ? 'border-primary bg-primary/10 shadow-xl ring-4 ring-primary/20'
                : 'border-border hover:border-primary/50 bg-white hover:shadow-lg'
            )}
          >
            {/* Icono grande */}
            <div className="w-12 h-12 mb-4 transition-transform duration-300 group-hover:scale-110 text-dark-light">
```
Reemplazar por:
```tsx
  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm font-medium text-dark-light hover:text-dark transition-colors"
        aria-label="Volver sin elegir un servicio"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Atrás
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {serviceCategories.map((category) => (
          <button
            key={category.type}
            onClick={() => onSelectCategory(category.type)}
            className={cn(
              'relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105',
              selectedCategory === category.type
                ? 'border-primary bg-primary/10 shadow-xl ring-4 ring-primary/20'
                : 'border-border hover:border-primary/50 bg-white hover:shadow-lg'
            )}
          >
            {/* Icono grande */}
            <div className="w-10 h-10 mb-3 transition-transform duration-300 group-hover:scale-110 text-dark-light">
```

- [ ] **Step 3: Reducir el tamaño del título de cada tarjeta**

Encontrar:
```tsx
            <h3 className="font-display text-2xl font-bold text-dark mb-2">
              {category.name}
            </h3>
```
Reemplazar por:
```tsx
            <h3 className="font-display text-xl font-bold text-dark mb-2">
              {category.name}
            </h3>
```

- [ ] **Step 4: Commit**

```bash
git add components/public/ServiceCategorySelector.tsx
git commit -m "fix(agendar): add back button to ServiceCategorySelector (was a dead end)"
```

---

### Task 6: Actualizar imports, validaciones y handlers en `agendar/page.tsx`

**Files:**
- Modify: `app/(public)/agendar/page.tsx:1-293`

- [ ] **Step 1: Actualizar los imports**

Encontrar:
```tsx
import { ServiceCategorySelector } from '@/components/public/ServiceCategorySelector'
import { ServiceCart } from '@/components/public/ServiceCart'
import { TortaServiceForm } from '@/components/public/TortaServiceForm'
import { CocktailServiceForm } from '@/components/public/CocktailServiceForm'
import { PastryServiceForm } from '@/components/public/PastryServiceForm'
import { EventTypeSelector } from '@/components/public/EventTypeSelector'
import { BookingCalendar } from '@/components/public/BookingCalendar'
import { Button, Input, Card } from '@/components/ui'
```
Reemplazar por:
```tsx
import { ServiceCategorySelector } from '@/components/public/ServiceCategorySelector'
import { ServiceCart } from '@/components/public/ServiceCart'
import { TortaServiceForm } from '@/components/public/TortaServiceForm'
import { CocktailServiceForm } from '@/components/public/CocktailServiceForm'
import { PastryServiceForm } from '@/components/public/PastryServiceForm'
import { eventTypes } from '@/components/public/EventTypeSelector'
import { BookingCalendar } from '@/components/public/BookingCalendar'
import { Button, Input, Card, Select } from '@/components/ui'
```

- [ ] **Step 2: Agregar el handler `handleCancelServiceSelector`**

Encontrar:
```tsx
  // Handler: cancel service form
  const handleCancelServiceForm = () => {
    setShowServiceForm(false)
    setSelectedServiceType(null)
  }
```
Reemplazar por:
```tsx
  // Handler: cancel service form
  const handleCancelServiceForm = () => {
    setShowServiceForm(false)
    setSelectedServiceType(null)
  }

  // Handler: cancel out of the category selector (fixes the dead-end bug)
  const handleCancelServiceSelector = () => {
    setShowServiceSelector(false)
  }
```

- [ ] **Step 3: Renombrar y fusionar las validaciones de pasos**

Encontrar:
```tsx
  // Validation functions
  const canContinueStep1 = bookingData.eventType !== null
  const canContinueStep2 = bookingData.services.length > 0
  const canContinueStep3 =
    bookingData.eventDate !== null &&
    bookingData.eventTime !== null &&
    bookingData.deliveryType !== null
  const canContinueStep4 = useMemo(() => {
```
Reemplazar por:
```tsx
  // Validation functions (renumbered for the 3-step wizard:
  // 1 = Servicios, 2 = Detalles (incluye tipo de evento), 3 = Contacto + Pago)
  const canContinueStep1 = bookingData.services.length > 0
  const canContinueStep2 =
    bookingData.eventType !== null &&
    bookingData.eventDate !== null &&
    bookingData.eventTime !== null &&
    bookingData.deliveryType !== null
  const canContinueStep3 = useMemo(() => {
```

- [ ] **Step 4: Verificar que no queda ninguna referencia vieja a `canContinueStep4`**

Run: `grep -n "canContinueStep4" "app/(public)/agendar/page.tsx"`
Expected: sin resultados fuera del bloque JSX que se reescribe en la Task 7 (ese bloque se corrige ahí).

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/agendar/page.tsx"
git commit -m "refactor(agendar): update imports and step validation for 3-step wizard"
```

---

### Task 7: Reescribir el cuerpo visual del wizard (JSX) — 3 pasos, sin indicador visual, fix de padding del carrito

**Files:**
- Modify: `app/(public)/agendar/page.tsx` (desde el comentario `{/* Progress Bar...` hasta el cierre del componente)

Este task reemplaza el bloque completo que va desde `// Progress percentage` hasta el `return (` final del `return` externo (aproximadamente lo que eran las líneas 337-916 antes de las Tasks 4-6). Es una sola pieza porque todo el bloque está interconectado (numeración de pasos, layout de columnas, carrito).

- [ ] **Step 1: Reemplazar el bloque completo**

Encontrar (el inicio del bloque a reemplazar):
```tsx
  // Progress percentage
  const progressPercentage = (currentStep / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-primary/5 py-12">
      <div className="container mx-auto px-4">
        {/* Progress Bar - Aligned with content */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="lg:pr-[420px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-dark">Paso {currentStep} de 5</span>
              <span className="text-sm text-dark-light font-medium">{Math.round(progressPercentage)}% completado</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary-hover to-accent transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Step Labels */}
            <div className="grid grid-cols-5 gap-3 mt-5">
              {[
                { num: 1, label: 'Evento', icon: '🎊' },
                { num: 2, label: 'Servicios', icon: '🛍️' },
                { num: 3, label: 'Detalles', icon: '📋' },
                { num: 4, label: 'Contacto', icon: '📞' },
                { num: 5, label: 'Pago', icon: '💳' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={cn(
                    'text-center py-3 px-4 rounded-xl transition-all duration-300 border-2',
                    currentStep === step.num
                      ? 'bg-primary border-primary text-white font-semibold shadow-lg scale-105'
                      : currentStep > step.num
                      ? 'bg-accent/10 border-accent text-accent font-medium'
                      : 'bg-white border-gray-200 text-gray-400'
                  )}
                >
                  <div className="text-lg mb-1">{step.icon}</div>
                  <div className="text-xs font-semibold">{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Cart */}
        <div className="max-w-7xl mx-auto">
          {/* Header - Aligned with form content */}
          <div className="lg:pr-[420px] mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-4">
              Arma Tu Evento Perfecto
            </h1>
            <p className="text-lg text-dark-light">
              Selecciona los servicios que necesites para tu celebración. Puedes combinar tortas,
              coctelería y pastelería en un solo pedido.
            </p>
          </div>

          {/* Grid con formulario y cart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="p-6 md:p-8">
              {/* STEP 1: Event Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      ¿Para qué tipo de evento?
                    </h2>
                    <p className="text-dark-light">
                      Esto nos ayuda a recomendarte los mejores productos para tu celebración
                    </p>
                  </div>

                  <EventTypeSelector
                    selectedEventType={bookingData.eventType}
                    onSelectEventType={(slug) => setEventType(slug)}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={nextStep}
                      disabled={!canContinueStep1}
                      className="px-8"
                    >
                      Continuar
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Services */}
              {currentStep === 2 && (
```
(Este es el inicio; el resto del reemplazo continúa en el Step 2 de esta tarea con el contenido completo hasta el final del archivo.)

Dado el tamaño del bloque, reemplázalo **completo** por el siguiente contenido (desde `// Progress percentage` hasta el cierre final `}` del componente):

```tsx
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-primary/5 py-8 md:py-10">
      <div className="container mx-auto px-4">
        {/* Main Content with Sidebar Cart */}
        <div className="max-w-7xl mx-auto">
          {/* Header - Aligned with form content */}
          <div className="lg:pr-[420px] mb-5">
            <p className="text-sm font-medium text-dark-light mb-2">Paso {currentStep} de 3</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-dark mb-3">
              Arma Tu Evento Perfecto
            </h1>
            <p className="text-base text-dark-light">
              Selecciona los servicios que necesites para tu celebración. Puedes combinar tortas,
              coctelería y pastelería en un solo pedido.
            </p>
          </div>

          {/* Grid con formulario y cart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Form */}
          <div
            className={cn(
              'lg:col-span-7 xl:col-span-8',
              bookingData.services.length > 0 && 'pb-24 lg:pb-0'
            )}
          >
            <Card className="p-5 md:p-6">
              {/* STEP 1: Services */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-dark mb-2">
                      Selecciona Tus Servicios
                    </h2>
                    <p className="text-dark-light">
                      Agrega todos los servicios que necesites para tu evento
                    </p>
                  </div>

                  {/* Show Service Selector or Form */}
                  {!showServiceForm && (
                    <>
                      {showServiceSelector ? (
                        <ServiceCategorySelector
                          selectedCategory={selectedServiceType}
                          onSelectCategory={handleSelectCategory}
                          onCancel={handleCancelServiceSelector}
                        />
                      ) : (
                        <div className="text-center py-10">
                          <div className="mb-4 flex justify-center">
                          <svg className="w-14 h-14 text-dark-light/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                          <p className="text-dark-light mb-6">
                            {bookingData.services.length === 0
                              ? 'Comienza agregando tu primer servicio'
                              : `Tienes ${bookingData.services.length} ${
                                  bookingData.services.length === 1 ? 'servicio agregado' : 'servicios agregados'
                                }`}
                          </p>
                          <Button onClick={() => setShowServiceSelector(true)} variant="primary">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {bookingData.services.length === 0 ? 'Agregar Servicio' : 'Agregar Otro Servicio'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Service Forms */}
                  {showServiceForm && selectedServiceType === 'torta' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : productsError ? (
                        <Card className="p-8 text-center">
                          <div className="text-red-600 mb-4">{productsError}</div>
                          <Button onClick={() => window.location.reload()}>
                            Reintentar
                          </Button>
                        </Card>
                      ) : (
                        <TortaServiceForm
                          eventType={bookingData.eventType || ''}
                          availableProducts={cakeProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {showServiceForm && selectedServiceType === 'cocteleria' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : (
                        <CocktailServiceForm
                          availableProducts={cocktailProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {showServiceForm && selectedServiceType === 'pasteleria' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : (
                        <PastryServiceForm
                          availableProducts={pastryProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {/* Navigation Buttons */}
                  {!showServiceForm && !showServiceSelector && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={nextStep} disabled={!canContinueStep1}>
                        Continuar
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Event Details & Delivery (incluye tipo de evento) */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-dark mb-2">
                      Detalles del Evento
                    </h2>
                    <p className="text-dark-light">
                      Cuéntanos qué tipo de evento es, cuándo y dónde necesitas tu pedido
                    </p>
                  </div>

                  {/* Event Type */}
                  <Select
                    label="Tipo de Evento *"
                    placeholder="Selecciona el tipo de evento"
                    value={bookingData.eventType || ''}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    {eventTypes.map((et) => (
                      <option key={et.id} value={et.slug}>
                        {et.name}
                      </option>
                    ))}
                  </Select>

                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Fecha del Evento *
                    </label>
                    <BookingCalendar
                      selectedDate={bookingData.eventDate}
                      onSelectDate={(date) => setEventDate(date)}
                    />
                  </div>

                  {/* Event Time */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Horario del Evento *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['AM', 'PM'].map((time) => (
                        <button
                          key={time}
                          onClick={() => setEventTime(time as 'AM' | 'PM')}
                          className={cn(
                            'py-3 px-5 rounded-xl border-2 font-semibold transition-all duration-200 text-sm',
                            bookingData.eventTime === time
                              ? 'border-primary bg-primary text-white shadow-lg'
                              : 'border-border hover:border-primary/50 text-dark'
                          )}
                        >
                          {time === 'AM' ? 'Mañana (6:00 AM - 12:00 PM)' : 'Tarde (12:00 PM - 10:00 PM)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Tipo de Entrega *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setDeliveryType('pickup')}
                        className={cn(
                          'py-4 px-5 rounded-xl border-2 transition-all duration-200 text-left',
                          bookingData.deliveryType === 'pickup'
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="w-7 h-7 mb-2 text-dark-light">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="font-semibold text-dark mb-1">Recoger en Tienda</div>
                        <div className="text-sm text-dark-light">Sin costo adicional</div>
                      </button>
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={cn(
                          'py-4 px-5 rounded-xl border-2 transition-all duration-200 text-left',
                          bookingData.deliveryType === 'delivery'
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="w-7 h-7 mb-2 text-dark-light">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                        </div>
                        <div className="font-semibold text-dark mb-1">Delivery</div>
                        <div className="text-sm text-accent font-semibold">+{formatCurrency(deliveryCost)}</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button onClick={prevStep} variant="ghost">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Atrás
                    </Button>
                    <Button onClick={nextStep} disabled={!canContinueStep2}>
                      Continuar
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Contact Information + Pago (mismo paso) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-dark mb-2">
                      Información de Contacto
                    </h2>
                    <p className="text-dark-light">
                      Para finalizar necesitamos tus datos de contacto
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombre *"
                      value={bookingData.customer.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onBlur={() => handleInputBlur('firstName')}
                      error={formErrors.firstName}
                      placeholder="Tu nombre"
                    />
                    <Input
                      label="Apellido *"
                      value={bookingData.customer.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onBlur={() => handleInputBlur('lastName')}
                      error={formErrors.lastName}
                      placeholder="Tu apellido"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email *"
                      type="email"
                      value={bookingData.customer.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleInputBlur('email')}
                      error={formErrors.email}
                      placeholder="tu@email.com"
                    />
                    <Input
                      label="Teléfono *"
                      type="tel"
                      value={bookingData.customer.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={() => handleInputBlur('phone')}
                      error={formErrors.phone}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  {bookingData.deliveryType === 'delivery' && (
                    <>
                      <Input
                        label="Dirección de Entrega *"
                        value={bookingData.customer.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        onBlur={() => handleInputBlur('address')}
                        error={formErrors.address}
                        placeholder="Calle, número, depto/casa"
                      />
                      <Input
                        label="Ciudad *"
                        value={bookingData.customer.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        onBlur={() => handleInputBlur('city')}
                        error={formErrors.city}
                        placeholder="Santiago, Valparaíso, etc."
                      />
                    </>
                  )}

                  {/* Pago: aparece en la misma pantalla en cuanto los datos de contacto son válidos */}
                  {canContinueStep3 && (
                    <div className="space-y-4 pt-2 border-t border-border">
                      <div className="pt-4">
                        <h2 className="font-display text-2xl font-bold text-dark mb-2">
                          Confirmar y Pagar
                        </h2>
                        <p className="text-dark-light">
                          Elige cómo quieres pagar para confirmar tu pedido
                        </p>
                      </div>

                      {/* Trust Signals */}
                      <div className="flex flex-wrap items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">Pago 100% Seguro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">Datos protegidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">MercadoPago</span>
                          <span className="text-sm text-green-800">Procesado por</span>
                        </div>
                      </div>

                      {/* Resumen de pago */}
                      <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-dark">Resumen de pago</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-light">Subtotal servicios</span>
                          <span className="text-dark font-medium">{formatCurrency(bookingData.subtotal)}</span>
                        </div>
                        {bookingData.deliveryFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-dark-light">Envío</span>
                            <span className="text-dark font-medium">{formatCurrency(bookingData.deliveryFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                          <span className="text-dark">Total del pedido</span>
                          <span className="text-accent font-display text-xl">{formatCurrency(bookingData.total)}</span>
                        </div>
                      </div>

                      {/* Error */}
                      {paymentError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                          {paymentError}
                        </div>
                      )}

                      {/* Opciones de pago */}
                      <div className="space-y-3">
                        {/* Pagar depósito */}
                        <button
                          onClick={() => handlePay('deposit')}
                          disabled={isPaymentLoading}
                          className="w-full p-4 bg-white border-2 border-primary rounded-2xl text-left hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-dark group-hover:text-primary transition-colors">
                              Pagar depósito ahora
                            </span>
                            <span className="text-xl font-bold font-display text-primary">
                              {formatCurrency(Math.round(bookingData.total * depositPercentage / 100))}
                            </span>
                          </div>
                          <p className="text-sm text-dark-light">
                            {depositPercentage}% ahora para reservar tu fecha · El saldo lo pagas más adelante
                          </p>
                        </button>

                        {/* Pagar total */}
                        <button
                          onClick={() => handlePay('full')}
                          disabled={isPaymentLoading}
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl text-left hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-dark">
                              Pagar monto completo
                            </span>
                            <span className="text-xl font-bold font-display text-accent">
                              {formatCurrency(bookingData.total)}
                            </span>
                          </div>
                          <p className="text-sm text-dark-light">
                            Pago único · Sin saldo pendiente
                          </p>
                        </button>
                      </div>

                      <p className="text-xs text-center text-dark-light">
                        Serás redirigido al sitio oficial de MercadoPago para completar tu pago de forma segura.
                      </p>

                      {isPaymentLoading && (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-sm text-dark-light mt-2">Preparando tu pago...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón atrás */}
                  <div className="flex justify-start pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => prevStep()}
                      disabled={isPaymentLoading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Atrás
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Service Cart (Desktop Only) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-20">
              <ServiceCart
                services={bookingData.services}
                subtotal={bookingData.subtotal}
                deliveryFee={bookingData.deliveryFee}
                total={bookingData.total}
                onRemoveService={removeService}
                onAddAnother={handleAddAnother}
                onContinue={handleContinueToCheckout}
                currentStep={currentStep}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores de TypeScript. Prestar atención a que no queden referencias a `EventTypeSelector` como componente JSX (solo se usa el array `eventTypes` ahora) ni a `canContinueStep4`.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/agendar/page.tsx"
git commit -m "feat(agendar): rebuild wizard to 3 steps, drop progress bar, merge contact+payment, fix cart overlap padding"
```

---

### Task 8: Corregir la referencia a `currentStep === 2` en `ServiceCart.tsx` (rota por la renumeración)

**Files:**
- Modify: `components/public/ServiceCart.tsx:162,279`

Este componente tiene un bloque de acciones (botones "Continuar" y "Agregar Otro Servicio" dentro del panel del carrito) que solo se muestra cuando `currentStep === 2` — ese `2` era el número del paso "Servicios" en la numeración vieja de 5 pasos. Con la renumeración de la Task 7, Servicios pasó a ser el paso **1**. Sin este fix, ese bloque de acciones nunca se mostraría.

- [ ] **Step 1: Actualizar el valor por defecto del prop**

Encontrar:
```tsx
  currentStep = 2,
}: ServiceCartProps) {
```
Reemplazar por:
```tsx
  currentStep = 1,
}: ServiceCartProps) {
```

- [ ] **Step 2: Actualizar la condición del bloque de acciones**

Encontrar:
```tsx
          {/* Actions - Only show on step 2 */}
          {currentStep === 2 && (
```
Reemplazar por:
```tsx
          {/* Actions - Only show on step 1 (Servicios) */}
          {currentStep === 1 && (
```

- [ ] **Step 3: Verificar en preview (mobile 375px)**

En `/agendar`, paso 1 (Servicios), agregar un servicio. Abrir el carrito ("Ver Pedido"). Confirmar que dentro del carrito aparecen los botones "Continuar" y "Agregar Otro Servicio". Avanzar al paso 2 (Detalles) y confirmar que esos botones **ya no** aparecen dentro del carrito (el carrito ahí solo debe mostrar el resumen, sin esas acciones).

- [ ] **Step 4: Commit**

```bash
git add components/public/ServiceCart.tsx
git commit -m "fix(agendar): update ServiceCart step-gated actions for new 3-step numbering"
```

---

### Task 9: Verificación integral

**Files:** (sin cambios de código salvo ajustes menores que surjan)

- [ ] **Step 1: Build limpio**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 2: Flujo completo en mobile (375px)**

En `/agendar`:
1. Paso 1 (Servicios): tocar "Agregar Servicio" → entrar al selector de categoría → tocar "Atrás" → confirmar que **vuelve** a la pantalla de servicios sin quedar atascado (fix del bug bloqueante).
2. Agregar un servicio de torta completo. Confirmar que aparece la barra fija "Ver Pedido" abajo y que el botón "Continuar" **no queda tapado** por esa barra (fix del segundo bug).
3. Paso 2 (Detalles): confirmar que el tipo de evento es un `<select>` desplegable (no una grilla de tarjetas), junto a fecha/horario/entrega.
4. Paso 3 (Contacto): completar los campos; confirmar que la sección "Confirmar y Pagar" aparece **debajo, en la misma pantalla**, sin navegar a otra vista, apenas los datos son válidos.
5. Confirmar que en ningún paso aparece la barra de progreso ni los emojis de pasos — solo el texto "Paso X de 3".

- [ ] **Step 3: Chequeo desktop (1280px)**

Repetir el flujo en 1280px. Confirmar que el carrito lateral fijo sigue funcionando como antes, y que los pasos requieren menos scroll que la versión anterior (padding y tamaños de fuente reducidos).

- [ ] **Step 4: Confirmar CTAs "Agendar" en todo el sitio**

En `/`, verificar: navbar dice "Agenda ahora" y el hero dice "Agenda tu torta", ambos apuntando a `/agendar`. La barra de acción mobile también dice "Agenda tu torta".

- [ ] **Step 5: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "chore(agendar): fase 3 verification tweaks"
```

---

## Self-Review

- **CTA Agendar en navbar/hero/barra mobile → §4 del spec:** Tasks 1, 2, 3. ✔
- **Wizard de 3 pasos (Servicios, Detalles, Contacto+Pago) → §5:** Task 7. ✔
- **Tipo de evento como dropdown dentro de Detalles → §5:** Task 6 (import) + Task 7 (Step 2 JSX). ✔
- **Indicador de progreso eliminado, solo texto "Paso X de 3" → §7:** Task 7. ✔
- **Bug 1 (selector de categoría sin salida) → §6:** Task 5 + Task 6 Step 2 (wiring del handler) + Task 7 (prop `onCancel` pasado). ✔
- **Bug 2 (carrito tapa el botón continuar) → §6:** Task 7 (padding condicional `pb-24 lg:pb-0` en la columna del formulario). ✔
- **Densidad visual reducida (mobile y desktop) → §8:** Task 5 (ServiceCategorySelector) + Task 7 (Card padding, tamaños de h2, spacing). ✔
- **Fuera de alcance respetado:** no se tocó la lógica de `handlePay`, `createBooking`, ni el endpoint de MercadoPago; `/cotizar` no se modificó. ✔
- **Consistencia de tipos:** `canContinueStep1/2/3` se usan consistentemente renombrados en Task 6 y Task 7; `handleCancelServiceSelector` definido en Task 6 y consumido en Task 7 con el mismo nombre. ✔
- **Referencia rota por la renumeración (`ServiceCart.tsx` gateaba acciones a `currentStep === 2`, el viejo número de "Servicios"):** detectada en la auto-revisión (no estaba en el spec explícitamente) y agregada como Task 8. ✔
