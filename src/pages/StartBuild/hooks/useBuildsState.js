// Enhanced useBuildsState.js - FIXED barcode scanning logic for better user experience
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import api from '../../../services/api';

export const useBuildsState = (systemInfoSubStep = 'chassisInfo') => {
  
  // Helper function to get user profile and auto-populate fields
  const initializeUserData = async () => {
    try {
      const profileResponse = await api.getProfile();
      if (profileResponse.success && profileResponse.data) {
        const userData = profileResponse.data;
        
        // Map location code to display name for database storage
        const locationMapping = {
          'MY.PNG': 'Penang',
          'US.ATX': 'Austin'
        };
        
        const mappedLocation = locationMapping[userData.location] || userData.location || '';
        const buildEngineer = userData.full_name || '';
        
        return { location: mappedLocation, buildEngineer };
      }
    } catch (error) {
      console.error('Failed to fetch user profile for auto-population:', error);
    }
    return { location: '', buildEngineer: '' };
  };
  // ============ STATE MANAGEMENT ============
  const [builds, setBuilds] = useState([{
    id: Date.now(),
    generalInfo: {
      location: '',
      buildEngineer: '',
      isCustomConfig: ''
    },
    systemInfo: {
      // Chassis Information
      projectName: '',
      systemPN: '',
      platformType: '',
      manufacturer: '',
      chassisSN: '',
      chassisType: '',
      bmcName: '',
      bmcMac: '',
      mbSN: '',
      ethernetMac: '',
      cpuSocket: '',
      cpuVendor: '',
      jiraTicketNo: '',
      // CPU Information
      cpuProgramName: '',
      cpuP0SN: '',
      cpuP0SocketDateCode: '',
      cpuP1SN: '',
      cpuP1SocketDateCode: '',
      // Component Information
      m2PN: '',
      m2PNOther: false, 
      m2PNCustom: '',      
      m2SN: '',
      dimmPN: '',
      dimmQty: '',
      dimmSNs: [],
      // Testing
      visualInspection: '',
      visualInspectionNotes: '',
      visualInspectionPhotos: [],
      bootStatus: '',
      bootNotes: '',
      bootPhotos: [],
      dimmsDetectedStatus: '',
      dimmsDetectedNotes: '',
      dimmsDetectedPhotos: [],
      lomWorkingStatus: '',
      lomWorkingNotes: '',
      lomWorkingPhotos: []
    },
    status: 'pending',
    errors: {},
    stepCompleted: {
      generalInfo: false,
      chassisInfo: false,
      cpuInfo: false,
      componentInfo: false,
      testing: false,
      bkcDetails: false,
      qualityDetails: false
    },
    bkcDetails: {
      biosVersion: '',
      scmFpgaVersion: '',
      hpmFpgaVersion: '',
      bmcVersion: ''
    },
    bkcExtraction: {
      extracting: false,
      extracted: false,
      error: null
    },
    qualityDetails: {
      fpyStatus: '',
      problemDescription: '',
      numberOfFailures: '',
      failureModes: [],
      failureCategories: [],
      canRework: '',
      saveOption: 'continue'
    }
  }]);

  const [selectedField, setSelectedField] = useState(null);
  const [selectedBuildIndex, setSelectedBuildIndex] = useState(0);
  const [partNumberSuggestions, setPartNumberSuggestions] = useState({
    m2PN: [],
    dimmPN: []
  });

  // State for part number search functionality
  const [partNumberSearch, setPartNumberSearch] = useState({
    m2PN: '',
    dimmPN: ''
  });
  
  const [showPartNumberDropdown, setShowPartNumberDropdown] = useState({
    m2PN: {},
    dimmPN: {}
  });

  // Auto-populate user profile data when component mounts
  useEffect(() => {
    const populateUserData = async () => {
      const userData = await initializeUserData();
      if (userData.location || userData.buildEngineer) {
        setBuilds(prevBuilds => 
          prevBuilds.map(build => ({
            ...build,
            generalInfo: {
              ...build.generalInfo,
              location: userData.location,
              buildEngineer: userData.buildEngineer
            }
          }))
        );
      }
    };
    
    populateUserData();
  }, []);

  // Refs for scanner inputs
  const scannerRefs = useRef({});
  
  // ENHANCED: Barcode scanner detection and management
  const scannerBufferRef = useRef({});
  const scannerTimeoutRef = useRef({});
  const lastInputTimeRef = useRef({});
  const isBarcodeScanRef = useRef(false);
  const manualInputTimeoutRef = useRef({});

  // ============ BARCODE SCANNER CONFIGURATION ============
  const SCANNER_CONFIG = {
    // Minimum speed for barcode detection (characters per second)
    MIN_SCAN_SPEED: 10,
    // Maximum time between characters in a barcode scan (ms)
    MAX_CHAR_INTERVAL: 50,
    // Minimum barcode length
    MIN_BARCODE_LENGTH: 4,
    // Maximum barcode length
    MAX_BARCODE_LENGTH: 50,
    // Time to wait before processing the complete scan (ms)
    SCAN_COMPLETE_DELAY: 50,
    // Navigation delay after scan (ms)
    NAVIGATION_DELAY: 100,
    // Manual input debounce delay
    MANUAL_INPUT_DELAY: 1000
  };

  // ============ SCANNER FIELD SEQUENCES ============
  const SCANNER_FIELD_SEQUENCES = {
    'chassisInfo': [
      'systemPN', 
      'chassisSN', 
      'bmcMac', 
      'mbSN', 
      'ethernetMac'
    ],
    'cpuInfo': [
      'cpuP0SN', 
      'cpuP1SN'
    ],
    'componentInfo': [
      'm2SN'
      // DIMM SNs are handled separately due to dynamic nature
    ]
  };

  // ============ EFFECTS ============
  // Initialize scanner refs
  useEffect(() => {
    builds.forEach((build, index) => {
      // Standard scanner fields
      const scannerFields = [
        'systemPN', 'chassisSN', 'bmcMac', 'mbSN', 'ethernetMac', 
        'cpuP0SN', 'cpuP1SN', 'm2SN'
      ];
      
      scannerFields.forEach(field => {
        const refKey = `${field}-${index}`;
        if (!scannerRefs.current[refKey]) {
          scannerRefs.current[refKey] = React.createRef();
        }
      });

      // DIMM SN refs
      const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
      for (let i = 0; i < Math.max(dimmQty, 16); i++) {
        const refKey = `dimmSN-${index}-${i}`;
        if (!scannerRefs.current[refKey]) {
          scannerRefs.current[refKey] = React.createRef();
        }
      }
    });
  }, [builds]);

  // Cleanup scanner timeouts on unmount
useEffect(() => {
  return () => {
    // Clear all timeouts
    Object.values(scannerTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    Object.values(manualInputTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    
    // Clear all refs
    scannerTimeoutRef.current = {};
    manualInputTimeoutRef.current = {};
    scannerBufferRef.current = {};
    lastInputTimeRef.current = {};
  };
}, []);

  /**
 * Extract DIMM P/N from DIMM S/N string
 * Example: "(L)32GB 1RX4 PC5-6400B-RC1-1211-XT(S)802C0624524CFBFA49(P)MTC20F1045S1RC64BD2(c)QSFF"
 * Extracts: "MTC20F1045S1RC64BD2" (part between (P) or (p) and (c))
 */
  const extractDimmPNFromSN = (dimmSN) => {
    if (!dimmSN) return '';
    
    // Look for pattern (P) or (p) followed by text until (c)
    const pattern = /\([pP]\)([^(]+)\(c\)/;
    const match = dimmSN.match(pattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return '';
  };


  // ============ BARCODE SCANNER UTILITIES ============

  /**
   * Detect if input is from barcode scanner based on typing speed
   */
  const detectBarcodeInput = (fieldKey, value) => {
  const now = Date.now();
  const lastTime = lastInputTimeRef.current[fieldKey] || 0;
  const timeDiff = now - lastTime;
  
  lastInputTimeRef.current[fieldKey] = now;
  
  // FIXED: More strict barcode detection
  // First character or very fast typing (under 50ms between chars)
  if (!lastTime || timeDiff < SCANNER_CONFIG.MAX_CHAR_INTERVAL) {
    isBarcodeScanRef.current = true;
    return true;
  }
  
  // FIXED: If typing is slower than 200ms between characters, it's definitely manual
  if (timeDiff > 200) {
    isBarcodeScanRef.current = false;
    // FIXED: Clear any existing scanner buffers for this field
    delete scannerBufferRef.current[fieldKey];
    if (scannerTimeoutRef.current[fieldKey]) {
      clearTimeout(scannerTimeoutRef.current[fieldKey]);
      delete scannerTimeoutRef.current[fieldKey];
    }
    return false;
  }
  
  // FIXED: For intermediate speeds, maintain current state but bias toward manual
  return isBarcodeScanRef.current && timeDiff < 100;
};

/**
 * Update build state immediately without API calls (for UI responsiveness)
 */
const updateBuildStateOnly = (buildIndex, section, field, value, dimmIndex = null) => {
  const updatedBuilds = [...builds];

  if (section === 'generalInfo') {
    updatedBuilds[buildIndex].generalInfo[field] = value;

    // Auto-fill location for all builds
    if (field === 'location' && buildIndex === 0) {
      updatedBuilds.forEach((build, idx) => {
        if (idx !== 0) {
          build.generalInfo.location = value;
        }
      });
    }
  } else if (section === 'systemInfo') {
    // Handle DIMM S/N separately
    if (field === 'dimmSN' && dimmIndex !== null) {
      if (!updatedBuilds[buildIndex].systemInfo.dimmSNs) {
        updatedBuilds[buildIndex].systemInfo.dimmSNs = [];
      }
      updatedBuilds[buildIndex].systemInfo.dimmSNs[dimmIndex] = value;
    } else {
      updatedBuilds[buildIndex].systemInfo[field] = value;
    }
  }

  // Clear field-specific errors immediately for better UX
  if (updatedBuilds[buildIndex].errors[field]) {
    delete updatedBuilds[buildIndex].errors[field];
  }

  setBuilds(updatedBuilds);
};

  /**
   * Clean and validate barcode data
   * FIXED: No longer removes leading zeros - preserves original barcode
   */
  const cleanBarcodeValue = (field, value) => {
    if (!value) return '';
    
    // Trim whitespace and remove non-printable characters
    let cleaned = value.trim().replace(/[\x00-\x1F\x7F]/g, '');
    
    switch (field) {
      case 'bmcMac':
      case 'ethernetMac':
        // Format MAC addresses - add colons if missing
        cleaned = cleaned.replace(/[^a-fA-F0-9]/g, '');
        if (cleaned.length === 12 && !cleaned.includes(':')) {
          cleaned = cleaned.match(/.{2}/g).join(':').toUpperCase();
        }
        break;
        
      case 'systemPN':
      case 'chassisSN':
      case 'mbSN':
      case 'cpuP0SN':
      case 'cpuP1SN':
      case 'm2SN':
        // FIXED: Preserve all characters including leading zeros
        // Only remove obvious scanner artifacts like carriage returns
        cleaned = cleaned.replace(/[\r\n]/g, '');
        break;
        
      default:
        // For other fields, just clean whitespace
        break;
    }
    
    return cleaned;
  };

  /**
   * Validate barcode format and length
   */
  const validateBarcodeFormat = (field, value) => {
    if (!value) return false;
    
    const length = value.length;
    
    // Check length constraints
    if (length < SCANNER_CONFIG.MIN_BARCODE_LENGTH || 
        length > SCANNER_CONFIG.MAX_BARCODE_LENGTH) {
      return false;
    }
    
    // Field-specific validation
    switch (field) {
      case 'bmcMac':
      case 'ethernetMac':
        // MAC address should be 12 hex chars or 17 chars with colons
        return /^([0-9A-Fa-f]{12}|[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2})$/.test(value);
        
      case 'm2SN':
        // M.2 S/N validation removed as per requirements
        return length >= 4;
        
      case 'systemPN':
      case 'chassisSN':
      case 'mbSN':
      case 'cpuP0SN':
      case 'cpuP1SN':
        // General alphanumeric with common special characters
        return /^[A-Za-z0-9\-_\.#]+$/.test(value);
        
      default:
        return true;
    }
  };

  /**
   * Get next scanner field for navigation
   */
  const getNextScannerField = (currentField, currentStep, buildIndex) => {
    const sequence = SCANNER_FIELD_SEQUENCES[currentStep];
    if (!sequence) return null;
    
    // Handle DIMM SN fields specially
    if (currentField.startsWith('dimmSN-')) {
      const dimmIndex = parseInt(currentField.split('-')[1]);
      const dimmQty = parseInt(builds[buildIndex].systemInfo.dimmQty) || 0;
      
      if (dimmIndex < dimmQty - 1) {
        // Move to next DIMM in same build
        return `dimmSN-${dimmIndex + 1}`;
      } else {
        // Last DIMM - move to next build's first DIMM or end
        return null;
      }
    }
    
    // Regular field navigation
    const currentIndex = sequence.indexOf(currentField);
    if (currentIndex === -1 || currentIndex === sequence.length - 1) {
      // Handle transition to DIMM fields for componentInfo step
      if (currentStep === 'componentInfo' && currentField === 'm2SN') {
        return 'dimmSN-0';
      }
      return null;
    }
    
    return sequence[currentIndex + 1];
  };

  /**
   * Focus on specific field with enhanced error handling
   */
  const focusField = (buildIndex, field, dimmIndex = null) => {
    let refKey;
    
    if (field.startsWith('dimmSN-') || dimmIndex !== null) {
      const index = dimmIndex !== null ? dimmIndex : parseInt(field.split('-')[1]);
      refKey = `dimmSN-${buildIndex}-${index}`;
    } else {
      refKey = `${field}-${buildIndex}`;
    }
    
    const ref = scannerRefs.current[refKey];
    if (ref && ref.current) {
      try {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          ref.current.focus();
          ref.current.select();
          console.log(`Focused on field: ${refKey}`);
        }, SCANNER_CONFIG.NAVIGATION_DELAY);
      } catch (error) {
        console.warn(`Failed to focus field ${refKey}:`, error);
      }
    } else {
      console.warn(`Reference not found for field: ${refKey}`);
    }
  };

  /**
   * Navigate to next field after successful scan
   */
  const navigateToNextField = (buildIndex, currentField, currentStep) => {
    const nextField = getNextScannerField(currentField, currentStep, buildIndex);
    
    if (nextField) {
      // Move to next field in same build
      if (nextField.startsWith('dimmSN-')) {
        const dimmIndex = parseInt(nextField.split('-')[1]);
        focusField(buildIndex, 'dimmSN', dimmIndex);
      } else {
        setSelectedField(nextField);
        focusField(buildIndex, nextField);
      }
    } else {
      // End of sequence - move to next build or end
      if (buildIndex < builds.length - 1) {
        const nextBuildIndex = buildIndex + 1;
        const firstField = SCANNER_FIELD_SEQUENCES[currentStep]?.[0];
        
        if (firstField) {
          setSelectedBuildIndex(nextBuildIndex);
          setSelectedField(firstField);
          focusField(nextBuildIndex, firstField);
        }
      } else {
        console.log('Reached end of scanning sequence');
      }
    }
  };

  // ============ ENHANCED INPUT CHANGE HANDLER ============

  /**
   * Enhanced input change handler with improved barcode detection
   */
  const handleInputChange = async (buildIndex, section, field, value, dimmIndex = null) => {
  const fieldKey = dimmIndex !== null ? `${field}-${buildIndex}-${dimmIndex}` : `${field}-${buildIndex}`;
  const isScannerField = ['systemPN', 'chassisSN', 'bmcMac', 'mbSN', 'ethernetMac', 'cpuP0SN', 'cpuP1SN', 'm2SN', 'dimmSN'].includes(field);
  
  if (isScannerField) {
    // FIXED: Clear any existing timeouts immediately to prevent double processing
    if (scannerTimeoutRef.current[fieldKey]) {
      clearTimeout(scannerTimeoutRef.current[fieldKey]);
      delete scannerTimeoutRef.current[fieldKey];
    }
    if (manualInputTimeoutRef.current[fieldKey]) {
      clearTimeout(manualInputTimeoutRef.current[fieldKey]);
      delete manualInputTimeoutRef.current[fieldKey];
    }

    // Detect if this is barcode input
    const isBarcodeInput = detectBarcodeInput(fieldKey, value);
    
    // ALWAYS update UI immediately for responsiveness (but without API calls)
    updateBuildStateOnly(buildIndex, section, field, value, dimmIndex);
    
    if (isBarcodeInput && value.length >= SCANNER_CONFIG.MIN_BARCODE_LENGTH) {
      // Store the value for barcode processing
      scannerBufferRef.current[fieldKey] = value;
      
      // FIXED: Set timeout to process complete barcode scan with API calls
      scannerTimeoutRef.current[fieldKey] = setTimeout(() => {
        const finalValue = scannerBufferRef.current[fieldKey];
        const cleanedValue = cleanBarcodeValue(field, finalValue);
        
        // Validate barcode format
        if (validateBarcodeFormat(field, cleanedValue)) {
          console.log(`Valid barcode scanned for ${field}:`, cleanedValue);
          
          // FIXED: Process with API calls and navigation (only once!)
          processInputChange(buildIndex, section, field, cleanedValue, dimmIndex, true);
          
          // Navigate to next field
          navigateToNextField(buildIndex, field, systemInfoSubStep);
        } else {
          console.warn(`Invalid barcode format for ${field}:`, cleanedValue);
          // FIXED: Still update with cleaned value but no navigation
          processInputChange(buildIndex, section, field, cleanedValue, dimmIndex, false);
        }
        
        // FIXED: Cleanup immediately after processing
        delete scannerBufferRef.current[fieldKey];
        delete scannerTimeoutRef.current[fieldKey];
        delete lastInputTimeRef.current[fieldKey];
      }, SCANNER_CONFIG.SCAN_COMPLETE_DELAY);
    } else {
      // FIXED: Manual typing detected - use debounced processing
      // Set debounced timeout for manual input (longer delay)
      manualInputTimeoutRef.current[fieldKey] = setTimeout(() => {
        console.log(`Manual input completed for ${field}:`, value);
        // Process with API calls but no navigation
        processInputChange(buildIndex, section, field, value, dimmIndex, false);
        
        // Cleanup
        delete manualInputTimeoutRef.current[fieldKey];
        delete lastInputTimeRef.current[fieldKey];
      }, SCANNER_CONFIG.MANUAL_INPUT_DELAY);
    }
  } else {
    // FIXED: Non-scanner fields process immediately with API calls
    processInputChange(buildIndex, section, field, value, dimmIndex, false);
  }
};

  // ============ ENHANCED PROCESS INPUT CHANGE ============
  
  /**
   * Process the actual input change with API calls and validation
   */
  const processInputChange = async (buildIndex, section, field, value, dimmIndex = null, shouldNavigate = true) => {
    const updatedBuilds = [...builds];

    if (section === 'generalInfo') {
      updatedBuilds[buildIndex].generalInfo[field] = value;

      // Auto-fill location for all builds
      if (field === 'location' && buildIndex === 0) {
        updatedBuilds.forEach((build, idx) => {
          if (idx !== 0) {
            build.generalInfo.location = value;
          }
        });
      }
    } else if (section === 'systemInfo') {
      // Handle DIMM S/N separately
      if (field === 'dimmSN' && dimmIndex !== null) {
        if (!updatedBuilds[buildIndex].systemInfo.dimmSNs) {
          updatedBuilds[buildIndex].systemInfo.dimmSNs = [];
        }
        updatedBuilds[buildIndex].systemInfo.dimmSNs[dimmIndex] = value;
        
        // Auto-populate DIMM P/N from first DIMM S/N
        if (dimmIndex === 0 && value) {
          const extractedPN = extractDimmPNFromSN(value);
          if (extractedPN && !updatedBuilds[buildIndex].systemInfo.dimmPN) {
            updatedBuilds[buildIndex].systemInfo.dimmPN = extractedPN;
            console.log(`Auto-populated DIMM P/N: ${extractedPN} from DIMM S/N`);
          }
        }
      } else {
        updatedBuilds[buildIndex].systemInfo[field] = value;
      }

      // Auto-fill project name, CPU socket, and CPU program name for all builds
      if ((field === 'projectName' || field === 'cpuSocket' || field === 'cpuProgramName') && buildIndex === 0) {
        updatedBuilds.forEach((build, idx) => {
          if (idx !== 0) {
            build.systemInfo[field] = value;
          }
        });
      }

      // ENHANCED: Auto-populate fields based on systemPN input while preserving Chassis S/N
      if (field === 'systemPN' && value && shouldNavigate) {
        try {
          const { platformType } = await api.getPlatformInfo(value);

          // Clear any previous systemPN errors since validation succeeded
          if (updatedBuilds[buildIndex].errors.systemPN) {
            delete updatedBuilds[buildIndex].errors.systemPN;
          }

          // PRESERVE: Store current Chassis S/N before updating
          const currentChassisSN = updatedBuilds[buildIndex].systemInfo.chassisSN;

          updatedBuilds[buildIndex].systemInfo.platformType = platformType || '';

          // Determine chassis type
          if (/\-[fF]/.test(value)) {
            updatedBuilds[buildIndex].systemInfo.chassisType = 'Rackmount';
          } else if (/\-[bB]/.test(value)) {
            updatedBuilds[buildIndex].systemInfo.chassisType = 'Benchtop';
          }

          // Extract manufacturer prefix and get manufacturer
          if (platformType) {
            const manufacturerPrefix = extractManufacturerPrefix(platformType);
            if (manufacturerPrefix) {
              try {
                const { manufacturer } = await api.getManufacturer(manufacturerPrefix);
                updatedBuilds[buildIndex].systemInfo.manufacturer = manufacturer || 'Unknown';
              } catch (error) {
                updatedBuilds[buildIndex].systemInfo.manufacturer = 'Unknown';
              }
            }
          }

          // ENHANCED: Update BMC name with new platform type BUT preserve Chassis S/N
          if (currentChassisSN) {
            updatedBuilds[buildIndex].systemInfo.bmcName = generateBMCName(
              platformType,
              currentChassisSN
            );
          }
        } catch (error) {
          console.error('Error fetching platform info:', error);

          // Set validation error based on error type
          if (error.message.includes('not found') || error.message.includes('404')) {
            updatedBuilds[buildIndex].errors.systemPN = 'System P/N is not available in our database. Please contact support to add this System P/N.';
          } else if (error.message.includes('Database error') || error.message.includes('500')) {
            updatedBuilds[buildIndex].errors.systemPN = 'Database error occurred while validating System P/N. Please try again.';
          } else {
            updatedBuilds[buildIndex].errors.systemPN = 'Unable to validate System P/N. Please check the value and try again.';
          }
        }
      }

      // Generate BMC name when chassis SN changes
      if (field === 'chassisSN' && value && shouldNavigate) {
        const platformType = updatedBuilds[buildIndex].systemInfo.platformType;
        if (platformType) {
          updatedBuilds[buildIndex].systemInfo.bmcName = generateBMCName(platformType, value);
        }
      }

      // ENHANCED: Handle DIMM quantity change - PRESERVE existing DIMM S/Ns
      if (field === 'dimmQty') {
        const newQty = parseInt(value) || 0;
        const existingDimmSNs = updatedBuilds[buildIndex].systemInfo.dimmSNs || [];
        const oldQty = existingDimmSNs.length;

        if (newQty > oldQty) {
          // INCREASING quantity: Keep existing data, add empty slots
          const newDimmSNs = [...existingDimmSNs];
          for (let i = existingDimmSNs.length; i < newQty; i++) {
            newDimmSNs.push('');
          }
          updatedBuilds[buildIndex].systemInfo.dimmSNs = newDimmSNs;
        } else if (newQty < oldQty) {
          // DECREASING quantity: Keep first N items, discard rest
          updatedBuilds[buildIndex].systemInfo.dimmSNs = existingDimmSNs.slice(0, newQty);
        }
        // If newQty === oldQty, no change needed - data is already preserved
      }

      // Auto-calculate FPY status when testing fields change
      if (['visualInspection', 'bootStatus', 'dimmsDetectedStatus', 'lomWorkingStatus'].includes(field)) {
        const fpyStatus = calculateFpyStatus(updatedBuilds[buildIndex]);
        updatedBuilds[buildIndex].qualityDetails.fpyStatus = fpyStatus;
        
        // Reset failure details if FPY becomes Pass
        if (fpyStatus === 'Pass') {
          updatedBuilds[buildIndex].qualityDetails.problemDescription = '';
          updatedBuilds[buildIndex].qualityDetails.numberOfFailures = '';
          updatedBuilds[buildIndex].qualityDetails.failureModes = [];
          updatedBuilds[buildIndex].qualityDetails.failureCategories = [];
          updatedBuilds[buildIndex].qualityDetails.canRework = '';
        }
      }
    }

    // Clear field-specific errors
    if (updatedBuilds[buildIndex].errors[field]) {
      delete updatedBuilds[buildIndex].errors[field];
    }

    const controlFields = ['chassisSN', 'mbSN', 'bmcMac', 'ethernetMac', 'cpuP0SN', 'cpuP1SN', 'm2SN'];
    const isDimmField = field === 'dimmSN';
    
    if (controlFields.includes(field) || isDimmField) {
      try {
        const { validateCrossBuildDuplicates } = await import('./useValidation');
        const crossBuildErrors = validateCrossBuildDuplicates(updatedBuilds);
        
        if (Object.keys(crossBuildErrors).length > 0) {
          const finalBuilds = updatedBuilds.map((build, index) => ({
            ...build,
            errors: {
              ...build.errors,
              ...(crossBuildErrors[index] || {})
            }
          }));
          setBuilds(finalBuilds);
          return; // Exit early if cross-build duplicates found
        }
      } catch (error) {
        console.error('Error checking cross-build duplicates:', error);
      }
    }

    setBuilds(updatedBuilds);

    // Real-time duplicate check for chassis S/N (only on final value)
    if (field === 'chassisSN' && value && value.trim() && shouldNavigate) {
      try {
        const duplicateCheck = await api.checkDuplicates({
          chassisSN: value.trim()
        });
        
        if (duplicateCheck.hasDuplicates && duplicateCheck.duplicates.chassisSN) {
          updatedBuilds[buildIndex].errors = {
            ...updatedBuilds[buildIndex].errors,
            chassisSN: `Chassis S/N already exists. Use unique S/N for new builds.`
          };
          console.log(`Duplicate chassis S/N detected: ${value.trim()}`);
        } else {
          const { chassisSN, ...otherErrors } = updatedBuilds[buildIndex].errors || {};
          updatedBuilds[buildIndex].errors = otherErrors;
        }
        setBuilds([...updatedBuilds]);
      } catch (error) {
        console.error('Error checking chassis S/N duplicates:', error);
      }
    }
  };

  // ============ UTILITY FUNCTIONS (kept from original) ============
  
  // Extract manufacturer prefix from platform type
  const extractManufacturerPrefix = (platformType) => {
    const specialCases = {
      'Marley-Jamaica': 'Marley-Jamaica'
    };

    for (const [key, value] of Object.entries(specialCases)) {
      if (platformType.includes(key)) {
        return value;
      }
    }

    const matches = platformType.match(/(?::\s*)([A-Z][a-z]{3,})/);
    if (matches && matches[1]) {
      return matches[1];
    }

    const words = platformType.split(/\s+/);
    return words.find(word => word.length > 3) || words[0] || '';
  };

  // Generate BMC name
  const generateBMCName = (platformType, chassisSN) => {
    if (!platformType || !chassisSN) return '';

    const platformName = extractManufacturerPrefix(platformType);
    const lastFourDigits = chassisSN.slice(-4);

    return `${platformName}-${lastFourDigits}`;
  };

  // Calculate FPY status based on testing results
  const calculateFpyStatus = (build) => {
    const testingResults = [
      build.systemInfo.visualInspection,
      build.systemInfo.bootStatus,
      build.systemInfo.dimmsDetectedStatus,
      build.systemInfo.lomWorkingStatus
    ];

    const allTestsPass = testingResults.every(result => 
      result === 'Pass' || result === 'Yes'
    );

    return allTestsPass ? 'Pass' : 'Fail';
  };

  // ============ PART NUMBER SEARCH FUNCTIONS (kept from original) ============
  const searchPartNumbers = async (query, type) => {
  // Start searching from the first character for faster response
  if (query.length < 1) {
    setPartNumberSuggestions(prev => ({
      ...prev,
      [type]: []
    }));
    return;
  }

  try {
    const response = await api.searchPartNumbers(query, type === 'm2PN' ? 'Drive' : 'Module');
    const suggestions = response.suggestions || [];
  
    // Always add "Other" option for M.2 P/N
    if (type === 'm2PN') {
      // Add Other at the end of suggestions list
      if (!suggestions.includes('Other')) {
        suggestions.push('Other');
      }
    }
    
    setPartNumberSuggestions(prev => ({
      ...prev,
      [type]: suggestions
    }));
  } catch (error) {
    console.error('Error searching part numbers:', error);
    if (type === 'm2PN') {
      setPartNumberSuggestions(prev => ({
        ...prev,
        [type]: ['Other']
      }));
    } else {
      setPartNumberSuggestions(prev => ({
        ...prev,
        [type]: []
      }));
    }
  }
};

  const handlePartNumberSearchChange = (buildIndex, type, value) => {
  setPartNumberSearch(prev => ({
    ...prev,
    [type]: value
  }));

  const updatedBuilds = [...builds];
  updatedBuilds[buildIndex].systemInfo[type] = value;
  
  // Handle "Other" selection for M.2 P/N
  if (type === 'm2PN' && value === 'Other') {
    updatedBuilds[buildIndex].systemInfo.m2PNOther = true;
    updatedBuilds[buildIndex].systemInfo.m2PNCustom = '';
  } else if (type === 'm2PN') {
    updatedBuilds[buildIndex].systemInfo.m2PNOther = false;
    updatedBuilds[buildIndex].systemInfo.m2PNCustom = '';
  }

  setBuilds(updatedBuilds);

  setShowPartNumberDropdown(prev => ({
    ...prev,
    [type]: { ...prev[type], [buildIndex]: true }
  }));

  // Clear existing timeout
  clearTimeout(window[`searchTimeout_${type}_${buildIndex}`]);
  
  // Reduce debounce delay from 100ms to 50ms for quicker response
  window[`searchTimeout_${type}_${buildIndex}`] = setTimeout(() => {
    searchPartNumbers(value, type);
  }, 50);
};

  const selectPartNumber = (buildIndex, type, partNumber) => {
  const updatedBuilds = [...builds];
  updatedBuilds[buildIndex].systemInfo[type] = partNumber;
  
  // Handle "Other" selection for M.2 P/N
  if (type === 'm2PN' && partNumber === 'Other') {
    updatedBuilds[buildIndex].systemInfo.m2PNOther = true;
    updatedBuilds[buildIndex].systemInfo.m2PNCustom = '';
    // Don't close dropdown for "Other" selection
    setBuilds(updatedBuilds);
    setPartNumberSearch(prev => ({
      ...prev,
      [type]: partNumber
    }));
    
    // Focus on the custom input field
    setTimeout(() => {
      const customInput = scannerRefs.current[`m2PNCustom-${buildIndex}`];
      if (customInput) {
        customInput.focus();
      }
    }, 100);
    
    return;
  } else if (type === 'm2PN') {
    updatedBuilds[buildIndex].systemInfo.m2PNOther = false;
    updatedBuilds[buildIndex].systemInfo.m2PNCustom = '';
  }
  
  setBuilds(updatedBuilds);

  setPartNumberSearch(prev => ({
    ...prev,
    [type]: partNumber
  }));

  setShowPartNumberDropdown(prev => ({
    ...prev,
    [type]: { ...prev[type], [buildIndex]: false }
  }));
};

const handleCustomM2PNInput = async (buildIndex, value) => {
  const updatedBuilds = [...builds];
  updatedBuilds[buildIndex].systemInfo.m2PNCustom = value;
  updatedBuilds[buildIndex].systemInfo.m2PN = value; // Also update m2PN for validation
  setBuilds(updatedBuilds);
  
  // Save to database when user finishes typing (on blur or enter)
  // This will be called from the onBlur event handler
};

const saveCustomM2PN = async (buildIndex) => {
  const customPN = builds[buildIndex].systemInfo.m2PNCustom;
  
  if (!customPN || customPN.trim() === '') {
    return;
  }
  
  try {
    // Save the new part number to the database
    await api.addPartNumber(customPN.trim(), 'Drive');
    console.log('Custom M.2 P/N saved successfully:', customPN);
    
    // Update the part number suggestions to include the new entry
    const response = await api.searchPartNumbers('', 'Drive');
    setPartNumberSuggestions(prev => ({
      ...prev,
      m2PN: response.suggestions || []
    }));
  } catch (error) {
    console.error('Error saving custom M.2 P/N:', error);
  }
};
  // ============ DATA MANAGEMENT (kept from original) ============
  const addNewBuild = () => {
    const newBuild = {
      id: Date.now(),
      generalInfo: {
        location: builds[0]?.generalInfo?.location || '',
        buildEngineer: builds[0]?.generalInfo?.buildEngineer || '',
        isCustomConfig: builds[0]?.generalInfo?.isCustomConfig || ''
      },
      systemInfo: {
        projectName: builds[0]?.systemInfo?.projectName || '',
        systemPN: '',
        platformType: '',
        manufacturer: '',
        chassisSN: '',
        chassisType: '',
        bmcName: '',
        bmcMac: '',
        mbSN: '',
        ethernetMac: '',
        cpuSocket: builds[0]?.systemInfo?.cpuSocket || '',
        cpuVendor: '',
        jiraTicketNo: '',
        cpuProgramName: builds[0]?.systemInfo?.cpuProgramName || '',
        cpuP0SN: '',
        cpuP0SocketDateCode: '',
        cpuP1SN: '',
        cpuP1SocketDateCode: '',
        m2PN: '',
        m2PNOther: false,
        m2PNCustom: '',
        m2SN: '',
        dimmPN: '',
        dimmQty: '',
        dimmSNs: [],
        visualInspection: '',
        visualInspectionNotes: '',
        visualInspectionPhotos: [],
        bootStatus: '',
        bootNotes: '',
        bootPhotos: [],
        dimmsDetectedStatus: '',
        dimmsDetectedNotes: '',
        dimmsDetectedPhotos: [],
        lomWorkingStatus: '',
        lomWorkingNotes: '',
        lomWorkingPhotos: []
      },
      status: 'pending',
      errors: {},
      stepCompleted: {
        generalInfo: false,
        chassisInfo: false,
        cpuInfo: false,
        componentInfo: false,
        testing: false,
        bkcDetails: false,
        qualityDetails: false
      },
      bkcDetails: {
        biosVersion: '',
        scmFpgaVersion: '',
        hpmFpgaVersion: '',
        bmcVersion: ''
      },
      bkcExtraction: {
        extracting: false,
        extracted: false,
        error: null
      },
      qualityDetails: {
        fpyStatus: '',
        problemDescription: '',
        numberOfFailures: '',
        failureModes: [],
        failureCategories: [],
        canRework: '',
        saveOption: 'continue'
      }
    };
    setBuilds([...builds, newBuild]);
  };

  const removeBuild = (index) => {
    if (builds.length > 1) {
      setBuilds(builds.filter((_, i) => i !== index));
    }
  };

  return {
    builds,
    setBuilds,
    selectedField,
    setSelectedField,
    selectedBuildIndex,
    setSelectedBuildIndex,
    partNumberSuggestions,
    setPartNumberSuggestions,
    partNumberSearch,
    handleCustomM2PNInput,
    setPartNumberSearch,
    showPartNumberDropdown,
    setShowPartNumberDropdown,
    scannerRefs,
    addNewBuild,
    removeBuild,
    handleInputChange,
    searchPartNumbers,
    handlePartNumberSearchChange,
    selectPartNumber,
    handleCustomM2PNInput,
    saveCustomM2PN,
    calculateFpyStatus,
    
    // Export scanner utilities for debugging
    SCANNER_CONFIG,
    focusField,
    cleanBarcodeValue,
    validateBarcodeFormat
  };
};