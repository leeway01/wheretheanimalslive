import React from 'react';
import WorldMap from './components/WorldMap';
import './index.css'; // CSS 파일 불러오기

function App() {
  return (
    <div style={appContainerStyle}>
      <img
        src="/assets/Where_the_Animals_Live-logo.png"
        alt="Where the Animals Live"
        style={logoStyle}
      />
      <WorldMap />
    </div>
  );
}

const appContainerStyle = {
  minHeight: '100vh', // 화면 전체 적용
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const logoStyle = {
  width: '350px',
  height: 'auto',
};

export default App;
