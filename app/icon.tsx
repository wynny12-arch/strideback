import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1B3A5C',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 220,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-8px',
            lineHeight: 1,
          }}
        >
          SB
        </div>
      </div>
    ),
    { ...size }
  )
}
