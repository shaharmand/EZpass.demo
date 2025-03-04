import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'antd/dist/antd.css';  // Use the CSS file from antd v4
import App from './App';
import { ConfigProvider } from 'antd';

// Disable findDOMNode warning in development
const disableFindDOMNodeWarning = () => {
  if (process.env.NODE_ENV === 'development') {
    const consoleError = console.error;
    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('findDOMNode')) return;
      consoleError(...args);
    };
  }
};

disableFindDOMNodeWarning();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider direction="rtl">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
); 