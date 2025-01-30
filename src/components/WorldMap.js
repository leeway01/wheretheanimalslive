import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet'; // ✅ leaflet에서 LatLngBounds 가져오기
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// 국가별 경계 데이터 (GeoJSON 불러오기)
const geoJsonUrl =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

// 지도 이동 제한 (경계를 벗어나지 못하게 설정)
const bounds = L.latLngBounds(
  [-75, -160], // 남서쪽 경계 (최소 위도, 최소 경도)
  [80, 160] // 북동쪽 경계 (최대 위도, 최대 경도)
);

const WorldMap = () => {
  const [countries, setCountries] = useState(null);

  useEffect(() => {
    // GeoJSON 데이터 가져오기
    fetch(geoJsonUrl)
      .then((response) => response.json())
      .then((data) => setCountries(data));
  }, []);

  // 국가 클릭 이벤트 핸들러
  const onEachCountry = (country, layer) => {
    layer.on('click', () => {
      alert(`클릭한 국가: ${country.properties.name}`);
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        maxBounds={bounds} // 지도 이동 제한
        maxBoundsViscosity={1.0} // 경계 밖으로 나가려 할 때 튕겨 나옴
        style={{
          height: '800px',
          width: '90vw',
          maxWidth: '1200px',
          border: '2px solid black',
          borderRadius: '10px',
        }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {countries && (
          <GeoJSON data={countries} onEachFeature={onEachCountry} />
        )}
      </MapContainer>
    </div>
  );
};

export default WorldMap;
