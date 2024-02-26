import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Course from './pages/Course/course';
import Lists from './pages/Lists/lists';
import Help from './pages/Help/help';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '@/components/custom/header';
import { ThemeProvider } from '@/utils/theme-provider';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Header />
      </ThemeProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/course/:courseId" element={<Course />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
