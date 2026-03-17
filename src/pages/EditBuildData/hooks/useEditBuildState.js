// frontend/src/pages/EditBuildData/hooks/useEditBuildState.js
import { useState } from 'react';

export const useEditBuildState = () => {
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
