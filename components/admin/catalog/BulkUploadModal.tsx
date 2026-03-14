'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { type ProductType } from '@/lib/supabase/catalog-mutations'

interface BulkUploadModalProps {
  productType: ProductType
  categories: any[]
  subcategories: any[]
  onClose: () => void
  onSuccess: () => void
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ProductRow {
  nombre: string
  descripcion?: string
  categoria: string
  subcategoria?: string
  precio: number
  precio_base?: number
  precio_por_porcion?: number
  min_porciones?: number
  max_porciones?: number
  dias_preparacion?: number
  unidad?: string
  cantidad_minima?: number
  personalizable?: boolean
  activo?: boolean
  destacado?: boolean
}

export function BulkUploadModal({
  productType,
  categories,
  subcategories,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ProductRow[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)

  const getTemplateColumns = () => {
    const common = ['nombre*', 'descripcion', 'categoria*', 'subcategoria', 'activo', 'destacado']

    if (productType === 'cake') {
      return [...common.slice(0, 4), 'precio_base*', 'precio_por_porcion', 'min_porciones', 'max_porciones', 'dias_preparacion', 'personalizable', ...common.slice(4)]
    } else if (productType === 'cocktail') {
      return [...common.slice(0, 4), 'precio*', 'cantidad_minima', ...common.slice(4)]
    } else {
      return [...common.slice(0, 4), 'precio*', 'unidad*', 'cantidad_minima', ...common.slice(4)]
    }
  }

  const downloadTemplate = () => {
    const columns = getTemplateColumns()

    // Crear hoja de datos con encabezados
    const ws = XLSX.utils.aoa_to_sheet([columns])

    // Agregar ejemplos
    const examples: any[][] = []
    if (productType === 'cake') {
      examples.push([
        'Torta de Chocolate',
        'Deliciosa torta de chocolate con ganache',
        categories[0]?.name || 'Clásicas',
        '',
        150000,
        2500,
        15,
        50,
        3,
        'SI',
        'SI',
        'NO'
      ])
    } else if (productType === 'cocktail') {
      examples.push([
        'Mini Empanadas',
        'Empanadas de pino caseras',
        categories[0]?.name || 'Salados',
        subcategories[0]?.name || 'Empanadas',
        3500,
        15,
        'SI',
        'NO'
      ])
    } else {
      examples.push([
        'Pie de Limón',
        'Clásico pie de limón con merengue',
        categories[0]?.name || 'Pies',
        '',
        25000,
        'unidad',
        1,
        'SI',
        'SI'
      ])
    }
    XLSX.utils.sheet_add_aoa(ws, examples, { origin: 1 })

    // Crear hoja de categorías válidas
    const catSheet = XLSX.utils.aoa_to_sheet([
      ['Categorías válidas'],
      ...categories.map(c => [c.name])
    ])

    // Crear hoja de subcategorías válidas
    const subSheet = XLSX.utils.aoa_to_sheet([
      ['Subcategoría', 'Categoría padre'],
      ...subcategories.map(s => [s.name, categories.find(c => c.id === s.category_id)?.name || ''])
    ])

    // Crear workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.utils.book_append_sheet(wb, catSheet, 'Categorías')
    XLSX.utils.book_append_sheet(wb, subSheet, 'Subcategorías')

    // Ajustar anchos de columna
    ws['!cols'] = columns.map(() => ({ wch: 20 }))

    // Descargar
    const typeLabels = { cake: 'Tortas', cocktail: 'Cocteleria', pastry: 'Pasteleria' }
    XLSX.writeFile(wb, `plantilla_${typeLabels[productType]}.xlsx`)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])
    setUploadResult(null)
    setIsValidating(true)

    try {
      const data = await readExcelFile(selectedFile)
      const { rows, validationErrors } = validateData(data)
      setPreviewData(rows)
      setErrors(validationErrors)
    } catch (error) {
      console.error('Error reading file:', error)
      setErrors([{ row: 0, field: 'archivo', message: 'Error al leer el archivo' }])
    } finally {
      setIsValidating(false)
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const validateData = (data: any[]): { rows: ProductRow[]; validationErrors: ValidationError[] } => {
    const validationErrors: ValidationError[] = []
    const rows: ProductRow[] = []

    const categoryNames = categories.map(c => c.name.toLowerCase())
    const subcategoryNames = subcategories.map(s => s.name.toLowerCase())

    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 porque Excel empieza en 1 y tiene encabezado

      // Validar nombre (requerido)
      const nombre = row['nombre*'] || row['nombre']
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        validationErrors.push({ row: rowNum, field: 'nombre', message: 'El nombre es requerido' })
      }

      // Validar categoría (requerida)
      const categoria = row['categoria*'] || row['categoria']
      if (!categoria || typeof categoria !== 'string' || categoria.trim() === '') {
        validationErrors.push({ row: rowNum, field: 'categoria', message: 'La categoría es requerida' })
      } else if (!categoryNames.includes(categoria.toLowerCase().trim())) {
        validationErrors.push({ row: rowNum, field: 'categoria', message: `Categoría "${categoria}" no válida` })
      }

      // Validar subcategoría si se proporciona
      const subcategoria = row['subcategoria']
      if (subcategoria && subcategoria.trim() !== '' && !subcategoryNames.includes(subcategoria.toLowerCase().trim())) {
        validationErrors.push({ row: rowNum, field: 'subcategoria', message: `Subcategoría "${subcategoria}" no válida` })
      }

      // Validar precio según tipo
      if (productType === 'cake') {
        const precioBase = parseFloat(row['precio_base*'] || row['precio_base'] || '0')
        if (isNaN(precioBase) || precioBase <= 0) {
          validationErrors.push({ row: rowNum, field: 'precio_base', message: 'El precio base debe ser mayor a 0' })
        }
      } else {
        const precio = parseFloat(row['precio*'] || row['precio'] || '0')
        if (isNaN(precio) || precio <= 0) {
          validationErrors.push({ row: rowNum, field: 'precio', message: 'El precio debe ser mayor a 0' })
        }
      }

      // Validar unidad para pastelería
      if (productType === 'pastry') {
        const unidad = row['unidad*'] || row['unidad']
        if (!unidad || typeof unidad !== 'string' || unidad.trim() === '') {
          validationErrors.push({ row: rowNum, field: 'unidad', message: 'La unidad es requerida' })
        }
      }

      // Agregar fila parseada
      rows.push({
        nombre: nombre?.toString().trim() || '',
        descripcion: row['descripcion']?.toString().trim(),
        categoria: categoria?.toString().trim() || '',
        subcategoria: subcategoria?.toString().trim(),
        precio: parseFloat(row['precio*'] || row['precio'] || '0'),
        precio_base: parseFloat(row['precio_base*'] || row['precio_base'] || '0'),
        precio_por_porcion: parseFloat(row['precio_por_porcion'] || '0'),
        min_porciones: parseInt(row['min_porciones'] || '15'),
        max_porciones: parseInt(row['max_porciones'] || '80'),
        dias_preparacion: parseInt(row['dias_preparacion'] || '3'),
        unidad: row['unidad*'] || row['unidad'] || 'unidad',
        cantidad_minima: parseInt(row['cantidad_minima'] || '1'),
        personalizable: row['personalizable']?.toString().toUpperCase() === 'SI',
        activo: row['activo']?.toString().toUpperCase() !== 'NO',
        destacado: row['destacado']?.toString().toUpperCase() === 'SI',
      })
    })

    return { rows, validationErrors }
  }

  const handleUpload = async () => {
    if (errors.length > 0 || previewData.length === 0) return

    setIsUploading(true)
    let success = 0
    let failed = 0

    try {
      const response = await fetch('/api/catalog/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          products: previewData,
          categories,
          subcategories,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        success = result.success || 0
        failed = result.failed || 0
        setUploadResult({ success, failed })

        if (success > 0) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || 'Error al subir productos')
      }
    } catch (error) {
      console.error('Upload error:', error)
      failed = previewData.length
      setUploadResult({ success: 0, failed })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-dark">Carga Masiva de Productos</h2>
              <p className="text-sm text-dark-light mt-1">
                Sube un archivo Excel con múltiples productos
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Step 1: Download Template */}
            <div className="mb-8">
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                Descargar Plantilla
              </h3>
              <p className="text-sm text-dark-light mb-4">
                Descarga la plantilla Excel con las columnas correctas y categorías válidas.
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Plantilla Excel
              </button>
            </div>

            {/* Step 2: Upload File */}
            <div className="mb-8">
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                Subir Archivo
              </h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-dark font-medium">
                  {file ? file.name : 'Click para seleccionar archivo Excel'}
                </p>
                <p className="text-sm text-dark-light mt-1">.xlsx, .xls</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Validation Status */}
            {isValidating && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                <span className="text-dark-light">Validando archivo...</span>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.length} error(es) encontrado(s)
                </h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Fila {err.row}: {err.field} - {err.message}
                    </li>
                  ))}
                  {errors.length > 10 && (
                    <li className="font-medium">... y {errors.length - 10} errores más</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview */}
            {previewData.length > 0 && errors.length === 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">✓</span>
                  Vista Previa ({previewData.length} productos)
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Nombre</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Categoría</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Precio</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Activo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{row.nombre}</td>
                            <td className="px-3 py-2 text-gray-600">{row.categoria}</td>
                            <td className="px-3 py-2 text-gray-600">
                              ${productType === 'cake' ? row.precio_base : row.precio}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {row.activo ? '✅' : '❌'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 10 && (
                    <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                      ... y {previewData.length - 10} productos más
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-xl mb-6 ${
                uploadResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {uploadResult.failed === 0 ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <div>
                    <p className="font-semibold">
                      {uploadResult.success} productos creados exitosamente
                    </p>
                    {uploadResult.failed > 0 && (
                      <p className="text-sm text-yellow-700">
                        {uploadResult.failed} productos fallaron
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {uploadResult ? 'Cerrar' : 'Cancelar'}
            </button>
            {!uploadResult && (
              <button
                onClick={handleUpload}
                disabled={isUploading || errors.length > 0 || previewData.length === 0}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir {previewData.length} Productos
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
