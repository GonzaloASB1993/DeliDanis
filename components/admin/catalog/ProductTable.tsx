'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type ProductType } from '@/lib/supabase/catalog-mutations'
import { cn } from '@/lib/utils/cn'

interface ProductTableProps {
  products: any[]
  productType: ProductType
  isLoading: boolean
  onEdit: (product: any) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentValue: boolean) => void
  onToggleFeatured: (id: string, currentValue: boolean) => void
}

export function ProductTable({
  products,
  productType,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}: ProductTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getPrice = (product: any) => {
    if (productType === 'cake') {
      return product.base_price
    }
    return product.price
  }

  const getCategoryName = (product: any) => {
    if (productType === 'cocktail') {
      return product.subcategory?.category?.name || product.subcategory?.name || '-'
    }
    return product.category?.name || '-'
  }

  const getSubcategoryName = (product: any) => {
    if (productType === 'cocktail') {
      return product.subcategory?.name || '-'
    }
    return product.subcategory?.name || '-'
  }

  const getPrimaryImage = (product: any) => {
    if (product.images?.length > 0) {
      const primary = product.images.find((img: any) => img.is_primary)
      return primary?.url || product.images[0]?.url
    }
    if (product.image_url) {
      return product.image_url
    }
    return null
  }

  const sortedProducts = [...products].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === 'price') {
      comparison = getPrice(a) - getPrice(b)
    } else {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (column: 'name' | 'price' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: string }) => (
    <svg
      className={cn(
        'w-4 h-4 ml-1 inline-block transition-transform',
        sortBy === column && sortOrder === 'desc' && 'rotate-180'
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-dark-light">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-dark mb-2">No hay productos</h3>
          <p className="text-dark-light">Crea tu primer producto para comenzar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Categoría
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-primary"
                onClick={() => handleSort('price')}
              >
                Precio
                <SortIcon column="price" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Destacado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                {/* Producto */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {getPrimaryImage(product) ? (
                        <Image
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-dark">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-dark-light line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Categoría */}
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-dark">{getCategoryName(product)}</p>
                    {getSubcategoryName(product) !== '-' && getSubcategoryName(product) !== getCategoryName(product) && (
                      <p className="text-xs text-dark-light">{getSubcategoryName(product)}</p>
                    )}
                  </div>
                </td>

                {/* Precio */}
                <td className="px-4 py-4">
                  <p className="font-semibold text-dark">{formatPrice(getPrice(product))}</p>
                  {productType === 'cake' && product.price_per_portion && (
                    <p className="text-xs text-dark-light">
                      +{formatPrice(product.price_per_portion)}/porción
                    </p>
                  )}
                  {productType === 'cocktail' && product.min_order_quantity && (
                    <p className="text-xs text-dark-light">
                      Mín. {product.min_order_quantity} unidades
                    </p>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => onToggleActive(product.id, product.is_active)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      product.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      product.is_active ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>

                {/* Destacado */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => onToggleFeatured(product.id, product.is_featured)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      product.is_featured
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
                    )}
                    title={product.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                  >
                    <svg className="w-5 h-5" fill={product.is_featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </td>

                {/* Acciones */}
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con conteo */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-sm text-dark-light">
          Mostrando {products.length} producto{products.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
