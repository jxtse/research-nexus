import React from 'react';
import { AppProvider } from './hooks/useAppContext';
import { AppLayout } from './components/AppLayout';
import './App.css';

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
