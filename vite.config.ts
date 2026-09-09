import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.METEO_FRANCE_API_KEY || process.env.METEO_FRANCE_API_KEY
  const wmsBaseUrl = 'https://api.meteofrance.fr/pro/piaf/1.0/wms/MF-NWP-HIGHRES-PIAF-001-FRANCE-WMS'

  return {
    plugins: [react(), {
      name: 'meteo-france-wms',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          if (!request.url?.startsWith('/api/meteo-wms')) return next()
          if (!apiKey) {
            response.statusCode = 500
            response.end('METEO_FRANCE_API_KEY manquante')
            return
          }
          try {
            const requestedFrame = Math.max(0, Math.min(12, Number(new URL(request.url, 'http://localhost').searchParams.get('frame') ?? 6)))
            const capabilities = await fetch(`${wmsBaseUrl}/GetCapabilities?service=WMS&version=1.3.0&request=GetCapabilities`, { headers: { apikey: apiKey } }).then((result) => result.text())
            const layerBlock = capabilities.match(/<Layer>[\s\S]*?<Name>TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE<\/Name>[\s\S]*?<\/Layer>/)?.[0] ?? ''
            const times = [...layerBlock.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g)].map((match) => match[0])
            if (!times.length) throw new Error('Aucune échéance WMS disponible')
            const center = times.length - 1
            const time = times[Math.max(0, Math.min(times.length - 1, center - 6 + requestedFrame))]
            const params = new URLSearchParams({ service: 'WMS', version: '1.3.0', request: 'GetMap', layers: 'TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE', crs: 'EPSG:4326', format: 'image/png', bbox: '37.5,-12,55.4,16', width: '1024', height: '700', transparent: 'true', time })
            const image = await fetch(`${wmsBaseUrl}/GetMap?${params}`, { headers: { apikey: apiKey } })
            response.statusCode = image.status
            response.setHeader('Content-Type', image.headers.get('content-type') ?? 'image/png')
            response.end(Buffer.from(await image.arrayBuffer()))
          } catch (error) {
            next(error)
          }
        })
      },
    }],
    server: {
      host: true,
    },
  }
})
