'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es requerido'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject || null,
        message: formData.message,
      })

      if (error) throw error

      setIsSuccess(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      alert('Hubo un error al enviar el mensaje. Intenta de nuevo o contáctanos por WhatsApp.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-md h-full w-full flex flex-col">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-semibold text-dark mb-2">
          Envíanos un mensaje
        </h2>
        <p className="text-dark-light">
          Completa el formulario y te responderemos a la brevedad
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg">
          <p className="text-success-dark font-medium">
            ¡Mensaje enviado exitosamente! Te contactaremos pronto.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Tu nombre"
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+56 9 1234 5678"
            required
          />

          <Input
            label="Asunto"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            error={errors.subject}
            placeholder="¿En qué podemos ayudarte?"
            required
          />
        </div>

        <div className="flex-1 flex flex-col">
          <Textarea
            label="Mensaje"
            name="message"
            value={formData.message}
            onChange={handleChange}
            error={errors.message}
            placeholder="Cuéntanos más detalles sobre tu consulta..."
            className="flex-1 min-h-[150px]"
            required
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </div>
      </form>
    </div>
  )
}
