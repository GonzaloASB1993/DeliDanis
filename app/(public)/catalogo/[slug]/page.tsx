'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { formatCurrency } from '@/lib/utils/format'
import type { ProductWithVariants } from '@/types'

// Mock data - in real app, fetch based on slug
const mockProduct: ProductWithVariants = {
  id: '1',
  category_id: '1',
  name: 'Torta de Bodas Elegante',
  slug: 'torta-bodas-elegante',
  description:
    'Una exquisita torta de tres pisos diseñada especialmente para bodas. Cada nivel está decorado con elegantes flores naturales y detalles en fondant que crean una obra maestra comestible. Perfecta para celebraciones de 50 a 100 personas.\n\nNuestra torta de bodas combina sabores tradicionales con presentaciones modernas. Cada piso puede tener un sabor diferente según tus preferencias. Incluye decoración personalizada según el tema de tu boda.',
  short_description: 'Elegancia en tres niveles',
  base_price: 450000,
  min_portions: 50,
  max_portions: 100,
  price_per_portion: 9000,
  preparation_days: 7,
  is_customizable: true,
  is_active: true,
  is_featured: true,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [],
  variants: [
    {
      id: '1',
      product_id: '1',
      variant_type: 'flavor',
      name: 'Vainilla Francesa',
      price_modifier: 0,
      is_default: true,
      is_active: true,
      created_at: '',
    },
    {
      id: '2',
      product_id: '1',
      variant_type: 'flavor',
      name: 'Chocolate Belga',
      price_modifier: 15000,
      is_default: false,
      is_active: true,
      created_at: '',
    },
    {
      id: '3',
      product_id: '1',
      variant_type: 'flavor',
      name: 'Red Velvet',
      price_modifier: 20000,
      is_default: false,
      is_active: true,
      created_at: '',
    },
    {
      id: '4',
      product_id: '1',
      variant_type: 'filling',
      name: 'Crema de Mantequilla',
      price_modifier: 0,
      is_default: true,
      is_active: true,
      created_at: '',
    },
    {
      id: '5',
      product_id: '1',
      variant_type: 'filling',
      name: 'Frutas Frescas',
      price_modifier: 10000,
      is_default: false,
      is_active: true,
      created_at: '',
    },
  ],
}

export default function ProductDetailPage() {
  const params = useParams()
  const [portions, setPortions] = useState(mockProduct.min_portions)
  const [selectedFlavor, setSelectedFlavor] = useState(
    mockProduct.variants.find((v) => v.variant_type === 'flavor' && v.is_default)?.id || mockProduct.variants[0].id
  )
  const [selectedFilling, setSelectedFilling] = useState(
    mockProduct.variants.find((v) => v.variant_type === 'filling' && v.is_default)?.id || mockProduct.variants[3].id
  )

  const flavorVariants = mockProduct.variants.filter((v) => v.variant_type === 'flavor')
  const fillingVariants = mockProduct.variants.filter((v) => v.variant_type === 'filling')

  const selectedFlavorVariant = mockProduct.variants.find((v) => v.id === selectedFlavor)
  const selectedFillingVariant = mockProduct.variants.find((v) => v.id === selectedFilling)

  const calculateTotal = () => {
    let total = mockProduct.base_price
    if (selectedFlavorVariant) total += selectedFlavorVariant.price_modifier
    if (selectedFillingVariant) total += selectedFillingVariant.price_modifier
    if (mockProduct.price_per_portion && portions > mockProduct.min_portions) {
      total += (portions - mockProduct.min_portions) * mockProduct.price_per_portion
    }
    return total
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-secondary py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-light hover:text-primary">
              Inicio
            </Link>
            <span className="text-dark-light">/</span>
            <Link href="/catalogo" className="text-dark-light hover:text-primary">
              Catálogo
            </Link>
            <span className="text-dark-light">/</span>
            <span className="text-dark">{mockProduct.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-2xl overflow-hidden">
              {/* Main image placeholder */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🎂</div>
                  <p className="text-dark-light">Imagen principal del producto</p>
                </div>
              </div>
            </div>
            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className="aspect-square bg-secondary rounded-lg hover:ring-2 hover:ring-primary transition-all"
                >
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🎂
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {mockProduct.is_featured && (
              <Badge variant="primary" className="mb-4">
                Producto Destacado
              </Badge>
            )}

            <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-4">
              {mockProduct.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-accent font-display">
                {formatCurrency(calculateTotal())}
              </span>
              <span className="text-dark-light">precio total</span>
            </div>

            {/* Description */}
            <div className="prose prose-lg mb-8">
              <p className="text-dark-light whitespace-pre-line">
                {mockProduct.description}
              </p>
            </div>

            {/* Portions Selector */}
            <div className="mb-6">
              <label className="block font-semibold text-dark mb-3">
                Número de Porciones
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setPortions(Math.max(mockProduct.min_portions, portions - 5))
                  }
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-bold"
                  disabled={portions <= mockProduct.min_portions}
                >
                  -
                </button>
                <span className="text-2xl font-bold text-dark min-w-[60px] text-center">
                  {portions}
                </span>
                <button
                  onClick={() =>
                    setPortions(Math.min(mockProduct.max_portions, portions + 5))
                  }
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-bold"
                  disabled={portions >= mockProduct.max_portions}
                >
                  +
                </button>
              </div>
              <p className="text-sm text-dark-light mt-2">
                Rango: {mockProduct.min_portions} - {mockProduct.max_portions}{' '}
                porciones
              </p>
            </div>

            {/* Flavor Selector */}
            {flavorVariants.length > 0 && (
              <div className="mb-6">
                <label className="block font-semibold text-dark mb-3">Sabor</label>
                <div className="grid grid-cols-2 gap-3">
                  {flavorVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedFlavor(variant.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedFlavor === variant.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-dark">{variant.name}</div>
                      {variant.price_modifier > 0 && (
                        <div className="text-sm text-dark-light">
                          +{formatCurrency(variant.price_modifier)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filling Selector */}
            {fillingVariants.length > 0 && (
              <div className="mb-8">
                <label className="block font-semibold text-dark mb-3">Relleno</label>
                <div className="grid grid-cols-2 gap-3">
                  {fillingVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedFilling(variant.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedFilling === variant.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-dark">{variant.name}</div>
                      {variant.price_modifier > 0 && (
                        <div className="text-sm text-dark-light">
                          +{formatCurrency(variant.price_modifier)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-secondary rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-dark mb-4">Detalles del Producto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-dark-light">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Tiempo de preparación: {mockProduct.preparation_days} días</span>
                </div>
                {mockProduct.is_customizable && (
                  <div className="flex items-center gap-3 text-dark-light">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                    <span>100% Personalizable según tus preferencias</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/agendar" className="flex-1">
                <Button size="lg" className="w-full">
                  Agendar Pedido
                </Button>
              </Link>
              <Link href="/cotizar" className="flex-1">
                <Button size="lg" variant="secondary" className="w-full">
                  Cotizar Personalizado
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </>
  )
}
