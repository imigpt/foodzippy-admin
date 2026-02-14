import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export default function MapPreview({ latitude, longitude, title }: MapPreviewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-muted-foreground text-sm font-medium">
            Map Preview ({latitude}, {longitude})
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your Google Maps API key to .env file
          </p>
        </div>
      </div>
    );
  }

  const position = { lat: latitude, lng: longitude };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-48 rounded-lg overflow-hidden border">
        <Map
          defaultCenter={position}
          defaultZoom={15}
          mapId="vendor-location-map"
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          <AdvancedMarker position={position} title={title || 'Vendor Location'}>
            <Pin
              background={'#ef4444'}
              borderColor={'#dc2626'}
              glyphColor={'#ffffff'}
            />
          </AdvancedMarker>
        </Map>
      </div>
    </APIProvider>
  );
}
