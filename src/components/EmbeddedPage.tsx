import { WebView } from 'react-native-webview';

/** Page web intégrée dans l'app (version mobile native : WebView). */
export function EmbeddedPage({ url, onError }: { url: string; onError?: () => void }) {
  return (
    <WebView
      source={{ uri: url }}
      style={{ flex: 1 }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      onError={onError}
      onHttpError={(e) => {
        if (e.nativeEvent.statusCode >= 400) onError?.();
      }}
    />
  );
}
