import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as GeoJSON from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/components/IndiaMapComponent.css';

// Mapbox token from environment variable
const mapboxToken = (import.meta.env as any).VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
if (!mapboxToken || mapboxToken === 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw') {
  console.warn('VITE_MAPBOX_TOKEN is not set in environment. Mapbox may not work.');
}
mapboxgl.accessToken = mapboxToken;

// Groundwater database
export const GW: Record<string, any> = {
  'Gujarat':           { rain:855.95, ext:37411.68, extr:17418.39, stage:55.95, status:'safe' },
  'Maharashtra':       { rain:1180.4, ext:48200.00, extr:31850.00, stage:66.10, status:'caution' },
  'Rajasthan':         { rain:415.20, ext:17420.00, extr:19800.00, stage:113.7, status:'critical' },
  'Punjab':            { rain:649.00, ext:21700.00, extr:30800.00, stage:141.9, status:'critical' },
  'Uttar Pradesh':     { rain:899.30, ext:76000.00, extr:68400.00, stage:90.00, status:'caution' },
  'Madhya Pradesh':    { rain:1017.0, ext:54200.00, extr:28300.00, stage:52.20, status:'safe' },
  'Karnataka':         { rain:1248.0, ext:16550.00, extr:13800.00, stage:83.40, status:'caution' },
  'Andhra Pradesh':    { rain:890.00, ext:23100.00, extr:15300.00, stage:66.20, status:'caution' },
  'Tamil Nadu':        { rain:925.00, ext:22400.00, extr:22800.00, stage:101.8, status:'critical' },
  'Kerala':            { rain:3055.0, ext:6870.00,  extr:3840.00,  stage:55.90, status:'safe' },
  'West Bengal':       { rain:1582.0, ext:29800.00, extr:18900.00, stage:63.40, status:'caution' },
  'Bihar':             { rain:1028.0, ext:28400.00, extr:17200.00, stage:60.60, status:'safe' },
  'Haryana':           { rain:571.50, ext:8700.00,  extr:11400.00, stage:131.0, status:'critical' },
  'Odisha':            { rain:1489.0, ext:16600.00, extr:6800.00,  stage:41.00, status:'safe' },
  'Telangana':         { rain:904.00, ext:14200.00, extr:9800.00,  stage:69.00, status:'caution' },
  'Assam':             { rain:1962.0, ext:26900.00, extr:5400.00,  stage:20.10, status:'safe' },
  'Jharkhand':         { rain:1200.0, ext:6400.00,  extr:2800.00,  stage:43.80, status:'safe' },
  'Chhattisgarh':      { rain:1292.0, ext:14300.00, extr:4200.00,  stage:29.40, status:'safe' },
  'Himachal Pradesh':  { rain:1251.0, ext:1400.00,  extr:690.00,   stage:49.30, status:'safe' },
  'Uttarakhand':       { rain:1558.0, ext:2100.00,  extr:1200.00,  stage:57.10, status:'safe' },
};

const CITIES: Record<string, any[]> = {
  'Gujarat':        [{name:'Ahmedabad', lat:23.0225, lng:72.5714, pop:'8.4M'}, {name:'Surat',    lat:21.1702, lng:72.8311, pop:'6.5M'}, {name:'Rajkot',   lat:22.3039, lng:70.8022, pop:'1.6M'}, {name:'Vadodara', lat:22.3072, lng:73.1812, pop:'2.1M'}, {name:'Gandhinagar',lat:23.2156,lng:72.6369, pop:'1.4M'}],
  'Maharashtra':    [{name:'Mumbai',    lat:19.0760, lng:72.8777, pop:'12.5M'},{name:'Pune',     lat:18.5204, lng:73.8567, pop:'7.4M'}, {name:'Nagpur',   lat:21.1458, lng:79.0882, pop:'2.9M'}, {name:'Nashik',   lat:20.0000, lng:73.7833, pop:'2.2M'}],
  'Rajasthan':      [{name:'Jaipur',   lat:26.9124, lng:75.7873, pop:'3.9M'}, {name:'Jodhpur',  lat:26.2389, lng:73.0243, pop:'1.7M'}, {name:'Udaipur',  lat:24.5854, lng:73.7125, pop:'1.4M'}, {name:'Bikaner',  lat:28.0229, lng:73.3119, pop:'1.1M'}],
  'Punjab':         [{name:'Chandigarh',lat:30.7333,lng:76.7794, pop:'1.1M'}, {name:'Ludhiana', lat:30.9010, lng:75.8573, pop:'1.7M'}, {name:'Amritsar', lat:31.6340, lng:74.8723, pop:'1.1M'}],
  'Uttar Pradesh':  [{name:'Lucknow',  lat:26.8467, lng:80.9462, pop:'3.7M'}, {name:'Kanpur',   lat:26.4499, lng:80.3319, pop:'2.9M'}, {name:'Agra',     lat:27.1767, lng:78.0081, pop:'1.7M'}, {name:'Varanasi', lat:25.3176, lng:82.9739, pop:'1.2M'}],
  'Karnataka':      [{name:'Bengaluru',lat:12.9716, lng:77.5946, pop:'12.3M'},{name:'Mysuru',   lat:12.2958, lng:76.6394, pop:'1.1M'}, {name:'Mangaluru',lat:12.9141, lng:74.8560, pop:'0.6M'}],
  'Tamil Nadu':     [{name:'Chennai',  lat:13.0827, lng:80.2707, pop:'10.7M'},{name:'Coimbatore',lat:11.0168,lng:76.9558, pop:'2.1M'}, {name:'Madurai',  lat:9.9252,  lng:78.1198, pop:'1.5M'}],
  'West Bengal':    [{name:'Kolkata',  lat:22.5726, lng:88.3639, pop:'14.9M'},{name:'Howrah',   lat:22.5958, lng:88.2636, pop:'1.1M'}, {name:'Durgapur', lat:23.4800, lng:87.3200, pop:'0.6M'}],
  'Andhra Pradesh': [{name:'Visakhapatnam',lat:17.6868,lng:83.2185,pop:'2.0M'},{name:'Vijayawada',lat:16.5062,lng:80.6480,pop:'1.5M'},{name:'Guntur',lat:16.3008,lng:80.4428,pop:'0.7M'}],
  'Telangana':      [{name:'Hyderabad',lat:17.3850, lng:78.4867, pop:'10.5M'},{name:'Warangal', lat:17.9689, lng:79.5941, pop:'0.8M'}],
  'Madhya Pradesh': [{name:'Bhopal',   lat:23.2599, lng:77.4126, pop:'2.4M'}, {name:'Indore',   lat:22.7196, lng:75.8577, pop:'3.3M'}, {name:'Jabalpur', lat:23.1815, lng:79.9864, pop:'1.2M'}],
  'Kerala':         [{name:'Thiruvananthapuram',lat:8.5241,lng:76.9366,pop:'0.9M'},{name:'Kochi',lat:9.9312,lng:76.2673,pop:'0.7M'},{name:'Kozhikode',lat:11.2588,lng:75.7804,pop:'0.6M'}],
};

function getStateCities(name: string) {
  return CITIES[name] || [{ name: name + ' (Capital)', lat: 22.5, lng: 78.9, pop: 'N/A' }];
}

function statusColor(status: string) {
  return status === 'critical' ? '#3d0010'
       : status === 'caution'  ? '#2d1f00'
       : '#003320';
}

function geomBounds(geom: any): [number, number, number, number] {
  let minLng=180, minLat=90, maxLng=-180, maxLat=-90;
  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng<minLng) minLng=lng; if (lng>maxLng) maxLng=lng;
      if (lat<minLat) minLat=lat; if (lat>maxLat) maxLat=lat;
    } else coords.forEach(processCoords);
  }
  processCoords(geom.coordinates);
  return [minLng, minLat, maxLng, maxLat];
}

interface IndiaMapComponentProps {
  onStateSelect?: (stateName: string, data?: any) => void;
  onMapMessage?: (text: string) => void;
  isVisible?: boolean;
  mapTheme?: 'light' | 'dark';
}

export const IndiaMapComponent: React.FC<IndiaMapComponentProps> = ({ onStateSelect, onMapMessage, isVisible = true, mapTheme = 'dark' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentState, setCurrentState] = useState<string | null>(null);
  const selectedFeatureIdRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(4);
  const [coords, setCoords] = useState({ lat: 22.59, lng: 78.96 });
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  const ttRef = useRef<HTMLDivElement>(null);
  const ttInnerRef = useRef<HTMLDivElement>(null);
  const hoveredCityIdRef = useRef<number | null>(null);
  const selectedCityIdRef = useRef<number | null>(null);

  // When the panel becomes visible, tell Mapbox to recalculate its canvas size.
  // A single 50ms tick may be too early if CSS transition isn't complete, so we do multiple passes.
  useEffect(() => {
    if (!map.current) return;
    if (isVisible) {
      const delays = [120, 300, 600];
      const timers: number[] = [];
      delays.forEach((delay) => {
        timers.push(window.setTimeout(() => map.current?.resize(), delay));
      });
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
    return;
  }, [isVisible]);

  // Keep map responsive to window resizes and transition end resizes from parent.
  useEffect(() => {
    const onResize = () => {
      if (map.current) map.current.resize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Initialize map
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

    // Only start the timeout warning if we're actually visible
    let loaderTimer: number | undefined;
    if (isVisible) {
      loaderTimer = window.setTimeout(() => {
        console.warn('Map is taking too long to load. Check your Mapbox token/network and refresh.');
        setShowLoader(false);
      }, 15000);
    }

    map.current.on('zoom', () => {
      const z = Math.round(map.current!.getZoom());
      setZoom(z);
    });

    map.current.on('mousemove', (e) => {
      setCoords({ lat: parseFloat(e.lngLat.lat.toFixed(2)), lng: parseFloat(e.lngLat.lng.toFixed(2)) });
    });

    map.current.on('load', async () => {
      window.clearTimeout(loaderTimer);
      const GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';
      
      let geojson;
      try {
        const geoController = new AbortController();
        const geoTimer = window.setTimeout(() => geoController.abort(), 12000);
        const res = await fetch(GEOJSON_URL, { signal: geoController.signal });
        geojson = await res.json();
        window.clearTimeout(geoTimer);
        geojson.features.forEach((f: any, i: number) => {
          f.id = i;
          const p = f.properties;
          p._name = p.NAME_1 || p.ST_NM || p.name || p.state || 'Unknown';
        });
      } catch (e) {
        console.error('GeoJSON load failed', e);
        setShowLoader(false);
        return;
      }

      // Add source
      map.current!.addSource('india-states', {
        type: 'geojson',
        data: geojson,
        generateId: true,
      });

      // Add layers
      map.current!.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
            '#0f2a44',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.6,
            0.72,
          ],
          'fill-outline-color': 'rgba(0,212,255,0.0)',
        },
      });

      map.current!.addLayer({
        id: 'states-line',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': 'rgba(0,212,255,0.3)',
          'line-width': 0.8,
        },
      });

      map.current!.addLayer({
        id: 'states-hover-line',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': '#00d4ff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 3,
            0,
          ],
          'line-blur': 3,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.9,
            0,
          ],
        },
      });

      map.current!.addLayer({
        id: 'states-glow',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': '#00d4ff',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.10,
            0,
          ],
        },
      });

      const colorExpr: any = ['match', ['get', '_name']];
      Object.entries(GW).forEach(([name, d]) => {
        colorExpr.push(name, statusColor(d.status));
      });
      colorExpr.push('#0f2a44');

      map.current!.setPaintProperty('states-fill', 'fill-color', [
        'case',
        ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
        colorExpr,
      ]);
      map.current!.on('mousemove', 'states-fill', (e) => {
        map.current!.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const name = feat.properties._name;
          showTooltip(name);
          showInfoCard(name);
        }
      });

      map.current!.on('mouseleave', 'states-fill', () => {
        map.current!.getCanvas().style.cursor = '';
        hideTooltip();
      });

      map.current!.on('click', 'states-fill', (e) => {
        const feat = e.features?.[0];
        if (feat) {
          const id = feat.id as number;
          const name = feat.properties._name;

          const isSame = selectedFeatureIdRef.current === id;
          if (isSame) {
            map.current!.setFeatureState({ source: 'india-states', id }, { selected: false });
            selectedFeatureIdRef.current = null;
            setCurrentState(null);
            setSelectedState(null);
            loadCities('');
            return;
          }

          if (selectedFeatureIdRef.current !== null) {
            map.current!.setFeatureState({ source: 'india-states', id: selectedFeatureIdRef.current }, { selected: false });
          }

          selectedFeatureIdRef.current = id;
          map.current!.setFeatureState({ source: 'india-states', id }, { selected: true });

          zoomToState(feat, name);
        }
      });

      initCityLayer();
      console.info('India GeoJSON loaded — ' + geojson.features.length + ' states rendered. Click any state to explore.');
      setShowLoader(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapTheme]);

  const zoomToState = (feat: any, name: string) => {
    setCurrentState(name);
    setSelectedState(name);
    const bounds = geomBounds(feat.geometry);
    map.current!.fitBounds(bounds as [number, number, number, number], { padding: 60, duration: 900 });
    botRespond(name);
    loadCities(name);
  };

  const initCityLayer = () => {
    if (!map.current) return;
    const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    map.current.addSource('city-data', { type: 'geojson', data: EMPTY_FC, generateId: true });

    map.current.addLayer({
      id: 'city-glow',
      type: 'circle',
      source: 'city-data',
      paint: {
        'circle-radius': 14,
        'circle-color': '#7c3aed',
        'circle-blur': 0.8,
        'circle-opacity': 0.35,
      },
    });

    map.current.addLayer({
      id: 'city-layer',
      type: 'circle',
      source: 'city-data',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9, 12, 12],
        'circle-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
          '#7c3aed',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false], '#ffffff',
          '#c4b5fd',
        ],
        'circle-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.9],
      },
    });

    map.current.addLayer({
      id: 'city-labels',
      type: 'symbol',
      source: 'city-data',
      layout: {
        'text-field': ['get', 'city'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#c4b5fd',
        'text-halo-color': 'rgba(3,8,15,0.9)',
        'text-halo-width': 1.5,
      },
    });

    map.current.on('mouseenter', 'city-layer', (e) => {
      map.current!.getCanvas().style.cursor = 'pointer';
      const feat = e.features?.[0];
      if (feat) {
        const p = feat.properties;
        if (ttInnerRef.current) {
          ttInnerRef.current.innerHTML = `
            <div class="tt-name">📍 ${p.city}</div>
            <hr class="tt-divider"/>
            <div class="tt-row">Latitude  <span>${parseFloat(p.lat).toFixed(4)}</span></div>
            <div class="tt-row">Longitude <span>${parseFloat(p.lng).toFixed(4)}</span></div>
            <div class="tt-row">Population <span>${p.pop || '—'}</span></div>
            <div class="tt-row">State <span>${p.state}</span></div>
          `;
        }
        if (ttRef.current) {
          ttRef.current.style.display = 'block';
          moveTooltip(e.originalEvent);
        }
      }
    });

    map.current.on('mousemove', 'city-layer', (e) => {
      if (ttRef.current?.style.display === 'block') moveTooltip(e.originalEvent);
    });

    map.current.on('mouseleave', 'city-layer', () => {
      map.current!.getCanvas().style.cursor = '';
      hideTooltip();
    });

    map.current.on('click', 'city-layer', (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const p = feature.properties;
      const id = feature.id as number;
      const isSameCity = selectedCityIdRef.current === id;

      if (isSameCity) {
        map.current!.setFeatureState({ source: 'city-data', id }, { selected: false });
        selectedCityIdRef.current = null;
      } else {
        if (selectedCityIdRef.current !== null) {
          map.current!.setFeatureState({ source: 'city-data', id: selectedCityIdRef.current }, { selected: false });
        }
        selectedCityIdRef.current = id;
        map.current!.setFeatureState({ source: 'city-data', id }, { selected: true });
      }

      const coords = [p.lng, p.lat];
      new mapboxgl.Popup({ closeOnClick: true, maxWidth: '220px' })
        .setLngLat(coords as [number, number])
        .setHTML(`
          <div class="popup-title">📍 ${p.city}</div>
          <div class="popup-row"><span class="pk">Latitude</span><span class="pv">${parseFloat(p.lat).toFixed(4)}</span></div>
          <div class="popup-row"><span class="pk">Longitude</span><span class="pv">${parseFloat(p.lng).toFixed(4)}</span></div>
          <div class="popup-row"><span class="pk">Population</span><span class="pv">${p.pop || '—'}</span></div>
          <div class="popup-row"><span class="pk">State</span><span class="pv">${p.state}</span></div>
        `)
        .addTo(map.current!);
      console.log(`City clicked: ${p.city} — Lat: ${parseFloat(p.lat).toFixed(4)}, Lng: ${parseFloat(p.lng).toFixed(4)} | Pop: ${p.pop || '—'}`);
    });
  };

  const stateCitiesToGeoJSON = (stateName: string): GeoJSON.FeatureCollection => {
    const cities = getStateCities(stateName);
    return {
      type: 'FeatureCollection',
      features: cities.map((c, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: {
          city: c.name,
          state: stateName,
          lat: c.lat,
          lng: c.lng,
          pop: c.pop || '—',
        },
      })) as GeoJSON.Feature[],
    };
  };

  const loadCities = (stateName: string) => {
    if (!map.current?.getSource('city-data')) return;
    if (!stateName) {
      (map.current.getSource('city-data') as any).setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    const fc = stateCitiesToGeoJSON(stateName);
    (map.current.getSource('city-data') as any).setData(fc);
  };

  const showTooltip = (stateName: string) => {
    const d = GW[stateName];
    const badge = d
      ? `<span class="badge b-${d.status}" style="font-size:9px;">${d.status.toUpperCase()}</span>`
      : '';
    if (ttInnerRef.current) {
      ttInnerRef.current.innerHTML = `
        <div class="tt-name">${stateName} ${badge}</div>
        ${d ? `
        <hr class="tt-divider"/>
        <div class="tt-row">Rainfall <span>${d.rain} mm</span></div>
        <div class="tt-row">Stage <span>${d.stage}%</span></div>
        ` : `<div class="tt-row" style="color:var(--muted)">Click to explore</div>`}
      `;
    }
    if (ttRef.current) ttRef.current.style.display = 'block';
  };

  const moveTooltip = (e: MouseEvent) => {
    if (!ttRef.current) return;
    const cx = (e as any).clientX ?? (e as any).pageX;
    const cy = (e as any).clientY ?? (e as any).pageY;
    const w = window.innerWidth, h = window.innerHeight;
    const tw = 200, th = 100;
    ttRef.current.style.left = (cx + 16 + tw > w ? cx - tw - 10 : cx + 16) + 'px';
    ttRef.current.style.top = (cy + 16 + th > h ? cy - th - 10 : cy + 16) + 'px';
  };

  const hideTooltip = () => {
    if (ttRef.current) ttRef.current.style.display = 'none';
  };

  const showInfoCard = (name: string) => {
    // This would be handled in the parent component or state
  };

  const botRespond = (name: string) => {
    const d = GW[name];
    if (onStateSelect) onStateSelect(name, d);

    if (!d) {
      console.warn(`No groundwater data for ${name}.`);
      return;
    }

    console.info(`State selected: ${name}`, d);
  };

  const resetMap = () => {
    setCurrentState(null);
    setSelectedState(null);
    if (map.current?.getSource('city-data')) {
      (map.current.getSource('city-data') as any).setData({ type: 'FeatureCollection', features: [] });
    }
    if (map.current?.getSource('india-states')) {
      map.current.removeFeatureState({ source: 'india-states' });
    }
    map.current?.flyTo({ center: [78.9629, 22.5937], zoom: 4, duration: 1000 });
  };

  return (
    <div
      className="map-container h-full w-full relative"
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      <div id="map" ref={mapContainer} className="h-full w-full" />
      {showLoader && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm text-white">
          Loading map...
        </div>
      )}
      <div id="tooltip" className="tooltip" ref={ttRef} style={{ display: 'none' }}>
        <div className="tt-inner" ref={ttInnerRef}></div>
      </div>
    </div>
  );
};

export default IndiaMapComponent;