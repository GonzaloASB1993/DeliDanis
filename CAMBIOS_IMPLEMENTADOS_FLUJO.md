# Cambios Implementados - Flujo de Pedidos

## ✅ FASE 1 COMPLETADA

### 1. Cambio "Aniversarios" → "Días Especiales"

**Archivo modificado**: `components/public/EventTypeSelector.tsx`

```typescript
// ANTES
{ id: '8', name: 'Aniversarios', slug: 'aniversarios', icon: '💝', description: 'Románticos y especiales' }

// DESPUÉS
{ id: '8', name: 'Días Especiales', slug: 'dias-especiales', icon: '💝', description: 'Aniversarios, Día de la Madre, etc.' }
```

**Beneficio**: Ahora incluye más tipos de eventos (aniversarios, día de la madre, día del padre, san valentín, etc.)

---

### 2. Cambio "Sabor" → "Producto"

**Archivos modificados**: `app/(public)/agendar/page.tsx`

**Cambios realizados**:
1. Stepper visual: "Sabor" → "Producto"
2. Título de sección: "Selecciona tu Sabor" → "Selecciona tu Producto"
3. Descripción: "X sabores disponibles" → "X productos disponibles"
4. Mensaje de ayuda: "selecciona el sabor de tu torta" → "selecciona el producto para tu evento"

**Beneficio**: Terminología más genérica que se adapta mejor cuando agregues coctelería y pastelería

---

### 3. Actualización de datos mock

Todos los productos ahora incluyen `'dias-especiales'` en lugar de `'aniversarios'`:

```typescript
// Todos los productos actualizados
metadata: { event_types: ['bodas', 'cumpleanos', 'dias-especiales', ...] }
```

---

## 🚀 PRÓXIMOS PASOS: Sistema Multi-Servicio

### Arquitectura Propuesta

```
BookingData {
  eventType: string
  services: ServiceItem[]    // ← NUEVO: Array de servicios
  eventDate: Date
  deliveryType: 'pickup' | 'delivery'
  customer: {...}
  totals: {...}
}

ServiceItem {
  id: string
  type: 'torta' | 'cocteleria' | 'pasteleria'

  // Datos específicos según tipo
  product?: ProductWithImages
  portions?: number
  cocktailService?: {...}
  pastryItems?: {...}

  price: number
}
```

---

## 📝 Flujo de Usuario Propuesto

### Paso 1: Tipo de Evento (igual que ahora)
```
Bodas, Quinceañeras, Cumpleaños, ..., Días Especiales
```

### Paso 2: Agregar Servicios (NUEVO)

**Vista principal:**
```
┌────────────────────────────────────────────────────────────┐
│  ¿Qué servicios necesitas para tu evento?                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │    🎂    │  │    🍹    │  │    🍰    │                │
│  │  Tortas  │  │Coctelería│  │Pastelería│                │
│  └──────────┘  └──────────┘  └──────────┘                │
└────────────────────────────────────────────────────────────┘
```

**Al seleccionar "Tortas":**
```
┌────────────────────────────────────────────────────────────┐
│  Tortas Personalizadas                                      │
│  ─────────────────────────────────────────────────────────│
│  Sabor: [Chocolate ▼]                                      │
│  Porciones: [15] [-] [+] [100]                            │
│  Mensaje: [_____________________________]                  │
│  Solicitudes: [_____________________________]              │
│                                                             │
│  Subtotal: $180,000                                        │
│  [+ Agregar al Pedido]                                     │
└────────────────────────────────────────────────────────────┘
```

**Al seleccionar "Coctelería":**
```
┌────────────────────────────────────────────────────────────┐
│  Servicio de Coctelería                                     │
│  ─────────────────────────────────────────────────────────│
│  Invitados: [50] [-] [+] [200]                            │
│  Duración: ○ 2 hrs  ● 3 hrs  ○ 4 hrs                      │
│  Barra: ● Barra completa  ○ Solo barman                   │
│                                                             │
│  Incluye:                                                   │
│  ✓ Barman profesional                                      │
│  ✓ Cristalería y equipos                                  │
│  ✓ Decoración de barra                                    │
│  ✓ Cocteles ilimitados                                    │
│                                                             │
│  Subtotal: $450,000                                        │
│  [+ Agregar al Pedido]                                     │
└────────────────────────────────────────────────────────────┘
```

**Al seleccionar "Pastelería":**
```
┌────────────────────────────────────────────────────────────┐
│  Pastelería Artesanal                                       │
│  ─────────────────────────────────────────────────────────│
│  [ ] Pie de Limón         Qty: [0]  $35,000/u             │
│  [ ] Tartas Variadas      Qty: [0]  $40,000/u             │
│  [ ] Galletas Gourmet     Qty: [0]  $15,000/docena        │
│  [ ] Rollitos de Canela   Qty: [0]  $25,000/6 unidades    │
│                                                             │
│  Subtotal: $0                                              │
│  [+ Agregar al Pedido]                                     │
└────────────────────────────────────────────────────────────┘
```

**Carrito Lateral (flotante):**
```
┌───────────────────────────────┐
│  TU PEDIDO                     │
│  ─────────────────────────────│
│  🎂 Torta de Chocolate         │
│     15 porciones               │
│     $180,000          [Editar] │
│                                │
│  🍹 Coctelería                 │
│     50 inv. × 3 hrs            │
│     $450,000          [Editar] │
│                                │
│  🍰 Pastelería                 │
│     2× Pie de Limón            │
│     1× Rollitos                │
│     $95,000           [Editar] │
│  ─────────────────────────────│
│  Subtotal:        $725,000     │
│  Envío:           $15,000      │
│  ─────────────────────────────│
│  TOTAL:           $740,000     │
│                                │
│  [+ Otro Servicio]             │
│  [Continuar →]                 │
└───────────────────────────────┘
```

### Paso 3: Fecha y Entrega
```
Fecha del evento: [calendario]
Horario: ○ AM  ● PM

Entrega:
● A domicilio (+$15,000)
○ Recoger en tienda (Gratis)
```

### Paso 4: Información de Contacto
```
Nombre, Email, Teléfono, Dirección (si delivery)
[Confirmar Pedido →]
```

---

## 💰 Precios Sugeridos

### Coctelería
**Base**: $9,000 por invitado/hora

**Opciones**:
- 2 horas: $18,000/invitado
- 3 horas: $27,000/invitado
- 4 horas: $36,000/invitado

**Extras**:
- Barra móvil completa: +$100,000
- Decoración premium: +$50,000
- Cocteles personalizados: +$5,000/invitado

**Ejemplo**: 50 invitados × 3 horas × $9,000 = $1,350,000 + $100,000 barra = **$1,450,000**

### Pastelería
- **Pie de Limón**: $35,000/unidad (8-10 porciones)
- **Tartas Variadas**: $40,000/unidad (8-10 porciones)
- **Galletas Gourmet**: $15,000/docena
- **Rollitos de Canela**: $25,000/6 unidades

---

## 📦 Componentes a Crear

### Fase 2: Sistema Multi-Servicio

1. **`ServiceCategorySelector.tsx`**
   - Cards para elegir: Tortas, Coctelería, Pastelería
   - Muestra icono, nombre y descripción breve

2. **`TortaServiceForm.tsx`**
   - Formulario específico para tortas
   - Selector de sabor, porciones, personalización

3. **`CocktailServiceForm.tsx`**
   - Formulario para coctelería
   - Invitados, duración, tipo de barra

4. **`PastryServiceForm.tsx`**
   - Formulario para pastelería
   - Checkboxes con cantidades para cada producto

5. **`ServiceCart.tsx`**
   - Carrito lateral flotante
   - Lista de servicios agregados
   - Botones editar/eliminar
   - Totales
   - Botón "Agregar otro servicio"

6. **Actualizar `bookingStore.ts`**
   - Nueva estructura con array de servicios
   - Métodos: `addService()`, `removeService()`, `updateService()`
   - Cálculo de totales considerando múltiples servicios

7. **Actualizar `app/(public)/agendar/page.tsx`**
   - Nuevo flujo con selección de categoría
   - Mostrar formulario según categoría elegida
   - Integrar carrito lateral

---

## ⚙️ Estado Actual del Código

### ✅ Completado
- Cambio "Aniversarios" → "Días Especiales"
- Cambio "Sabor" → "Producto"
- Datos mock actualizados

### 📋 Pendiente (cuando decidas continuar)
- Crear componentes de formularios por servicio
- Crear componente de carrito
- Actualizar store con nueva estructura
- Definir precios finales
- Actualizar flujo de agendamiento

---

## 🎯 Recomendaciones

1. **Define precios finales** para coctelería y pastelería antes de implementar
2. **Valida con clientes** si el flujo propuesto es intuitivo
3. **Considera descuentos** por paquetes combinados (ej: Torta + Coctelería -10%)
4. **Crea política de depósito** para servicios grandes (30-50% adelantado)
5. **Documenta tiempo de preparación** para cada servicio

---

## 📞 Próximo Paso

Para continuar con la implementación completa (Fase 2), necesitas:

1. **Confirmar precios** de coctelería y pastelería
2. **Decidir si incluir descuentos** por paquetes
3. **Definir política de depósitos** y pagos
4. **Aprobar el flujo de usuario** propuesto

Una vez confirmado esto, puedo implementar el sistema completo de carrito multi-servicio.

¿Qué te parece? ¿Quieres que continue con la Fase 2 ahora o prefieres probar los cambios actuales primero?
