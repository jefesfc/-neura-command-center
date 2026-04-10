import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { applyTheme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PostGenerator from './pages/PostGenerator';
import CaptionBuilder from './pages/CaptionBuilder';
import ContentCalendar from './pages/ContentCalendar';
import PostLibrary from './pages/PostLibrary';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(applyTheme).catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="studio/generator" element={<PostGenerator />} />
        <Route path="studio/caption" element={<CaptionBuilder />} />
        <Route path="studio/calendar" element={<ContentCalendar />} />
        <Route path="library" element={<PostLibrary />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
