# DeliDanis - Pastelería Premium SaaS

Sistema web completo para pastelería especializada en tortas para eventos. Incluye sitio público con catálogo y agendamiento, más panel administrativo SaaS para gestión integral del negocio.

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Animaciones**: GSAP
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Mensajería**: Twilio (WhatsApp Business API)
- **Email**: Resend
- **Pagos**: Mercado Pago / Stripe
- **Deploy**: Vercel

## Características Principales

### Sitio Público
- Catálogo de productos con filtros avanzados
- Sistema de agendamiento con calendario de disponibilidad
- Formulario de cotizaciones personalizadas
- Sistema de pagos integrado (señas y pagos completos)
- Seguimiento de pedidos en tiempo real
- Diseño responsive con animaciones GSAP

### Panel Administrativo
- Dashboard con KPIs y métricas
- Gestión completa de pedidos
- Calendario de producción
- Administración de catálogo de productos
- Sistema de cotizaciones
- Control de inventario
- CRM de clientes
- Módulo financiero
- Gestión de usuarios y permisos

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd DeliDanis
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.local.example .env.local
# Editar .env.local con tus credenciales
```

4. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run db:types` - Genera tipos de TypeScript desde Supabase
- `npm run db:push` - Aplica cambios al esquema de base de datos
- `npm run db:reset` - Resetea la base de datos
- `npm run email:dev` - Inicia el servidor de desarrollo para emails

## Estructura del Proyecto

```
/
├── app/                      # Rutas de Next.js (App Router)
│   ├── (public)/            # Sitio público
│   ├── (auth)/              # Autenticación
│   └── admin/               # Panel administrativo
├── components/              # Componentes React
│   ├── ui/                  # Componentes base
│   ├── layout/              # Layout components
│   ├── public/              # Componentes del sitio público
│   └── admin/               # Componentes del panel admin
├── lib/                     # Librerías y utilidades
│   ├── supabase/           # Cliente de Supabase
│   ├── gsap/               # Configuración GSAP
│   ├── utils/              # Funciones utilitarias
│   ├── email/              # Configuración de emails
│   ├── twilio/             # Configuración de Twilio
│   └── payments/           # Integración de pagos
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand stores
├── types/                   # Tipos de TypeScript
├── emails/                  # Templates de email (React Email)
└── public/                  # Archivos estáticos
```

## Design System

### Colores

- **Primary**: `#D4847C` (Rosa terracota)
- **Secondary**: `#F7F3EF` (Blanco algodón)
- **Accent**: `#B8860B` (Dorado oscuro)
- **Dark**: `#3D3D3D` (Gris carbón)

### Tipografía

- **Display**: Playfair Display (headings)
- **Body**: Inter (texto general)
- **Accent**: Cormorant Garamond (detalles especiales)

### Componentes UI

El proyecto incluye componentes UI base reutilizables:
- Button (variantes: primary, secondary, ghost)
- Input, Textarea
- Card con subcomponentes
- Badge
- Skeleton (loading states)

Importación centralizada:
```typescript
import { Button, Card, Input, Badge } from '@/components/ui'
```

## Configuración de Base de Datos

Ver `claude.md` para el esquema completo de base de datos con todas las tablas, índices y políticas RLS.

## Integraciones

### Supabase
- Configurar proyecto en [supabase.com](https://supabase.com)
- Crear las tablas según el esquema en `claude.md`
- Configurar RLS (Row Level Security)
- Agregar credenciales en `.env.local`

### Twilio (WhatsApp)
- Crear cuenta en [twilio.com](https://twilio.com)
- Configurar WhatsApp Business API
- Crear templates de mensajes
- Agregar credenciales en `.env.local`

### Resend (Email)
- Crear cuenta en [resend.com](https://resend.com)
- Configurar dominio de email
- Agregar API key en `.env.local`

### Pagos
- **Mercado Pago**: Configurar en [mercadopago.com](https://mercadopago.com)
- **Stripe**: Configurar en [stripe.com](https://stripe.com)

## Desarrollo

### Convenciones de Código

- Componentes en PascalCase: `ProductCard.tsx`
- Hooks con prefijo `use`: `useAuth.ts`
- Utilidades en camelCase: `formatDate.ts`
- Constantes en SCREAMING_SNAKE_CASE

### Order de Imports

1. React/Next
2. Librerías externas
3. Componentes internos
4. Hooks/Stores
5. Utils/Lib
6. Types

## Deploy

### Vercel

1. Importar el proyecto en [vercel.com](https://vercel.com)
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

## Documentación Adicional

Ver `claude.md` para documentación técnica completa incluyendo:
- Esquema completo de base de datos
- Especificación de módulos
- Guías de animaciones GSAP
- Detalles de integraciones

## Licencia

Todos los derechos reservados - DeliDanis

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.
