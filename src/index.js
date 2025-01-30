import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ React 18에서는 createRoot 사용
import App from './App';

// React 18에서 새로운 방식으로 root 생성
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
