"use client"
import React, { createContext, useContext, useState } from "react";

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [runTour, setRunTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const startTutorial = () => {
    setRunTour(false);
    // Small timeout ensures the state toggle registers if a tour was already active
    setTimeout(() => setRunTour(true), 100);
  };

  const openHelp = () => {
    setShowHelp(true);
  };

  return (
    <UIContext.Provider
      value={{ runTour, setRunTour, startTutorial, showHelp, setShowHelp, openHelp }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);