import { supabase } from './client'

// ============================================
// TIPOS
// ============================================

export interface GalleryImage {
  id: string
  title: string | null
  description: string | null
  url: string
  alt_text: string | null
  category: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GalleryImageInput {
  title?: string
  description?: string
  url: string
  alt_text?: string
  category: string
  order_index?: number
  is_active?: boolean
}

// ============================================
// QUERIES
// ============================================

/** Public: get active gallery images, optionally filtered by category */
export async function getGalleryImages(category?: string) {
  let query = supabase
    .from('gallery_images')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (category && category !== 'todos') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) throw error
  return data as GalleryImage[]
}

/** Admin: get all gallery images including inactive */
export async function getGalleryImagesAdmin() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as GalleryImage[]
}

// ============================================
// MUTATIONS
// ============================================

/** Upload image file to storage bucket */
export async function uploadGalleryImage(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `gallery/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return publicUrl
}

/** Insert a new gallery image record */
export async function addGalleryImage(input: GalleryImageInput) {
  const { data, error } = await supabase
    .from('gallery_images')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as GalleryImage
}

/** Update an existing gallery image record */
export async function updateGalleryImage(id: string, input: Partial<GalleryImageInput>) {
  const { data, error } = await supabase
    .from('gallery_images')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as GalleryImage
}

/** Delete gallery image from storage and database */
export async function deleteGalleryImage(id: string, url: string) {
  // Remove from storage
  const path = url.split('/product-images/')[1]
  if (path) {
    await supabase.storage.from('product-images').remove([path])
  }

  // Remove DB record
  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/** Toggle active/inactive */
export async function toggleGalleryImageActive(id: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('gallery_images')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as GalleryImage
}
