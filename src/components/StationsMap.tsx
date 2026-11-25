import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { SITE_URL } from '@/config';
import { isDarkTheme } from '@/theme';

import { buildMapHtml } from './mapHtml';

import type { MapStation } from './StationsMap.types';

export type { MapStation } from './StationsMap.types';

/**
 * Version mobile native de la carte : la même carte Leaflet / OpenStreetMap que sur le web,
 * affichée dans une WebView (pas de clé Google Maps nécessaire).
 */
export function StationsMap({ stations }: { stations: MapStation[] }) {
  const ref = useRef<ComponentRef<typeof WebView>>(null);

  // La page n'est construite qu'une fois (sinon la carte se réinitialiserait) ; les repères sont mis à jour ensuite
  const [html] = useState(() => buildMapHtml(stations, isDarkTheme));

  useEffect(() => {
    ref.current?.injectJavaScript(`window.setStations(${JSON.stringify(stations)}); true;`);
  }, [stations]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'open' && typeof msg.id === 'string') {
        router.push({ pathname: '/station/[id]', params: { id: msg.id } });
      }
    } catch {
      // message inattendu : ignoré
    }
  };

  return (
    <WebView
      ref={ref}
      // baseUrl : les tuiles OpenStreetMap exigent un "Referer" valide
      source={{ html, baseUrl: `${SITE_URL}/` }}
      originWhitelist={['*']}
      onMessage={onMessage}
      style={{ flex: 1 }}
      setSupportMultipleWindows={false}
    />
  );
}
