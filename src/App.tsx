import { useEffect, useRef, useState } from 'react'
import { Crosshair, LocateFixed, Minus, Pause, Play, Plus, Settings2, Wind, X } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const timeline = Array.from({ length: 13 }, (_, index) => {
  const time = new Date(Date.now() + (index - 6) * 10 * 60 * 1000)
  return time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
})
const mapBounds: L.LatLngBoundsExpression = [[37.5, -12], [55.4, 16]]
// const regions = [
//   { name: 'Bretagne', latitude: 48.2, longitude: -3.1 }, { name: 'Île-de-France', latitude: 48.85, longitude: 2.35 },
//   { name: 'Grand Est', latitude: 48.6, longitude: 5.2 }, { name: 'Nouvelle-Aquitaine', latitude: 45.2, longitude: -0.6 },
//   { name: 'Auvergne-Rhône-Alpes', latitude: 45.6, longitude: 4.8 },
// ]

function App() {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const wmsLayerRef = useRef<L.ImageOverlay | null>(null)
  const [frame, setFrame] = useState(6)
  const [playing, setPlaying] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [model, setModel] = useState('PIAF')
  const [wmsError, setWmsError] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 761px)').matches)
  const currentTime = timeline[frame]

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return undefined
    const map = L.map(mapElement.current, { zoomControl: false, attributionControl: false, minZoom: 4, maxZoom: 11 })
    map.fitBounds(mapBounds)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    // regions.forEach((region) => {
    //   const marker = L.circleMarker([region.latitude, region.longitude], { radius: 3, color: '#d9eee5', fillColor: '#d9eee5', fillOpacity: 1, weight: 1 })
    //     .addTo(map)
    //     .bindTooltip(region.name, { permanent: true, direction: 'right', className: 'region-tooltip', offset: [5, 0] })
    //   marker.on('click', () => setSelectedRegion(region.name))
    // })
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % timeline.length), 900)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const resize = () => map.invalidateSize({ animate: false })
    window.addEventListener('resize', resize)
    const observer = new ResizeObserver(resize)
    if (mapElement.current) observer.observe(mapElement.current)
    return () => { window.removeEventListener('resize', resize); observer.disconnect() }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const url = `/api/meteo-wms?frame=${frame}`
    setWmsError(false)
    const image = new Image()
    image.onload = () => {
      if (wmsLayerRef.current) wmsLayerRef.current.remove()
      wmsLayerRef.current = L.imageOverlay(url, mapBounds, { opacity: 0.82, interactive: false }).addTo(map)
    }
    image.onerror = () => setWmsError(true)
    image.src = url
    return () => { image.onload = null; image.onerror = null }
  }, [frame])

  return <main className="app-shell">
    <header className="topbar">
    <div className="brand-lockup">
    <button className="brand-mark" aria-label={sidebarOpen ? 'Masquer le volet' : 'Afficher le volet'} onClick={() => setSidebarOpen((value) => !value)}><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 70 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path fill="#90A4AE" d="M46 26c-.5 0-1 .1-1.4.3C43.2 21.6 38.4 18 32.5 18c-5.1 0-9.4 3.6-10.4 8.4-1.9.4-3.3 2-3.3 4.1 0 2.3 1.9 4.2 4.2 4.2h23c2.3 0 4.2-1.9 4.2-4.2 0-2.1-1.5-3.8-3.5-4.1z" /><path fill="#4FC3F7" d="M24 42c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1 2-3.5 2-3.5s2 2.4 2 3.5z" /><path fill="#4FC3F7" d="M34 42c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1 2-3.5 2-3.5s2 2.4 2 3.5z" /><path fill="#4FC3F7" d="M44 42c0 1.1-.9-2 2-2s-2-.9-2-2c0-1.1 2-3.5 2-3.5s2 2.4 2 3.5z" /><path fill="#4FC3F7" d="M29 50c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1 2-3.5 2-3.5s2 2.4 2 3.5z" /><path fill="#4FC3F7" d="M39 50c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1 2-3.5 2-3.5s2 2.4 2 3.5z" /></svg></button><div><div className="brand-name">Averse</div>
    <div className="brand-subtitle">Radar des précipitations</div></div></div><div className="topbar-center"><span className="live-dot" /> Données en direct <span className="divider" /> France métropolitaine</div><div className="topbar-actions"><button className="icon-button" aria-label="Paramètres"><Settings2 size={18} /></button></div></header>
    <section className={`workspace ${sidebarOpen ? 'sidebar-is-open' : 'sidebar-is-closed'}`}><aside className="sidebar"><div className="sidebar-heading"><span>Prévisions</span><span className="muted-count">Mise à jour 18:57</span></div><div className="model-label">SOURCE ACTIVE</div><div className="source-select"><div className="source-icon"><Wind size={17} /></div><label htmlFor="model">Modèle météo</label><select id="model" value={model} onChange={(event) => setModel(event.target.value)}><option>PIAF</option><option>AROME</option><option>Radar France</option></select></div><div className="status-card"><div className="status-row"><span className="pulse-indicator" /><strong>Flux opérationnel</strong></div><p>Dernières données reçues il y a 3 min</p></div><div className="sidebar-section-title">REPÈRES</div><div className="place-row"><span className="place-pin pin-blue" /> France entière <span className="place-arrow">›</span></div><div className="place-row"><span className="place-pin pin-yellow" /> Ma position <span className="place-arrow">›</span></div><div className="sidebar-footer"><div className="legend-title">INTENSITÉ (MM/H)</div><div className="legend-bar" /><div className="legend-values"><span>0</span><span>2</span><span>5</span><span>10</span><span>20+</span></div></div></aside>
      <section className="map-stage"><div ref={mapElement} className="leaflet-map" aria-label="Carte géographique des précipitations" />{wmsError && <div className="wms-warning">Flux WMS indisponible</div>}<div className="map-controls"><button className="map-control" aria-label="Zoom avant" onClick={() => mapRef.current?.zoomIn()}><Plus size={17} /></button><button className="map-control" aria-label="Zoom arrière" onClick={() => mapRef.current?.zoomOut()}><Minus size={17} /></button><div className="control-rule" /><button className="map-control" aria-label="Recentrer la carte" onClick={() => mapRef.current?.fitBounds(mapBounds)}><LocateFixed size={16} /></button></div><div className="map-readout"><Crosshair size={14} /> Déplacez la carte pour explorer</div><div className="map-attribution">© Averse · Sources Météo-France · {model}</div>{selectedRegion && <div className="location-popover"><button className="popover-close" aria-label="Fermer" onClick={() => setSelectedRegion('')}><X size={15} /></button><div className="popover-kicker">PRÉVISION LOCALE</div><strong>{selectedRegion}</strong><div className="popover-weather"><span className="weather-dot" /> Pluie faible <b>1,8 mm/h</b></div><span className="popover-time">À {currentTime} · dans 10 min</span></div>}</section>
    </section>
    <section className="timeline-panel"><div className="timeline-header"><div><span className="timeline-kicker">PRÉCIPITATIONS</span><h1>{currentTime}<span> · {frame <= 6 ? 'Observation' : 'Prévision'}</span></h1></div><button className="now-button" onClick={() => setFrame(6)}>Revenir à maintenant</button></div><div className="timeline-body"><button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? 'Mettre en pause' : 'Lancer l’animation'} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button><div className="timeline-track-wrap"><div className="timeline-track"><div className="track-fill" style={{ width: `${(frame / (timeline.length - 1)) * 100}%` }} />{timeline.map((time, index) => <button key={`${time}-${index}`} className={`time-tick ${index === frame ? 'active' : ''}`} style={{ left: `${(index / (timeline.length - 1)) * 100}%` }} onClick={() => { setFrame(index); setPlaying(false) }}><span className="tick-mark" /><span className="tick-label">{time}</span></button>)}<input className="timeline-range" type="range" min="0" max={timeline.length - 1} value={frame} onChange={(event) => { setFrame(Number(event.target.value)); setPlaying(false) }} aria-label="Choisir l'heure" /></div></div></div></section>
  </main>
}

export default App
