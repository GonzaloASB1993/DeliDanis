# B2B Portal para Cafeterías — Spec

## Resumen

Portal separado (`/b2b`) donde cafeterías con cuenta creada por admin pueden ver el catálogo con precios mayoristas, seleccionar cantidades, enviar pedidos, y consultar historial con opción de repetir pedidos anteriores.

---

## Rutas

```
app/b2b/
├── login/page.tsx          # Login para cafeterías
├── layout.tsx              # Layout B2B (navbar simple)
├── page.tsx                # Catálogo con precios mayoristas
├── carrito/page.tsx        # Resumen del pedido
├── pedidos/
│   ├── page.tsx            # Historial de pedidos
│   └── [id]/page.tsx       # Detalle de un pedido
└── perfil/page.tsx         # Datos de la cafetería (solo lectura)
```

---

## Layout B2B

Navbar superior minimalista:
- Logo DeliDanis (link a `/b2b`)
- Nombre de la cafetería logueada
- Link "Mis Pedidos" → `/b2b/pedidos`
- Icono carrito con badge de cantidad → `/b2b/carrito`
- Botón logout

Sin sidebar. Fondo claro, estética de tienda.

---

## Modelo de Datos

### Cambios a tablas existentes

**`customers`** — nuevo campo:
```sql
ALTER TABLE customers ADD COLUMN type VARCHAR(20) DEFAULT 'particular';
-- valores: 'particular', 'business'
```

**`orders`** — nuevo campo:
```sql
ALTER TABLE orders ADD COLUMN channel VARCHAR(20) DEFAULT 'public';
-- valores: 'public', 'b2b'
```

**`user_profiles`** — agregar rol `b2b_client` a la lista de roles válidos.

### Nueva tabla

```sql
CREATE TABLE b2b_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX idx_b2b_prices_product ON b2b_prices(product_id);
```

---

## Autenticación y Autorización

- Nuevo rol: `b2b_client`
- Middleware: rutas `/b2b/*` (excepto `/b2b/login`) requieren sesión con rol `b2b_client`
- Si no autenticado → redirige a `/b2b/login`
- Si autenticado pero rol incorrecto → redirige a `/b2b/login` con error

### RLS

```sql
-- b2b_prices: lectura pública para usuarios autenticados con rol b2b_client
CREATE POLICY "B2B clients can read prices" ON b2b_prices
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'b2b_client')
  );

-- orders: B2B clients solo ven sus propios pedidos
CREATE POLICY "B2B clients see own orders" ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );
```

---

## Flujo: Catálogo (`/b2b`)

**Vista:** Grid de productos (reutiliza datos de `products` donde `is_active = true`).

**Cada card muestra:**
- Imagen principal del producto
- Nombre
- Precio mayorista (de `b2b_prices`)
- Input numérico de cantidad (mínimo según `b2b_prices.min_quantity`)
- Botón "Agregar"

**Filtros:** Por categoría (mismas categorías del catálogo público).

**Productos sin precio B2B asignado:** No se muestran en el portal B2B.

---

## Flujo: Carrito (`/b2b/carrito`)

**Persistencia:** `localStorage` bajo key `b2b_cart_{user_id}`.

**Vista:** Tabla con columnas:
- Producto (imagen thumb + nombre)
- Precio unitario
- Cantidad (editable con +/-)
- Subtotal
- Botón eliminar

**Footer:** Total general + botón "Confirmar Pedido".

**Confirmar pedido:**
1. Crea `order` con `channel = 'b2b'`, `status = 'pending'`
2. Crea `order_items` por cada producto
3. Asocia al `customer` del usuario logueado
4. Limpia carrito
5. Redirige a `/b2b/pedidos/[id]` con mensaje de éxito

---

## Flujo: Historial de Pedidos (`/b2b/pedidos`)

**Vista:** Lista de pedidos ordenados por fecha (más reciente primero).

**Cada fila:**
- Número de pedido
- Fecha
- Cantidad de items
- Total
- Estado (badge con color)
- Botón "Repetir pedido"

**Repetir pedido:** Carga los mismos items y cantidades al carrito, redirige a `/b2b/carrito`.

**Detalle (`/b2b/pedidos/[id]`):** Muestra items, cantidades, precios, total, estado actual, fecha de creación.

---

## Gestión Admin

### Crear usuario B2B

Desde `/admin/clientes` → botón "Nuevo Cliente B2B":
1. Formulario: nombre cafetería, email, teléfono, dirección, contraseña inicial
2. Crea `auth.users` (via Supabase Admin API)
3. Crea `user_profiles` con rol `b2b_client`
4. Crea `customers` con type `business` y `user_id` vinculado

### Precios B2B

Se gestiona desde la ficha de cada producto en `/admin/catalogo/[id]`, en una pestaña "B2B":
- Toggle "Disponible para B2B" (si está off, el producto no aparece en el portal B2B)
- Campo "Precio mayorista" (obligatorio si el toggle está activo)
- Campo "Cantidad mínima" (default 1)

### Pedidos B2B en admin

Los pedidos B2B aparecen en la sección de pedidos/agendamientos existente:
- Filtro por canal: "Todos", "Público", "B2B"
- Badge "B2B" en la lista para identificarlos rápidamente
- Mismo flujo de gestión de estados que pedidos normales

---

## Componentes a crear

| Componente | Ubicación | Descripción |
|-----------|-----------|-------------|
| `B2BNavbar` | `components/b2b/B2BNavbar.tsx` | Navbar del portal |
| `B2BProductCard` | `components/b2b/B2BProductCard.tsx` | Card con precio y selector cantidad |
| `B2BProductGrid` | `components/b2b/B2BProductGrid.tsx` | Grid del catálogo |
| `B2BCart` | `components/b2b/B2BCart.tsx` | Tabla del carrito |
| `B2BOrderList` | `components/b2b/B2BOrderList.tsx` | Historial de pedidos |
| `B2BOrderDetail` | `components/b2b/B2BOrderDetail.tsx` | Detalle de pedido |
| `B2BLoginForm` | `components/b2b/B2BLoginForm.tsx` | Form de login |

### Store

```typescript
// stores/b2bCartStore.ts (Zustand)
interface B2BCartItem {
  productId: string
  productName: string
  imageUrl: string
  quantity: number
  unitPrice: number
}

interface B2BCartStore {
  items: B2BCartItem[]
  addItem: (item: B2BCartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  total: () => number
  itemCount: () => number
  loadFromOrder: (orderId: string) => Promise<void>
}
```

---

## Fuera de alcance (v1)

- Pago online para B2B (se factura por separado)
- Descuentos por volumen automáticos
- Catálogo personalizado por cafetería
- Chat/mensajería integrada
- Fecha de entrega en el pedido (se coordina por WhatsApp)
