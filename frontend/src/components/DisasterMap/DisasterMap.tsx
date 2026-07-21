import React, { useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import axios from 'axios';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DisasterMap: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/map/data`);
        setGeoData(response.data);
      } catch (error) {
        console.error("Failed to load map data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="h-full w-full relative border rounded overflow-hidden">
      <Map
        initialViewState={{
          longitude: 122.0790, // Zamboanga City
          latitude: 6.9214,
          zoom: 12.5
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {geoData && (
          <Source id="disaster-data" type="geojson" data={geoData}>
            {/* Polygon Layer for Flood Zones */}
            <Layer
              id="flood-zones"
              type="fill"
              filter={['==', 'type', 'risk_zone']}
              paint={{
                'fill-color': '#ff0000',
                'fill-opacity': 0.4
              }}
            />
            {/* Point Layer for Evacuation Centers */}
            <Layer
              id="evacuation-centers"
              type="circle"
              filter={['==', 'type', 'evacuation_center']}
              paint={{
                'circle-radius': 8,
                'circle-color': '#00ff00',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
             <Layer
              id="evacuation-centers-labels"
              type="symbol"
              filter={['==', 'type', 'evacuation_center']}
              layout={{
                'text-field': ['get', 'name'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.8,
                'text-justify': 'auto',
                'text-size': 12
              }}
              paint={{
                  'text-color': '#000000',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2
              }}
            />
            {/* Point Layer for Hospitals */}
            <Layer
              id="hospitals"
              type="circle"
              filter={['==', 'type', 'hospital']}
              paint={{
                'circle-radius': 8,
                'circle-color': '#3b82f6',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
             <Layer
              id="hospitals-labels"
              type="symbol"
              filter={['==', 'type', 'hospital']}
              layout={{
                'text-field': ['get', 'name'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.8,
                'text-justify': 'auto',
                'text-size': 12
              }}
              paint={{
                  'text-color': '#000000',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2
              }}
            />
            {/* Point Layer for Sensors */}
            <Layer
              id="sensors"
              type="circle"
              filter={['==', 'type', 'sensor']}
              paint={{
                'circle-radius': 6,
                'circle-color': '#eab308',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
             <Layer
              id="sensors-labels"
              type="symbol"
              filter={['==', 'type', 'sensor']}
              layout={{
                'text-field': ['concat', ['get', 'name'], '\n', ['get', 'level']],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.8,
                'text-justify': 'auto',
                'text-size': 10
              }}
              paint={{
                  'text-color': '#000000',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2
              }}
            />
          </Source>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-md border text-sm">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="flex items-center mb-1">
              <span className="w-4 h-4 bg-red-500 opacity-40 inline-block mr-2 border border-red-500"></span> High Risk Flood Zone
          </div>
          <div className="flex items-center mb-1">
              <span className="w-4 h-4 bg-green-500 rounded-full border-2 border-white inline-block mr-2"></span> Evacuation Center
          </div>
          <div className="flex items-center mb-1">
              <span className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white inline-block mr-2"></span> Hospital
          </div>
           <div className="flex items-center">
              <span className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white inline-block mr-2"></span> River Sensor
          </div>
      </div>
    </div>
  );
};

export default DisasterMap;
