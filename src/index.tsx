import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ConfigProvider } from 'antd';
import 'antd/dist/antd.min.css';  // Using minified version

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
  <ConfigProvider direction="rtl">
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </ConfigProvider>
); 