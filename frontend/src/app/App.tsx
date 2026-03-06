import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import DiscoverEvents from './pages/DiscoverEvents';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverEvents />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/event/:eventKey" element={<EventDetail />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}
