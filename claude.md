# CLAUDE.md - Pastelería Premium SaaS

## Descripción del Proyecto

Sistema web para pastelería especializada en tortas para eventos. Incluye:
- **Sitio público**: Catálogo, agendamiento, cotizaciones, pagos
- **Panel administrativo (SaaS)**: Gestión completa del negocio

> **Task Tracker**: Lee `.claude/task.md` para ver el estado completo del proyecto (milestones, lo hecho y lo pendiente).

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Animaciones | GSAP |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Mensajería | Twilio (WhatsApp Business API) |
| Email | Resend |
| Pagos | Mercado Pago / Stripe |
| Deploy | Vercel |

---

## Design System

### Paleta de Colores (Fresca Contemporánea)

```css
:root {
  /* Primarios */
  --color-primary: #D4847C;        /* Rosa terracota - Botones principales, acentos */
  --color-primary-hover: #C4746C;  /* Rosa terracota oscuro */
  --color-primary-light: #E8A9A3;  /* Rosa terracota claro */
  
  /* Secundarios */
  --color-secondary: #F7F3EF;      /* Blanco algodón - Fondos secundarios */
  --color-accent: #B8860B;         /* Dorado oscuro - Detalles premium, precios */
  --color-accent-light: #D4A84B;   /* Dorado claro */
  
  /* Neutros */
  --color-dark: #3D3D3D;           /* Gris carbón - Textos principales */
  --color-dark-light: #5D5D5D;     /* Gris medio - Textos secundarios */
  --color-light: #FFFFFF;          /* Blanco puro - Fondos principales */
  --color-light-alt: #FAFAFA;      /* Blanco off - Fondos alternos */
  
  /* Estados */
  --color-success: #8FBC8F;        /* Verde pastel - Confirmaciones */
  --color-success-dark: #6B9B6B;
  --color-error: #D4847C;          /* Rojo suave - Errores */
  --color-warning: #E8B86D;        /* Amarillo suave - Alertas */
  --color-info: #7BA3C4;           /* Azul suave - Información */
  
  /* Bordes y sombras */
  --color-border: #E8E4E0;
  --color-border-dark: #D4D0CC;
  --shadow-sm: 0 2px 8px rgba(61, 61, 61, 0.08);
  --shadow-md: 0 4px 20px rgba(61, 61, 61, 0.12);
  --shadow-lg: 0 10px 40px rgba(61, 61, 61, 0.15);
}
```

### Tailwind Config Extendido

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4847C',
          hover: '#C4746C',
          light: '#E8A9A3',
        },
        secondary: '#F7F3EF',
        accent: {
          DEFAULT: '#B8860B',
          light: '#D4A84B',
        },
        dark: {
          DEFAULT: '#3D3D3D',
          light: '#5D5D5D',
        },
        success: {
          DEFAULT: '#8FBC8F',
          dark: '#6B9B6B',
        },
        warning: '#E8B86D',
        info: '#7BA3C4',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
    },
  },
}
```

### Tipografía

| Uso | Fuente | Peso | Tamaño |
|-----|--------|------|--------|
| H1 | Playfair Display | 700 | 48-56px |
| H2 | Playfair Display | 600 | 36-42px |
| H3 | Playfair Display | 600 | 24-28px |
| H4 | Cormorant Garamond | 500 | 20-24px |
| Body | Inter | 400 | 16px |
| Body small | Inter | 400 | 14px |
| Labels | Inter | 500 | 12-14px |
| Buttons | Inter | 600 | 14px |

### Componentes UI Base

**Botones:**
- Primary: bg-primary, text-white, rounded-full, px-8 py-3
- Secondary: border-2 border-dark, text-dark, rounded-full
- Ghost: text-primary, hover:bg-primary/10

**Cards:**
- Background: bg-secondary o bg-white
- Border-radius: rounded-2xl (16px)
- Shadow: shadow-md on hover
- Padding: p-6

**Inputs:**
- Border: border border-border
- Focus: ring-2 ring-primary/30
- Border-radius: rounded-lg

---

## Estructura de Carpetas

```
/
├── app/
│   ├── (public)/                    # Sitio público
│   │   ├── page.tsx                 # Home
│   │   ├── catalogo/
│   │   │   ├── page.tsx             # Lista de productos
│   │   │   └── [slug]/page.tsx      # Detalle producto
│   │   ├── agendar/
│   │   │   ├── page.tsx             # Flujo de agendamiento
│   │   │   └── confirmacion/page.tsx
│   │   ├── cotizar/page.tsx         # Cotización personalizada
│   │   ├── nosotros/page.tsx
│   │   ├── galeria/page.tsx
│   │   ├── contacto/page.tsx
│   │   └── seguimiento/[codigo]/page.tsx
│   │
│   ├── (auth)/                      # Autenticación
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   └── recuperar/page.tsx
│   │
│   ├── admin/                       # Panel administración
│   │   ├── layout.tsx               # Layout con sidebar
│   │   ├── page.tsx                 # Dashboard
│   │   ├── pedidos/
│   │   │   ├── page.tsx             # Lista pedidos
│   │   │   └── [id]/page.tsx        # Detalle pedido
│   │   ├── calendario/page.tsx
│   │   ├── catalogo/
│   │   │   ├── page.tsx             # Lista productos admin
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/page.tsx        # Editar producto
│   │   ├── cotizaciones/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── inventario/
│   │   │   ├── page.tsx             # Stock
│   │   │   └── movimientos/page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── finanzas/
│   │   │   ├── page.tsx             # Dashboard financiero
│   │   │   ├── ingresos/page.tsx
│   │   │   ├── egresos/page.tsx
│   │   │   └── reportes/page.tsx
│   │   ├── usuarios/page.tsx
│   │   └── configuracion/page.tsx
│   │
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── twilio/route.ts
│   │   │   ├── mercadopago/route.ts
│   │   │   └── stripe/route.ts
│   │   ├── cron/
│   │   │   └── recordatorios/route.ts
│   │   └── [...]/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # Componentes base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Calendar.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileMenu.tsx
│   │
│   ├── public/                      # Componentes sitio público
│   │   ├── Hero.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── BookingCalendar.tsx
│   │   ├── QuoteForm.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Gallery.tsx
│   │   └── WhatsAppButton.tsx
│   │
│   └── admin/                       # Componentes admin
│       ├── DashboardStats.tsx
│       ├── OrdersTable.tsx
│       ├── OrderDetail.tsx
│       ├── CalendarView.tsx
│       ├── ProductForm.tsx
│       ├── InventoryTable.tsx
│       ├── ClientsTable.tsx
│       ├── FinanceCharts.tsx
│       └── QuoteBuilder.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Cliente browser
│   │   ├── server.ts                # Cliente server
│   │   └── admin.ts                 # Cliente admin (service role)
│   │
│   ├── twilio/
│   │   ├── client.ts
│   │   └── templates.ts             # Templates WhatsApp
│   │
│   ├── email/
│   │   ├── client.ts
│   │   └── templates/               # Templates email (React Email)
│   │
│   ├── payments/
│   │   ├── mercadopago.ts
│   │   └── stripe.ts
│   │
│   └── utils/
│       ├── format.ts                # Formateo fechas, moneda
│       ├── validation.ts            # Schemas Zod
│       └── constants.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useBooking.ts
│   ├── useOrders.ts
│   └── useRealtime.ts               # Subscripciones Supabase
│
├── stores/                          # Zustand stores
│   ├── cartStore.ts
│   ├── bookingStore.ts
│   └── uiStore.ts
│
├── types/
│   ├── database.ts                  # Tipos generados Supabase
│   ├── orders.ts
│   ├── products.ts
│   └── index.ts
│
├── emails/                          # React Email templates
│   ├── OrderConfirmation.tsx
│   ├── OrderStatusUpdate.tsx
│   ├── QuoteResponse.tsx
│   └── Reminder.tsx
│
└── public/
    ├── images/
    ├── fonts/
    └── icons/
```

---

## Esquema Base de Datos (Supabase)

### Tablas Principales

```sql
-- Categorías de productos
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos (Tortas)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(300),
  base_price DECIMAL(10,2) NOT NULL,
  min_portions INTEGER DEFAULT 10,
  max_portions INTEGER DEFAULT 100,
  price_per_portion DECIMAL(10,2),
  preparation_days INTEGER DEFAULT 5,
  is_customizable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imágenes de productos
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes/Opciones de productos
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL, -- 'size', 'flavor', 'filling', 'topping'
  name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  birthday DATE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_production, ready, delivered, completed, cancelled
  
  -- Fechas
  event_date DATE NOT NULL,
  event_time TIME,
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  
  -- Entrega
  delivery_type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery'
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_notes TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Montos
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  
  -- Pago
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid
  payment_reference VARCHAR(100),
  
  -- Metadata
  event_type VARCHAR(100), -- 'wedding', 'quinceanera', 'birthday', 'corporate', etc.
  special_requests TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  portions INTEGER,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '{}', -- {flavor: '', filling: '', message: '', etc}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de estados de pedido
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cotizaciones personalizadas
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, accepted, rejected, expired
  
  -- Detalles del evento
  event_type VARCHAR(100),
  event_date DATE,
  guest_count INTEGER,
  
  -- Descripción
  description TEXT NOT NULL,
  reference_images TEXT[], -- URLs de imágenes de referencia
  
  -- Respuesta
  response TEXT,
  estimated_price DECIMAL(12,2),
  valid_until DATE,
  
  -- Conversión
  converted_to_order UUID REFERENCES orders(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredientes/Insumos
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL, -- 'kg', 'lt', 'unidad', etc.
  current_stock DECIMAL(10,3) DEFAULT 0,
  min_stock DECIMAL(10,3) DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos de inventario
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference VARCHAR(200), -- 'Compra #123', 'Pedido #456', etc.
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recetas (costo por producto)
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity_per_portion DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones financieras
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'income', 'expense'
  category VARCHAR(100) NOT NULL, -- 'order', 'ingredient_purchase', 'salary', 'utilities', etc.
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- order_id, etc.
  reference_type VARCHAR(50),
  payment_method VARCHAR(50),
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del negocio
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacidad diaria
CREATE TABLE daily_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  max_orders INTEGER DEFAULT 5,
  current_orders INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios admin (extendiendo auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'production', 'sales', 'accountant', 'viewer'
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices Importantes

```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_event_date ON orders(event_date);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_ingredients_stock ON ingredients(current_stock, min_stock);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para admin
CREATE POLICY "Admin full access" ON orders
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'sales', 'production')
    )
  );
```

---

## Módulos del Sistema

### Sitio Público

| Módulo | Funcionalidades |
|--------|-----------------|
| **Home** | Hero animado GSAP, productos destacados, proceso de pedido, testimonios, CTA |
| **Catálogo** | Filtros (categoría, precio, porciones), grid responsive, quick view, detalle completo |
| **Agendamiento** | Calendario disponibilidad, selector fecha/hora, personalización, checkout, pago señal |
| **Cotizaciones** | Formulario detallado, subida imágenes referencia, seguimiento estado |
| **Seguimiento** | Consulta por código, timeline estado, detalles pedido |
| **Contacto** | Formulario, mapa, horarios, redes sociales |

### Panel Administración

| Módulo | Funcionalidades |
|--------|-----------------|
| **Dashboard** | KPIs, pedidos pendientes, alertas stock, calendario semanal, gráficos |
| **Pedidos** | CRUD, filtros, cambio estados, asignación, timeline, impresión |
| **Calendario** | Vista mes/semana/día, capacidad, bloqueo fechas, drag & drop |
| **Catálogo Admin** | CRUD productos, variantes, galería, precios, activación |
| **Cotizaciones** | Lista, respuesta, conversión a pedido |
| **Inventario** | Stock, alertas, movimientos, costos, proveedores |
| **Clientes** | CRM básico, historial, etiquetas, notas |
| **Finanzas** | Ingresos/egresos, costos producción, reportes, gráficos, exportación |
| **Usuarios** | Gestión roles, permisos |
| **Config** | Negocio, capacidad, mensajes, notificaciones |

---

## Integraciones

### Twilio (WhatsApp)

Templates a implementar:
- Confirmación de pedido
- Actualización de estado
- Recordatorio día anterior
- Respuesta a cotización
- Mensaje de seguimiento post-entrega

### Email (Resend)

Templates (React Email):
- Confirmación de pedido
- Confirmación de pago
- Actualización de estado
- Respuesta cotización
- Recordatorio
- Newsletter (opcional)

### Pagos

- **Mercado Pago**: Checkout Pro para señas/pagos completos
- **Stripe**: Alternativa internacional

---

## Convenciones de Código

### Naming

```typescript
// Componentes: PascalCase
ProductCard.tsx
BookingCalendar.tsx

// Hooks: camelCase con prefijo 'use'
useAuth.ts
useBooking.ts

// Utilities: camelCase
formatDate.ts
calculateTotal.ts

// Constantes: SCREAMING_SNAKE_CASE
const MAX_PORTIONS = 100
const ORDER_STATUS = {...}

// Tipos/Interfaces: PascalCase con prefijo descriptivo
type OrderStatus = 'pending' | 'confirmed' | ...
interface ProductWithImages extends Product {...}
```

### Estructura Componentes

```typescript
// components/public/ProductCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'

interface ProductCardProps {
  product: Product
  onQuickView?: (product: Product) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  // Estado local
  const [isHovered, setIsHovered] = useState(false)
  
  // Handlers
  const handleQuickView = () => {
    onQuickView?.(product)
  }
  
  // Render
  return (
    <article className="group bg-secondary rounded-2xl overflow-hidden transition-all hover:shadow-lg">
      {/* ... */}
    </article>
  )
}
```

### Imports Order

```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Librerías externas
import { format } from 'date-fns'
import { gsap } from 'gsap'

// 3. Componentes internos
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/public/ProductCard'

// 4. Hooks/Stores
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/stores/cartStore'

// 5. Utils/Lib
import { formatCurrency } from '@/lib/utils/format'
import { supabase } from '@/lib/supabase/client'

// 6. Types
import type { Product, Order } from '@/types'

// 7. Estilos (si aplica)
import styles from './Component.module.css'
```

### Server vs Client Components

```typescript
// Server Component (default) - Para fetch de datos
// app/catalogo/page.tsx
import { getProducts } from '@/lib/supabase/queries'

export default async function CatalogoPage() {
  const products = await getProducts()
  return <ProductGrid products={products} />
}

// Client Component - Para interactividad
// components/public/ProductGrid.tsx
'use client'

import { useState } from 'react'
```

---

## Animaciones GSAP

### Configuración Base

```typescript
// lib/gsap/config.ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const defaultEase = 'power3.out'
export const defaultDuration = 0.8
```

### Animaciones Comunes

```typescript
// hooks/useAnimations.ts
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

export function useFadeInUp(ref: RefObject<HTMLElement>, delay = 0) {
  useGSAP(() => {
    gsap.from(ref.current, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      delay,
      ease: 'power3.out',
    })
  }, [])
}

export function useStaggerChildren(containerRef: RefObject<HTMLElement>) {
  useGSAP(() => {
    gsap.from(containerRef.current?.children ?? [], {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
    })
  }, [])
}
```

---

## Variables de Entorno

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Email
RESEND_API_KEY=

# Pagos
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME="DulceArte"
```

---

## Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:types": "supabase gen types typescript --local > types/database.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset",
    "email:dev": "email dev --port 3001"
  }
}
```

---

## Checklist Desarrollo

> Ver `.claude/task.md` para el desglose completo con estado actualizado de cada milestone.
