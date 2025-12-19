# Propuesta: Sistema de Pedidos Multi-Servicio

## Problema Actual
El flujo actual solo permite elegir **un producto/sabor de torta** por pedido. No hay forma de:
- Ordenar torta + coctelería en el mismo pedido
- Ordenar torta + pastelería
- Ordenar múltiples servicios combinados

## Solución Propuesta: Sistema de Carrito

### Flujo Mejorado

```
1. Tipo de Evento → 2. Agregar Servicios → 3. Fecha y Entrega → 4. Información de Contacto
```

#### PASO 1: Tipo de Evento
**Cambio**: "Aniversarios" → "Días Especiales"
- Bodas 💍
- Quinceañeras 👑
- Cumpleaños 🎈
- Bautizos 🕊️
- Primera Comunión ⛪
- Baby Shower 👶
- Corporativos 💼
- **Días Especiales** 💝 (Aniversarios, Día de la Madre, Día del Padre, etc.)

#### PASO 2: Agregar Servicios (NUEVO)
El cliente puede agregar uno o varios servicios:

**2.1 Seleccionar Categoría de Servicio**
```
┌─────────────────────────────────────────────────────────────┐
│  ¿Qué servicios necesitas para tu evento?                   │
│                                                              │
│  [🎂 Tortas]  [🍹 Coctelería]  [🍰 Pastelería]             │
└─────────────────────────────────────────────────────────────┘
```

**2.2 Según la categoría elegida:**

### A) Si elige TORTAS:
```
┌─────────────────────────────────────────────────────────────┐
│  Selecciona tu Torta                                         │
│  ├── Chocolate                                               │
│  ├── Hojarasca                                               │
│  ├── Tres Leches                                             │
│  └── ...                                                     │
│                                                              │
│  Porciones: [15] [-] [+] [100]                             │
│  Mensaje: [Feliz Cumpleaños María]                         │
│  Solicitudes: [Sin nueces por alergias]                    │
│                                                              │
│  [+ Agregar al Pedido] $180,000                            │
└─────────────────────────────────────────────────────────────┘
```

### B) Si elige COCTELERÍA:
```
┌─────────────────────────────────────────────────────────────┐
│  Servicio de Coctelería                                      │
│                                                              │
│  Número de invitados: [50] [-] [+] [200]                   │
│  Duración: ● 2 horas  ○ 3 horas  ○ 4 horas                 │
│  Barra: ● Barra móvil completa  ○ Solo barman              │
│                                                              │
│  Servicios incluidos:                                        │
│  ✓ Barman profesional                                       │
│  ✓ Cristalería y herramientas                              │
│  ✓ Decoración de barra                                     │
│  ✓ Cocteles ilimitados (menú estándar)                    │
│                                                              │
│  Solicitudes especiales: [Cocteles sin alcohol también]    │
│                                                              │
│  [+ Agregar al Pedido] $450,000                            │
└─────────────────────────────────────────────────────────────┘
```

### C) Si elige PASTELERÍA:
```
┌─────────────────────────────────────────────────────────────┐
│  Pastelería                                                  │
│                                                              │
│  [✓] Pie de Limón (x2)              $70,000                │
│  [✓] Rollitos de Canela (x1)        $25,000                │
│  [ ] Galletas Gourmet (x0)          $0                     │
│  [ ] Tartas Variadas (x0)           $0                     │
│                                                              │
│  Nota: Los productos se entregan frescos el día del evento  │
│                                                              │
│  [+ Agregar al Pedido] $95,000                             │
└─────────────────────────────────────────────────────────────┘
```

**2.3 Carrito de Servicios (Vista lateral flotante)**
```
┌─────────────────────────────────────┐
│  Tu Pedido                           │
│  ──────────────────────────────────  │
│  🎂 Torta de Chocolate               │
│     15 porciones                     │
│     $180,000               [Editar]  │
│                                      │
│  🍹 Coctelería                       │
│     50 invitados, 3 hrs              │
│     $450,000               [Editar]  │
│                                      │
│  🍰 Pastelería                       │
│     2x Pie de Limón                  │
│     1x Rollitos                      │
│     $95,000                [Editar]  │
│  ──────────────────────────────────  │
│  Subtotal:           $725,000        │
│  Envío:              $15,000         │
│  ──────────────────────────────────  │
│  Total:              $740,000        │
│                                      │
│  [+ Agregar Otro Servicio]           │
│  [Continuar →]                       │
└─────────────────────────────────────┘
```

#### PASO 3: Fecha y Entrega
```
Fecha del evento: [calendario]
Horario: ○ AM  ● PM

Tipo de entrega:
● Entrega a domicilio (+$15,000)
○ Recoger en tienda (Gratis)

[Si entrega]
Dirección: _______________________
Ciudad: _________________________
```

#### PASO 4: Información de Contacto
```
Nombre: ____________  Apellido: ____________
Email: _________________________________
Teléfono/WhatsApp: _____________________

[Confirmar Pedido →]
```

---

## Estructura de Datos Propuesta

### Store Actualizado (bookingStore.ts)

```typescript
interface ServiceItem {
  id: string
  type: 'torta' | 'cocteleria' | 'pasteleria'

  // Para tortas
  product?: ProductWithImages
  portions?: number
  customizations?: {
    message?: string
    specialRequests?: string
  }

  // Para coctelería
  cocktailService?: {
    guests: number
    duration: 2 | 3 | 4  // horas
    includesBar: boolean
    specialRequests?: string
  }

  // Para pastelería
  pastryItems?: {
    pieLimon: number
    tartas: number
    galletas: number
    rollitos: number
  }

  price: number
}

interface BookingData {
  eventType: string | null

  // Carrito de servicios
  services: ServiceItem[]

  // Fecha y entrega
  eventDate: Date | null
  eventTime: 'AM' | 'PM' | null
  deliveryType: 'pickup' | 'delivery' | null

  // Cliente
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
    city?: string
  }

  // Cálculos
  subtotal: number
  deliveryFee: number
  total: number
}
```

---

## Ventajas de Esta Propuesta

✅ **Flexibilidad**: Cliente puede ordenar múltiples servicios
✅ **Claridad**: Cada servicio tiene su configuración específica
✅ **UX Mejorada**: Carrito visible en todo momento
✅ **Escalable**: Fácil agregar nuevos servicios
✅ **Conversión**: Upselling natural (agregar más servicios)
✅ **Administración**: Un solo pedido con múltiples servicios

---

## Implementación por Fases

### Fase 1: Cambios Inmediatos ✅
1. Cambiar "Aniversarios" por "Días Especiales" en EventTypeSelector
2. Cambiar "Sabor" por "Producto" en el stepper

### Fase 2: Sistema de Carrito 🚀
1. Crear componente `ServiceCategorySelector.tsx`
2. Crear componente `CocktailServiceForm.tsx`
3. Crear componente `PastryServiceForm.tsx`
4. Actualizar `ProductSelector.tsx` para tortas
5. Crear componente `ServiceCart.tsx` (lateral flotante)
6. Actualizar `bookingStore.ts` con nueva estructura
7. Actualizar página `agendar/page.tsx` con nuevo flujo

### Fase 3: Precios y Cotizaciones
1. Definir precios para coctelería (por invitado/hora)
2. Definir precios para pastelería (por unidad)
3. Sistema de cotización para eventos grandes (100+ invitados)

---

## Precios Sugeridos

### Coctelería
- Base: $9,000 por invitado/hora
- Barra móvil: +$100,000 fijo
- Ejemplo: 50 invitados x 3 horas = $1,350,000 + $100,000 barra = **$1,450,000**

### Pastelería
- Pie de Limón: $35,000/unidad
- Tartas: $40,000/unidad
- Galletas: $15,000/docena
- Rollitos: $25,000/6 unidades

---

## Siguiente Paso

¿Qué prefieres?

**Opción A**: Implementar cambios rápidos (Fase 1) primero
- Cambiar "Aniversarios" → "Días Especiales"
- Cambiar "Sabor" → "Producto"

**Opción B**: Implementar el sistema completo de carrito (Fase 2)
- Todos los cambios incluidos
- Sistema multi-servicio completo

**Opción C**: Solo documentar y tú implementas después
- Dejar esta propuesta como guía

¿Cuál prefieres?
