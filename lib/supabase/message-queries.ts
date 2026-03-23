import { supabase } from './client'

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

export async function markMessageAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('contact_messages')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    console.error('Error marking message as read:', error)
    return false
  }

  return true
}
