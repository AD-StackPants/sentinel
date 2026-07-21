import React, { useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import axios from 'axios';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DisasterMap: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [showFloodZones, setShowFloodZones] = useState<boolean>(true);
  const [showEvacuation, setShowEvacuation] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);

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
    <div className="card h-full w-full relative overflow-hidden border-border bg-card shadow-sm">
      {/* Top Banner: Live Telemetry Status Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-card/90 glass-panel border border-border px-3 py-1.5 rounded-xl shadow-md text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span>
        <span className="font-semibold text-foreground">SENSOR ZAM-TUMAGA-01:</span>
        <span className="font-mono text-danger font-bold">8.8m WATER LEVEL (CRITICAL)</span>
      </div>

      {/* Layer Control Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-card/90 glass-panel border border-border p-1.5 rounded-xl shadow-md text-[11px] font-medium text-foreground">
        <button
          onClick={() => setShowFloodZones(!showFloodZones)}
          className={`px-2 py-1 rounded-lg border transition-all ${showFloodZones ? 'bg-danger/20 border-danger text-danger font-bold' : 'bg-neutral/10 border-border opacity-60'}`}
        >
          Flood Zone
        </button>
        <button
          onClick={() => setShowEvacuation(!showEvacuation)}
          className={`px-2 py-1 rounded-lg border transition-all ${showEvacuation ? 'bg-success/20 border-success text-success font-bold' : 'bg-neutral/10 border-border opacity-60'}`}
        >
          Evacuation
        </button>
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`px-2 py-1 rounded-lg border transition-all ${showHospitals ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-neutral/10 border-border opacity-60'}`}
        >
          Hospitals
        </button>
        <button
          onClick={() => setShowSensors(!showSensors)}
          className={`px-2 py-1 rounded-lg border transition-all ${showSensors ? 'bg-warning/20 border-warning text-warning font-bold' : 'bg-neutral/10 border-border opacity-60'}`}
        >
          Sensors
        </button>
      </div>

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
            {showFloodZones && (
              <Layer
                id="flood-zones"
                type="fill"
                filter={['==', 'type', 'risk_zone']}
                paint={{
                  'fill-color': '#ef4444',
                  'fill-opacity': 0.4
                }}
              />
            )}

            {/* Point Layer for Evacuation Centers */}
            {showEvacuation && (
              <>
                <Layer
                  id="evacuation-centers"
                  type="circle"
                  filter={['==', 'type', 'evacuation_center']}
                  paint={{
                    'circle-radius': 8,
                    'circle-color': '#22c55e',
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
                    'text-size': 11
                  }}
                  paint={{
                    'text-color': '#0f172a',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                  }}
                />
              </>
            )}

            {/* Point Layer for Hospitals */}
            {showHospitals && (
              <>
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
                    'text-size': 11
                  }}
                  paint={{
                    'text-color': '#0f172a',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                  }}
                />
              </>
            )}

            {/* Point Layer for Sensors */}
            {showSensors && (
              <>
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
                    'text-color': '#0f172a',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                  }}
                />
              </>
            )}
          </Source>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/90 glass-panel p-3 rounded-xl shadow-lg border border-border text-xs text-foreground z-10">
          <h4 className="font-bold mb-2 text-foreground text-[11px] uppercase tracking-wider">Map Infrastructure</h4>
          <div className="flex items-center mb-1.5">
              <span className="w-3.5 h-3.5 bg-danger/40 border border-danger inline-block mr-2 rounded-xs"></span> High Risk Flood Zone
          </div>
          <div className="flex items-center mb-1.5">
              <span className="w-3.5 h-3.5 bg-success rounded-full border-2 border-white inline-block mr-2"></span> Evacuation Center
          </div>
          <div className="flex items-center mb-1.5">
              <span className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-white inline-block mr-2"></span> Hospital
          </div>
           <div className="flex items-center">
              <span className="w-3.5 h-3.5 bg-warning rounded-full border-2 border-white inline-block mr-2"></span> River Sensor
          </div>
      </div>
    </div>
  );
};

export default DisasterMap;
