import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = 'DeliDanis <pedidos@delidanis.cl>'
export const EMAIL_BUSINESS = 'contacto@delidanis.cl'
