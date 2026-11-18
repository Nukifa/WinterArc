/** Page web intégrée dans l'app (version web : iframe). */
export function EmbeddedPage({ url }: { url: string; onError?: () => void }) {
  return (
    <iframe
      src={url}
      title="Webcam"
      allow="fullscreen; autoplay; gyroscope; accelerometer"
      allowFullScreen
      style={{ border: 0, width: '100%', height: '100%', flex: 1, display: 'block' }}
    />
  );
}
