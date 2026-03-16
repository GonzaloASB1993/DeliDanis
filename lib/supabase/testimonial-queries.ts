import { supabase } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  customer_name: string
  customer_initials: string | null
  event_type: string | null
  comment: string
  rating: number
  is_active: boolean
  is_featured: boolean
  order_index: number
  // Fields added by migration 017
  status: 'pending' | 'approved' | 'rejected'
  customer_email: string | null
  image_urls: string[]
  admin_response: string | null
  created_at: string
  updated_at: string
}

export type TestimonialInsert = Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>
export type TestimonialUpdate = Partial<TestimonialInsert>

export interface TestimonialFilters {
  activeOnly?: boolean
  featuredOnly?: boolean
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List all testimonials. Admin use — applies optional filters.
 */
export async function getTestimonials(filters?: TestimonialFilters): Promise<Testimonial[]> {
  let query = supabase
    .from('testimonials')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters?.activeOnly) {
    query = query.eq('is_active', true)
  }

  if (filters?.featuredOnly) {
    query = query.eq('is_featured', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('[testimonial-queries] getTestimonials:', error.message)
    return []
  }

  return data as Testimonial[]
}

/**
 * Active testimonials for the public site, ordered by order_index.
 * Uses anon key — relies on RLS policy "Public can view active testimonials".
 */
export async function getTestimonialsPublic(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[testimonial-queries] getTestimonialsPublic:', error.message)
    return []
  }

  return data as Testimonial[]
}

/**
 * Create a new testimonial.
 */
export async function createTestimonial(
  data: TestimonialInsert
): Promise<{ data: Testimonial | null; error: string | null }> {
  const { data: row, error } = await supabase
    .from('testimonials')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('[testimonial-queries] createTestimonial:', error.message)
    return { data: null, error: error.message }
  }

  return { data: row as Testimonial, error: null }
}

/**
 * Update an existing testimonial.
 */
export async function updateTestimonial(
  id: string,
  data: TestimonialUpdate
): Promise<{ data: Testimonial | null; error: string | null }> {
  const { data: row, error } = await supabase
    .from('testimonials')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[testimonial-queries] updateTestimonial:', error.message)
    return { data: null, error: error.message }
  }

  return { data: row as Testimonial, error: null }
}

/**
 * Permanently delete a testimonial.
 */
export async function deleteTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[testimonial-queries] deleteTestimonial:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Toggle the is_active flag.
 */
export async function toggleTestimonialActive(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('testimonials')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('[testimonial-queries] toggleTestimonialActive:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Toggle the is_featured flag.
 */
export async function toggleTestimonialFeatured(
  id: string,
  isFeatured: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('testimonials')
    .update({ is_featured: isFeatured })
    .eq('id', id)

  if (error) {
    console.error('[testimonial-queries] toggleTestimonialFeatured:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Bulk-update order_index for an ordered array of ids.
 * Each id at position i gets order_index = i.
 */
export async function reorderTestimonials(
  orderedIds: string[]
): Promise<{ error: string | null }> {
  // Build individual updates; Supabase JS v2 has no bulk-upsert by pk easily,
  // so we run them in parallel using Promise.all.
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('testimonials')
      .update({ order_index: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)

  if (firstError?.error) {
    console.error('[testimonial-queries] reorderTestimonials:', firstError.error.message)
    return { error: firstError.error.message }
  }

  return { error: null }
}

// ─── Public Submission ────────────────────────────────────────────────────────

/**
 * Submit a testimonial from a public (anonymous) user.
 * Inserted with status='pending' and is_active=false so it is hidden until
 * an admin approves it. Relies on the RLS policy "Public can submit testimonials".
 */
export async function submitTestimonialPublic(data: {
  customer_name: string
  customer_email: string
  event_type: string
  comment: string
  rating: number
  image_urls?: string[]
}): Promise<{ success: boolean; error?: string }> {
  // Auto-generate initials from the customer name
  const initials = data.customer_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const { error } = await supabase.from('testimonials').insert([
    {
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim(),
      customer_initials: initials,
      event_type: data.event_type || null,
      comment: data.comment.trim(),
      rating: data.rating,
      image_urls: data.image_urls ?? [],
      status: 'pending',
      is_active: false,
      is_featured: false,
      order_index: 0,
    },
  ])

  if (error) {
    console.error('[testimonial-queries] submitTestimonialPublic:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get all testimonials with status='pending' for admin review.
 */
export async function getPendingTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[testimonial-queries] getPendingTestimonials:', error.message)
    return []
  }

  return data as Testimonial[]
}

/**
 * Approve a pending testimonial, making it visible publicly.
 */
export async function approveTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('testimonials')
    .update({ status: 'approved', is_active: true })
    .eq('id', id)

  if (error) {
    console.error('[testimonial-queries] approveTestimonial:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Reject a pending testimonial and optionally record a reason.
 */
export async function rejectTestimonial(
  id: string,
  reason: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('testimonials')
    .update({ status: 'rejected', is_active: false, admin_response: reason })
    .eq('id', id)

  if (error) {
    console.error('[testimonial-queries] rejectTestimonial:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Upload a customer testimonial image to Supabase Storage.
 * Uses bucket 'product-images' with path 'testimonials/[timestamp].[ext]'.
 * Returns the public URL or null on failure.
 */
export async function uploadTestimonialImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `testimonials/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file)

  if (uploadError) {
    console.error('[testimonial-queries] uploadTestimonialImage:', uploadError.message)
    return null
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(path)

  return publicUrl
}
