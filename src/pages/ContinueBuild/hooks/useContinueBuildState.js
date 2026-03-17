// frontend/src/pages/ContinueBuild/hooks/useContinueBuildState.js
import { useState } from 'react';

export const useContinueBuildState = () => {
  const [builds, setBuilds] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  return {
    builds,
    setBuilds,
    selectedBuild,
    setSelectedBuild,
    loading,
    setLoading,
    messages,
    setMessages
  };
};