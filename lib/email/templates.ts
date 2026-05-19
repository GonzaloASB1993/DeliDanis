/**
 * Email templates for DeliDanis
 * Clean, minimal design using corporate colors.
 */

interface OrderItem {
  service_type: string
  product_name: string
  quantity?: number
  unit_price?: number
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
  isB2B?: boolean
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

function getServiceLabel(type: string): string {
  switch (type) {
    case 'torta': return 'Torta'
    case 'cocteleria': return 'Cocteleria'
    case 'pasteleria': return 'Pasteleria'
    default: return type
  }
}

const logoWhiteUrl = 'https://ezqhprxxojhnmiypxjtl.supabase.co/storage/v1/object/public/public-assets/email/logo-white.png'

// ── Shared layout pieces ──

function emailHead(title: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>`
}

function emailHeader(): string {
  return `
  <tr>
    <td style="background-color:#D4847C;padding:32px 32px 28px;text-align:center;">
      <img src="${logoWhiteUrl}" alt="DeliDanis" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto;" />
    </td>
  </tr>`
}

function emailFooter(recipientEmail: string): string {
  return `
  <tr>
    <td style="background-color:#3D3D3D;padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:12px;">
            <img src="${logoWhiteUrl}" alt="DeliDanis" width="120" style="display:inline-block;width:120px;max-width:100%;height:auto;opacity:0.8;" />
          </td>
        </tr>
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 8px;"><a href="https://wa.me/56939282764" style="font-size:12px;color:#D4847C;text-decoration:none;">WhatsApp</a></td>
                <td style="color:rgba(255,255,255,0.2);font-size:12px;">|</td>
                <td style="padding:0 8px;"><a href="https://www.instagram.com/delidanis.cl/" style="font-size:12px;color:#D4847C;text-decoration:none;">Instagram</a></td>
                <td style="color:rgba(255,255,255,0.2);font-size:12px;">|</td>
                <td style="padding:0 8px;"><a href="mailto:contacto@delidanis.cl" style="font-size:12px;color:#D4847C;text-decoration:none;">Email</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:12px;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.5;">
              Enviado a ${recipientEmail}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

function getItemImageUrl(item: OrderItem): string | null {
  const sd = item.service_data as any
  if (!sd) return null

  // B2B flat structure
  if (sd.image_url) return sd.image_url

  // Public torta structure
  if (sd.product?.images) {
    const primary = sd.product.images.find((img: any) => img.is_primary) || sd.product.images[0]
    if (primary?.url) return primary.url
  }

  // Public cocteleria/pasteleria — image is per-detail, not per-item
  if (sd.itemsDetails?.[0]?.imageUrl) return sd.itemsDetails[0].imageUrl

  return null
}

function getItemName(item: OrderItem): string {
  const sd = item.service_data as any
  return item.product_name
    || sd?.product_name
    || sd?.product?.name
    || getServiceLabel(item.service_type)
}

function getItemQuantity(item: OrderItem): number {
  return item.quantity ?? 1
}

function itemRowHtml(item: OrderItem): string {
  const imageUrl = getItemImageUrl(item)
  const name = getItemName(item)
  const qty = getItemQuantity(item)
  const unitPrice = item.unit_price ?? item.total_price

  const imageTd = `
    <td style="padding:12px;width:56px;vertical-align:middle;">
      ${imageUrl
        ? `<img src="${imageUrl}" alt="${name}" width="48" height="48" style="width:48px;height:48px;border-radius:8px;object-fit:cover;display:block;" />`
        : `<div style="width:48px;height:48px;border-radius:8px;background-color:#F7F3EF;"></div>`
      }
    </td>`

  return `
    <tr style="border-bottom:1px solid #F0ECE8;">
      ${imageTd}
      <td style="padding:12px 8px;vertical-align:middle;">
        <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${name}</span>
        ${item.portions ? `<br/><span style="font-size:12px;color:#5D5D5D;">${item.portions} porciones</span>` : ''}
      </td>
      <td style="padding:12px 8px;vertical-align:middle;text-align:center;white-space:nowrap;">
        <span style="font-size:13px;color:#5D5D5D;">${qty > 1 ? `${qty} u.` : `${qty}`}</span>
      </td>
      <td style="padding:12px;vertical-align:middle;text-align:right;white-space:nowrap;">
        <span style="font-size:14px;font-weight:600;color:#B8860B;">${formatCurrency(item.total_price)}</span>
        ${qty > 1 ? `<br/><span style="font-size:11px;color:#5D5D5D;">${formatCurrency(unitPrice)} c/u</span>` : ''}
      </td>
    </tr>`
}

function itemsTableHtml(items: OrderItem[]): string {
  // For cocteleria/pasteleria public orders, expand itemsDetails into individual rows
  const expandedItems: OrderItem[] = []

  for (const item of items) {
    const sd = item.service_data as any
    if ((item.service_type === 'cocteleria' || item.service_type === 'pasteleria') && sd?.itemsDetails?.length) {
      for (const detail of sd.itemsDetails) {
        expandedItems.push({
          service_type: item.service_type,
          product_name: detail.productName,
          quantity: detail.quantity,
          unit_price: detail.unitPrice,
          total_price: detail.unitPrice * detail.quantity,
          service_data: { image_url: detail.imageUrl },
        })
      }
    } else {
      expandedItems.push(item)
    }
  }

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
      <tr>
        <td colspan="4" style="background-color:#F7F3EF;padding:10px 16px;border-bottom:1px solid #E8E4E0;">
          <span style="font-size:12px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">Detalle del pedido</span>
        </td>
      </tr>
      ${expandedItems.map(itemRowHtml).join('')}
    </table>`
}

function totalsHtml(data: OrderEmailData): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;background-color:#F7F3EF;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px;color:#5D5D5D;padding:3px 0;">Subtotal</td>
              <td style="font-size:14px;color:#3D3D3D;text-align:right;padding:3px 0;font-weight:500;">${formatCurrency(data.subtotal)}</td>
            </tr>
            ${data.deliveryFee > 0 ? `
            <tr>
              <td style="font-size:13px;color:#5D5D5D;padding:3px 0;">Despacho</td>
              <td style="font-size:14px;color:#3D3D3D;text-align:right;padding:3px 0;font-weight:500;">${formatCurrency(data.deliveryFee)}</td>
            </tr>` : ''}
            <tr><td colspan="2" style="padding:8px 0 0;border-top:1px solid #E8E4E0;"></td></tr>
            <tr>
              <td style="font-size:14px;font-weight:700;color:#3D3D3D;padding:4px 0;vertical-align:bottom;">Total</td>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#B8860B;text-align:right;line-height:1;">${formatCurrency(data.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

function eventDetailsHtml(data: OrderEmailData): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background-color:#F7F3EF;padding:10px 16px;border-bottom:1px solid #E8E4E0;">
          <span style="font-size:12px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">${data.isB2B ? 'Datos del pedido' : 'Evento'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br/>
                <span style="font-size:15px;font-weight:700;color:#D4847C;">${formatDate(data.eventDate)}</span>
              </td>
            </tr>
            ${data.eventTime ? `
            <tr>
              <td style="padding:8px 0 4px;">
                <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br/>
                <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventTime === 'AM' ? 'Mañana' : 'Tarde'}</span>
              </td>
            </tr>` : ''}
            ${data.eventType && data.eventType !== 'b2b_order' ? `
            <tr>
              <td style="padding:8px 0 4px;">
                <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Tipo</span><br/>
                <span style="font-size:14px;font-weight:600;color:#3D3D3D;">${data.eventType}</span>
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0 2px;border-top:1px solid #E8E4E0;">
                <span style="font-size:11px;color:#5D5D5D;text-transform:uppercase;letter-spacing:0.5px;">Entrega</span><br/>
                <span style="font-size:14px;font-weight:600;color:#3D3D3D;">
                  ${data.deliveryType === 'pickup' ? 'Retiro en tienda' : 'Despacho a domicilio'}
                </span>
                ${data.deliveryAddress ? `<br/><span style="font-size:13px;color:#5D5D5D;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ''}</span>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// ── Template: New order notification (to admin) ──

export function newOrderNotificationHtml(data: OrderEmailData): string {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://delidanis.cl'}/admin/agendamientos`
  const channelLabel = data.isB2B ? 'B2B' : 'Web'

  return `
${emailHead(`Nuevo Pedido ${data.orderNumber}`)}
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Nuevo pedido ${data.orderNumber} de ${data.customerName} - Total: ${formatCurrency(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          <!-- Urgency Banner -->
          <tr>
            <td style="background-color:#C4746C;padding:8px 24px;text-align:center;">
              <span style="color:#ffffff;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
                Nuevo pedido ${channelLabel}
              </span>
            </td>
          </tr>

          ${emailHeader()}

          <!-- Order Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#3D3D3D;color:#ffffff;padding:8px 28px;border-radius:0 0 10px 10px;font-size:15px;font-weight:700;letter-spacing:1.5px;">
                    ${data.orderNumber}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 16px;">

              <!-- Client Info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:10px 16px;border-bottom:1px solid #E8E4E0;">
                    <span style="font-size:12px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">Cliente</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;">
                    <span style="font-size:16px;font-weight:700;color:#3D3D3D;">${data.customerName}</span><br/>
                    <a href="mailto:${data.customerEmail}" style="font-size:13px;color:#D4847C;text-decoration:none;">${data.customerEmail}</a><br/>
                    <a href="tel:${data.customerPhone}" style="font-size:13px;color:#D4847C;text-decoration:none;">${data.customerPhone}</a>
                    &nbsp;
                    <a href="https://wa.me/${data.customerPhone.replace(/[^0-9]/g, '')}" style="font-size:11px;color:#25D366;text-decoration:none;font-weight:600;background-color:#E8F5E9;padding:2px 8px;border-radius:10px;">WhatsApp</a>
                  </td>
                </tr>
              </table>

              ${eventDetailsHtml(data)}

              ${itemsTableHtml(data.items)}

              ${totalsHtml(data)}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="display:inline-block;padding:14px 40px;background-color:#D4847C;border-radius:28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Revisar Pedido
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${emailFooter(data.customerEmail)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Template: Order confirmed (to client) ──

export function orderConfirmationHtml(data: OrderEmailData): string {
  return `
${emailHead(`Pedido Confirmado - ${data.orderNumber}`)}
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu pedido ${data.orderNumber} ha sido confirmado. Total: ${formatCurrency(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          ${emailHeader()}

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#8FBC8F;color:#ffffff;padding:8px 24px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                    Pedido Confirmado
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 16px;">

              <!-- Greeting -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#3D3D3D;font-family:Georgia,'Times New Roman',serif;">
                      Hola ${data.customerName}
                    </p>
                    <p style="margin:0;font-size:14px;color:#5D5D5D;line-height:1.6;">
                      Tu pedido <strong>${data.orderNumber}</strong> ha sido confirmado. Nuestro equipo se pondr&aacute; en contacto contigo para coordinar los detalles.
                    </p>
                  </td>
                </tr>
              </table>

              ${eventDetailsHtml(data)}

              ${itemsTableHtml(data.items)}

              ${totalsHtml(data)}

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56939282764" target="_blank" style="display:inline-block;padding:14px 40px;background-color:#25D366;border-radius:28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${emailFooter(data.customerEmail)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Template: Order ready (to client) ──

export function orderReadyHtml(data: OrderEmailData): string {
  return `
${emailHead(`Pedido Listo - ${data.orderNumber}`)}
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu pedido ${data.orderNumber} est&aacute; listo. ${data.deliveryType === 'pickup' ? 'Ya puedes retirarlo.' : 'Pronto lo recibir&aacute;s.'}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          ${emailHeader()}

          <!-- Ready Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#7BA3C4;color:#ffffff;padding:8px 24px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                    Pedido Listo
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 16px;">

              <!-- Greeting -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#3D3D3D;font-family:Georgia,'Times New Roman',serif;">
                      Hola ${data.customerName}
                    </p>
                    <p style="margin:0;font-size:14px;color:#5D5D5D;line-height:1.6;">
                      Tu pedido <strong>${data.orderNumber}</strong> est&aacute; listo.
                      ${data.deliveryType === 'pickup'
                        ? 'Puedes pasar a retirarlo cuando gustes.'
                        : 'Pronto coordinaremos la entrega.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Delivery/Pickup Info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#F7F3EF;padding:10px 16px;border-bottom:1px solid #E8E4E0;">
                    <span style="font-size:12px;font-weight:700;color:#3D3D3D;text-transform:uppercase;letter-spacing:0.8px;">
                      ${data.deliveryType === 'pickup' ? 'Retiro' : 'Entrega'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;">
                    <span style="font-size:15px;font-weight:700;color:#D4847C;">${formatDate(data.eventDate)}</span>
                    ${data.deliveryAddress ? `<br/><span style="font-size:13px;color:#5D5D5D;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ''}</span>` : ''}
                  </td>
                </tr>
              </table>

              ${itemsTableHtml(data.items)}

              ${totalsHtml(data)}

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56939282764" target="_blank" style="display:inline-block;padding:14px 40px;background-color:#25D366;border-radius:28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${emailFooter(data.customerEmail)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Template: B2B new order notification (to admin) ──

export function b2bOrderNotificationHtml(data: OrderEmailData): string {
  return newOrderNotificationHtml({ ...data, isB2B: true })
}

// ── Template: B2B order received confirmation (to client) ──

export function b2bOrderReceivedHtml(data: OrderEmailData): string {
  return `
${emailHead(`Pedido Recibido - ${data.orderNumber}`)}
<body style="margin:0;padding:0;background-color:#F0ECE8;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#F0ECE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Pedido ${data.orderNumber} recibido. Total: ${formatCurrency(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0ECE8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,61,61,0.08);">

          ${emailHeader()}

          <!-- B2B Badge -->
          <tr>
            <td style="padding:0;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#3D3D3D;color:#ffffff;padding:8px 24px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                    Pedido B2B Recibido
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 16px;">

              <!-- Greeting -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#3D3D3D;font-family:Georgia,'Times New Roman',serif;">
                      Hola ${data.customerName}
                    </p>
                    <p style="margin:0;font-size:14px;color:#5D5D5D;line-height:1.6;">
                      Hemos recibido tu pedido <strong>${data.orderNumber}</strong>. Nuestro equipo lo revisar&aacute; y te confirmar&aacute; a la brevedad.
                    </p>
                  </td>
                </tr>
              </table>

              ${eventDetailsHtml({ ...data, isB2B: true })}

              ${itemsTableHtml(data.items)}

              ${totalsHtml(data)}

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56939282764" target="_blank" style="display:inline-block;padding:14px 40px;background-color:#25D366;border-radius:28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${emailFooter(data.customerEmail)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export type { OrderEmailData, OrderItem }
