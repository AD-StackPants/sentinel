import React from 'react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const DisasterMap: React.FC = () => {
  return (
    <div className="h-full w-full relative border rounded">
      <Map
        initialViewState={{
          longitude: 121.7740, // Center of Philippines
          latitude: 12.8797,
          zoom: 5
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {/* TODO: Add markers and layers for disaster zones, evacuation centers, etc. */}
      </Map>
    </div>
  );
};

export default DisasterMap;
