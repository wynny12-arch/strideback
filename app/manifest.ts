import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StrideBack',
    short_name: 'StrideBack',
    description: 'AI-guided rehab coach for runners and active adults',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1B3A5C',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
