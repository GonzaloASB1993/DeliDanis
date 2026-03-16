import { supabase } from './client'

export interface MessageTemplate {
  id: string
  name: string
  channel: 'email' | 'whatsapp' | 'both'
  subject?: string
  body: string
  variables: string[]
  isActive: boolean
}

export interface MessageTemplateSet {
  templates: MessageTemplate[]
  updatedAt: string
}

const SETTINGS_KEY = 'message_templates'

export function getDefaultTemplates(): MessageTemplateSet {
  return {
    templates: [
      {
        id: 'order_confirmation',
        name: 'Confirmación de pedido',
        channel: 'both',
        subject: 'Confirmación de tu pedido {{numero_pedido}} - DeliDanis',
        body: `Hola {{cliente_nombre}},

¡Tu pedido ha sido confirmado con éxito! 🎉

Detalles del pedido:
- Número de pedido: {{numero_pedido}}
- Fecha del evento: {{fecha_evento}}
- Servicios: {{servicios}}
- Total: {{total}}

Gracias por confiar en DeliDanis. Nos pondremos en contacto contigo para coordinar los detalles finales.

¡Que disfrutes tu evento!
El equipo de DeliDanis`,
        variables: ['cliente_nombre', 'numero_pedido', 'fecha_evento', 'total', 'servicios'],
        isActive: true,
      },
      {
        id: 'status_update',
        name: 'Actualización de estado',
        channel: 'both',
        subject: 'Tu pedido {{numero_pedido}} ha sido actualizado',
        body: `Hola {{cliente_nombre}},

Te informamos que el estado de tu pedido ha sido actualizado.

- Número de pedido: {{numero_pedido}}
- Estado anterior: {{estado_anterior}}
- Nuevo estado: {{estado_nuevo}}

Si tienes alguna consulta, no dudes en contactarnos.

El equipo de DeliDanis`,
        variables: ['cliente_nombre', 'numero_pedido', 'estado_anterior', 'estado_nuevo'],
        isActive: true,
      },
      {
        id: 'day_before_reminder',
        name: 'Recordatorio día anterior',
        channel: 'both',
        subject: 'Recordatorio: Tu pedido {{numero_pedido}} es mañana',
        body: `Hola {{cliente_nombre}},

Te recordamos que mañana es tu evento y tu pedido estará listo para ti.

- Número de pedido: {{numero_pedido}}
- Fecha del evento: {{fecha_evento}}
- Hora: {{hora_evento}}
- Tipo de entrega: {{tipo_entrega}}

Si tienes alguna consulta de último momento, escríbenos.

¡Mañana será un día especial!
El equipo de DeliDanis`,
        variables: ['cliente_nombre', 'numero_pedido', 'fecha_evento', 'hora_evento', 'tipo_entrega'],
        isActive: true,
      },
      {
        id: 'order_ready',
        name: 'Pedido listo',
        channel: 'both',
        subject: 'Tu pedido {{numero_pedido}} está listo',
        body: `Hola {{cliente_nombre}},

¡Tu pedido está listo! 🎂

- Número de pedido: {{numero_pedido}}
- Tipo de entrega: {{tipo_entrega}}
{{direccion_entrega}}

Esperamos que disfrutes cada momento de tu evento especial.

El equipo de DeliDanis`,
        variables: ['cliente_nombre', 'numero_pedido', 'tipo_entrega', 'direccion_entrega'],
        isActive: true,
      },
      {
        id: 'quote_response',
        name: 'Respuesta cotización',
        channel: 'email',
        subject: 'Respuesta a tu cotización {{numero_cotizacion}} - DeliDanis',
        body: `Hola {{cliente_nombre}},

Hemos revisado tu solicitud de cotización y tenemos una propuesta para ti.

- Número de cotización: {{numero_cotizacion}}
- Descripción: {{descripcion}}
- Precio estimado: {{precio_estimado}}

Esta cotización es válida por 7 días. Si deseas proceder con el pedido o tienes alguna consulta, responde a este correo o contáctanos directamente.

¡Esperamos poder hacer tu evento especial!
El equipo de DeliDanis`,
        variables: ['cliente_nombre', 'numero_cotizacion', 'precio_estimado', 'descripcion'],
        isActive: true,
      },
      {
        id: 'post_delivery_followup',
        name: 'Seguimiento post-entrega',
        channel: 'whatsapp',
        body: `Hola {{cliente_nombre}} 😊

Esperamos que tu evento del {{fecha_evento}} haya sido todo un éxito.

Nos encantaría saber cómo estuvo todo con tu pedido {{numero_pedido}}. ¿Todo salió a tu gusto?

Tu opinión es muy importante para nosotros. Si deseas dejarnos una reseña, estaremos muy agradecidos 🌟

¡Gracias por elegirnos!
DeliDanis`,
        variables: ['cliente_nombre', 'numero_pedido', 'fecha_evento'],
        isActive: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

export async function getMessageTemplates(): Promise<MessageTemplateSet> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error || !data) {
    return getDefaultTemplates()
  }

  try {
    const parsed = data.value as MessageTemplateSet
    if (!parsed.templates || !Array.isArray(parsed.templates)) {
      return getDefaultTemplates()
    }
    return parsed
  } catch {
    return getDefaultTemplates()
  }
}

export async function saveMessageTemplates(templates: MessageTemplateSet): Promise<{ error: string | null }> {
  const payload: MessageTemplateSet = {
    ...templates,
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      { key: SETTINGS_KEY, value: payload as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
