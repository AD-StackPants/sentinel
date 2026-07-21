import React, { useEffect, useState } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import axios from 'axios';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTelemetryWebSocket } from '../../hooks/useTelemetryWebSocket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_LNG = parseFloat(import.meta.env.VITE_DEFAULT_MAP_LONGITUDE) || 122.0790;
const DEFAULT_LAT = parseFloat(import.meta.env.VITE_DEFAULT_MAP_LATITUDE) || 6.9214;
const DEFAULT_ZOOM = parseFloat(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 12.5;

const DisasterMap: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [showFloodZones, setShowFloodZones] = useState<boolean>(true);
  const [showEvacuation, setShowEvacuation] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const { telemetry } = useTelemetryWebSocket();

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

  // Update geoData when new sensor telemetry arrives
  useEffect(() => {
    if (telemetry && telemetry.type === 'sensor_update' && geoData) {
      const updatedFeatures = geoData.features.map((feature: any) => {
        if (feature.properties.type === 'sensor') {
          const update = telemetry.data.find((d: any) => d.name === feature.properties.name);
          if (update) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                level: `${update.level.toFixed(1)}m`,
                status: update.level >= 8.0 ? 'Critical' : 'Normal'
              }
            };
          }
        }
        return feature;
      });

      setGeoData({ ...geoData, features: updatedFeatures });
    }
  }, [telemetry, geoData]);

  return (
    <div className="card h-full w-full relative overflow-hidden border-border bg-card shadow-sm">
      {/* Top Banner: Live Telemetry Status Overlay */}
      {(() => {
        const tumagaSensor = geoData?.features?.find((f: any) => f.properties.type === 'sensor' && f.properties.name === 'ZAM-TUMAGA-01');
        const level = tumagaSensor ? tumagaSensor.properties.level : '8.8m';
        const isCritical = level && parseFloat(level) >= 8.0;

        return (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-card/90 glass-panel border border-border px-3 py-1.5 rounded-xl shadow-md text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-danger animate-pulse' : 'bg-success'}`}></span>
            <span className="font-semibold text-foreground">SENSOR ZAM-TUMAGA-01:</span>
            <span className={`font-mono font-bold ${isCritical ? 'text-danger' : 'text-success'}`}>{level} WATER LEVEL {isCritical ? '(CRITICAL)' : '(NORMAL)'}</span>
          </div>
        );
      })()}

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
          longitude: DEFAULT_LNG,
          latitude: DEFAULT_LAT,
          zoom: DEFAULT_ZOOM
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={['evacuation-centers', 'hospitals', 'sensors']}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            setSelectedFeature(e.features[0]);
          } else {
            setSelectedFeature(null);
          }
        }}
        cursor="pointer"
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

        {selectedFeature && selectedFeature.properties.type === 'evacuation_center' && (
          <Popup
            longitude={selectedFeature.geometry.coordinates[0]}
            latitude={selectedFeature.geometry.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedFeature(null)}
            className="z-50"
            closeButton={false}
          >
            <div className="bg-card/90 glass-panel p-3 rounded-xl shadow-lg border border-border text-foreground min-w-[200px]">
              <h4 className="font-bold text-sm mb-1">{selectedFeature.properties.name}</h4>
              <p className="text-xs mb-2 text-neutral-foreground">Evacuation Center</p>

              <div className="w-full bg-neutral/20 rounded-full h-2 mb-1">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{ width: `${(selectedFeature.properties.occupancy / selectedFeature.properties.capacity) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs font-mono">
                {selectedFeature.properties.occupancy} / {selectedFeature.properties.capacity}
                ({Math.round((selectedFeature.properties.occupancy / selectedFeature.properties.capacity) * 100)}%)
              </p>
            </div>
          </Popup>
        )}

        {selectedFeature && selectedFeature.properties.type === 'hospital' && (
          <Popup
            longitude={selectedFeature.geometry.coordinates[0]}
            latitude={selectedFeature.geometry.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedFeature(null)}
            className="z-50"
            closeButton={false}
          >
            <div className="bg-card/90 glass-panel p-3 rounded-xl shadow-lg border border-border text-foreground min-w-[200px]">
              <h4 className="font-bold text-sm mb-1">{selectedFeature.properties.name}</h4>
              <p className="text-xs mb-2 text-neutral-foreground">Medical Facility</p>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-lg">{selectedFeature.properties.beds}</span>
                <span className="text-xs text-neutral-foreground">beds available</span>
              </div>
            </div>
          </Popup>
        )}

        {selectedFeature && selectedFeature.properties.type === 'sensor' && (
          <Popup
            longitude={selectedFeature.geometry.coordinates[0]}
            latitude={selectedFeature.geometry.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedFeature(null)}
            className="z-50"
            closeButton={false}
          >
            <div className="bg-card/90 glass-panel p-3 rounded-xl shadow-lg border border-border text-foreground min-w-[220px]">
              <h4 className="font-bold text-sm mb-1">{selectedFeature.properties.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${selectedFeature.properties.status === 'Critical' ? 'bg-danger animate-pulse' : 'bg-warning'}`}></span>
                <span className="text-xs font-bold font-mono">{selectedFeature.properties.level}</span>
                <span className="text-xs text-neutral-foreground uppercase">{selectedFeature.properties.status}</span>
              </div>

              <div className="h-16 w-full mt-2 border border-border/50 rounded bg-background/50">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { time: '00', level: 4.2 },
                    { time: '04', level: 4.8 },
                    { time: '08', level: 5.5 },
                    { time: '12', level: 6.8 },
                    { time: '16', level: 7.9 },
                    { time: '20', level: 8.4 },
                    { time: '24', level: 8.8 }
                  ]}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="level" stroke="#eab308" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-center text-neutral-foreground mt-1">24h Water Level Trend</p>
            </div>
          </Popup>
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
