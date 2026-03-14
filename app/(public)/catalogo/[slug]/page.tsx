'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { formatCurrency } from '@/lib/utils/format'
import { getCakeProducts } from '@/lib/supabase/product-queries'

interface ProductImage {
  id: string
  url: string
  alt_text?: string
  is_primary: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  base_price: number
  min_portions: number
  max_portions: number
  price_per_portion?: number
  preparation_days?: number
  is_customizable?: boolean
  is_featured?: boolean
  category?: { name: string }
  subcategory?: { name: string }
  images?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Cargar producto
  useEffect(() => {
    async function loadProduct() {
      try {
        const { success, products } = await getCakeProducts()
        if (success) {
          const found = products.find((p: Product) => p.slug === slug)
          if (found) {
            setProduct(found)
          }
        }
      } catch (error) {
        console.error('Error loading product:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProduct()
  }, [slug])

  // Estado de porciones
  const minPortions = product?.min_portions || 15
  const maxPortions = product?.max_portions || 80
  const [portions, setPortions] = useState(minPortions)

  // Actualizar porciones cuando carga el producto
  useEffect(() => {
    if (product) {
      setPortions(product.min_portions || 15)
    }
  }, [product])

  // Calcular precio
  const calculatedPrice = useMemo(() => {
    if (!product) return 0
    const basePrice = product.base_price || 0
    const pricePerPortion = product.price_per_portion || 0
    const extraPortions = Math.max(0, portions - minPortions)
    return basePrice + (extraPortions * pricePerPortion)
  }, [product, portions, minPortions])

  const images = product?.images || []
  const currentImage = images[selectedImageIndex]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-light text-lg">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-dark mb-4">Producto no encontrado</h2>
          <p className="text-dark-light mb-6">El producto que buscas no existe o fue eliminado.</p>
          <Link
            href="/catalogo"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-block"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    )
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
            <span className="text-dark">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-2xl overflow-hidden relative">
              {currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt_text || product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-8xl">🎂</div>
                </div>
              )}
              {product.is_featured && (
                <div className="absolute top-4 left-4">
                  <Badge variant="primary">Destacado</Badge>
                </div>
              )}
            </div>
            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImageIndex
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt_text || `${product.name} ${i + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Torta
              </span>
              {product.category && (
                <span className="px-3 py-1 bg-secondary text-dark rounded-full text-sm font-medium">
                  {product.category.name}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-dark mb-4">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="text-dark-light text-lg leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Portions Selector */}
            <div className="bg-secondary/50 rounded-xl p-5 mb-6">
              <label className="block font-semibold text-dark mb-3">
                Número de Porciones
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPortions(Math.max(minPortions, portions - 5))}
                  disabled={portions <= minPortions}
                  className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-dark">{portions}</span>
                  <span className="text-dark-light ml-2">personas</span>
                </div>
                <button
                  onClick={() => setPortions(Math.min(maxPortions, portions + 5))}
                  disabled={portions >= maxPortions}
                  className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-dark-light mt-3 text-center">
                Rango: {minPortions} - {maxPortions} porciones
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-secondary rounded-xl p-5 mb-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-sm text-dark-light mb-1">Precio total</p>
                  <p className="font-display text-3xl md:text-4xl font-bold text-accent">
                    {formatCurrency(calculatedPrice)}
                  </p>
                </div>
              </div>
              {product.price_per_portion && product.price_per_portion > 0 && (
                <div className="pt-3 border-t border-white/50 text-sm text-dark-light space-y-1">
                  <div className="flex justify-between">
                    <span>Precio base ({minPortions} porciones)</span>
                    <span>{formatCurrency(product.base_price)}</span>
                  </div>
                  {portions > minPortions && (
                    <div className="flex justify-between">
                      <span>+{portions - minPortions} porciones extra</span>
                      <span>+{formatCurrency((portions - minPortions) * product.price_per_portion)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {product.preparation_days && (
                <div className="flex items-center gap-2 text-dark-light">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{product.preparation_days} días de preparación</span>
                </div>
              )}
              {product.is_customizable && (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>100% Personalizable</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/agendar" className="flex-1">
                <Button size="lg" className="w-full">
                  Agendar Pedido
                </Button>
              </Link>
              <a
                href={`https://wa.me/56939282764?text=Hola, me interesa: ${product.name} para ${portions} personas`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar
              </a>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </>
  )
}
