import React from 'react';
import WorldMap from './components/WorldMap';

function App() {
  return (
    <div>
      <img
        src="/assets/Where_the_Animals_Live-logo.png"
        alt="Where the Animals Live"
        style={logoStyle}
      />
      <WorldMap />
    </div>
  );
}

const logoStyle = {
  width: '450px', // 로고 크기 조정
  height: 'auto', // 비율 유지
};

export default App;
