import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { LayersControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import { BASE_PATH } from '@/config';
import { GRENOBLE } from '@/data/stations';

import type { MapStation } from './StationsMap.types';

export type { MapStation } from './StationsMap.types';

// Styles de la carte (repères, bulles, tuiles assombries en mode sombre), injectés une fois
if (typeof document !== 'undefined' && !document.getElementById('neve-map-css')) {
  const style = document.createElement('style');
  style.id = 'neve-map-css';
  const darkTiles = '.leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);}';
  style.textContent = `
    .neve-pin{display:flex;align-items:center;justify-content:center;min-width:34px;height:24px;padding:0 6px;
      border-radius:12px;color:#fff;font:700 12px/1 system-ui,-apple-system,sans-serif;white-space:nowrap;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transform:translate(-50%,-50%);}
    .neve-pin.fav{border-color:#F2A900;}
    .neve-popup{font:13px/1.4 system-ui,-apple-system,sans-serif;color:#0F1B2D;min-width:180px}
    .neve-popup b{font-size:15px}
    .neve-popup button{margin-top:8px;width:100%;padding:8px;border:0;border-radius:8px;background:#1E6FD9;
      color:#fff;font-weight:700;cursor:pointer}
    .leaflet-container{background:var(--c-bg);font-family:system-ui,-apple-system,sans-serif}
    .leaflet-control-layers-toggle{background-image:url(${BASE_PATH}/leaflet/layers.png)}
    .leaflet-retina .leaflet-control-layers-toggle{background-image:url(${BASE_PATH}/leaflet/layers-2x.png)}
    @media (prefers-color-scheme: dark){:root:not([data-theme="light"]) ${darkTiles}}
    :root[data-theme="dark"] ${darkTiles}
  `;
  document.head.appendChild(style);
}

function pinIcon(s: MapStation) {
  return L.divIcon({
    className: '',
    html: `<div class="neve-pin${s.favorite ? ' fav' : ''}" style="background:${s.color}">${s.favorite ? '★ ' : ''}${s.label}</div>`,
    iconSize: [0, 0],
  });
}

/** Carte interactive des stations (Leaflet + OpenStreetMap). */
export function StationsMap({ stations }: { stations: MapStation[] }) {
  const icons = useMemo(() => Object.fromEntries(stations.map((s) => [s.id, pinIcon(s)])), [stations]);

  return (
    <MapContainer
      center={[GRENOBLE.lat + 0.15, GRENOBLE.lon + 0.55]}
      zoom={8}
      minZoom={6}
      maxZoom={15}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Plan">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Relief">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lon]} icon={icons[s.id]} title={s.name}>
          <Popup>
            <div className="neve-popup">
              <b>{s.name}</b>
              <div style={{ color: '#5B6B82' }}>{s.massif}</div>
              {s.details.map((d) => (
                <div key={d}>{d}</div>
              ))}
              <button type="button" onClick={() => router.push({ pathname: '/station/[id]', params: { id: s.id } })}>
                Voir la fiche
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
