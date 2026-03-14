/**
 * Email templates for DeliDanis
 * Using inline HTML for simplicity - no React Email dependency needed
 */

interface OrderItem {
  service_type: string
  product_name: string
  total_price: number
  portions?: number | null
  service_data?: any
}

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  eventDate: string
  eventTime: string | null
  eventType: string | null
  deliveryType: string
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryFee: number
  subtotal: number
  total: number
  items: OrderItem[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getServiceEmoji(type: string): string {
  switch (type) {
    case 'torta': return '&#127874;'
    case 'cocteleria': return '&#129386;'
    case 'pasteleria': return '&#127856;'
    default: return '&#127856;'
  }
}

function getServiceLabel(type: string): string {
  switch (type) {
    case 'torta': return 'Torta'
    case 'cocteleria': return 'Cocteleria'
    case 'pasteleria': return 'Pasteleria'
    default: return type
  }
}

/* baseStyles removed - all styles are inline for maximum email client compatibility */

const logoWhiteUrl = 'https://ezqhprxxojhnmiypxjtl.supabase.co/storage/v1/object/public/public-assets/email/logo-white.png'

function itemsHtml(items: OrderItem[]): string {
  return items.map(item => `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F3EF; border-radius: 8px; margin-bottom: 8px;">
      <tr>
        <td style="padding: 12px; width: 40px; vertical-align: top; font-size: 24px;">
          ${getServiceEmoji(item.service_type)}
        </td>
        <td style="padding: 12px; vertical-align: top;">
          <strong style="color: #3D3D3D; font-size: 14px;">${getServiceLabel(item.service_type)}</strong>
          <br/>
          <span style="color: #5D5D5D; font-size: 13px;">${item.product_name}</span>
          ${item.portions ? `<br/><span style="color: #5D5D5D; font-size: 12px;">${item.portions} porciones</span>` : ''}
        </td>
        <td style="padding: 12px; vertical-align: top; text-align: right; white-space: nowrap;">
          <strong style="color: #B8860B; font-size: 14px;">${formatCurrency(item.total_price)}</strong>
        </td>
      </tr>
    </table>
  `).join('')
}

/**
 * Email de notificacion al negocio cuando llega un nuevo pedido
 */
export function newOrderNotificationHtml(data: OrderEmailData): string {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://delidanis.cl'}/admin/agendamientos`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nuevo Pedido ${data.orderNumber}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Nuevo pedido ${data.orderNumber} de ${data.customerName} para el ${formatDate(data.eventDate)} - Total: ${formatCurrency(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          <!-- Urgency Banner -->
          <tr>
            <td style="background-color:#C4746C;padding:10px 24px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="color:#ffffff;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
                    &#128276; NUEVO PEDIDO RECIBIDO &#128276;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color:#D4847C;padding:32px 32px 28px;text-align:center;">
              <img src="${logoWhiteUrl}" alt="DeliDanis" width="200" style="display:inline-block;width:200px;max-width:100%;height:auto;" />
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:400;letter-spacing:0.5px;">
                Panel de Administraci&oacute;n
              </p>
            </td>
          </tr>

          <!-- Order Number Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#3D3D3D;color:#ffffff;padding:10px 32px;border-radius:0 0 12px 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:1.5px;">
                    ${data.orderNumber}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 16px;">

              <!-- Client Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#128100; Cliente
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:18px;font-weight:700;color:#3D3D3D;">${data.customerName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <a href="mailto:${data.customerEmail}" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#D4847C;text-decoration:none;font-weight:500;">
                            &#9993; ${data.customerEmail}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <a href="tel:${data.customerPhone}" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#D4847C;text-decoration:none;font-weight:500;">
                            &#128222; ${data.customerPhone}
                          </a>
                          &nbsp;&nbsp;
                          <a href="https://wa.me/${data.customerPhone.replace(/[^0-9]/g, '')}" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#25D366;text-decoration:none;font-weight:600;background-color:#E8F5E9;padding:3px 10px;border-radius:12px;">
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#128197; Evento
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:12px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br/>
                          <span style="font-size:16px;font-weight:700;color:#3D3D3D;">${formatDate(data.eventDate)}</span>
                        </td>
                      </tr>
                      ${data.eventTime ? `
                      <tr>
                        <td style="padding:8px 0 5px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:12px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventTime === 'AM' ? 'Ma\u00f1ana' : 'Tarde'}</span>
                        </td>
                      </tr>` : ''}
                      ${data.eventType ? `
                      <tr>
                        <td style="padding:8px 0 5px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:12px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Tipo de evento</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventType}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:10px 0 2px;border-top:1px solid #E8E4E0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:12px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Entrega</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">
                            ${data.deliveryType === 'pickup' ? '&#127970; Retiro en tienda' : '&#128666; Despacho a domicilio'}
                          </span>
                          ${data.deliveryAddress ? `<br/><span style="font-size:13px;color:#5D5D5D;line-height:1.5;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ''}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Services Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#127856; Servicios contratados
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    ${itemsHtml(data.items)}
                  </td>
                </tr>
              </table>

              <!-- Total Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border:2px solid #B8860B;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#5D5D5D;padding:3px 0;">Subtotal</td>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#3D3D3D;text-align:right;padding:3px 0;font-weight:500;">${formatCurrency(data.subtotal)}</td>
                      </tr>
                      ${data.deliveryFee > 0 ? `
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#5D5D5D;padding:3px 0;">Despacho</td>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#3D3D3D;text-align:right;padding:3px 0;font-weight:500;">${formatCurrency(data.deliveryFee)}</td>
                      </tr>` : ''}
                      <tr>
                        <td colspan="2" style="padding:10px 0 0;border-top:2px solid #E8E4E0;"></td>
                      </tr>
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#3D3D3D;padding:4px 0;vertical-align:bottom;">TOTAL</td>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#B8860B;text-align:right;padding:0;line-height:1;">${formatCurrency(data.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#D4847C;border-radius:28px;">
                          <a href="${adminUrl}" target="_blank" style="display:inline-block;padding:16px 48px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            Revisar y Confirmar Pedido &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F7F3EF;padding:20px 32px;border-top:1px solid #E8E4E0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:#5D5D5D;line-height:1.6;">
                    Notificaci&oacute;n autom&aacute;tica del sistema DeliDanis<br/>
                    Este correo fue enviado a contacto@delidanis.cl
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}



/**
 * Email de confirmacion de pedido para el cliente
 */
export function orderConfirmationHtml(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pedido Confirmado - ${data.orderNumber}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu pedido ${data.orderNumber} ha sido confirmado. Fecha del evento: ${formatDate(data.eventDate)}. Total: ${formatCurrency(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#D4847C;padding:36px 32px 32px;text-align:center;">
              <img src="${logoWhiteUrl}" alt="DeliDanis" width="220" style="display:inline-block;width:220px;max-width:100%;height:auto;" />
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
                Pasteler&iacute;a Premium
              </p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#8FBC8F;color:#ffffff;padding:10px 28px;border-radius:0 0 12px 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                    &#10003;&nbsp; Pedido Confirmado
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 16px;">

              <!-- Greeting -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#3D3D3D;font-family:Georgia,'Times New Roman',serif;">
                      &iexcl;Hola ${data.customerName}!
                    </p>
                    <p style="margin:0;font-size:15px;color:#5D5D5D;line-height:1.7;">
                      Tu pedido ha sido confirmado y nuestro equipo ya est&aacute; trabajando para que todo quede perfecto. A continuaci&oacute;n encontrar&aacute;s todos los detalles.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#3D3D3D;color:#ffffff;padding:12px 36px;border-radius:28px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:1.5px;">
                          Pedido ${data.orderNumber}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#128197; Detalles de tu evento
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <!-- Date - prominent -->
                      <tr>
                        <td style="padding:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Fecha del evento</span><br/>
                          <span style="font-size:18px;font-weight:700;color:#D4847C;font-family:Georgia,'Times New Roman',serif;">${formatDate(data.eventDate)}</span>
                        </td>
                      </tr>
                      ${data.eventTime ? `
                      <tr>
                        <td style="padding:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventTime === 'AM' ? 'Ma\u00f1ana' : 'Tarde'}</span>
                        </td>
                      </tr>` : ''}
                      ${data.eventType ? `
                      <tr>
                        <td style="padding:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Tipo de evento</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventType}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:12px 0 0;border-top:1px solid #E8E4E0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Tipo de entrega</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">
                            ${data.deliveryType === 'pickup' ? '&#127970; Retiro en tienda' : '&#128666; Despacho a domicilio'}
                          </span>
                          ${data.deliveryAddress ? `<br/><span style="font-size:13px;color:#5D5D5D;line-height:1.6;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ''}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Services -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#127856; Tu pedido
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    ${itemsHtml(data.items)}
                  </td>
                </tr>
              </table>

              <!-- Total Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background-color:#F7F3EF;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#5D5D5D;padding:4px 0;">Subtotal</td>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#3D3D3D;text-align:right;padding:4px 0;font-weight:500;">${formatCurrency(data.subtotal)}</td>
                      </tr>
                      ${data.deliveryFee > 0 ? `
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#5D5D5D;padding:4px 0;">Despacho</td>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#3D3D3D;text-align:right;padding:4px 0;font-weight:500;">${formatCurrency(data.deliveryFee)}</td>
                      </tr>` : ''}
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;border-top:2px solid #E8E4E0;"></td>
                      </tr>
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#3D3D3D;padding:6px 0;vertical-align:bottom;">Total</td>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#B8860B;text-align:right;padding:0;line-height:1;">${formatCurrency(data.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-top:1px solid #E8E4E0;font-size:0;line-height:0;" height="1">&nbsp;</td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#3D3D3D;text-align:center;">
                      Pr&oacute;ximos pasos
                    </h3>

                    <!-- Step 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="width:44px;vertical-align:top;padding-top:2px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:36px;height:36px;border-radius:50%;background-color:#D4847C;text-align:center;vertical-align:middle;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">
                                1
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:8px;vertical-align:top;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#3D3D3D;">Coordinaci&oacute;n por WhatsApp</p>
                          <p style="margin:0;font-size:13px;color:#5D5D5D;line-height:1.5;">Nuestro equipo te contactar&aacute; para coordinar los detalles finales y el pago de tu pedido.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="width:44px;vertical-align:top;padding-top:2px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:36px;height:36px;border-radius:50%;background-color:#D4847C;text-align:center;vertical-align:middle;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">
                                2
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:8px;vertical-align:top;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#3D3D3D;">Preparaci&oacute;n artesanal</p>
                          <p style="margin:0;font-size:13px;color:#5D5D5D;line-height:1.5;">Prepararemos tu pedido con anticipaci&oacute;n usando los mejores ingredientes para asegurar una calidad excepcional.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:44px;vertical-align:top;padding-top:2px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:36px;height:36px;border-radius:50%;background-color:#D4847C;text-align:center;vertical-align:middle;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">
                                3
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:8px;vertical-align:top;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#3D3D3D;">${data.deliveryType === 'pickup' ? 'Retiro' : 'Entrega'} de tu pedido</p>
                          <p style="margin:0;font-size:13px;color:#5D5D5D;line-height:1.5;">Te mantendremos informado sobre el estado hasta ${data.deliveryType === 'pickup' ? 'el d&iacute;a del retiro' : 'la entrega en tu domicilio'}. &iexcl;Todo quedar&aacute; perfecto!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;background-color:#F7F3EF;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#3D3D3D;">
                      &iquest;Tienes alguna consulta?
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" style="background-color:#25D366;border-radius:28px;">
                          <a href="https://wa.me/56939282764" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Escr&iacute;benos por WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#3D3D3D;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="${logoWhiteUrl}" alt="DeliDanis" width="140" style="display:inline-block;width:140px;max-width:100%;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:0 8px;">
                          <a href="https://wa.me/56939282764" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">WhatsApp</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.3);font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="https://www.instagram.com/delidanis.cl/" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">Instagram</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.3);font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="mailto:contacto@delidanis.cl" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">Email</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);margin-top:16px;">
                    <p style="margin:16px 0 0;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.6;">
                      Este correo fue enviado a ${data.customerEmail}<br/>
                      porque realizaste un pedido en DeliDanis.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Email informando al cliente que su pedido esta listo
 */
export function orderReadyHtml(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pedido Listo - ${data.orderNumber}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu pedido ${data.orderNumber} est&aacute; listo. ${data.deliveryType === 'pickup' ? 'Ya puedes retirarlo.' : 'Pronto lo recibirás.'} - DeliDanis
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#D4847C;padding:36px 32px 32px;text-align:center;">
              <img src="${logoWhiteUrl}" alt="DeliDanis" width="220" style="display:inline-block;width:220px;max-width:100%;height:auto;" />
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
                Pasteler&iacute;a Premium
              </p>
            </td>
          </tr>

          <!-- Ready Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#7BA3C4;color:#ffffff;padding:10px 28px;border-radius:0 0 12px 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                    &#127881;&nbsp; &iexcl;Tu Pedido est&aacute; Listo!
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 16px;">

              <!-- Greeting -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#3D3D3D;font-family:Georgia,'Times New Roman',serif;">
                      &iexcl;Hola ${data.customerName}!
                    </p>
                    <p style="margin:0;font-size:15px;color:#5D5D5D;line-height:1.7;">
                      &iexcl;Excelentes noticias! Tu pedido ha sido preparado con mucho cari&ntilde;o y ya est&aacute; listo.
                      ${data.deliveryType === 'pickup'
                        ? 'Puedes pasar a retirarlo cuando gustes.'
                        : 'Pronto coordinaremos la entrega a tu domicilio.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#3D3D3D;color:#ffffff;padding:12px 36px;border-radius:28px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:1.5px;">
                          Pedido ${data.orderNumber}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Delivery/Pickup Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          ${data.deliveryType === 'pickup' ? '&#127970; Retiro en tienda' : '&#128666; Despacho a domicilio'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Fecha del evento</span><br/>
                          <span style="font-size:18px;font-weight:700;color:#D4847C;font-family:Georgia,'Times New Roman',serif;">${formatDate(data.eventDate)}</span>
                        </td>
                      </tr>
                      ${data.eventTime ? `
                      <tr>
                        <td style="padding:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventTime === 'AM' ? 'Ma\u00f1ana' : 'Tarde'}</span>
                        </td>
                      </tr>` : ''}
                      ${data.deliveryAddress ? `
                      <tr>
                        <td style="padding:12px 0 0;border-top:1px solid #E8E4E0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Direcci&oacute;n de entrega</span><br/>
                          <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ''}</span>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:12px 20px;border-bottom:1px solid #E8E4E0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                          &#127856; Resumen de tu pedido
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    ${itemsHtml(data.items)}
                  </td>
                </tr>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background-color:#F7F3EF;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#3D3D3D;vertical-align:bottom;">Total</td>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#B8860B;text-align:right;line-height:1;">${formatCurrency(data.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important note -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border-left:4px solid #D4847C;border-radius:0 8px 8px 0;background-color:#FDF6F5;">
                <tr>
                  <td style="padding:16px 20px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#3D3D3D;">
                      ${data.deliveryType === 'pickup' ? 'Informaci&oacute;n de retiro' : 'Informaci&oacute;n de entrega'}
                    </p>
                    <p style="margin:0;font-size:13px;color:#5D5D5D;line-height:1.6;">
                      ${data.deliveryType === 'pickup'
                        ? 'Si tienes dudas sobre la ubicaci&oacute;n o el horario de retiro, no dudes en escribirnos por WhatsApp. &iexcl;Te esperamos!'
                        : 'Nos pondremos en contacto contigo por WhatsApp para coordinar la hora exacta de entrega. &iexcl;Estar&aacute; en tus manos pronto!'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;background-color:#F7F3EF;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#3D3D3D;">
                      &iquest;Necesitas coordinar algo?
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" style="background-color:#25D366;border-radius:28px;">
                          <a href="https://wa.me/56939282764" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Escr&iacute;benos por WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#3D3D3D;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="${logoWhiteUrl}" alt="DeliDanis" width="140" style="display:inline-block;width:140px;max-width:100%;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:0 8px;">
                          <a href="https://wa.me/56939282764" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">WhatsApp</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.3);font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="https://www.instagram.com/delidanis.cl/" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">Instagram</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.3);font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="mailto:contacto@delidanis.cl" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#D4847C;text-decoration:none;">Email</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);margin-top:16px;">
                    <p style="margin:16px 0 0;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.6;">
                      Este correo fue enviado a ${data.customerEmail}<br/>
                      porque realizaste un pedido en DeliDanis.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export type { OrderEmailData }
