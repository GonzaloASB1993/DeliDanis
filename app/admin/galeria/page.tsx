'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  getGalleryImagesAdmin,
  uploadGalleryImage,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  toggleGalleryImageActive,
  type GalleryImage,
} from '@/lib/supabase/gallery-queries'

type CategoryFilter = 'todas' | 'tortas' | 'pasteleria' | 'cocteleria'

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'tortas', label: 'Tortas' },
  { key: 'pasteleria', label: 'Pasteleria' },
  { key: 'cocteleria', label: 'Cocteleria' },
]

const CATEGORY_OPTIONS = [
  { value: 'tortas', label: 'Tortas' },
  { value: 'pasteleria', label: 'Pasteleria' },
  { value: 'cocteleria', label: 'Cocteleria' },
]

export default function GaleriaAdminPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CategoryFilter>('todas')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editImage, setEditImage] = useState<GalleryImage | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<GalleryImage | null>(null)

  const loadImages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getGalleryImagesAdmin()
      setImages(data)
    } catch (err) {
      console.error('Error loading gallery images:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  const filteredImages = filter === 'todas'
    ? images
    : images.filter(img => img.category === filter)

  const handleToggleActive = async (img: GalleryImage) => {
    try {
      const updated = await toggleGalleryImageActive(img.id, !img.is_active)
      setImages(prev => prev.map(i => i.id === img.id ? updated : i))
    } catch (err) {
      console.error('Error toggling active:', err)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteGalleryImage(deleteConfirm.id, deleteConfirm.url)
      setImages(prev => prev.filter(i => i.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting image:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Galeria"
        subtitle="Administra las imagenes de tu galeria publica"
        actions={
          <Button className="gap-2" onClick={() => setShowUploadModal(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Subir Imagenes
          </Button>
        }
      />

      <div className="p-6">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                filter === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-dark-light hover:bg-primary/10 hover:text-primary'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredImages.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-dark-light/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-dark mb-2">Sin imagenes</h3>
            <p className="text-dark-light mb-4">
              {filter !== 'todas'
                ? 'No hay imagenes en esta categoria.'
                : 'Sube tu primera imagen para comenzar.'}
            </p>
            <Button onClick={() => setShowUploadModal(true)} size="sm">
              Subir imagen
            </Button>
          </div>
        )}

        {/* Image Grid */}
        {!loading && filteredImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map(img => (
              <div
                key={img.id}
                className={cn(
                  'group relative bg-white rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md',
                  !img.is_active && 'opacity-50'
                )}
              >
                {/* Image */}
                <div className="relative aspect-square">
                  <Image
                    src={img.url}
                    alt={img.alt_text || img.title || 'Galeria'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/30 transition-colors" />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-dark truncate">
                    {img.title || 'Sin titulo'}
                  </p>
                  <p className="text-xs text-dark-light capitalize mt-0.5">{img.category}</p>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(img)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      img.is_active
                        ? 'bg-success text-white'
                        : 'bg-white/90 text-dark-light'
                    )}
                    title={img.is_active ? 'Desactivar' : 'Activar'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {img.is_active ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      )}
                    </svg>
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => setEditImage(img)}
                    className="w-8 h-8 rounded-full bg-white/90 text-dark-light hover:text-primary flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirm(img)}
                    className="w-8 h-8 rounded-full bg-white/90 text-dark-light hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            loadImages()
          }}
        />
      )}

      {/* Edit Modal */}
      {editImage && (
        <EditModal
          image={editImage}
          onClose={() => setEditImage(null)}
          onSuccess={(updated) => {
            setImages(prev => prev.map(i => i.id === updated.id ? updated : i))
            setEditImage(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark mb-2">Eliminar imagen</h3>
            <p className="text-dark-light text-sm mb-6">
              Esta accion no se puede deshacer. La imagen sera eliminada permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Upload Modal
// ============================================

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('tortas')
  const [title, setTitle] = useState('')
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const accepted = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...accepted])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const url = await uploadGalleryImage(file)
        await addGalleryImage({
          url,
          title: title || file.name.replace(/\.[^.]+$/, ''),
          alt_text: altText || title || file.name.replace(/\.[^.]+$/, ''),
          category,
        })
      }
      onSuccess()
    } catch (err) {
      console.error('Error uploading:', err)
      alert('Error al subir imagenes. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">Subir imagenes</h3>
          <button onClick={onClose} className="text-dark-light hover:text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dropzone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <svg className="w-10 h-10 mx-auto text-dark-light/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-dark-light">
            Arrastra imagenes aqui o <span className="text-primary font-medium">selecciona archivos</span>
          </p>
          <p className="text-xs text-dark-light/70 mt-1">JPG, PNG, WebP</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {files.map((file, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Titulo (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Torta de bodas elegante"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Texto alternativo (opcional)</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descripcion de la imagen para accesibilidad"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={files.length === 0}
            isLoading={uploading}
          >
            Subir {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Edit Modal
// ============================================

function EditModal({
  image,
  onClose,
  onSuccess,
}: {
  image: GalleryImage
  onClose: () => void
  onSuccess: (updated: GalleryImage) => void
}) {
  const [title, setTitle] = useState(image.title || '')
  const [altText, setAltText] = useState(image.alt_text || '')
  const [description, setDescription] = useState(image.description || '')
  const [category, setCategory] = useState(image.category)
  const [orderIndex, setOrderIndex] = useState(image.order_index)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateGalleryImage(image.id, {
        title: title || undefined,
        alt_text: altText || undefined,
        description: description || undefined,
        category,
        order_index: orderIndex,
      })
      onSuccess(updated)
    } catch (err) {
      console.error('Error updating image:', err)
      alert('Error al guardar cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">Editar imagen</h3>
          <button onClick={onClose} className="text-dark-light hover:text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-secondary">
          <Image src={image.url} alt={image.alt_text || ''} fill className="object-contain" />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Texto alternativo</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Descripcion</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Orden</label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              min={0}
              className="w-24 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
