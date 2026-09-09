import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.METEO_FRANCE_API_KEY || process.env.METEO_FRANCE_API_KEY
  const wmsBaseUrl = 'https://public-api.meteofrance.fr/public/aromepi/1.0/wms/MF-NWP-HIGHRES-AROMEPI-0025-FRANCE-WMS'
// MF-NWP-HIGHRES-AROMEPI-001-FRANCE-WMS
// MF-NWP-HIGHRES-AROMEPI-0025-FRANCE-WMS
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
            const requestUrl = new URL(request.url ?? '/', 'http://localhost')
           
            const time =  requestUrl.searchParams.get('time')
            const params = new URLSearchParams({ service: 'WMS', version: '1.3.0', layers: 'TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE', crs: 'EPSG:4326', format: 'image/png', bbox: '37.5,-12,55.4,16', height: '256', width: '256', transparent: 'true' })
            if (time) params.set('time', time)
            
            const image = await fetch(`${wmsBaseUrl}/GetMap?${params}`, { headers: { apikey: apiKey } })
            // console.log('WMS request params:', `${wmsBaseUrl}/GetMap?${params}`)
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
