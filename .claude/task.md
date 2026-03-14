# DeliDanis - Task Tracker

> Estado completo del proyecto. Checkboxes marcados = implementado y funcional.

---

## Milestone 1: Setup y Base

- [x] Inicializar Next.js 14 + TypeScript + App Router
- [x] Configurar Tailwind CSS + Design tokens (colores, tipografía)
- [x] Setup Supabase (proyecto, tablas, RLS, migraciones)
- [x] Configurar GSAP + ScrollTrigger
- [x] Crear componentes UI base (Button, Input, Card, Badge, Skeleton)
- [x] Configurar fuentes (Playfair Display, Inter, Cormorant Garamond)
- [x] Estructura de carpetas según CLAUDE.md
- [x] Variables de entorno configuradas

---

## Milestone 2: Sitio Público

### Layout
- [x] Navbar responsive con MobileMenu
- [x] Footer con info del negocio
- [x] Layout público (app/(public)/layout.tsx)

### Home
- [x] Hero con animaciones GSAP
- [x] Productos destacados (FeaturedProducts)
- [x] Sección de servicios (ServicesSection) — Tortas, Pastelería, Coctelería
- [x] Carrusel de testimonios (TestimonialsCarousel)
- [x] CTA Section
- [x] Hook useAnimations (fadeInUp, stagger)

### Catálogo
- [x] Página principal catálogo con ProductGrid
- [x] ProductCard con hover effects
- [x] Catálogo Pastelería (catalogo/pasteleria)
- [x] Catálogo Coctelería (catalogo/cocteleria)
- [x] Detalle de producto ([slug]/page.tsx)
- [x] ProductDetailModal
- [x] Datos desde Supabase (product-queries.ts)

### Agendamiento
- [x] Flujo multi-servicio (tortas, pastelería, coctelería)
- [x] TortaServiceForm
- [x] PastryServiceForm
- [x] CocktailServiceForm
- [x] ProductSelector por servicio
- [x] ServiceCart (carrito de servicios)
- [x] Página de confirmación
- [x] Store multi-servicio (bookingStoreMulti.ts)

### Otras Páginas Públicas
- [x] Página Galería (/galeria) — grid masonry con lightbox, filtros por categoría, animaciones GSAP, datos desde BD con fallback estático
- [x] Página Contacto (/contacto) — formulario, info de contacto, FAQ, CTA WhatsApp
- [x] Página Nosotros (/nosotros) — historia, equipo, valores
- [x] WhatsAppButton flotante — componente reutilizable en todas las páginas
- [x] Número de contacto actualizado (+56 9 3928 2764) en todo el frontend (Footer, catálogo, modales, WhatsApp)

### Pendientes Sitio Público
- [ ] Página Cotizar (/cotizar) — formulario detallado + subida imágenes
- [ ] Seguimiento de pedido (/seguimiento/[codigo]) — timeline estado

---

## Milestone 3: Panel Admin Core

### Auth y Acceso
- [x] Middleware de autenticación (middleware.ts)
- [x] Hook useAuth
- [x] Store authStore
- [x] Tipos auth (types/auth.ts)
- [x] Login admin funcional
- [x] RLS policies configuradas

### Admin Implementado
- [x] Layout admin con sidebar
- [x] Dashboard con estadísticas (DashboardStats)
- [x] Gestión de pedidos (OrdersTable, OrderDetail)
- [x] Catálogo admin — CRUD productos (ProductForm)
- [x] Inventario — stock y movimientos (InventoryTable)
- [x] Queries Supabase: booking-mutations, catalog-mutations, dashboard-queries, inventory-queries, orders-queries, production-queries

### Admin Pendiente
- [ ] Calendario visual (CalendarView) — vista mes/semana/día, drag & drop
- [ ] Cotizaciones admin — lista, respuesta, conversión a pedido (QuoteBuilder)
- [ ] Clientes CRM (ClientsTable) — historial, etiquetas, notas
- [ ] Finanzas (FinanceCharts) — ingresos/egresos, reportes, gráficos
- [ ] Gestión de usuarios — roles y permisos
- [ ] Configuración del negocio — capacidad, mensajes, notificaciones

---

## Milestone 4: Admin Avanzado

- [ ] Reportes exportables (PDF, Excel)
- [ ] Configuración avanzada del negocio (settings)
- [ ] Plantillas de mensajes WhatsApp/Email (admin)
- [x] Gestión de galería desde admin — CRUD completo con upload, edición, toggle activo, eliminación (admin/galeria)
- [x] Migración BD gallery_images (014_gallery_images.sql) — tabla, índices, RLS
- [x] Queries/mutations galería (lib/supabase/gallery-queries.ts) — 7 funciones CRUD
- [x] Galería pública conectada a BD con fallback a imágenes estáticas
- [ ] Gestión de testimonios desde admin
- [ ] Capacidad diaria (daily_capacity) — UI admin
- [ ] Notificaciones internas (alertas stock, pedidos nuevos)

---

## Milestone 5: Componentes UI Faltantes

- [ ] Modal component (components/ui/Modal.tsx)
- [ ] Select component (components/ui/Select.tsx)
- [ ] Toast/notifications system (components/ui/Toast.tsx)
- [ ] Avatar component (components/ui/Avatar.tsx)
- [ ] Calendar picker component (components/ui/Calendar.tsx)
- [ ] CategoryFilter component (components/public/CategoryFilter.tsx)

---

## Milestone 6: Integración Pagos

- [ ] MercadoPago — Checkout Pro para señas/pagos
- [ ] Stripe — alternativa internacional
- [ ] Webhook MercadoPago (api/webhooks/mercadopago)
- [ ] Webhook Stripe (api/webhooks/stripe)
- [ ] Flujo de pago en agendamiento
- [ ] Confirmación de pago automática
- [ ] Registro de transacciones en tabla transactions

---

## Milestone 7: Integración Email

- [x] Configurar Resend (lib/email/client.ts)
- [x] Dominio delidanis.cl verificado en Resend (DNS SPF/DKIM en Cloudflare)
- [x] Emails configurados: pedidos@delidanis.cl (envío), contacto@delidanis.cl (recepción → danitza.faune@gmail.com)
- [x] Logo hosteado en Supabase Storage para uso en emails
- [x] Templates HTML profesionales (lib/email/templates.ts):
  - [x] Notificación nuevo pedido al admin (contacto@delidanis.cl)
  - [x] Confirmación de pedido al cliente
  - [x] Pedido listo al cliente (diferencia retiro vs despacho)
  - [ ] Confirmación de pago
  - [ ] Respuesta cotización
  - [ ] Recordatorio día anterior
- [x] API routes:
  - [x] /api/email/notify-order — notifica al negocio cuando llega pedido
  - [x] /api/email/confirm-order — confirma pedido al cliente
  - [x] /api/email/order-ready — informa al cliente que su pedido está listo
- [x] Envío automático en cambios de estado:
  - [x] Nuevo pedido → email al admin
  - [x] Estado "confirmed" → email al cliente
  - [x] Estado "ready" → email al cliente

---

## Milestone 8: Integración WhatsApp

- [ ] Configurar Twilio (lib/twilio/client.ts)
- [ ] Templates WhatsApp (lib/twilio/templates.ts):
  - [ ] Confirmación de pedido
  - [ ] Actualización de estado
  - [ ] Recordatorio día anterior
  - [ ] Respuesta a cotización
  - [ ] Seguimiento post-entrega
- [ ] Webhook Twilio (api/webhooks/twilio)
- [ ] Cron recordatorios (api/cron/recordatorios)

---

## Milestone 9: Auth Público (Clientes)

- [ ] Página Login (/login)
- [ ] Página Registro (/registro)
- [ ] Página Recuperar contraseña (/recuperar)
- [ ] Perfil de cliente con historial de pedidos
- [ ] Integración con tabla customers

---

## Milestone 10: Polish y Deploy

- [ ] SEO — metadata, Open Graph, sitemap.xml, robots.txt
- [ ] Optimización de imágenes — next/image, formatos modernos
- [ ] Testing — unit tests, integration tests
- [ ] Analytics — Google Analytics o Vercel Analytics
- [ ] Performance — Lighthouse audit, lazy loading
- [ ] Accesibilidad — ARIA, contraste, navegación teclado
- [ ] Deploy producción en Vercel
- [ ] Dominio personalizado
- [ ] Variables de entorno en Vercel

---

## Resumen de Progreso

| Milestone | Estado | Completado |
|-----------|--------|------------|
| 1. Setup y Base | DONE | 100% |
| 2. Sitio Público | Mayormente done | ~90% |
| 3. Panel Admin Core | Parcial | ~50% |
| 4. Admin Avanzado | En progreso | ~30% |
| 5. UI Faltantes | Pendiente | 0% |
| 6. Pagos | Pendiente | 0% |
| 7. Email | En progreso | ~70% |
| 8. WhatsApp | Pendiente | 0% |
| 9. Auth Público | Pendiente | 0% |
| 10. Polish y Deploy | Pendiente | 0% |
