# Estructura de Base de Datos Estandarizada

## Resumen
Todas las categorías de productos (Tortas, Coctelería, Pastelería) ahora tienen la **misma estructura** consistente.

---

## Estructura Uniforme

### 📊 TORTAS (Cakes)

```
cake_categories (categorías principales)
    ↓
cake_subcategories (subcategorías opcionales)
    ↓
cake_products (productos)
    ↓
product_images (imágenes genéricas)
```

**Tablas:**
- `cake_categories` - Categorías principales (Clásicas, Premium, Temáticas)
- `cake_subcategories` - Subcategorías opcionales (Chocolate, Frutas, Cremas, etc.)
- `cake_products` - Productos de tortas con precios por porción
- `product_images` - Imágenes (product_type = 'cake')

**Campos especiales:**
- `base_price` - Precio base
- `min_portions`, `max_portions` - Rango de porciones
- `price_per_portion` - Precio por porción adicional
- `preparation_days` - Días de preparación

---

### 🥪 COCTELERÍA (Cocktails)

```
cocktail_categories (categorías principales)
    ↓
cocktail_subcategories (subcategorías)
    ↓
cocktail_products (productos)
    ↓
product_images (imágenes genéricas)
```

**Tablas:**
- `cocktail_categories` - Categorías principales
- `cocktail_subcategories` - Subcategorías
- `cocktail_products` - Productos de coctelería
- `product_images` - Imágenes (product_type = 'cocktail')

**Campos especiales:**
- `unit` - Unidad de medida (unidad, docena, bandeja)
- `min_order_quantity` - Cantidad mínima de pedido

---

### 🍰 PASTELERÍA (Pastry)

```
pastry_categories (categorías principales)
    ↓
pastry_subcategories (subcategorías opcionales)
    ↓
pastry_products (productos)
    ↓
product_images (imágenes genéricas)
```

**Tablas:**
- `pastry_categories` - Categorías principales (Pies, Tartas, Galletas, Bocaditos)
- `pastry_subcategories` - Subcategorías opcionales (Pies de Frutas, Galletas Decoradas, etc.)
- `pastry_products` - Productos de pastelería
- `product_images` - Imágenes (product_type = 'pastry')

**Campos especiales:**
- `unit` - Unidad de medida (unidad, docena, paquete)
- `min_order_quantity` - Cantidad mínima de pedido

---

## Tabla Genérica de Imágenes

### `product_images`
Una sola tabla para **TODAS** las imágenes de productos.

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_type VARCHAR(20) NOT NULL, -- 'cake', 'cocktail', 'pastry'
  product_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ
);
```

**Ventajas:**
- Una sola tabla para mantener
- Queries consistentes
- Fácil agregar nuevos tipos de productos en el futuro
- Panel admin simplificado

---

## Campos Comunes en Todas las Tablas

### Categorías (categories)
```sql
id UUID PRIMARY KEY
name VARCHAR(100) NOT NULL
slug VARCHAR(100) UNIQUE NOT NULL
description TEXT
image_url TEXT
is_active BOOLEAN DEFAULT true
order_index INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### Subcategorías (subcategories)
```sql
id UUID PRIMARY KEY
category_id UUID REFERENCES {product_type}_categories(id)
name VARCHAR(100) NOT NULL
slug VARCHAR(100) NOT NULL
description TEXT
is_active BOOLEAN DEFAULT true
order_index INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
UNIQUE(category_id, slug)
```

### Productos (products)
```sql
-- Campos comunes a TODOS los productos:
id UUID PRIMARY KEY
category_id UUID REFERENCES {product_type}_categories(id)
subcategory_id UUID REFERENCES {product_type}_subcategories(id) -- OPCIONAL
name VARCHAR(200) NOT NULL
slug VARCHAR(200) UNIQUE NOT NULL
description TEXT
short_description VARCHAR(300)
is_active BOOLEAN DEFAULT true
is_featured BOOLEAN DEFAULT false
order_index INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

-- Campos específicos por tipo de producto
```

---

## Funciones de Query Disponibles

### Productos Individuales
```typescript
// lib/supabase/product-queries.ts

getCakeProducts()      // Tortas con categorías, subcategorías e imágenes
getCocktailProducts()  // Coctelería con categorías, subcategorías e imágenes
getPastryProducts()    // Pastelería con categorías, subcategorías e imágenes
```

### Categorías con Productos
```typescript
getCakeCategoriesWithProducts()      // Estructura completa de tortas
getCocktailCategoriesWithProducts()  // Estructura completa de coctelería
getPastryCategoriesWithProducts()    // Estructura completa de pastelería
```

---

## Flujo de Datos

### Admin → Catálogos Públicos

```
ADMIN PORTAL (Unificado)
├─ Gestión de Categorías
│  ├─ Tortas
│  ├─ Coctelería
│  └─ Pastelería
│
├─ Gestión de Subcategorías
│  ├─ Tortas
│  ├─ Coctelería
│  └─ Pastelería
│
└─ Gestión de Productos
   ├─ Tortas (cake_products)
   ├─ Coctelería (cocktail_products)
   └─ Pastelería (pastry_products)

         ↓ PUBLICACIÓN ↓

CATÁLOGOS PÚBLICOS (Separados)
├─ /catalogo/tortas      → cake_products
├─ /catalogo/cocteleria  → cocktail_products
└─ /catalogo/pasteleria  → pastry_products
```

---

## Migraciones a Ejecutar

### Si NO has ejecutado migraciones previas:
```bash
# Ejecutar TODO en orden:
1. supabase/EJECUTAR_ESTO.sql           # Setup inicial
2. supabase/migrations/003_cocktail_products.sql
3. supabase/migrations/004_booking_system.sql
4. supabase/migrations/005_customer_stats_function.sql
5. supabase/EJECUTAR_PRODUCTOS_V2.sql   # Productos + imágenes genéricas
6. supabase/migrations/009_standardize_categories.sql  # Esta nueva migración
```

### Si YA ejecutaste EJECUTAR_PRODUCTOS_V2.sql:
```bash
# Solo ejecutar:
supabase/migrations/009_standardize_categories.sql
```

---

## Verificación de Estructura

### Tablas creadas (18 total):

**Sistema de pedidos:**
1. customers
2. orders
3. order_items
4. order_history

**Coctelería:**
5. cocktail_categories
6. cocktail_subcategories
7. cocktail_products

**Tortas:**
8. cake_categories
9. cake_subcategories ✨ NUEVA
10. cake_products

**Pastelería:**
11. pastry_categories ✨ NUEVA
12. pastry_subcategories ✨ NUEVA
13. pastry_products

**Imágenes (genérica):**
14. product_images

---

## Ejemplos de Uso

### Obtener todas las tortas con categorías e imágenes:
```typescript
import { getCakeProducts } from '@/lib/supabase/product-queries'

const { products } = await getCakeProducts()

// Resultado:
products[0] = {
  id: '...',
  name: 'Torta de Chocolate',
  category: {
    name: 'Clásicas',
    slug: 'clasicas'
  },
  subcategory: {
    name: 'Chocolate',
    slug: 'chocolate'
  },
  images: [
    { url: '...', is_primary: true },
    { url: '...', is_primary: false }
  ]
}
```

### Obtener estructura completa de pastelería:
```typescript
import { getPastryCategoriesWithProducts } from '@/lib/supabase/product-queries'

const { categories } = await getPastryCategoriesWithProducts()

// Resultado:
categories = [
  {
    name: 'Pies',
    subcategories: [
      {
        name: 'Pies de Frutas',
        products: [...]
      },
      {
        name: 'Pies de Crema',
        products: [...]
      }
    ]
  }
]
```

---

## Próximos Pasos

1. ✅ **Ejecutar migración 009_standardize_categories.sql**
2. ⏳ Verificar que todas las tablas existan
3. ⏳ Actualizar formulario de agendamiento para cargar desde BD
4. ⏳ Crear panel admin para gestión de productos
5. ⏳ Crear páginas públicas de catálogos

---

## Beneficios de la Estandarización

### ✅ Para el Desarrollador:
- Código reutilizable entre módulos
- Queries predecibles y consistentes
- Fácil mantenimiento
- Escalable para nuevos tipos de productos

### ✅ Para el Admin:
- Interfaz consistente para todos los productos
- Mismo flujo de trabajo para todas las categorías
- Gestión centralizada

### ✅ Para el Cliente:
- Experiencia uniforme en todos los catálogos
- Navegación coherente
- Filtros y búsqueda consistentes
