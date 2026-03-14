import { Resend } from 'resend'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { newOrderNotificationHtml, orderConfirmationHtml, orderReadyHtml, type OrderEmailData } from '../lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const testData: OrderEmailData = {
  orderNumber: 'DD-0050',
  customerName: 'Daniela Fuentes',
  customerEmail: 'daniela@ejemplo.cl',
  customerPhone: '+56 9 8765 4321',
  eventDate: '2026-04-15',
  eventTime: 'PM',
  eventType: 'Cumpleaños',
  deliveryType: 'delivery',
  deliveryAddress: 'Av. Providencia 1234, Depto 502',
  deliveryCity: 'Santiago',
  deliveryFee: 5000,
  subtotal: 85000,
  total: 90000,
  items: [
    {
      service_type: 'torta',
      product_name: 'Torta Red Velvet con Cream Cheese',
      total_price: 45000,
      portions: 20,
    },
    {
      service_type: 'cocteleria',
      product_name: 'Cocteleria: 30x Mini Empanadas, 20x Brochetas Caprese',
      total_price: 40000,
      portions: null,
    },
  ],
}

async function sendTest() {
  // Test: Confirmación al cliente (con logo)
  console.log('Enviando email de confirmacion con logo...')
  const { data, error } = await resend.emails.send({
    from: 'DeliDanis <pedidos@delidanis.cl>',
    to: 'contacto@delidanis.cl',
    subject: `Pedido Confirmado ${testData.orderNumber} (con logo) - DeliDanis`,
    html: orderConfirmationHtml(testData),
  })
  if (error) console.error('Error:', error)
  else console.log('Enviado! ID:', data?.id)
}

sendTest()
