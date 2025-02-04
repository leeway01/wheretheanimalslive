import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// ✅ 국가별 경계 데이터 (GeoJSON 불러오기)
const geoJsonUrl =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

// ✅ 지도 이동 제한 값 유지
const bounds = L.latLngBounds([-75, -160], [80, 160]);

const WorldMap = () => {
  const [countries, setCountries] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [animalData, setAnimalData] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [locale, setLocale] = useState('ko'); // 기본 언어 설정
  const [localizedData, setLocalizedData] = useState({});

  useEffect(() => {
    fetch(geoJsonUrl)
      .then((response) => response.json())
      .then((data) => setCountries(data));
  }, []);

  useEffect(() => {
    const fetchLocaleData = async () => {
      try {
        const response = await fetch(`/locales/${locale}.json`);
        const data = await response.json();
        setLocalizedData(data);
      } catch (error) {
        console.error('Error fetching locale data:', error);
      }
    };
    fetchLocaleData();
  }, [locale]);

  const fetchAnimals = async (countryName) => {
    try {
      const response = await fetch('/data/animals.json');
      const data = await response.json();
      const countryData = data.find((c) => c.country === countryName);
      setAnimalData(countryData ? countryData.animals : []);
    } catch (error) {
      console.error('Error fetching animal data:', error);
      setAnimalData([]);
    }
  };

  const onEachCountry = (country, layer) => {
    layer.on('click', () => {
      const countryName = country.properties.name;
      setSelectedCountry(countryName);
      fetchAnimals(countryName);
    });
  };

  const openModal = (animal) => {
    setModalData(animal);
  };

  const closeModal = () => {
    setModalData(null);
  };

  const getUIText = (key, replacements = {}) => {
    let text = localizedData.ui?.[key] || key;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });
    return text;
  };

  const getAnimalName = (id) => localizedData[id]?.name || id;
  const getAnimalDescription = (id) =>
    localizedData[id]?.description || getUIText('no_data');

  return (
    <div style={containerStyle}>
      {/* 🌍 언어 변경 버튼 */}
      <div style={languageSwitcherStyle}>
        <button onClick={() => setLocale('ko')}>🇰🇷 한국어</button>
        <button onClick={() => setLocale('en')}>🇺🇸 English</button>
      </div>

      {/* 📢 광고 공간 */}
      <div style={adSpaceStyle}>
        <h3>광고 공간</h3>
        <p>여기에 광고를 넣을 수 있습니다.</p>
        <div style={adBannerStyle}>광고 배너</div>
      </div>

      {/* 🌍 지도 배치 */}
      <div style={mapContainerStyle}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={10}
          maxBounds={bounds}
          style={mapStyle}
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

      {/* 🦁 동물 목록 */}
      <div style={animalListStyle}>
        <h2 style={{ textAlign: 'center' }}>
          {selectedCountry
            ? getUIText('animals_in_country', { country: selectedCountry })
            : getUIText('select_country')}
        </h2>
        {animalData.length > 0 ? (
          <div style={gridStyle}>
            {animalData.map((animal, index) => (
              <div
                key={index}
                style={cardStyle}
                onClick={() => openModal(animal)}
              >
                <div style={imageContainerStyle}>
                  <img
                    src={animal.image}
                    alt={getAnimalName(animal.id)}
                    style={imageStyle}
                  />
                </div>
                <p style={textStyle}>
                  <strong>{getAnimalName(animal.id)}</strong>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>{getUIText('no_data')}</p>
        )}
      </div>

      {/* 🖼️ 모달 창 */}
      {modalData && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={closeModal}>
              ×
            </button>
            <img
              src={modalData.image}
              alt={getAnimalName(modalData.id)}
              style={modalImageStyle}
            />
            <h2>{getAnimalName(modalData.id)}</h2>
            <p style={copyrightTextStyle}>
              {modalData.copyright || '© Unknown'}
            </p>
            <p>{getAnimalDescription(modalData.id)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ 스타일 객체 (둥근 모서리 및 테두리 추가)
const containerStyle = {
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '725px',
  overflowX: 'hidden', // 가로 스크롤 제거
  backgroundColor: 'lightgreen',
  boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
};
const adSpaceStyle = {
  flexBasis: '150px',
  backgroundColor: '#f4f4f4',
  textAlign: 'center',
  padding: '10px',
  borderRadius: '10px',
};
const mapContainerStyle = {
  flex: '2',
  display: 'flex',
  justifyContent: 'center',
  padding: '10px',
  borderRadius: '10px',
};
const mapStyle = {
  height: '700px',
  width: '100%',
  border: '2px solid #ddd',
  borderRadius: '10px',
};
const animalListStyle = {
  flexBasis: '600px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '10px',
  overflowY: 'auto', // 세로 스크롤 추가
  maxHeight: '800px', // 동물 목록 크기 제한
  width: '100%',
};
const cardStyle = {
  textAlign: 'center',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
};
const languageSwitcherStyle = {
  position: 'absolute',
  top: '10px',
  right: '20px',
  zIndex: 100,
};
const adBannerStyle = {
  width: '100%',
  height: '250px',
  backgroundColor: '#ccc',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', // 최대 3개씩 표시
  gap: '15px',
  padding: '10px',
  maxWidth: '100%',
};
const imageContainerStyle = {
  width: '100%',
  height: '180px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const textStyle = {
  marginTop: '10px',
  fontSize: '14px',
  textAlign: 'center',
  color: '#333',
};

// ✅ 모달 스타일 추가 (누락된 부분)
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};
const modalStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '10px',
  textAlign: 'center',
  maxWidth: '500px',
  width: '80%',
};
const modalImageStyle = {
  maxHeight: '650px',
  width: '100%',
  borderRadius: '10px',
  display: 'block',
  margin: '0 auto',
};
const closeButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '20px',
  fontSize: '20px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
};
const copyrightTextStyle = {
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic',
  marginBottom: '10px',
};
export default WorldMap;
