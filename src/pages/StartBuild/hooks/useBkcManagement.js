export const useBkcManagement = (builds, setBuilds) => {
  // Extract firmware versions for a specific build
  const extractFirmwareVersions = async (buildIndex) => {
    const build = builds[buildIndex];
    if (!build.systemInfo.bmcName) {
      const updatedBuilds = [...builds];
      updatedBuilds[buildIndex].bkcExtraction.error = 'BMC Name is required for extraction';
      setBuilds(updatedBuilds);
      return;
    }

    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].bkcExtraction = {
      extracting: true,
      extracted: false,
      error: null
    };
    setBuilds(updatedBuilds);

    try {
      const api = await import('../../../services/api');
      const response = await api.default.extractBMCFirmwareVersions(build.systemInfo.bmcName);
      
      if (response.success) {
        const finalBuilds = [...builds];
        finalBuilds[buildIndex].bkcDetails = {
          biosVersion: response.versions.hostVersion || '',
          scmFpgaVersion: response.versions.scmFpgaVersion || '', // Optional
          hpmFpgaVersion: response.versions.hpmFpgaVersion || '',
          bmcVersion: response.versions.bmcVersion || ''
        };
        finalBuilds[buildIndex].bkcExtraction = {
          extracting: false,
          extracted: true,
          error: null
        };
        setBuilds(finalBuilds);
      } else {
        const finalBuilds = [...builds];
        finalBuilds[buildIndex].bkcExtraction = {
          extracting: false,
          extracted: false,
          error: response.error || 'Failed to extract firmware versions'
        };
        setBuilds(finalBuilds);
      }
    } catch (error) {
      console.error('Firmware extraction error:', error);
      
      const finalBuilds = [...builds];
      let errorMessage = 'Failed to extract firmware versions';
      
      // Handle different types of errors with user-friendly messages
      if (error.response) {
        // HTTP error response
        if (error.response.status === 500) {
          const serverError = error.response.data?.error || error.message;
          if (serverError.includes('resolve')) {
            errorMessage = `Cannot reach BMC "${build.systemInfo.bmcName}". Check if BMC is online and accessible.`;
          } else if (serverError.includes('timeout')) {
            errorMessage = `BMC "${build.systemInfo.bmcName}" is not responding. Please try again later.`;
          } else if (serverError.includes('login') || serverError.includes('Login')) {
            errorMessage = `Cannot login to BMC "${build.systemInfo.bmcName}". Check BMC credentials or web interface.`;
          } else if (serverError.includes('firmware') || serverError.includes('versions')) {
            errorMessage = `Cannot access firmware page on BMC "${build.systemInfo.bmcName}". Manual entry required.`;
          } else {
            errorMessage = `BMC Error: ${serverError}`;
          }
        } else if (error.response.status === 404) {
          errorMessage = `BMC "${build.systemInfo.bmcName}" not found. Check BMC name and network connectivity.`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid BMC name format';
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`;
        }
      } else if (error.message) {
        // Network or other errors
        if (error.message.includes('Network Error')) {
          errorMessage = `Network error: Cannot connect to server. Check your connection.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `Request timeout: Server is taking too long to respond.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      finalBuilds[buildIndex].bkcExtraction = {
        extracting: false,
        extracted: false,
        error: errorMessage
      };
      setBuilds(finalBuilds);
    }
  };

  // Handle BKC field change
  const handleBkcFieldChange = (buildIndex, field, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].bkcDetails[field] = value;
    // Clear field error if exists
    if (updatedBuilds[buildIndex].errors[field]) {
      delete updatedBuilds[buildIndex].errors[field];
    }
    setBuilds(updatedBuilds);
  };

  return {
    extractFirmwareVersions,
    handleBkcFieldChange
  };
};