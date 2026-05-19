import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'DeliDanis - Tortas Artesanales y Pastelería Premium en Santiago, Chile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFF5F3 0%, #F7F3EF 40%, #FFF 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #D4847C, #B8860B, #D4847C)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
          }}
        >
          {/* Brand name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#3D3D3D',
              letterSpacing: '-1px',
              marginBottom: '8px',
            }}
          >
            DeliDanis
          </div>

          {/* Divider */}
          <div
            style={{
              width: '120px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #D4847C, transparent)',
              marginBottom: '24px',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: '#D4847C',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            Pastelería Artesanal Premium
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: '#5D5D5D',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            Tortas personalizadas para matrimonios, cumpleaños
            y eventos especiales en Santiago, Chile
          </div>

          {/* Services */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '32px',
            }}
          >
            {['Tortas', 'Pastelería', 'Coctelería', 'Catering'].map((service) => (
              <div
                key={service}
                style={{
                  background: 'rgba(212, 132, 124, 0.1)',
                  border: '1px solid rgba(212, 132, 124, 0.3)',
                  borderRadius: '24px',
                  padding: '8px 24px',
                  fontSize: 18,
                  color: '#D4847C',
                  fontWeight: 500,
                }}
              >
                {service}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: 16,
            color: '#5D5D5D',
          }}
        >
          <span>delidanis.cl</span>
          <span style={{ color: '#D4847C' }}>•</span>
          <span>Santiago, Chile</span>
          <span style={{ color: '#D4847C' }}>•</span>
          <span>+56 9 3928 2764</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
