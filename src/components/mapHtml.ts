import { GRENOBLE } from '@/data/stations';

import type { MapStation } from './StationsMap.types';

const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist';

/** Page HTML autonome de la carte Leaflet, affichée dans une WebView sur mobile. */
export function buildMapHtml(stations: MapStation[], dark: boolean): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="${LEAFLET}/leaflet.css">
<style>
  html,body,#map{height:100%;margin:0;background:${dark ? '#0E1621' : '#F2F6FB'}}
  ${dark ? '.leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);}' : ''}
  .neve-pin{display:flex;align-items:center;justify-content:center;min-width:34px;height:24px;padding:0 6px;
    border-radius:12px;color:#fff;font:700 12px/1 system-ui,-apple-system,sans-serif;white-space:nowrap;
    border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transform:translate(-50%,-50%);}
  .neve-pin.fav{border-color:#F2A900;}
  .neve-popup{font:14px/1.4 system-ui,-apple-system,sans-serif;color:#0F1B2D;min-width:180px}
  .neve-popup b{font-size:16px}
  .neve-popup button{margin-top:8px;width:100%;padding:10px;border:0;border-radius:8px;background:#1E6FD9;
    color:#fff;font-weight:700;font-size:14px}
</style>
</head><body>
<div id="map"></div>
<script src="${LEAFLET}/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${GRENOBLE.lat + 0.15}, ${GRENOBLE.lon + 0.55}], 8);
  var plan = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  var relief = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17, attribution: '&copy; OpenStreetMap, SRTM | &copy; OpenTopoMap (CC-BY-SA)'
  });
  L.control.layers({ 'Plan': plan, 'Relief': relief }).addTo(map);
  var layer = L.layerGroup().addTo(map);

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
  function openStation(id) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open', id: id })); }

  window.setStations = function (stations) {
    layer.clearLayers();
    stations.forEach(function (s) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="neve-pin' + (s.favorite ? ' fav' : '') + '" style="background:' + s.color + '">' +
          (s.favorite ? '★ ' : '') + esc(s.label) + '</div>',
        iconSize: [0, 0]
      });
      var details = s.details.map(function (d) { return '<div>' + esc(d) + '</div>'; }).join('');
      L.marker([s.lat, s.lon], { icon: icon, title: s.name })
        .bindPopup('<div class="neve-popup"><b>' + esc(s.name) + '</b><div style="color:#5B6B82">' + esc(s.massif) +
          '</div>' + details + '<button onclick="openStation(\\'' + s.id + '\\')">Voir la fiche</button></div>')
        .addTo(layer);
    });
  };
  window.setStations(${JSON.stringify(stations)});
</script>
</body></html>`;
}
