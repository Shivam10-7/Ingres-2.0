import React, { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as GeoJSON from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/components/IndiaMapComponent.css';

// ─── MAPBOX TOKEN ──────────────────────────────────────────────────────────────
const mapboxToken =
  (import.meta.env as any).VITE_MAPBOX_TOKEN ||
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
mapboxgl.accessToken = mapboxToken;

// ─── TOPOJSON MINIMAL CONVERTER ───────────────────────────────────────────────
// Lightweight TopoJSON → GeoJSON converter (no external dep needed)
function topoArcToCoords(topology: any, arc: number[]): number[][] {
  const isReversed = arc[0] < 0;
  const idx = isReversed ? ~arc[0] : arc[0];
  const rawArc: number[][] = topology.arcs[idx];
  const transform = topology.transform;
  const coords: number[][] = [];

  let x = 0, y = 0;
  for (const delta of rawArc) {
    x += delta[0];
    y += delta[1];
    if (transform) {
      coords.push([
        x * transform.scale[0] + transform.translate[0],
        y * transform.scale[1] + transform.translate[1],
      ]);
    } else {
      coords.push([x, y]);
    }
  }
  return isReversed ? coords.reverse() : coords;
}

function topoArcsToRing(topology: any, arcIdxList: number[]): number[][] {
  const ring: number[][] = [];
  for (const arcIdx of arcIdxList) {
    const seg = topoArcToCoords(topology, [arcIdx]);
    if (ring.length > 0) {
      // skip first point (duplicate of previous last)
      ring.push(...seg.slice(1));
    } else {
      ring.push(...seg);
    }
  }
  return ring;
}

function topoGeomToGeoJSON(topology: any, geom: any): GeoJSON.Geometry | null {
  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geom.arcs.map((ring: number[]) => topoArcsToRing(topology, ring)),
    };
  }
  if (geom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geom.arcs.map((poly: number[][]) =>
        poly.map((ring: number[]) => topoArcsToRing(topology, ring))
      ),
    };
  }
  return null;
}

function topoToGeoJSON(topology: any, objectName: string): GeoJSON.FeatureCollection {
  const obj = topology.objects[objectName];
  const features: GeoJSON.Feature[] = [];
  obj.geometries.forEach((geom: any, i: number) => {
    const geometry = topoGeomToGeoJSON(topology, geom);
    if (geometry) {
      features.push({
        type: 'Feature',
        id: i,
        geometry,
        properties: { ...geom.properties },
      });
    }
  });
  return { type: 'FeatureCollection', features };
}

// ─── GROUNDWATER DATA ─────────────────────────────────────────────────────────
export const GW: Record<string, any> = {
  Gujarat:           { rain: 855.95, ext: 37411.68, extr: 17418.39, stage: 55.95, status: 'safe' },
  Maharashtra:       { rain: 1180.4, ext: 48200.0,  extr: 31850.0,  stage: 66.1,  status: 'caution' },
  Rajasthan:         { rain: 415.2,  ext: 17420.0,  extr: 19800.0,  stage: 113.7, status: 'critical' },
  Punjab:            { rain: 649.0,  ext: 21700.0,  extr: 30800.0,  stage: 141.9, status: 'critical' },
  'Uttar Pradesh':   { rain: 899.3,  ext: 76000.0,  extr: 68400.0,  stage: 90.0,  status: 'caution' },
  'Madhya Pradesh':  { rain: 1017.0, ext: 54200.0,  extr: 28300.0,  stage: 52.2,  status: 'safe' },
  Karnataka:         { rain: 1248.0, ext: 16550.0,  extr: 13800.0,  stage: 83.4,  status: 'caution' },
  'Andhra Pradesh':  { rain: 890.0,  ext: 23100.0,  extr: 15300.0,  stage: 66.2,  status: 'caution' },
  'Tamil Nadu':      { rain: 925.0,  ext: 22400.0,  extr: 22800.0,  stage: 101.8, status: 'critical' },
  Kerala:            { rain: 3055.0, ext: 6870.0,   extr: 3840.0,   stage: 55.9,  status: 'safe' },
  'West Bengal':     { rain: 1582.0, ext: 29800.0,  extr: 18900.0,  stage: 63.4,  status: 'caution' },
  Bihar:             { rain: 1028.0, ext: 28400.0,  extr: 17200.0,  stage: 60.6,  status: 'safe' },
  Haryana:           { rain: 571.5,  ext: 8700.0,   extr: 11400.0,  stage: 131.0, status: 'critical' },
  Odisha:            { rain: 1489.0, ext: 16600.0,  extr: 6800.0,   stage: 41.0,  status: 'safe' },
  Telangana:         { rain: 904.0,  ext: 14200.0,  extr: 9800.0,   stage: 69.0,  status: 'caution' },
  Assam:             { rain: 1962.0, ext: 26900.0,  extr: 5400.0,   stage: 20.1,  status: 'safe' },
  Jharkhand:         { rain: 1200.0, ext: 6400.0,   extr: 2800.0,   stage: 43.8,  status: 'safe' },
  Chhattisgarh:      { rain: 1292.0, ext: 14300.0,  extr: 4200.0,   stage: 29.4,  status: 'safe' },
  'Himachal Pradesh':{ rain: 1251.0, ext: 1400.0,   extr: 690.0,    stage: 49.3,  status: 'safe' },
  Uttarakhand:       { rain: 1558.0, ext: 2100.0,   extr: 1200.0,   stage: 57.1,  status: 'safe' },
};

// ─── DISTRICT GROUNDWATER (sample data — extend as needed) ────────────────────
// Keyed by "district|state"
const DISTRICT_GW: Record<string, any> = {
  'Nagpur|Maharashtra':       { stage: 61.2, rain: 1050, status: 'caution' },
  'Pune|Maharashtra':         { stage: 72.4, rain: 720,  status: 'caution' },
  'Mumbai|Maharashtra':       { stage: 55.0, rain: 2400, status: 'safe' },
  'Nashik|Maharashtra':       { stage: 48.3, rain: 820,  status: 'safe' },
  'Ahmednagar|Maharashtra':   { stage: 80.1, rain: 640,  status: 'caution' },
  'Jaipur|Rajasthan':         { stage: 118.5,rain: 380,  status: 'critical' },
  'Jodhpur|Rajasthan':        { stage: 132.0,rain: 290,  status: 'critical' },
  'Ahmedabad|Gujarat':        { stage: 52.1, rain: 810,  status: 'safe' },
  'Surat|Gujarat':            { stage: 44.6, rain: 1100, status: 'safe' },
  'Ludhiana|Punjab':          { stage: 145.2,rain: 580,  status: 'critical' },
  'Amritsar|Punjab':          { stage: 138.7,rain: 620,  status: 'critical' },
  'Bengaluru Urban|Karnataka':{ stage: 88.3, rain: 970,  status: 'caution' },
  'Chennai|Tamil Nadu':       { stage: 108.4,rain: 1400, status: 'critical' },
  'Hyderabad|Telangana':      { stage: 70.2, rain: 810,  status: 'caution' },
  'Lucknow|Uttar Pradesh':    { stage: 85.6, rain: 900,  status: 'caution' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function statusColor(status: string) {
  return status === 'critical' ? '#3d0010'
       : status === 'caution'  ? '#2d1f00'
       : '#003320';
}

function districtStatusColor(status: string) {
  return status === 'critical' ? '#4a0014'
       : status === 'caution'  ? '#3a2800'
       : '#004028';
}

function geomBounds(geom: any): [number, number, number, number] {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    } else coords.forEach(processCoords);
  }
  processCoords(geom.coordinates);
  return [minLng, minLat, maxLng, maxLat];
}

function featureBounds(feat: GeoJSON.Feature): [number, number, number, number] {
  return geomBounds(feat.geometry);
}

function computeCentroid(geom: GeoJSON.Geometry): [number, number] {
  const bounds = geomBounds(geom);
  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface IndiaMapComponentProps {
  onStateSelect?: (stateName: string, data?: any) => void;
  onDistrictSelect?: (districtName: string, stateName: string, data?: any) => void;
  onMapMessage?: (text: string) => void;
  isVisible?: boolean;
  mapTheme?: 'light' | 'dark';
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TOPO_OBJECT_NAME = 'india-districts-2019-734';
const DISTRICTS_URL =
  'https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/india/districts/districts.json';
// We'll use the uploaded file via a blob/import approach instead
// (handled in loadDistrictsForState via fetch of the local file path during dev,
//  or bundled as a JSON import in production)

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const IndiaMapComponent: React.FC<IndiaMapComponentProps> = ({
  onStateSelect,
  onDistrictSelect,
  onMapMessage,
  isVisible = true,
  mapTheme = 'dark',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const ttRef = useRef<HTMLDivElement>(null);
  const ttInnerRef = useRef<HTMLDivElement>(null);
  const activePopup = useRef<mapboxgl.Popup | null>(null);

  // ── Feature-state tracking refs ──────────────────────────────────────────
  const selectedStateIdRef   = useRef<number | null>(null);
  const hoveredStateIdRef    = useRef<number | null>(null);
  const selectedDistrictIdRef = useRef<number | null>(null);
  const hoveredDistrictIdRef  = useRef<number | null>(null);

  // ── TopoJSON cache (loaded once) ─────────────────────────────────────────
  const topoDataRef = useRef<any>(null);
  const allDistrictsGeoJSONRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // ── React state ──────────────────────────────────────────────────────────
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);
  const [zoom, setZoom] = useState(4);
  const [coords, setCoords] = useState({ lat: 22.59, lng: 78.96 });
  const [showLoader, setShowLoader] = useState(true);
  const [hierarchyLevel, setHierarchyLevel] = useState<'india' | 'state' | 'district'>('india');

  // ── Resize handling ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !isVisible) return;
    const delays = [120, 300, 600];
    const timers = delays.map(d => window.setTimeout(() => map.current?.resize(), d));
    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  useEffect(() => {
    const onResize = () => map.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── TOOLTIP ───────────────────────────────────────────────────────────────
  const moveTooltip = useCallback((e: MouseEvent) => {
    if (!ttRef.current) return;
    const cx = (e as any).clientX ?? (e as any).pageX;
    const cy = (e as any).clientY ?? (e as any).pageY;
    const tw = 220, th = 120;
    const w = window.innerWidth, h = window.innerHeight;
    ttRef.current.style.left = (cx + 16 + tw > w ? cx - tw - 10 : cx + 16) + 'px';
    ttRef.current.style.top  = (cy + 16 + th > h ? cy - th - 10 : cy + 16) + 'px';
  }, []);

  const hideTooltip = useCallback(() => {
    if (ttRef.current) ttRef.current.style.display = 'none';
  }, []);

  const showStateTooltip = useCallback((name: string) => {
    const d = GW[name];
    const badge = d
      ? `<span class="badge b-${d.status}">${d.status.toUpperCase()}</span>`
      : '';
    if (ttInnerRef.current) {
      ttInnerRef.current.innerHTML = `
        <div class="tt-name">${name} ${badge}</div>
        ${d ? `
        <hr class="tt-divider"/>
        <div class="tt-row">Rainfall <span>${d.rain} mm</span></div>
        <div class="tt-row">Stage    <span>${d.stage}%</span></div>
        <div class="tt-row" style="font-size:9px;margin-top:4px;color:var(--muted)">Click → districts&nbsp;&nbsp;Dbl-click → zoom</div>
        ` : `<div class="tt-row" style="color:var(--muted)">Click to explore districts</div>`}
      `;
    }
    if (ttRef.current) ttRef.current.style.display = 'block';
  }, []);

  const showDistrictTooltip = useCallback((district: string, state: string) => {
    const key = `${district}|${state}`;
    const d = DISTRICT_GW[key];
    const badge = d
      ? `<span class="badge b-${d.status}">${d.status.toUpperCase()}</span>`
      : '';
    if (ttInnerRef.current) {
      ttInnerRef.current.innerHTML = `
        <div class="tt-name">📍 ${district} ${badge}</div>
        <div class="tt-row" style="color:var(--muted);margin-bottom:4px">${state}</div>
        ${d ? `
        <hr class="tt-divider"/>
        <div class="tt-row">Rainfall <span>${d.rain} mm</span></div>
        <div class="tt-row">Stage    <span>${d.stage}%</span></div>
        ` : `<div class="tt-row" style="color:var(--muted)">Click for details</div>`}
      `;
    }
    if (ttRef.current) ttRef.current.style.display = 'block';
  }, []);

  // ─── MAP INIT ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapTheme === 'light' ? 'mapbox://styles/mapbox/light-v10' : 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 22.5937],
      zoom: 4,
      minZoom: 3,
      maxZoom: 14,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-left');

    map.current.on('zoom', () => setZoom(Math.round(map.current!.getZoom())));
    map.current.on('mousemove', (e) => {
      setCoords({
        lat: parseFloat(e.lngLat.lat.toFixed(2)),
        lng: parseFloat(e.lngLat.lng.toFixed(2)),
      });
    });

    map.current.on('load', async () => {
      // ── 1. Load state GeoJSON ──────────────────────────────────────────────
      const STATE_URL =
        'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';
      let stateGeoJSON: any;
      try {
        const res = await fetch(STATE_URL);
        stateGeoJSON = await res.json();
        stateGeoJSON.features.forEach((f: any, i: number) => {
          f.id = i;
          const p = f.properties;
          p._name = p.NAME_1 || p.ST_NM || p.name || p.state || 'Unknown';
        });
      } catch (e) {
        console.error('State GeoJSON load failed', e);
        setShowLoader(false);
        return;
      }

      // ── 2. Load TopoJSON districts ─────────────────────────────────────────
      // Try local first (Vite dev server serves public folder), then fallback CDN
      let topoData: any;
      try {
        // In a Vite project, place the file in /public/india-districts.json
        // or import it directly: import topoData from './india-districts-2019-734.json'
        // For maximum compatibility we try both paths:
        let topoRes: Response | null = null;
        const localPaths = [
          '/india-districts-2019-734.json',
          '/public/india-districts-2019-734.json',
          './india-districts-2019-734.json',
        ];
        for (const path of localPaths) {
          try {
            const r = await fetch(path);
            if (r.ok) { topoRes = r; break; }
          } catch { /* try next */ }
        }
        if (!topoRes) {
          // CDN fallback
          topoRes = await fetch(
            'https://cdn.jsdelivr.net/npm/india-topojson@1.0.0/india.json'
          );
        }
        topoData = await topoRes!.json();
        topoDataRef.current = topoData;

        // Convert full TopoJSON → GeoJSON once
        const objName = Object.keys(topoData.objects)[0];
        const fullGeoJSON = topoToGeoJSON(topoData, objName);
        // Assign stable numeric IDs
        fullGeoJSON.features.forEach((f, i) => { (f as any).id = i; });
        allDistrictsGeoJSONRef.current = fullGeoJSON;
      } catch (e) {
        console.warn('District TopoJSON load failed — district layer unavailable', e);
      }

      // ── 3. Add state source & layers ──────────────────────────────────────
      map.current!.addSource('india-states', {
        type: 'geojson',
        data: stateGeoJSON,
        generateId: true,
      });

      const colorExpr: any = ['match', ['get', '_name']];
      Object.entries(GW).forEach(([name, d]) => colorExpr.push(name, statusColor(d.status)));
      colorExpr.push('#0f2a44');

      map.current!.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
            colorExpr,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.18,
            0.72,
          ],
          'fill-outline-color': 'rgba(0,0,0,0)',
        },
      });

      map.current!.addLayer({
        id: 'states-line',
        type: 'line',
        source: 'india-states',
        paint: { 'line-color': 'rgba(0,212,255,0.3)', 'line-width': 0.8 },
      });

      map.current!.addLayer({
        id: 'states-hover-line',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': '#00d4ff',
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0],
          'line-blur':  ['case', ['boolean', ['feature-state', 'selected'], false], 3, 0],
          'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.9, 0],
        },
      });

      map.current!.addLayer({
        id: 'states-glow',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': '#00d4ff',
          'fill-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.08, 0],
        },
      });

      // ── 4. Add district source & layers (empty until state selected) ───────
      const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

      map.current!.addSource('city-boundaries', {
        type: 'geojson',
        data: EMPTY_FC,
        generateId: true,
      });

      // 4a. District fill — color-coded by groundwater status
      map.current!.addLayer({
        id: 'city-fill',
        type: 'fill',
        source: 'city-boundaries',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#00d4ff',
            ['match', ['get', 'gw_status'],
              'critical', '#4a0014',
              'caution',  '#3a2800',
              'safe',     '#004028',
              '#1e293b',
            ],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.45,
            0.6,
          ],
        },
      });

      // 4b. District border
      map.current!.addLayer({
        id: 'city-border',
        type: 'line',
        source: 'city-boundaries',
        paint: {
          'line-color': 'rgba(0,212,255,0.4)',
          'line-width': 0.8,
        },
      });

      // 4c. District glow (selected highlight)
      map.current!.addLayer({
        id: 'city-glow',
        type: 'fill',
        source: 'city-boundaries',
        paint: {
          'fill-color': '#00d4ff',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.22,
            ['boolean', ['feature-state', 'hovered'], false],  0.08,
            0,
          ],
        },
      });

      // 4d. District selected outline (bright glow ring)
      map.current!.addLayer({
        id: 'city-selected-line',
        type: 'line',
        source: 'city-boundaries',
        paint: {
          'line-color': '#00d4ff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.5,
            0,
          ],
          'line-blur': ['case', ['boolean', ['feature-state', 'selected'], false], 2, 0],
          'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0],
        },
      });

      // 4e. District labels
      map.current!.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'city-boundaries',
        minzoom: 6,
        layout: {
          'text-field': ['get', 'district'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 12],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
            '#c4d8f0',
          ],
          'text-halo-color': 'rgba(3,8,15,0.9)',
          'text-halo-width': 1.5,
        },
      });

      // ── 5. State interactions ─────────────────────────────────────────────
      map.current!.on('mousemove', 'states-fill', (e) => {
        if (hierarchyLevelRef.current !== 'india') return;
        map.current!.getCanvas().style.cursor = 'pointer';
        const feat = e.features?.[0];
        if (feat) {
          if (hoveredStateIdRef.current !== null && hoveredStateIdRef.current !== feat.id) {
            map.current!.setFeatureState(
              { source: 'india-states', id: hoveredStateIdRef.current }, { hovered: false }
            );
          }
          hoveredStateIdRef.current = feat.id as number;
          map.current!.setFeatureState(
            { source: 'india-states', id: feat.id as number }, { hovered: true }
          );
          showStateTooltip(feat.properties._name);
        }
      });

      map.current!.on('mousemove', (e) => moveTooltip(e.originalEvent));

      map.current!.on('mouseleave', 'states-fill', () => {
        map.current!.getCanvas().style.cursor = '';
        if (hoveredStateIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'india-states', id: hoveredStateIdRef.current }, { hovered: false }
          );
          hoveredStateIdRef.current = null;
        }
        hideTooltip();
      });

      // State SINGLE click → load districts
      map.current!.on('click', 'states-fill', (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const id   = feat.id as number;
        const name = feat.properties._name;

        // Toggle deselect
        if (selectedStateIdRef.current === id) {
          map.current!.setFeatureState({ source: 'india-states', id }, { selected: false });
          selectedStateIdRef.current = null;
          clearDistricts();
          setCurrentState(null);
          setHierarchyLevel('india');
          hierarchyLevelRef.current = 'india';
          return;
        }

        // Deselect previous
        if (selectedStateIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'india-states', id: selectedStateIdRef.current }, { selected: false }
          );
        }

        selectedStateIdRef.current = id;
        map.current!.setFeatureState({ source: 'india-states', id }, { selected: true });

        setCurrentState(name);
        setCurrentDistrict(null);
        setHierarchyLevel('state');
        hierarchyLevelRef.current = 'state';

        // Zoom to state bounds
        const bounds = geomBounds(feat.geometry);
        map.current!.fitBounds(bounds as [number, number, number, number], {
          padding: 60,
          duration: 900,
        });

        // Load districts for this state
        loadDistrictsForState(name);

        // Notify parent
        if (onStateSelect) onStateSelect(name, GW[name]);
        onMapMessage?.(`Loaded districts for ${name}`);
      });

      // State DOUBLE click → zoom closer (handled above + prevent double fire)
      map.current!.on('dblclick', 'states-fill', (e) => {
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;
        const bounds = geomBounds(feat.geometry);
        map.current!.fitBounds(bounds as [number, number, number, number], {
          padding: 40, duration: 800,
        });
      });

      // ── 6. District interactions ──────────────────────────────────────────
      map.current!.on('mouseenter', 'city-fill', (e) => {
        map.current!.getCanvas().style.cursor = 'pointer';
        const feat = e.features?.[0];
        if (!feat) return;
        const id = feat.id as number;
        if (hoveredDistrictIdRef.current !== null && hoveredDistrictIdRef.current !== id) {
          map.current!.setFeatureState(
            { source: 'city-boundaries', id: hoveredDistrictIdRef.current }, { hovered: false }
          );
        }
        hoveredDistrictIdRef.current = id;
        map.current!.setFeatureState({ source: 'city-boundaries', id }, { hovered: true });
        showDistrictTooltip(feat.properties.district, feat.properties.st_nm);
      });

      map.current!.on('mousemove', 'city-fill', (e) => {
        moveTooltip(e.originalEvent);
        const feat = e.features?.[0];
        if (!feat) return;
        const id = feat.id as number;
        if (hoveredDistrictIdRef.current !== id) {
          if (hoveredDistrictIdRef.current !== null) {
            map.current!.setFeatureState(
              { source: 'city-boundaries', id: hoveredDistrictIdRef.current }, { hovered: false }
            );
          }
          hoveredDistrictIdRef.current = id;
          map.current!.setFeatureState({ source: 'city-boundaries', id }, { hovered: true });
          showDistrictTooltip(feat.properties.district, feat.properties.st_nm);
        }
      });

      map.current!.on('mouseleave', 'city-fill', () => {
        map.current!.getCanvas().style.cursor = '';
        if (hoveredDistrictIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'city-boundaries', id: hoveredDistrictIdRef.current }, { hovered: false }
          );
          hoveredDistrictIdRef.current = null;
        }
        hideTooltip();
      });

      // District SINGLE click → highlight + popup
      map.current!.on('click', 'city-fill', (e) => {
        e.preventDefault(); // stop state click firing
        const feat = e.features?.[0];
        if (!feat) return;
        const id       = feat.id as number;
        const district = feat.properties.district as string;
        const state    = feat.properties.st_nm    as string;
        const key      = `${district}|${state}`;
        const gwData   = DISTRICT_GW[key];

        // Toggle deselect
        if (selectedDistrictIdRef.current === id) {
          map.current!.setFeatureState({ source: 'city-boundaries', id }, { selected: false });
          selectedDistrictIdRef.current = null;
          activePopup.current?.remove();
          setCurrentDistrict(null);
          return;
        }

        // Deselect previous
        if (selectedDistrictIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'city-boundaries', id: selectedDistrictIdRef.current }, { selected: false }
          );
        }

        selectedDistrictIdRef.current = id;
        map.current!.setFeatureState({ source: 'city-boundaries', id }, { selected: true });
        setCurrentDistrict(district);
        setHierarchyLevel('district');
        hierarchyLevelRef.current = 'district';

        // Popup
        const centroid = computeCentroid(feat.geometry as GeoJSON.Geometry);
        activePopup.current?.remove();
        const statusBadge = gwData
          ? `<span style="display:inline-block;margin-top:6px;padding:2px 8px;border-radius:12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;
               background:${gwData.status==='critical'?'rgba(255,77,109,0.15)':gwData.status==='caution'?'rgba(245,166,35,0.15)':'rgba(0,229,160,0.15)'};
               color:${gwData.status==='critical'?'#ff4d6d':gwData.status==='caution'?'#f5a623':'#00e5a0'};
               border:1px solid ${gwData.status==='critical'?'rgba(255,77,109,0.4)':gwData.status==='caution'?'rgba(245,166,35,0.4)':'rgba(0,229,160,0.4)'}">${gwData.status.toUpperCase()}</span>`
          : '';

        activePopup.current = new mapboxgl.Popup({ closeOnClick: true, maxWidth: '240px' })
          .setLngLat(centroid)
          .setHTML(`
            <div class="popup-title">📍 ${district}</div>
            <div class="popup-row"><span class="pk">State</span><span class="pv">${state}</span></div>
            ${gwData ? `
            <div class="popup-row"><span class="pk">Rainfall</span><span class="pv">${gwData.rain} mm</span></div>
            <div class="popup-row"><span class="pk">GW Stage</span><span class="pv">${gwData.stage}%</span></div>
            ${statusBadge}
            ` : `<div class="popup-row"><span class="pk" style="color:var(--muted)">No data available</span></div>`}
          `)
          .addTo(map.current!);

        if (onDistrictSelect) onDistrictSelect(district, state, gwData);
      });

      // District DOUBLE click → zoom to district + show parent state info
      map.current!.on('dblclick', 'city-fill', (e) => {
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;

        const state  = feat.properties.st_nm as string;
        const bounds = geomBounds(feat.geometry as GeoJSON.Geometry);
        map.current!.fitBounds(bounds as [number, number, number, number], {
          padding: 60, duration: 900, maxZoom: 12,
        });

        // Highlight parent state — find it in state source
        onMapMessage?.(`Zoomed to district. Parent state: ${state}`);
        if (onStateSelect) onStateSelect(state, GW[state]);
      });

      setShowLoader(false);
      console.info('Map loaded. Click any state to reveal district boundaries.');
    });

    return () => { map.current?.remove(); };
  }, [mapTheme]);

  // ── Keep a stable ref to hierarchyLevel for use inside map callbacks ────
  const hierarchyLevelRef = useRef<'india' | 'state' | 'district'>('india');
  useEffect(() => { hierarchyLevelRef.current = hierarchyLevel; }, [hierarchyLevel]);

  // ─── LOAD DISTRICTS FOR STATE ─────────────────────────────────────────────
  const loadDistrictsForState = useCallback((stateName: string) => {
    if (!map.current?.getSource('city-boundaries')) return;

    if (!allDistrictsGeoJSONRef.current) {
      // District data unavailable (fetch failed)
      console.warn('No district data available');
      return;
    }

    // Clear previous selection
    if (selectedDistrictIdRef.current !== null) {
      try {
        map.current.setFeatureState(
          { source: 'city-boundaries', id: selectedDistrictIdRef.current }, { selected: false }
        );
      } catch { /* source may have been reset */ }
      selectedDistrictIdRef.current = null;
    }
    activePopup.current?.remove();

    // Filter districts by state name
    const stateFeatures = allDistrictsGeoJSONRef.current.features.filter((f) => {
      const sn = f.properties?.st_nm || f.properties?.state || '';
      return sn === stateName;
    });

    if (stateFeatures.length === 0) {
      console.warn(`No districts found for state: ${stateName}`);
    }

    // Enrich features with groundwater status for paint expressions
    const enriched: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: stateFeatures.map((f) => {
        const d = f.properties?.district || '';
        const key = `${d}|${stateName}`;
        const gw = DISTRICT_GW[key];
        return {
          ...f,
          properties: {
            ...f.properties,
            gw_status: gw?.status || 'unknown',
            gw_stage:  gw?.stage  || null,
            gw_rain:   gw?.rain   || null,
          },
        };
      }),
    };

    (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData(enriched);
  }, []);

  const clearDistricts = useCallback(() => {
    if (!map.current?.getSource('city-boundaries')) return;
    activePopup.current?.remove();
    selectedDistrictIdRef.current = null;
    hoveredDistrictIdRef.current  = null;
    (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection', features: [],
    });
  }, []);

  // ─── RESET MAP ────────────────────────────────────────────────────────────
  const resetMap = useCallback(() => {
    setCurrentState(null);
    setCurrentDistrict(null);
    setHierarchyLevel('india');
    hierarchyLevelRef.current = 'india';
    clearDistricts();
    if (map.current?.getSource('india-states')) {
      map.current.removeFeatureState({ source: 'india-states' });
    }
    selectedStateIdRef.current = null;
    map.current?.flyTo({ center: [78.9629, 22.5937], zoom: 4, duration: 1000 });
  }, [clearDistricts]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div
      className="map-container h-full w-full relative"
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      <div id="map" ref={mapContainer} className="h-full w-full" />

      {/* Loading overlay */}
      {showLoader && (
        <div className="loader">
          <div className="loader-ring" />
          <div className="loader-text">Initializing GIS layers…</div>
        </div>
      )}

      {/* Tooltip */}
      <div id="tooltip" className="tooltip" ref={ttRef} style={{ display: 'none' }}>
        <div className="tt-inner" ref={ttInnerRef} />
      </div>

      {/* Hierarchy breadcrumb badge */}
      <div className="mapBadge">
        <div className="mb-z">
          {hierarchyLevel === 'india'    && '🌏 India'}
          {hierarchyLevel === 'state'    && `📍 ${currentState}`}
          {hierarchyLevel === 'district' && `🏙 ${currentDistrict}`}
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '1px' }}>
          ZOOM {zoom} &nbsp;|&nbsp; {coords.lat}°N {coords.lng}°E
        </div>
        {hierarchyLevel !== 'india' && (
          <button
            onClick={resetMap}
            style={{
              marginTop: 6,
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'var(--accent)',
              borderRadius: 5,
              padding: '3px 10px',
              fontSize: 9,
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: 'var(--mono)',
            }}
          >
            ← Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default IndiaMapComponent;
