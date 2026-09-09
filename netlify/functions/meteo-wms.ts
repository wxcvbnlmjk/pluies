 
// const WMS_BASE_URL = 'https://api.meteofrance.fr/pro/piaf/1.0/wms/MF-NWP-HIGHRES-PIAF-001-FRANCE-WMS'
// const MAP_BOUNDS = '37.5,-12,55.4,16'
// const LAYER_NAME = 'TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE'

const WMS_BASE_URL = 'https://public-api.meteofrance.fr/public/aromepi/1.0/wms/MF-NWP-HIGHRES-AROMEPI-0025-FRANCE-WMS'
const MAP_BOUNDS = '37.5,-12,55.4,16'
const LAYER_NAME = 'TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE'
// PRECIPITATION_TYPE_15_MIN__GROUND_OR_WATER_SURFACE

export default async (request: Request): Promise<Response> => {

  // const apiKey = process.env.METEO_FRANCE_API_KEY

  const apiKey1 = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.METEO_FRANCE_API_KEY_1  
 
  const apiKey2 = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.METEO_FRANCE_API_KEY_2  
 
  const apiKey3 = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.METEO_FRANCE_API_KEY_3  
 
  // const apiKey4 = (globalThis as typeof globalThis & {
  //   process?: { env?: Record<string, string | undefined> }
  // }).process?.env?.METEO_FRANCE_API_KEY_4  
 
  // const apiKey5 = (globalThis as typeof globalThis & {
  //   process?: { env?: Record<string, string | undefined> }
  // }).process?.env?.METEO_FRANCE_API_KEY_5  
 
  // const apiKey6 = (globalThis as typeof globalThis & {
  //   process?: { env?: Record<string, string | undefined> }
  // }).process?.env?.METEO_FRANCE_API_KEY_6  
 
   const apiKey = [apiKey1, apiKey2, apiKey3].filter(
     (key): key is string => key !== undefined,
   ).join('')
   
  //  console.log('apiKeyz:', apiKeyz)
    
  if (!apiKey) {
    return new Response('METEO_FRANCE_API_KEY manquante dans les variables Netlify', { status: 500 })
  }

  try {
    const time = new URL(request.url).searchParams.get('time')
    const params = new URLSearchParams({
      service: 'WMS', version: '1.3.0', request: 'GetMap', layers: LAYER_NAME,
      crs: 'EPSG:4326', format: 'image/png', bbox: MAP_BOUNDS, height: '256', width: '256',
      transparent: 'true',
    })
    if (time) params.set('time', time)
    const imageResponse = await fetch(`${WMS_BASE_URL}/GetMap?${params}`, { headers: { apikey: apiKey } })
    return new Response(imageResponse.body, {
      status: imageResponse.status,
      headers: { 'Content-Type': imageResponse.headers.get('content-type') ?? 'image/png', 'Cache-Control': 'public, max-age=30' },
    })
  } catch (error) {
    console.error('Erreur WMS Météo-France', error)
    return new Response('Flux WMS indisponible', { status: 502 })
  }
}