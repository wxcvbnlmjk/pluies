 
const WMS_BASE_URL = 'https://api.meteofrance.fr/pro/piaf/1.0/wms/MF-NWP-HIGHRES-PIAF-001-FRANCE-WMS'
const MAP_BOUNDS = '37.5,-12,55.4,16'
const LAYER_NAME = 'TOTAL_PRECIPITATION_RATE__GROUND_OR_WATER_SURFACE'

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
 
  const apiKey4 = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.METEO_FRANCE_API_KEY_4  
 
  const apiKey5 = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.METEO_FRANCE_API_KEY_5  
 
   const apiKey = [apiKey1, apiKey2, apiKey3, apiKey4, apiKey5].filter(
     (key): key is string => key !== undefined,
   ).join('')
   
  //  console.log('apiKeyz:', apiKeyz)
    
  if (!apiKey) {
    return new Response('METEO_FRANCE_API_KEY manquante dans les variables Netlify', { status: 500 })
  }

  try {
    const frame = Math.max(0, Math.min(12, Number(new URL(request.url).searchParams.get('frame') ?? 6)))
    const capabilitiesResponse = await fetch(`${WMS_BASE_URL}/GetCapabilities?service=WMS&version=1.3.0&request=GetCapabilities`, {
      headers: { apikey: apiKey },
    })
    if (!capabilitiesResponse.ok) throw new Error(`GetCapabilities: ${capabilitiesResponse.status}`)

    const capabilities = await capabilitiesResponse.text()
    const layerBlock = capabilities.match(new RegExp(`<Layer>[\\s\\S]*?<Name>${LAYER_NAME}</Name>[\\s\\S]*?</Layer>`))?.[0] ?? ''
    const times = [...layerBlock.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g)].map((match) => match[0])
    if (!times.length) throw new Error('Aucune échéance WMS disponible')

    const center = times.length - 1
    const time = times[Math.max(0, Math.min(times.length - 1, center - 6 + frame))]
    const params = new URLSearchParams({
      service: 'WMS', version: '1.3.0', request: 'GetMap', layers: LAYER_NAME,
      crs: 'EPSG:4326', format: 'image/png', bbox: MAP_BOUNDS, width: '1024', height: '700',
      transparent: 'true', time,
    })
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