import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import GeneratorApp from './GeneratorApp';
import { inviteCodes } from './utils/inviteCodes';

export default function App() {
  const [view, setView] = useState<'landing' | 'generator'>('landing');

  // On initial load, check if the user has a valid, stored invite code.
  // If so, send them directly to the generator.
  useEffect(() => {
    const storedCode = localStorage.getItem('tumdah-invite-code');
    if (storedCode && inviteCodes.has(storedCode)) {
      setView('generator');
    }
  }, []);

  // This function is called by the LandingPage after a valid code is entered.
  const handleStart = () => {
    setView('generator');
  };

  const goToHome = () => {
    if (view === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setView('landing');
    }
  };
  
  if (view === 'generator') {
    return <GeneratorApp onGoHome={goToHome} />;
  }

  return <LandingPage onStart={handleStart} onGoHome={goToHome} />;
}
