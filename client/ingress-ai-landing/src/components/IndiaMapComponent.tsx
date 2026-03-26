import React, { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as GeoJSON from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/components/IndiaMapComponent.css';
import { getGwraMapData, type GwraMapSummary } from '@/lib/api';

// ─── MAPBOX TOKEN ──────────────────────────────────────────────────────────────
const mapboxToken =
  (import.meta.env as any).VITE_MAPBOX_TOKEN ||
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
mapboxgl.accessToken = mapboxToken;

// ─── TOPOJSON MINIMAL CONVERTER ───────────────────────────────────────────────
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

// ─── DISTRICT GROUNDWATER ────────────────────────────────────────────────────
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

// ─── PREMIUM COLOR SYSTEM ─────────────────────────────────────────────────────
const MAP_DEEP = '#050C9C';
const MAP_PRIMARY = '#3572EF';
const MAP_BRIGHT = '#3ABEF9';
const MAP_LIGHT = '#A7E6FF';
const MAP_NEUTRAL_FILL = MAP_DEEP;
const MAP_SELECTED_FILL = MAP_PRIMARY;
const MAP_BORDER = 'rgba(167, 230, 255, 0.5)';
const MAP_HOVER_ACCENT = MAP_LIGHT;

// Blue palette requested by user.
function statusColor(status: string) {
  return status === 'critical' ? MAP_DEEP
       : status === 'caution'  ? MAP_PRIMARY
       : MAP_BRIGHT;
}

function districtStatusColor(status: string) {
  return status === 'critical' ? MAP_PRIMARY
       : status === 'caution'  ? MAP_BRIGHT
       : MAP_LIGHT;
}

function statusGlowColor(status: string) {
  return status === 'critical' ? MAP_PRIMARY
       : status === 'caution'  ? MAP_BRIGHT
       : MAP_LIGHT;
}

function normalizeLocationName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatHam(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  return value.toLocaleString('en-IN', {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const IndiaMapComponent: React.FC<IndiaMapComponentProps> = ({
  onStateSelect,
  onDistrictSelect,
  onMapMessage,
  isVisible = true,
  mapTheme = 'dark',
}) => {
  const STATE_ONLY_MAX_ZOOM = 5;
  const CITY_MODE_MIN_ZOOM = STATE_ONLY_MAX_ZOOM + 1;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const ttRef = useRef<HTMLDivElement>(null);
  const ttInnerRef = useRef<HTMLDivElement>(null);
  const activePopup = useRef<mapboxgl.Popup | null>(null);

  const selectedStateIdRef   = useRef<number | null>(null);
  const hoveredStateIdRef    = useRef<number | null>(null);
  const selectedDistrictIdRef = useRef<number | null>(null);
  const hoveredDistrictIdRef  = useRef<number | null>(null);

  const topoDataRef = useRef<any>(null);
  const allDistrictsGeoJSONRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const stateDataRef = useRef<Record<string, GwraMapSummary>>({});
  const districtDataRef = useRef<Record<string, GwraMapSummary>>({});

  const [currentState, setCurrentState] = useState<string | null>(null);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);
  const [zoom, setZoom] = useState(4);
  const [coords, setCoords] = useState({ lat: 22.59, lng: 78.96 });
  const [showLoader, setShowLoader] = useState(true);
  const [hierarchyLevel, setHierarchyLevel] = useState<'india' | 'state' | 'district'>('india');

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

  const getStateData = useCallback((stateName: string) => {
    const directMatch = stateDataRef.current[stateName];
    if (directMatch) return directMatch;

    const normalizedState = normalizeLocationName(stateName);
    return Object.values(stateDataRef.current).find(
      (entry) => normalizeLocationName(entry.name) === normalizedState
    );
  }, []);

  const getDistrictData = useCallback((districtName: string, stateName: string) => {
    const directKey = `${districtName}|${stateName}`;
    const directMatch = districtDataRef.current[directKey];
    if (directMatch) return directMatch;

    const normalizedDistrict = normalizeLocationName(districtName);
    const normalizedState = normalizeLocationName(stateName);

    return Object.values(districtDataRef.current).find(
      (entry) =>
        normalizeLocationName(entry.name) === normalizedDistrict &&
        normalizeLocationName(entry.state || '') === normalizedState
    );
  }, []);

  // ─── TOOLTIP ───────────────────────────────────────────────────────────────
  const moveTooltip = useCallback((e: MouseEvent) => {
    if (!ttRef.current) return;
    const cx = (e as any).clientX ?? (e as any).pageX;
    const cy = (e as any).clientY ?? (e as any).pageY;
    const tw = 220, th = 130;
    const w = window.innerWidth, h = window.innerHeight;
    ttRef.current.style.left = (cx + 16 + tw > w ? cx - tw - 10 : cx + 16) + 'px';
    ttRef.current.style.top  = (cy + 16 + th > h ? cy - th - 10 : cy + 16) + 'px';
  }, []);

  const hideTooltip = useCallback(() => {
    if (ttRef.current) ttRef.current.style.display = 'none';
  }, []);

  const showStateTooltip = useCallback((name: string) => {
    const d = getStateData(name);
    let glowColor = MAP_HOVER_ACCENT;
    if (d) {
      if (mapTheme === 'light') glowColor = d.status === 'critical' ? '#1e3a8a' : d.status === 'caution' ? '#1d4ed8' : '#0284c7';
      else glowColor = statusGlowColor(d.status);
    } else if (mapTheme === 'light') glowColor = '#0369a1';

    const badge = d
      ? `<span class="badge b-${d.status}">${d.status.toUpperCase()}</span>`
      : '';
    if (ttInnerRef.current) {
      ttInnerRef.current.innerHTML = `
        <div class="tt-name" style="color:${glowColor}">${name} ${badge}</div>
        ${d ? `
        <hr class="tt-divider"/>
        <div class="tt-row">Recharge <span style="color:${glowColor}">${formatHam(d.recharge)} Ham</span></div>
        <div class="tt-row">Extraction <span style="color:${glowColor}">${formatHam(d.extraction)} Ham</span></div>
        <div class="tt-row">GW Stage <span style="color:${glowColor}">${d.stage}%</span></div>
        <div class="tt-row" style="font-size:9px;margin-top:6px;color:var(--muted)">
          <span style="opacity:0.6">Click → districts &nbsp;·&nbsp; Dbl-click → zoom</span>
        </div>
        ` : `<div class="tt-row" style="color:var(--muted)">Click to explore districts</div>`}
      `;
    }
    if (ttRef.current) ttRef.current.style.display = 'block';
  }, [getStateData]);

  const showDistrictTooltip = useCallback((district: string, state: string) => {
    const d = getDistrictData(district, state);
    let glowColor = MAP_HOVER_ACCENT;
    if (d) {
      if (mapTheme === 'light') glowColor = d.status === 'critical' ? '#1e3a8a' : d.status === 'caution' ? '#1d4ed8' : '#0284c7';
      else glowColor = statusGlowColor(d.status);
    } else if (mapTheme === 'light') glowColor = '#0369a1';

    const badge = d
      ? `<span class="badge b-${d.status}">${d.status.toUpperCase()}</span>`
      : '';
    if (ttInnerRef.current) {
      ttInnerRef.current.innerHTML = `
        <div class="tt-name" style="color:${glowColor}">◈ ${district} ${badge}</div>
        <div class="tt-row" style="color:var(--muted);margin-bottom:5px">${state}</div>
        ${d ? `
        <hr class="tt-divider"/>
        <div class="tt-row">Recharge <span style="color:${glowColor}">${formatHam(d.recharge)} Ham</span></div>
        <div class="tt-row">Extraction <span style="color:${glowColor}">${formatHam(d.extraction)} Ham</span></div>
        <div class="tt-row">GW Stage <span style="color:${glowColor}">${d.stage}%</span></div>
        ` : `<div class="tt-row" style="color:var(--muted)">Click for details</div>`}
      `;
    }
    if (ttRef.current) ttRef.current.style.display = 'block';
  }, [getDistrictData]);

  // ─── MAP INIT ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // Premium dark base — deepest available dark style
      style: mapTheme === 'light'
        ? 'mapbox://styles/mapbox/light-v10'
        : 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 22.5937],
      zoom: 4,
      minZoom: 3,
      maxZoom: 14,
      antialias: true,
      // Slight pitch for subtle 3D depth feel
      pitch: 0,
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
      const mapData = await getGwraMapData();
      stateDataRef.current = mapData.states ?? {};
      districtDataRef.current = mapData.districts ?? {};

      const themePalette = mapTheme === 'light'
        ? {
            background: '#f2fbff',
            water: '#A7E6FF',
            land: '#eef6ff',
            label: '#050C9C',
            halo: 'rgba(255,255,255,0.92)',
          }
        : {
            background: '#03065a',
            water: '#050C9C',
            land: '#07136f',
            label: '#A7E6FF',
            halo: 'rgba(2,6,23,0.95)',
          };
      // ── Deep ocean / background override ─────────────────────────────────
      // Make the ocean/background much darker for depth contrast
      if (map.current!.getLayer('background')) {
        map.current!.setPaintProperty('background', 'background-color', themePalette.background);
      }
      // Ocean / water layers
      ['water', 'water-shadow', 'waterway'].forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          try {
            map.current!.setPaintProperty(layerId, 'fill-color', themePalette.water);
          } catch { /* layer uses line paint */ }
          try {
            map.current!.setPaintProperty(layerId, 'line-color', themePalette.water);
          } catch { /* layer uses fill paint */ }
        }
      });
      // Darken land base
      if (map.current!.getLayer('land')) {
        map.current!.setPaintProperty('land', 'background-color', themePalette.land);
      }

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
          // Pre-attach status for paint expressions
          const gwData = getStateData(p._name);
          p._status = gwData?.status || 'unknown';
        });
      } catch (e) {
        console.error('State GeoJSON load failed', e);
        setShowLoader(false);
        return;
      }

      // ── 2. Load TopoJSON districts ─────────────────────────────────────────
      let topoData: any;
      try {
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
          topoRes = await fetch('https://cdn.jsdelivr.net/npm/india-topojson@1.0.0/india.json');
        }
        topoData = await topoRes!.json();
        topoDataRef.current = topoData;
        const objName = Object.keys(topoData.objects)[0];
        const fullGeoJSON = topoToGeoJSON(topoData, objName);
        fullGeoJSON.features.forEach((f, i) => { (f as any).id = i; });
        allDistrictsGeoJSONRef.current = fullGeoJSON;
      } catch (e) {
        console.warn('District TopoJSON load failed — district layer unavailable', e);
      }

      // ── 3. State source & layers (premium paint system) ───────────────────
      map.current!.addSource('india-states', {
        type: 'geojson',
        data: stateGeoJSON,
        generateId: true,
      });

      const colorExpr: any = [
        'match', ['get', '_status'],
        'critical', statusColor('critical'),
        'caution', statusColor('caution'),
        'safe', statusColor('safe'),
        MAP_NEUTRAL_FILL,
      ];

      // 3a. State base fill — deep, rich, gradient-aware
      map.current!.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP_SELECTED_FILL,
            colorExpr,
          ],
          'fill-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3,  ['case', ['boolean', ['feature-state', 'selected'], false], 0.9, 0.85],
            6,  ['case', ['boolean', ['feature-state', 'selected'], false], 0.7, 0.75],
          ],
          'fill-antialias': true,
        },
      });

      // 3b. State hover shimmer fill — color-matched glow overlay
      map.current!.addLayer({
        id: 'states-hover-fill',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], MAP_HOVER_ACCENT,
            ['boolean', ['feature-state', 'hovered'], false],  MAP_HOVER_ACCENT,
            'transparent',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.1,
            ['boolean', ['feature-state', 'hovered'], false],  0.04,
            0,
          ],
        },
      });

      // 3c. Base state border — thin, premium cyan tint
      map.current!.addLayer({
        id: 'states-line',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': MAP_BORDER,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 6, 1.0],
        },
      });

      // 3d. Selected state glow border — multi-layer glow simulation
      // Outer soft glow ring
      map.current!.addLayer({
        id: 'states-glow-outer',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': MAP_HOVER_ACCENT,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 4,
            ['boolean', ['feature-state', 'hovered'], false],  2,
            0,
          ],
          'line-blur': 0,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.45,
            ['boolean', ['feature-state', 'hovered'], false],  0.22,
            0,
          ],
        },
      });

      // Inner crisp selected border
      map.current!.addLayer({
        id: 'states-selected-line',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': MAP_HOVER_ACCENT,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2,
            ['boolean', ['feature-state', 'hovered'], false],  1,
            0,
          ],
          'line-blur': 0,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.0,
            ['boolean', ['feature-state', 'hovered'], false],  0.6,
            0,
          ],
        },
      });

      // ── 4. District source & layers ────────────────────────────────────────
      const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

      map.current!.addSource('city-boundaries', {
        type: 'geojson',
        data: EMPTY_FC,
        generateId: true,
      });

      // District status color expression
      const districtColorExpr: any = [
        'match', ['get', 'gw_status'],
        'critical', districtStatusColor('critical'),
        'caution',  districtStatusColor('caution'),
        'safe',     districtStatusColor('safe'),
        MAP_NEUTRAL_FILL,
      ];

      // 4a. District base fill — depth hierarchy (brighter than states)
      map.current!.addLayer({
        id: 'city-fill',
        type: 'fill',
        source: 'city-boundaries',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP_SELECTED_FILL,
            districtColorExpr,
          ],
          'fill-opacity': [
            'interpolate', ['linear'], ['zoom'],
            6, 0.75,
            10, 0.80,
          ],
          'fill-antialias': true,
        },
      });

      // 4b. District status glow overlay (color-matched)
      map.current!.addLayer({
        id: 'city-status-glow',
        type: 'fill',
        source: 'city-boundaries',
        paint: {
          'fill-color': [
            'match', ['get', 'gw_status'],
            'critical', statusGlowColor('critical'),
            'caution',  statusGlowColor('caution'),
            'safe',     statusGlowColor('safe'),
            MAP_HOVER_ACCENT,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.08,
            ['boolean', ['feature-state', 'hovered'], false],  0.03,
            0.01,
          ],
        },
      });

      // 4c. District base border
      map.current!.addLayer({
        id: 'city-border',
        type: 'line',
        source: 'city-boundaries',
        paint: {
          'line-color': MAP_BORDER,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 10, 0.8],
        },
      });

      // 4d. District outer glow line (blur)
      map.current!.addLayer({
        id: 'city-glow-outer',
        type: 'line',
        source: 'city-boundaries',
        paint: {
          'line-color': [
            'match', ['get', 'gw_status'],
            'critical', statusGlowColor('critical'),
            'caution',  statusGlowColor('caution'),
            'safe',     statusGlowColor('safe'),
            MAP_HOVER_ACCENT,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.5,
            ['boolean', ['feature-state', 'hovered'], false],  1.5,
            0,
          ],
          'line-blur': 0,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.55,
            ['boolean', ['feature-state', 'hovered'], false],  0.28,
            0,
          ],
        },
      });

      // 4e. District selected crisp border
      map.current!.addLayer({
        id: 'city-selected-line',
        type: 'line',
        source: 'city-boundaries',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            ['match', ['get', 'gw_status'],
              'critical', statusGlowColor('critical'),
              'caution',  statusGlowColor('caution'),
              'safe',     statusGlowColor('safe'),
              MAP_HOVER_ACCENT,
            ],
            MAP_HOVER_ACCENT,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2,
            ['boolean', ['feature-state', 'hovered'], false],  1,
            0,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1,
            ['boolean', ['feature-state', 'hovered'], false],  0.7,
            0,
          ],
        },
      });

      // 4f. District labels — premium typography with glow
      map.current!.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'city-boundaries',
        minzoom: 6.5,
        layout: {
          'text-field': ['get', 'district'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 8, 11, 11, 13],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], MAP_HOVER_ACCENT,
            ['boolean', ['feature-state', 'hovered'], false],  MAP_HOVER_ACCENT,
            themePalette.label,
          ],
          'text-halo-color': themePalette.halo,
          'text-halo-width': 2,
          'text-halo-blur': 1,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 0, 7, 1],
        },
      });

      const enrichDistricts = (features: GeoJSON.Feature[]) => {
        return features.map((f) => {
          const district = (f.properties?.district || '').toString();
          const state = (f.properties?.st_nm || f.properties?.state || '').toString();
          const gw = getDistrictData(district, state);
          return {
            ...f,
            properties: {
              ...f.properties,
              gw_status: gw?.status || 'unknown',
              gw_stage: gw?.stage ?? null,
              gw_recharge: gw?.recharge ?? null,
              gw_extractable: gw?.extractable ?? null,
              gw_extraction: gw?.extraction ?? null,
              gw_category: gw?.worstCategory ?? null,
            },
          };
        });
      };

      const setCityLayerVisibility = (visible: boolean) => {
        ['city-fill', 'city-status-glow', 'city-border', 'city-glow-outer', 'city-selected-line', 'city-labels'].forEach((layerId) => {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
          }
        });
      };

      const applyZoomMode = () => {
        if (!map.current?.getSource('city-boundaries')) return;
        const z = map.current.getZoom();
        const cityMode = z >= CITY_MODE_MIN_ZOOM;

        if (cityMode) {
          const features = allDistrictsGeoJSONRef.current?.features || [];
          const enriched: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: enrichDistricts(features),
          };
          (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData(enriched);
          setCityLayerVisibility(true);
        } else {
          (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection', features: [],
          });
          setCityLayerVisibility(false);
          if (selectedDistrictIdRef.current !== null) {
            selectedDistrictIdRef.current = null;
            setCurrentDistrict(null);
          }
        }
      };

      map.current!.on('zoomend', () => applyZoomMode());
      applyZoomMode();

      // ── 5. State interactions ─────────────────────────────────────────────
      map.current!.on('mousemove', 'states-fill', (e) => {
        if (map.current!.getZoom() >= CITY_MODE_MIN_ZOOM) return;
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
        if (map.current!.getZoom() >= CITY_MODE_MIN_ZOOM) return;
        map.current!.getCanvas().style.cursor = '';
        if (hoveredStateIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'india-states', id: hoveredStateIdRef.current }, { hovered: false }
          );
          hoveredStateIdRef.current = null;
        }
        hideTooltip();
      });

      // State SINGLE click
      map.current!.on('click', 'states-fill', (e) => {
        if (map.current!.getZoom() >= CITY_MODE_MIN_ZOOM) return;
        const feat = e.features?.[0];
        if (!feat) return;
        const id   = feat.id as number;
        const name = feat.properties._name;

        if (selectedStateIdRef.current === id) {
          map.current!.setFeatureState({ source: 'india-states', id }, { selected: false });
          selectedStateIdRef.current = null;
          clearDistricts();
          setCurrentState(null);
          setHierarchyLevel('india');
          hierarchyLevelRef.current = 'india';
          return;
        }

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

        if (onStateSelect) onStateSelect(name, getStateData(name));
        onMapMessage?.(`Selected state: ${name}`);
      });

      // State DOUBLE click → zoom
      map.current!.on('dblclick', 'states-fill', (e) => {
        if (map.current!.getZoom() >= CITY_MODE_MIN_ZOOM) return;
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;
        const bounds = geomBounds(feat.geometry);
        map.current!.fitBounds(bounds as [number, number, number, number], {
          padding: 40, duration: 900,
        });
      });

      // ── 6. District interactions ──────────────────────────────────────────
      map.current!.on('mouseenter', 'city-fill', (e) => {
        if (map.current!.getZoom() < CITY_MODE_MIN_ZOOM) return;
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
        if (map.current!.getZoom() < CITY_MODE_MIN_ZOOM) return;
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
        if (map.current!.getZoom() < CITY_MODE_MIN_ZOOM) return;
        map.current!.getCanvas().style.cursor = '';
        if (hoveredDistrictIdRef.current !== null) {
          map.current!.setFeatureState(
            { source: 'city-boundaries', id: hoveredDistrictIdRef.current }, { hovered: false }
          );
          hoveredDistrictIdRef.current = null;
        }
        hideTooltip();
      });

      // District SINGLE click
      map.current!.on('click', 'city-fill', (e) => {
        if (map.current!.getZoom() < CITY_MODE_MIN_ZOOM) return;
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;
        const id       = feat.id as number;
        const district = feat.properties.district as string;
        const state    = feat.properties.st_nm    as string;
        const gwData   = getDistrictData(district, state);
        
        let glowColor = MAP_HOVER_ACCENT;
        if (gwData) {
          if (mapTheme === 'light') glowColor = gwData.status === 'critical' ? '#1e3a8a' : gwData.status === 'caution' ? '#1d4ed8' : '#0284c7';
          else glowColor = statusGlowColor(gwData.status);
        } else if (mapTheme === 'light') glowColor = '#0369a1';

        if (selectedDistrictIdRef.current === id) {
          map.current!.setFeatureState({ source: 'city-boundaries', id }, { selected: false });
          selectedDistrictIdRef.current = null;
          activePopup.current?.remove();
          setCurrentDistrict(null);
          return;
        }

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

        const centroid = computeCentroid(feat.geometry as GeoJSON.Geometry);
        activePopup.current?.remove();

        const statusBadge = gwData
          ? `<span class="popup-status-badge" style="
               display:inline-block;margin-top:8px;padding:3px 10px;border-radius:12px;
               font-size:9px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;
               background:${gwData.status==='critical'?'rgba(255,77,109,0.15)':gwData.status==='caution'?'rgba(245,166,35,0.15)':'rgba(0,229,160,0.15)'};
               color:${glowColor};
               border:1px solid ${glowColor}40;
               box-shadow: 0 0 8px ${glowColor}30;
             ">${gwData.status.toUpperCase()}</span>`
          : '';

        activePopup.current = new mapboxgl.Popup({
          closeOnClick: true,
          maxWidth: '260px',
          className: 'premium-popup',
        })
          .setLngLat(centroid)
          .setHTML(`
            <div class="popup-title" style="color:${glowColor}">◈ ${district}</div>
            <div class="popup-row"><span class="pk">State</span><span class="pv" style="color:${glowColor}">${state}</span></div>
            ${gwData ? `
            <div class="popup-row"><span class="pk">Recharge</span><span class="pv" style="color:${glowColor}">${formatHam(gwData.recharge)} Ham</span></div>
            <div class="popup-row"><span class="pk">Extractable</span><span class="pv" style="color:${glowColor}">${formatHam(gwData.extractable)} Ham</span></div>
            <div class="popup-row"><span class="pk">Extraction</span><span class="pv" style="color:${glowColor}">${formatHam(gwData.extraction)} Ham</span></div>
            <div class="popup-row"><span class="pk">GW Stage</span><span class="pv" style="color:${glowColor}">${gwData.stage}%</span></div>
            ${statusBadge}
            ` : `<div class="popup-row"><span class="pk" style="color:var(--muted)">No data available</span></div>`}
          `)
          .addTo(map.current!);

        if (onDistrictSelect) onDistrictSelect(district, state, gwData);
      });

      // District DOUBLE click
      map.current!.on('dblclick', 'city-fill', (e) => {
        if (map.current!.getZoom() < CITY_MODE_MIN_ZOOM) return;
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;

        const state  = feat.properties.st_nm as string;
        const bounds = geomBounds(feat.geometry as GeoJSON.Geometry);
        map.current!.fitBounds(bounds as [number, number, number, number], {
          padding: 60, duration: 900, maxZoom: 12,
        });

        const stateFeatures = stateGeoJSON?.features || [];
        const targetState = state.toString().trim().toLowerCase();
        const parent = stateFeatures.find((sf: any) => {
          const n = (sf.properties?._name || '').toString().trim().toLowerCase();
          return n === targetState;
        });
        if (parent?.id !== undefined) {
          if (selectedStateIdRef.current !== null && selectedStateIdRef.current !== parent.id) {
            map.current!.setFeatureState(
              { source: 'india-states', id: selectedStateIdRef.current }, { selected: false }
            );
          }
          selectedStateIdRef.current = parent.id as number;
          map.current!.setFeatureState(
            { source: 'india-states', id: parent.id as number }, { selected: true }
          );
          setCurrentState(state);
          setHierarchyLevel('state');
          hierarchyLevelRef.current = 'state';
        }

        onMapMessage?.(`Zoomed to district. Parent state: ${state}`);
        if (onStateSelect) onStateSelect(state, getStateData(state));
      });

      setShowLoader(false);
      console.info('▶ Premium GIS Map loaded. Click any state to reveal district boundaries.');
    });

    return () => { map.current?.remove(); };
  }, [mapTheme]);

  const hierarchyLevelRef = useRef<'india' | 'state' | 'district'>('india');
  useEffect(() => { hierarchyLevelRef.current = hierarchyLevel; }, [hierarchyLevel]);

  // ─── LOAD DISTRICTS FOR STATE ─────────────────────────────────────────────
  const loadDistrictsForState = useCallback((stateName: string) => {
    if (!map.current?.getSource('city-boundaries')) return;

    if (!allDistrictsGeoJSONRef.current) {
      console.warn('No district data available');
      return;
    }

    if (selectedDistrictIdRef.current !== null) {
      try {
        map.current.setFeatureState(
          { source: 'city-boundaries', id: selectedDistrictIdRef.current }, { selected: false }
        );
      } catch { /* source may have been reset */ }
      selectedDistrictIdRef.current = null;
    }
    activePopup.current?.remove();

    const normalizedStateName = normalizeLocationName(stateName);
    const stateFeatures = allDistrictsGeoJSONRef.current.features.filter((f) => {
      const sn = String(f.properties?.st_nm || f.properties?.state || '');
      return normalizeLocationName(sn) === normalizedStateName;
    });

    if (stateFeatures.length === 0) {
      console.warn(`No districts found for state: ${stateName}`);
    }

    const enriched: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: stateFeatures.map((f) => {
        const d = f.properties?.district || '';
        const gw = getDistrictData(String(d), stateName);
        return {
          ...f,
          properties: {
            ...f.properties,
            gw_status: gw?.status || 'unknown',
            gw_stage: gw?.stage ?? null,
            gw_recharge: gw?.recharge ?? null,
            gw_extractable: gw?.extractable ?? null,
            gw_extraction: gw?.extraction ?? null,
            gw_category: gw?.worstCategory ?? null,
          },
        };
      }),
    };

    (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData(enriched);
  }, [getDistrictData]);

  const clearDistricts = useCallback(() => {
    if (!map.current?.getSource('city-boundaries')) return;
    activePopup.current?.remove();
    selectedDistrictIdRef.current = null;
    hoveredDistrictIdRef.current  = null;
    (map.current.getSource('city-boundaries') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection', features: [],
    });
  }, []);

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
    map.current?.flyTo({ center: [78.9629, 22.5937], zoom: 4, duration: 1200 });
  }, [clearDistricts]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`map-container h-full w-full relative ${mapTheme === 'light' ? 'light-mode' : ''}`}
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      {/* Vignette overlay — cinematic edge darkening */}
      <div className="map-vignette" />

      <div id="map" ref={mapContainer} className="h-full w-full" />

      {/* Loading overlay */}
      {showLoader && (
        <div className="loader">
          <div className="loader-ring-wrap">
            <div className="loader-ring" />
            <div className="loader-ring-inner" />
          </div>
          <div className="loader-text">Initializing Intelligence Layers</div>
          <div className="loader-sub">Calibrating GIS telemetry…</div>
        </div>
      )}

      {/* Tooltip */}
      <div id="tooltip" className="tooltip" ref={ttRef} style={{ display: 'none' }}>
        <div className="tt-inner" ref={ttInnerRef} />
      </div>

      {/* Hierarchy breadcrumb badge */}
      <div className="mapBadge">
        <div className="mb-hierarchy">
          {hierarchyLevel === 'india'    && <><span className="mb-icon">◉</span> <span className="mb-z">India</span></>}
          {hierarchyLevel === 'state'    && <><span className="mb-icon" style={{ color: MAP_HOVER_ACCENT }}>◈</span> <span className="mb-z">{currentState}</span></>}
          {hierarchyLevel === 'district' && <><span className="mb-icon" style={{ color: statusGlowColor('caution') }}>◆</span> <span className="mb-z">{currentDistrict}</span></>}
        </div>
        <div className="mb-coords">
          <span style={{color: mapTheme === 'light' ? 'rgba(5,12,156,0.6)' : 'rgba(199,236,255,0.55)'}}>Z</span> <span style={{color: mapTheme === 'light' ? '#000' : 'inherit'}}>{zoom}</span>
          &nbsp;·&nbsp;
          <span style={{color: mapTheme === 'light' ? 'rgba(5,12,156,0.6)' : 'rgba(199,236,255,0.55)'}}>N</span> <span style={{color: mapTheme === 'light' ? '#000' : 'inherit'}}>{coords.lat}°</span>
          &nbsp;
          <span style={{color: mapTheme === 'light' ? 'rgba(5,12,156,0.6)' : 'rgba(199,236,255,0.55)'}}>E</span> <span style={{color: mapTheme === 'light' ? '#000' : 'inherit'}}>{coords.lng}°</span>
        </div>
        {hierarchyLevel !== 'india' && (
          <button onClick={resetMap} className="mb-reset-btn">
            ← Reset View
          </button>
        )}
      </div>

      {/* Legend overlay */}
      {/* <div className="map-legend">
        <div className="legend-title">GW STATUS</div>
        <div className="legend-item">
          <div className="legend-dot legend-safe" />
          <span>Safe</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-caution" />
          <span>Caution</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-critical" />
          <span>Critical</span>
        </div>
      </div> */}
    </div>
  );
};

export default IndiaMapComponent;
