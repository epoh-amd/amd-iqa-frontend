import React, { useState, useEffect, useRef } from "react";
import "../../assets/css/waiver.css";
import api from "../../services/api";
import { getAllConfig } from './waiverConfig';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';

const RequestorInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const debounce = useRef(null);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/users/search-email?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data);
        if (data.length > 0 && inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
        }
        setOpen(data.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 250);
  };

  const select = (row) => {
    onChange(row.full_name || row.email);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            setOpen(true);
          }
        }}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {open && (
        <ul style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999,
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          margin: '2px 0 0', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
        }}>
          {suggestions.map((row, i) => (
            <li
              key={i}
              onMouseDown={() => select(row)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontWeight: 500 }}>{row.full_name}</span>
              {row.email && <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>{row.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const MultiSelectDropdown = ({ options, value = [], onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setOpen(v => !v);
  };

  const toggle = (item) => {
    const next = value.includes(item) ? value.filter(v => v !== item) : [...value, item];
    onChange(next);
  };

  const displayText = value.length === 0 ? placeholder : value.join(', ');

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px',
          background: '#fff', cursor: 'pointer', fontSize: '13px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayText}</span>
        <span style={{ marginLeft: '8px', flexShrink: 0 }}>&#9660;</span>
      </div>
      {open && (
        <div style={{
          position: 'fixed',
          top: dropPos.top,
          left: dropPos.left,
          width: dropPos.width,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxHeight: '200px',
          overflowY: 'scroll',
        }}>
          {options.map(item => (
            <label key={item} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
              borderBottom: '1px solid #f0f0f0', width: 'auto', margin: 0
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <input type="checkbox" checked={value.includes(item)} onChange={() => toggle(item)} style={{ cursor: 'pointer' }} />
              {item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};


const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const toFileUrl = (filePath) => filePath ? `${BASE_URL}${filePath.replace('/drafts/', '/api/drafts/')}` : '';

const generateWaiverId = () => {
  const year = new Date().getFullYear().toString().slice(-2); // 2026 -> 26

  const runningNumber = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0"); // 001, 002...

  const amendment = "A";

  return `WV${year}${runningNumber}-${amendment}`;
};



const WaiverForm = () => {
  const { user } = useAuth();
  const userId = user?.employee_number;
  const navigate = useNavigate();
  const [waiverId, setWaiverId] = useState(null);
  const [myForms, setMyForms] = useState([]);
  const [myFormsLoading, setMyFormsLoading] = useState(false);
  const [myFormsSearch, setMyFormsSearch] = useState('');
  const [myFormsStatusFilter, setMyFormsStatusFilter] = useState('all');
  const [waiverStatus, setWaiverStatus] = useState(null);
  const [emailSentBanner, setEmailSentBanner] = useState(null);
  const emailBannerTimer = useRef(null);
  const [sendingEmailIdx, setSendingEmailIdx] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [expandedCancelReason, setExpandedCancelReason] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [subcontractors, setSubcontractors] = useState([]);
  const [assemblyLevels, setAssemblyLevels] = useState([]);
  const [materialActions, setMaterialActions] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds waiverId to delete
  const [pageMessage, setPageMessage] = useState(null);

  const isEditingRef = React.useRef(false);
  const [approverEditMode, setApproverEditMode] = useState(false);
  const [requestorEditMode, setRequestorEditMode] = useState(false);
  const [rejectedEditMode, setRejectedEditMode] = useState(false);


  useEffect(() => {
    const loadConfig = async () => {
      const data = await getAllConfig();
      setSubcontractors(data.subcontractors || []);
      setAssemblyLevels(data.assemblyLevels || []);
      setMaterialActions(data.materialActions || []);
      setApprovers(data.approvers || []);
    };
    loadConfig();
  }, []);


  useEffect(() => {
    if (!userId || !waiverId || !isEditingRef.current) return;

    const loadDraft = async () => {
      try {
        const data = await api.getDraftDetails(userId, waiverId);

        if (data?.formData?.waiverId) {
          // ✅ use saved ID
          setWaiverId(data.formData.waiverId);
        }

        setFormData(data.formData ?? {
          partNumber: "",
          revision: "",
          description: "",
          subcontractor: "",
          assemblyLevel: "",
          requestor: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          waiverType: [],
          reason: "",
          workorder: "",
          workorderQty: ""
        });

        setMaterialRows(data.materialRows ?? [
          {
            currentPart: "",
            currentPartDescription: "",
            newPart: "",
            newPartDescription: "",
            action: "",
            instructions: "",
            file: null
          }
        ]);

        setOpenSection(data.openSection ?? []);

        setProcessData(data.processData ?? { areas: [], areaInstructions: {}, areaFiles: {}, instructions: "", file: null });
        setTestData(data.testData ?? { rows: [{ currentPart: '', toBePart: '', refdes: '' }], areas: [], areaInstructions: {}, areaFiles: {}, instructions: "", file: null });
        setSpecData(data.specData ?? { specImpact: "", instructions: "", file1: null, file2: null });
        setReworkData(data.reworkData ?? { instructions: "", file: null });
        setLabelData(data.labelData ?? { instructions: "", file: null });
      } catch (err) {
        console.error("Load draft failed:", err);
      }
    };

    loadDraft();
  }, [userId, waiverId]);

  useEffect(() => {
    fetchDrafts();
  }, [userId]);

  // Requestor edit: detect ?edit=true&id=WAIVER_ID from URL (My Forms tab)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== 'true') return;
    const editId = params.get('id');
    if (!editId) return;

    setRequestorEditMode(true);
    isEditingRef.current = false;
    const toDate = (v) => v ? v.toString().slice(0, 10) : '';

    (async () => {
      try {
        const data = await api.getWaiverDetails(editId);
        setWaiverId(editId);
        setFormData({
          waiverId: editId,
          partNumber: data.partNumber || '',
          revision: data.revision || '',
          description: data.description || '',
          subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
          assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
          requestor: Array.isArray(data.requestor) ? data.requestor : data.requestor ? [data.requestor] : [''],
          startDate: toDate(data.startDate) || new Date().toISOString().split('T')[0],
          endDate: toDate(data.endDate),
          waiverType: data.waiverType || [],
          reason: data.reason || '',
          workorder: data.workorder || '',
          workorderQty: data.workorderQty || '',
          currentPart: '', newPart: '', action: '', instructions: ''
        });
        const sectionMap = {
          'Material Waiver': 'material', 'Process Waiver': 'process',
          'Test Waiver': 'test', 'Spec Deviation': 'spec',
          'Rework Waiver': 'rework', 'Label Waiver': 'label'
        };
        setOpenSection((data.waiverType || []).map(t => sectionMap[t]).filter(Boolean));
        setMaterialRows((data.materialRows || [{ currentPart: '', currentPartDescription: '', newPart: '', newPartDescription: '', action: '', instructions: '', file: null }]).map(r => ({
          currentPart: r.current_part || r.currentPart || '',
          currentPartDescription: r.current_part_description || r.currentPartDescription || '',
          noOfPer: r.no_of_per || r.noOfPer || '',
          refdes: r.refdes || '',
          newPart: r.new_part || r.newPart || '',
          newPartDescription: r.new_part_description || r.newPartDescription || '',
          action: r.action || '',
          instructions: r.instructions || '',
          file: r.file_path || r.file || null
        })));
        setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: data.processData?.file || null });
        setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: data.testData?.file || null });
        setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
        setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
        setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
        setWaiverStatus(data.status || null);
        setShowForm(true);
      } catch (err) {
        console.error('Failed to load waiver for edit:', err);
      }
    })();
  }, []);

  // Approver edit: detect ?approverEdit=true&id=WAIVER_ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('approverEdit') !== 'true') return;
    const editId = params.get('id');
    if (!editId) return;

    setApproverEditMode(true);
    isEditingRef.current = false;
    const toDate = (v) => v ? v.toString().slice(0, 10) : '';

    (async () => {
      try {
        const data = await api.getWaiverDetails(editId);
        setWaiverId(editId);
        setFormData({
          waiverId: editId,
          partNumber: data.partNumber || '',
          revision: data.revision || '',
          description: data.description || '',
          subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
          assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
          requestor: Array.isArray(data.requestor) ? data.requestor : data.requestor ? [data.requestor] : [''],
          startDate: toDate(data.startDate) || new Date().toISOString().split('T')[0],
          endDate: toDate(data.endDate),
          waiverType: data.waiverType || [],
          reason: data.reason || '',
          workorder: data.workorder || '',
          workorderQty: data.workorderQty || '',
          currentPart: '', newPart: '', action: '', instructions: ''
        });
        const sectionMap = {
          'Material Waiver': 'material', 'Process Waiver': 'process',
          'Test Waiver': 'test', 'Spec Deviation': 'spec',
          'Rework Waiver': 'rework', 'Label Waiver': 'label'
        };
        setOpenSection((data.waiverType || []).map(t => sectionMap[t]).filter(Boolean));
        setMaterialRows((data.materialRows || [{ currentPart: '', currentPartDescription: '', newPart: '', newPartDescription: '', action: '', instructions: '', file: null }]).map(r => ({
          currentPart: r.current_part || r.currentPart || '',
          currentPartDescription: r.current_part_description || r.currentPartDescription || '',
          noOfPer: r.no_of_per || r.noOfPer || '',
          refdes: r.refdes || '',
          newPart: r.new_part || r.newPart || '',
          newPartDescription: r.new_part_description || r.newPartDescription || '',
          action: r.action || '',
          instructions: r.instructions || '',
          file: r.file_path || r.file || null
        })));
        setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: data.processData?.file || null });
        setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: data.testData?.file || null });
        setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
        setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
        setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
        setWaiverStatus(data.status || null);
        setShowForm(true);
      } catch (err) {
        console.error('Failed to load waiver for approver edit:', err);
      }
    })();
  }, []); // run once on mount


  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('drafts');  // 'drafts' | 'myforms'
  const [showForm, setShowForm] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const [submitMessage, setSubmitMessage] = useState(null);



  useEffect(() => {
    if (!waiverId) return;

    setFormData((prev) => ({
      ...prev,
      waiverId
    }));
  }, [waiverId]);

  // const [loaded, setLoaded] = useState(false);

  const [formData, setFormData] = useState({
    partNumber: "",
    revision: "",
    description: "",
    subcontractor: "",
    assemblyLevel: "",
    requestor: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    waiverType: [],
    reason: "",
    workorder: "",
    workorderQty: "",
    currentPart: "",
    newPart: "",
    action: "",
    instructions: ""
  });



  const [openSection, setOpenSection] = useState([]);

  const [materialRows, setMaterialRows] = useState([
    {
      currentPart: "",
      currentPartDescription: "",
      noOfPer: "",
      refdes: "",
      newPart: "",
      newPartDescription: "",
      action: "",
      instructions: "",
      file: ""
    }
  ]);

  const PROCESS_AREAS = ['Prepping', 'SMT', 'Wave', 'Hand Soldering', 'Visual Inspection', 'Final Assembly', 'System Assembly', 'Packing', 'Rework'];

  const [processData, setProcessData] = useState({
    areas: [],
    areaInstructions: {},
    areaFiles: {},
    instructions: "",
    file: null
  });

  const TEST_AREAS = ['Programming', 'Flying Probe', 'ICT', 'Functional Test', 'System Test'];

  const [testData, setTestData] = useState({
    rows: [{ currentPart: '', toBePart: '', refdes: '' }],
    areas: [],
    areaInstructions: {},
    areaFiles: {},
    instructions: "",
    file: null
  });

  const [specData, setSpecData] = useState({
    specImpact: "",
    instructions: "",
    file1: null,
    file2: null
  });

  const [reworkData, setReworkData] = useState({
    instructions: "",
    file: null
  });

  const [labelData, setLabelData] = useState({
    instructions: "",
    file: null
  });

  useEffect(() => {
    if (!userId) return;
    // Don't save to drafts when editing an existing waiver from All Forms
    if (requestorEditMode || approverEditMode || rejectedEditMode) return;

    // prevent saving empty initial state
    const isEmpty =
      !formData.partNumber &&
      materialRows.every(r => !r.currentPart && !r.newPart);

    if (isEmpty) return;

    const timeout = setTimeout(async () => {
      try {
        await api.saveDraftDetails({
          userId,
          formData,
          materialRows,
          processData,
          testData,
          specData,
          reworkData,
          labelData,
          openSection
        });
      } catch (error) {
        console.error("Auto-save draft failed:", error);
      }
    }, 1000); // debounce 1s

    return () => clearTimeout(timeout);
  }, [userId,
    formData,
    materialRows,
    processData,
    testData,
    specData,
    reworkData,
    labelData,
    openSection]);

  // Auto-save to waivers table when editing from All Forms tab
  useEffect(() => {
    if (!requestorEditMode || !waiverId || !formData.partNumber) return;

    const timeout = setTimeout(async () => {
      try {
        const activeTypes = formData.waiverType || [];
        await api.submitWaiver({
          waiverId,
          partNumber: formData.partNumber,
          revision: formData.revision,
          description: formData.description,
          subcontractor: formData.subcontractor,
          assemblyLevel: formData.assemblyLevel,
          requestor: JSON.stringify(Array.isArray(formData.requestor) ? formData.requestor.filter(Boolean) : formData.requestor ? [formData.requestor] : []),
          startDate: formData.startDate,
          endDate: formData.endDate,
          waiverType: activeTypes,
          reason: formData.reason,
          workorder: formData.workorder,
          workorderQty: formData.workorderQty,
          submittedBy: user?.full_name || user?.email || '',
          status: waiverStatus || 'New',
          materialRows: activeTypes.includes('Material Waiver') ? materialRows : [],
          processData: activeTypes.includes('Process Waiver') ? processData : { areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null },
          testData: activeTypes.includes('Test Waiver') ? testData : { rows: [{ currentPart: '', toBePart: '', refdes: '' }], areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null },
          specData: activeTypes.includes('Spec Deviation') ? specData : { specImpact: '', instructions: '', file1: null, file2: null },
          reworkData: activeTypes.includes('Rework Waiver') ? reworkData : { instructions: '', file: null },
          labelData: activeTypes.includes('Label Waiver') ? labelData : { instructions: '', file: null },
          openSections: openSection,
        });
      } catch (error) {
        console.error("Auto-save waiver failed:", error);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [requestorEditMode, waiverId,
    formData, materialRows, processData,
    testData, specData, reworkData, labelData, openSection]);


  const handleMaterialChange = (index, field, value) => {
    const updated = [...materialRows];
    updated[index][field] = value;
    setMaterialRows(updated);
  };

  const handleMaterialFileChange = async (index, file) => {
    const updated = [...materialRows];

    const formData = new FormData();
    formData.append("file", file);

    const res = await api.uploadDraft(formData);

    updated[index].file = res.filePath;

    setMaterialRows(updated);
  };

  const handleProcessFileChange = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.uploadDraft(formData);

      setProcessData({
        ...processData,
        file: res.filePath
      });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleFileChange = async (file, state, setState, field = "file") => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.uploadDraft(formData);

      setState({
        ...state,
        [field]: res.filePath
      });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleReplace = async (state, setState, field = "file") => {
    if (state[field]) {
      try {
        await api.deleteDraftFile({ filePath: state[field] });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    setState({
      ...state,
      [field]: null
    });
  };

  const handleProcessReplace = async () => {
    if (processData.file) {
      try {
        await api.deleteDraftFile({ filePath: processData.file });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    setProcessData({
      ...processData,
      file: null
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "waiverType") {
      let updatedTypes = [...formData.waiverType];

      if (checked) {
        updatedTypes.push(value);
      } else {
        updatedTypes = updatedTypes.filter((item) => item !== value);
      }

      setFormData({
        ...formData,
        waiverType: updatedTypes
      });

      // 👇 open multiple sections
      const sectionMap = {
        "Material Waiver": "material",
        "Process Waiver": "process",
        "Test Waiver": "test",
        "Spec Deviation": "spec",
        "Rework Waiver": "rework",
        "Label Waiver": "label"
      };

      const sectionsToOpen = updatedTypes.map(type => sectionMap[type]);
      setOpenSection(sectionsToOpen);

    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const addMaterialRow = () => {
    setMaterialRows([
      ...materialRows,
      { currentPart: "", newPart: "", actions: [], instructions: "" }
    ]);
  };

  const removeMaterialRow = (index) => {
    const updated = [...materialRows];
    updated.splice(index, 1);
    setMaterialRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage(null);

    // Validate required fields
    const activeTypes = formData.waiverType || [];
    const errors = [];

    if (!formData.partNumber?.trim()) errors.push('AMD Product Part Number');
    if (!formData.revision?.trim()) errors.push('AMD Product Revision');
    if (!formData.description?.trim()) errors.push('AMD Product Description');
    if (!formData.subcontractor || (Array.isArray(formData.subcontractor) ? formData.subcontractor.length === 0 : !formData.subcontractor)) errors.push('Affected Subcontractor');
    if (!formData.assemblyLevel || (Array.isArray(formData.assemblyLevel) ? formData.assemblyLevel.length === 0 : !formData.assemblyLevel)) errors.push('Assembly Level');
    if (!(Array.isArray(formData.requestor) ? formData.requestor.some(r => r.trim()) : formData.requestor?.trim())) errors.push('Requestor Name');
    if (!formData.startDate) errors.push('Waiver Start Date');
    if (activeTypes.length === 0) errors.push('Waiver Type (at least one)');
    if (!formData.reason?.trim()) errors.push('Reason / Justification');

    // Section-specific required fields — only enforced when requestor is submitting for approval
    if (requestorEditMode || rejectedEditMode) {
      if (activeTypes.includes('Material Waiver')) {
        const hasValidRow = materialRows.some(r => r.currentPart?.trim() || r.newPart?.trim());
        if (!hasValidRow) errors.push('Material Waiver: at least one row with Current or New Part');
      }
      if (activeTypes.includes('Process Waiver')) {
        if (!processData.areas?.length) errors.push('Process Waiver: Area');
        else if (!processData.areas.every(area => processData.areaInstructions?.[area]?.trim()))
          errors.push('Process Waiver: Instructions (all selected areas must have instructions)');
      }
      if (activeTypes.includes('Test Waiver')) {
        if (!testData.rows?.some(r => r.currentPart?.trim())) errors.push('Test Waiver: Current Part Number');
        if (!testData.rows?.some(r => r.toBePart?.trim())) errors.push('Test Waiver: To Be Part Number');
        if (!testData.areas?.length) errors.push('Test Waiver: Area');
      }
      if (activeTypes.includes('Spec Deviation')) {
        if (!specData.specImpact?.trim()) errors.push('Spec Deviation: Specifications/Drawings impacted');
        if (!specData.instructions?.trim()) errors.push('Spec Deviation: Instructions');
      }
      if (activeTypes.includes('Rework Waiver') && !reworkData.instructions?.trim())
        errors.push('Rework Waiver: Instructions');
      if (activeTypes.includes('Label Waiver') && !labelData.instructions?.trim())
        errors.push('Label Waiver: Instructions');
    }

    if (errors.length > 0) {
      setSubmitMessage({ type: 'error', text: `Please fill in the following required fields:\n• ${errors.join('\n• ')}` });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        waiverId: formData.waiverId,
        partNumber: formData.partNumber,
        revision: formData.revision,
        description: formData.description,
        subcontractor: formData.subcontractor,
        assemblyLevel: formData.assemblyLevel,
        requestor: JSON.stringify(Array.isArray(formData.requestor) ? formData.requestor.filter(Boolean) : formData.requestor ? [formData.requestor] : []),
        startDate: formData.startDate,
        endDate: formData.endDate,
        waiverType: activeTypes,
        reason: formData.reason,
        workorder: formData.workorder,
        workorderQty: formData.workorderQty,
        submittedBy: user?.full_name || user?.email || '',
        materialRows: activeTypes.includes('Material Waiver') ? materialRows : [],
        processData: activeTypes.includes('Process Waiver') ? processData : { areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null },
        testData: activeTypes.includes('Test Waiver') ? testData : { rows: [{ currentPart: '', toBePart: '', refdes: '' }], areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null },
        specData: activeTypes.includes('Spec Deviation') ? specData : { specImpact: '', instructions: '', file1: null, file2: null },
        reworkData: activeTypes.includes('Rework Waiver') ? reworkData : { instructions: '', file: null },
        labelData: activeTypes.includes('Label Waiver') ? labelData : { instructions: '', file: null },
        openSections: openSection,
      };

      // Approver editing an existing submitted waiver
      if (approverEditMode) {
        await api.approverEditWaiver(payload, user?.full_name || user?.email || '');
        navigate(-1);
        return;
      }

      // Requestor submitting from All Forms — set to Pending Approval and notify approvers
      if (requestorEditMode) {
        await api.submitWaiver({ ...payload, status: 'Pending Approval' });
        navigate(`/waiver-view?id=${formData.waiverId}&sendEmail=true`, {
          state: {
            approvers,
            submittedBy: user?.full_name,
            description: formData.description,
            reason: formData.reason,
            isUpdate: waiverStatus === 'Pending Approval',
          },
        });
        return;
      }

      // Requestor re-submitting a Cancelled waiver — reset to New and notify approvers with PDF
      if (rejectedEditMode) {
        await api.submitWaiver({ ...payload, status: 'New' });
        navigate(`/waiver-view?id=${formData.waiverId}&sendEmail=true`, {
          state: {
            approvers,
            submittedBy: user?.full_name,
            description: formData.description,
            reason: formData.reason,
            isUpdate: false,
          },
        });
        return;
      }
// New waiver — save as New, notify requestors only
await api.submitWaiver({ ...payload, status: 'New' });

// Remove from drafts list after successful submit
try {
  await api.deleteWaiver(formData.waiverId);
} catch (err) {
  console.warn('Could not delete draft after submit:', err);
}

// Notify requestors
const requestorList = Array.isArray(formData.requestor)
  ? formData.requestor.filter(Boolean)
  : formData.requestor ? [formData.requestor] : [];

try {
  await api.sendRequestorNotification({
    waiverId: formData.waiverId,
    partNumber: formData.partNumber,
    description: formData.description,
    revision: formData.revision,
    assemblyLevel: formData.assemblyLevel,
    reason: formData.reason,
    submittedBy: user?.full_name || user?.email || '',
    requestors: requestorList,
  });
} catch (emailErr) {
  console.error('Failed to notify requestors:', emailErr);
}

setShowForm(false);
setActiveTab('myforms');
fetchMyForms();
setPageMessage({ type: 'success', text: `Waiver ${formData.waiverId} created and requestors have been notified.` });
setTimeout(() => setPageMessage(null), 5000);


    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitMessage({ type: 'error', text: 'Failed to submit waiver. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDrafts = async () => {
    if (!userId) return;
    setDraftsLoading(true);
    try {
      const data = await api.getWaiverDrafts(userId);
      setDrafts(data);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setDraftsLoading(false);
    }
  };

  const fetchMyForms = async () => {
    setMyFormsLoading(true);
    try {
      const data = await api.getAllWaivers();
      setMyForms(data);
    } catch (err) {
      console.error('Failed to load my forms:', err);
    } finally {
      setMyFormsLoading(false);
    }
  };


  const handleDuplicate = async (waiverId) => {
    isEditingRef.current = false;
    const newId = generateWaiverId();
    setWaiverId(newId);

    try {
      const data = await api.getWaiverDetails(waiverId);

      setFormData({
        waiverId: newId,
        partNumber: data.partNumber || '',
        revision: data.revision || '',
        description: data.description || '',
        subcontractor: data.subcontractor || '',
        assemblyLevel: data.assemblyLevel || '',
        requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: data.endDate || '',
        waiverType: data.waiverType || [],
        reason: data.reason || '',
        workorder: data.workorder || '',
        workorderQty: data.workorderQty || '',
        currentPart: '',
        newPart: '',
        action: '',
        instructions: ''
      });

      const sectionMap = {
        'Material Waiver': 'material', 'Process Waiver': 'process',
        'Test Waiver': 'test', 'Spec Deviation': 'spec',
        'Rework Waiver': 'rework', 'Label Waiver': 'label'
      };
      setOpenSection((data.waiverType || []).map(t => sectionMap[t]).filter(Boolean));

      setMaterialRows((data.materialRows || []).map(r => ({
        currentPart: r.current_part || r.currentPart || '',
        currentPartDescription: r.current_part_description || r.currentPartDescription || '',
        noOfPer: r.no_of_per || r.noOfPer || '',
        refdes: r.refdes || '',
        newPart: r.new_part || r.newPart || '',
        newPartDescription: r.new_part_description || r.newPartDescription || '',
        action: r.action || '',
        instructions: r.instructions || '',
        file: null
      })));

      setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: null });
      setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: null });
      setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: null, file2: null });
      setReworkData({ instructions: data.reworkData?.instructions || '', file: null });
      setLabelData({ instructions: data.labelData?.instructions || '', file: null });

    } catch (err) {
      console.error('Duplicate failed:', err);
    }

    setShowForm(true);
  };

  const handleCancelForm = async () => {
    if (!cancelTarget || !cancelTarget.reason.trim()) return;
    try {
      await api.updateWaiverStatus(cancelTarget.waiverId, 'Cancelled', cancelTarget.reason, `Requestor: ${user?.full_name || ''}`);

      try {
        await api.sendWaiverStatusNotification({
          waiverId: cancelTarget.waiverId,
          status: 'Cancelled',
          actionBy: user?.full_name || '',
          cancelReason: cancelTarget.reason,
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr);
      }

      setMyForms(prev => prev.map(w =>
        w.waiver_id === cancelTarget.waiverId ? { ...w, status: 'Cancelled' } : w
      ));
      setCancelTarget(null);
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const handleCreateNew = () => {
    isEditingRef.current = false;
    setRequestorEditMode(false);
    setApproverEditMode(false);
    setRejectedEditMode(false);
    setWaiverStatus(null);

    setWaiverId(generateWaiverId());

    setFormData({
      partNumber: '',
      revision: '',
      description: '',
      subcontractor: [],
      assemblyLevel: [],
      requestor: [''],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      waiverType: [],
      reason: '',
      workorder: '',
      workorderQty: '',
      currentPart: '',
      newPart: '',
      action: '',
      instructions: ''
    });

    setMaterialRows([{
      currentPart: '', currentPartDescription: '',
      noOfPer: '', refdes: '',
      newPart: '', newPartDescription: '',
      action: '', instructions: '', file: null
    }]);

    setOpenSection([]);
    setProcessData({ areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null });
    setTestData({ rows: [{ currentPart: '', toBePart: '', refdes: '' }], areas: [], areaInstructions: {}, areaFiles: {}, instructions: '', file: null });
    setSpecData({ specImpact: '', instructions: '', file1: null, file2: null });
    setReworkData({ instructions: '', file: null });
    setLabelData({ instructions: '', file: null });

    setShowForm(true);
  };


  const handleEditDraft = async (draft) => {
    isEditingRef.current = true;
    setShowForm(true);
    setWaiverId(draft.waiver_id);

    try {
      const data = await api.getDraftDetails(userId, draft.waiver_id);

      if (data?.formData) {
        setFormData(data.formData);
      }

      setMaterialRows(data.materialRows ?? [{
        currentPart: '', currentPartDescription: '',
        newPart: '', newPartDescription: '',
        action: '', instructions: '', file: null
      }]);

      setOpenSection(data.openSection ?? []);
      setProcessData(data.processData ?? { instructions: '', file: null });
      setTestData(data.testData ?? { currentPart: '', toBePart: '', instructions: '', file: null });
      setSpecData(data.specData ?? { specImpact: '', instructions: '', file1: null, file2: null });
      setReworkData(data.reworkData ?? { instructions: '', file: null });
      setLabelData(data.labelData ?? { instructions: '', file: null });

    } catch (err) {
      console.error('Failed to load draft for edit:', err);
    }
  };


  const handleDeleteDraft = async (waiverId) => {
    setDeleteConfirm(waiverId);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteWaiver(deleteConfirm);
      setDrafts(prev => prev.filter(d => d.waiver_id !== deleteConfirm));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };


  const handleBackToList = () => {
    setShowForm(false);
    fetchDrafts();
  };

  const handleEditMyForm = async (waiverId) => {
    setRequestorEditMode(true);
    isEditingRef.current = false;
    try {
      const data = await api.getWaiverDetails(waiverId);
      setWaiverId(waiverId);
      setFormData({
        waiverId,
        partNumber: data.partNumber || '',
        revision: data.revision || '',
        description: data.description || '',
        subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
        assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
        requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
        startDate: data.startDate ? data.startDate.toString().slice(0, 10) : new Date().toISOString().split('T')[0],
        endDate: data.endDate ? data.endDate.toString().slice(0, 10) : '',
        waiverType: data.waiverType || [],
        reason: data.reason || '',
        workorder: data.workorder || '',
        workorderQty: data.workorderQty || '',
        currentPart: '', newPart: '', action: '', instructions: ''
      });
      const sectionMap = {
        'Material Waiver': 'material', 'Process Waiver': 'process',
        'Test Waiver': 'test', 'Spec Deviation': 'spec',
        'Rework Waiver': 'rework', 'Label Waiver': 'label'
      };
      setOpenSection((data.waiverType || []).map(t => sectionMap[t]).filter(Boolean));
      setMaterialRows((data.materialRows || [{ currentPart: '', currentPartDescription: '', newPart: '', newPartDescription: '', action: '', instructions: '', file: null }]).map(r => ({
        currentPart: r.current_part || r.currentPart || '',
        currentPartDescription: r.current_part_description || r.currentPartDescription || '',
        noOfPer: r.no_of_per || r.noOfPer || '',
        refdes: r.refdes || '',
        newPart: r.new_part || r.newPart || '',
        newPartDescription: r.new_part_description || r.newPartDescription || '',
        action: r.action || '',
        instructions: r.instructions || '',
        file: r.file_path || r.file || null
      })));
      setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: data.processData?.file || null });
      setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: data.testData?.file || null });
      setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
      setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
      setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
      setWaiverStatus(data.status || null);
      setShowForm(true);
    } catch (err) {
      console.error('Failed to load waiver for edit:', err);
    }
  };


  const handleEditRejectedForm = async (waiverId) => {
    setRejectedEditMode(true);
    setRequestorEditMode(false);
    isEditingRef.current = false;
    try {
      const data = await api.getWaiverDetails(waiverId);
      setWaiverId(waiverId);
      setFormData({
        waiverId,
        partNumber: data.partNumber || '',
        revision: data.revision || '',
        description: data.description || '',
        subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
        assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
        requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
        startDate: data.startDate ? data.startDate.toString().slice(0, 10) : new Date().toISOString().split('T')[0],
        endDate: data.endDate ? data.endDate.toString().slice(0, 10) : '',
        waiverType: data.waiverType || [],
        reason: data.reason || '',
        workorder: data.workorder || '',
        workorderQty: data.workorderQty || '',
        currentPart: '', newPart: '', action: '', instructions: ''
      });
      const sectionMap = {
        'Material Waiver': 'material', 'Process Waiver': 'process',
        'Test Waiver': 'test', 'Spec Deviation': 'spec',
        'Rework Waiver': 'rework', 'Label Waiver': 'label'
      };
      setOpenSection((data.waiverType || []).map(t => sectionMap[t]).filter(Boolean));
      setMaterialRows((data.materialRows || [{ currentPart: '', currentPartDescription: '', newPart: '', newPartDescription: '', action: '', instructions: '', file: null }]).map(r => ({
        currentPart: r.current_part || r.currentPart || '',
        currentPartDescription: r.current_part_description || r.currentPartDescription || '',
        noOfPer: r.no_of_per || r.noOfPer || '',
        refdes: r.refdes || '',
        newPart: r.new_part || r.newPart || '',
        newPartDescription: r.new_part_description || r.newPartDescription || '',
        action: r.action || '',
        instructions: r.instructions || '',
        file: r.file_path || r.file || null
      })));
      setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: data.processData?.file || null });
      setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: data.testData?.file || null });
      setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
      setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
      setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
      setWaiverStatus(data.status || null);
      setShowForm(true);
    } catch (err) {
      console.error('Failed to load cancelled waiver for edit:', err);
    }
  };

  const handleReplaceClick = async (index) => {
    const updated = [...materialRows];

    const existingFile = updated[index].file;

    // 1. DELETE OLD FILE IMMEDIATELY
    if (existingFile) {
      try {
        await api.deleteDraftFile({ filePath: existingFile });
      } catch (err) {
        console.error("Failed to delete old file:", err);
      }
    }

    // 2. CLEAR UI STATE
    updated[index] = {
      ...updated[index],
      file: null
    };

    setMaterialRows(updated);
  };

  return (
    <div className="waiver-container">

      {!showForm ? (
        /* ── Tab landing page ── */
        <>
          {/* Header */}
          <div className="title-header">
            <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
          </div>
          {pageMessage && (
            <div className={`waiver-page-message ${pageMessage.type}`}>
              {pageMessage.text}
            </div>
          )}


          {/* Create button + Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 0 0' }}>
            <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #ddd' }}>
              {[
                { key: 'drafts', label: 'Drafts' },
                { key: 'myforms', label: 'All Forms' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'myforms') fetchMyForms();
                  }}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderBottom: activeTab === tab.key ? '3px solid #222' : '3px solid transparent',
                    color: activeTab === tab.key ? '#222' : '#888',
                    marginBottom: '-2px'
                  }}
                >
                  {tab.label}
                </button>
              ))}

            </div>

            <button
              className="submit-btn"
              style={{ marginTop: 0, width: 'auto', padding: '10px 24px', fontSize: '14px' }}
              onClick={handleCreateNew}
            >
              + Create New Waiver
            </button>
          </div>

          {/* ── Drafts Tab ── */}
          {activeTab === 'drafts' && (
            <div style={{ marginTop: '20px' }}>
              {draftsLoading ? (
                <p>Loading drafts...</p>
              ) : drafts.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px', color: '#aaa',
                  border: '1px dashed #ddd', borderRadius: '8px', marginTop: '16px'
                }}>
                  No drafts yet. Click <strong>+ Create New Waiver</strong> to start.
                </div>
              ) : (
                <table className="material-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Waiver ID</th>
                      <th>Product Part Number</th>
                      <th>Last Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((draft) => (
                      <tr key={draft.waiver_id}>
                        <td>{draft.waiver_id}</td>
                        <td>{draft.part_number || '-'}</td>
                        <td>
                          {draft.updated_at
                            ? new Date(draft.updated_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="add-btn"
                            onClick={() => handleEditDraft(draft)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            style={{ border: '1px solid #dc3545', padding: '4px 12px', borderRadius: '4px' }}
                            onClick={() => handleDeleteDraft(draft.waiver_id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── My Forms Tab ── */}
          {activeTab === 'myforms' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search by Waiver ID, Part Number, Description, Workorder, Subcontractor..."
                  value={myFormsSearch}
                  onChange={(e) => setMyFormsSearch(e.target.value)}
                  style={{
                    flex: 1, padding: '9px 14px',
                    border: '1px solid #ccc', borderRadius: '6px',
                    fontSize: '14px', boxSizing: 'border-box'
                  }}
                />
                <select
                  value={myFormsStatusFilter}
                  onChange={(e) => setMyFormsStatusFilter(e.target.value)}
                  style={{
                    padding: '9px 14px', border: '1px solid #ccc',
                    borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="New">New</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {myFormsLoading ? (
                <p>Loading...</p>
              ) : myForms.filter(w => {
                const q = myFormsSearch.toLowerCase();
                if (!q) return true;
                const subText = Array.isArray(w.subcontractor)
                  ? w.subcontractor.join(' ')
                  : typeof w.subcontractor === 'string'
                    ? w.subcontractor.replace(/[\[\]"\\]/g, ' ')
                    : '';
                const terms = q.split(/[\s,]+/).filter(Boolean);
                const matchesTerm = (t) =>
                  (w.waiver_id || '').toLowerCase().includes(t) ||
                  (w.part_number || '').toLowerCase().includes(t) ||
                  (w.description || '').toLowerCase().includes(t) ||
                  (w.workorder || '').toLowerCase().includes(t) ||
                  subText.toLowerCase().includes(t) ||
                  (w.reason || '').toLowerCase().includes(t);
                return terms.some(matchesTerm);
              }).length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px', color: '#aaa',
                  border: '1px dashed #ddd', borderRadius: '8px', marginTop: '16px'
                }}>
                  {myForms.length === 0 ? 'No forms found.' : 'No results match your search.'}
                </div>
              ) : (
                <table className="material-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Waiver ID</th>
                      <th>Product Part Number</th>
                      <th>Product Part Description</th>
                      <th>Revision</th>
                      <th>Reason / Justification</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Updated At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myForms
                      .filter(w => {
                        const q = myFormsSearch.toLowerCase();
                        const subText = Array.isArray(w.subcontractor)
                          ? w.subcontractor.join(' ')
                          : typeof w.subcontractor === 'string'
                            ? w.subcontractor.replace(/[\[\]"\\]/g, ' ')
                            : '';
                        const terms = q.split(/[\s,]+/).filter(Boolean);
                        const matchesTerm = (t) =>
                          (w.waiver_id || '').toLowerCase().includes(t) ||
                          (w.part_number || '').toLowerCase().includes(t) ||
                          (w.description || '').toLowerCase().includes(t) ||
                          (w.workorder || '').toLowerCase().includes(t) ||
                          subText.toLowerCase().includes(t) ||
                          (w.reason || '').toLowerCase().includes(t);
                        const matchSearch = !q || terms.some(matchesTerm);
                        const matchStatus = myFormsStatusFilter === 'all' ||
                          (w.status || 'New') === myFormsStatusFilter;
                        return matchSearch && matchStatus;
                      })
                      .map((w) => {
                        const status = w.status || 'New';
                        const statusColor = {
                          'New': { bg: '#e8f4fd', color: '#1a73e8' },
                          'Pending Approval': { bg: '#fff8e1', color: '#f57c00' },
                          'Approved': { bg: '#e8f5e9', color: '#2e7d32' },
                          'Cancelled': { bg: '#fff3e0', color: '#e65100' },
                          'Rejected': { bg: '#fdecea', color: '#c62828' },
                        }[status] || { bg: '#cfcfcf49', color: '#555' };
                        return (
                          <tr key={w.waiver_id}>
                            <td>
                              <span
                                className="wm-waiver-link"
                                onClick={() => navigate(`/waiver-view?id=${w.waiver_id}`)}
                              >
                                {w.waiver_id}
                              </span>
                            </td>
                            <td>{w.part_number || '-'}</td>
                            <td>{w.description || '-'}</td>
                            <td>{w.revision || '-'}</td>
                            <td>{w.reason || '-'}</td>
                            <td>
                              {(() => {
                                const cancelledBy = w.cancelled_by || '';
                                const cancelReason = w.cancel_reason || '';
                                const isApproverReject = status === 'Rejected' &&
                                  cancelledBy.toLowerCase().startsWith('approver:');
                                const isRequestorCancel = status === 'Cancelled' &&
                                  cancelledBy.toLowerCase().startsWith('requestor:');
                                const cancellerName = cancelledBy.includes(':')
                                  ? cancelledBy.split(':').slice(1).join(':').trim()
                                  : cancelledBy.trim();

                                let displayText = status;
                                if (status === 'Approved' && w.approved_by) displayText = `Approved by ${w.approved_by}`;
                                else if (isApproverReject) displayText = `Rejected by ${cancellerName}`;
                                else if (isRequestorCancel) displayText = 'Cancelled (by you)';
                                else if (status === 'Cancelled' && cancelledBy) displayText = `Cancelled by ${cancellerName}`;
                                else if (status === 'Rejected' && cancelledBy) displayText = `Rejected by ${cancellerName}`;

                                const isExpanded = expandedCancelReason === w.waiver_id;

                                return (
                                  <div>
                                    <span
                                      className="mf-status-badge"
                                      style={{ background: statusColor.bg, color: statusColor.color }}
                                    >
                                      {displayText}
                                    </span>
                                    {w.modified_by && (
                                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                        Modified by {w.modified_by}
                                      </div>
                                    )}
                                    {(status === 'Rejected' || status === 'Cancelled') && cancelReason && (
                                      <div>
                                        <span
                                          className="mf-cancel-toggle"
                                          onClick={() => setExpandedCancelReason(isExpanded ? null : w.waiver_id)}
                                        >
                                          {isExpanded ? 'Hide reason ▲' : 'View reason ▼'}
                                        </span>
                                        {isExpanded && (
                                          <div style={{
                                            marginTop: '4px',
                                            padding: '8px 12px',
                                            background: '#eeeeee',
                                            border: '1px solid #ccc',
                                            borderLeft: '3px solid #aaa',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            color: '#444',
                                            maxWidth: '220px',
                                            lineHeight: '1.5'
                                          }}>
                                            {cancelReason}
                                          </div>

                                        )}
                                      </div>
                                    )}
                                  </div>
                                );

                              })()}
                            </td>

                            <td style={{ fontSize: '13px', color: '#555', maxWidth: '180px' }}>
                              {w.cancelled_by && !w.cancelled_by.toLowerCase().startsWith('requestor:') && w.status === 'New' ? (
                                <div>
                                  <div style={{ fontWeight: 500, color: '#c62828' }}>
                                    Rejected by {w.cancelled_by.includes(':') ? w.cancelled_by.split(':').slice(1).join(':').trim() : w.cancelled_by}
                                  </div>
                                  {w.cancel_reason && (() => {
                                    const isExpanded = expandedCancelReason === w.waiver_id;
                                    return (
                                      <div>
                                        <span
                                          className="mf-cancel-toggle"
                                          onClick={() => setExpandedCancelReason(isExpanded ? null : w.waiver_id)}
                                        >
                                          {isExpanded ? 'Hide reason ▲' : 'View reason ▼'}
                                        </span>
                                        {isExpanded && (
                                          <div style={{
                                            marginTop: '4px', padding: '8px 12px',
                                            background: '#fdecea', border: '1px solid #f5c6cb',
                                            borderLeft: '3px solid #c62828', borderRadius: '4px',
                                            fontSize: '12px', color: '#444', lineHeight: '1.5'
                                          }}>
                                            {w.cancel_reason}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : '-'}
                            </td>

                            <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#555' }}>
                              {w.updated_at ? (() => {
                                const raw = w.updated_at;
                                let date;
                                if (typeof raw === 'string' && !raw.endsWith('Z') && !raw.includes('+')) {
                                  date = new Date(raw.replace(' ', 'T') + '+08:00');
                                } else {
                                  date = new Date(raw);
                                }
                                return isNaN(date) ? '-' : date.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                              })() : '-'}
                            </td>

                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {(status === 'New' || status === 'Pending Approval') && (
                                  <button
                                    className="add-btn"
                                    style={{ background: '#28a745', color: '#fff', border: '1px solid #28a745' }}
                                    onClick={() => handleEditMyForm(w.waiver_id)}
                                  >
                                    Edit
                                  </button>
                                )}
                                {status === 'Cancelled' && (
                                  <button
                                    className="add-btn"
                                    style={{ background: '#28a745', color: '#fff', border: '1px solid #28a745' }}
                                    onClick={() => handleEditMyForm(w.waiver_id)}
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  className="add-btn"
                                  onClick={() => handleDuplicate(w.waiver_id)}
                                >
                                  Duplicate
                                </button>
                                {status !== 'Cancelled' && status !== 'Rejected' && (
                                <button
                                  className="delete-btn"
                                  style={{ border: '1px solid #dc3545', padding: '4px 12px', borderRadius: '4px' }}
                                  onClick={() =>
                                    setCancelTarget(
                                      cancelTarget?.waiverId === w.waiver_id
                                        ? null
                                        : { waiverId: w.waiver_id, reason: '' }
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                                )}
                              </div>
                              {cancelTarget?.waiverId === w.waiver_id && (
                                <div style={{ marginTop: '8px' }}>
                                  <textarea
                                    rows={2}
                                    placeholder="Enter cancellation reason..."
                                    value={cancelTarget.reason}
                                    onChange={(e) => setCancelTarget({ ...cancelTarget, reason: e.target.value })}
                                    style={{
                                      width: '100%', padding: '6px 10px', fontSize: '13px',
                                      border: '1px solid #ccc', borderRadius: '4px',
                                      resize: 'vertical', boxSizing: 'border-box'
                                    }}
                                  />
                                  <button
                                    className="delete-btn"
                                    style={{
                                      marginTop: '4px', border: '1px solid #dc3545',
                                      padding: '4px 12px', borderRadius: '4px',
                                      opacity: !cancelTarget.reason.trim() ? 0.5 : 1,
                                      cursor: !cancelTarget.reason.trim() ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={!cancelTarget.reason.trim()}
                                    onClick={() => setShowCancelConfirm(true)}
                                  >
                                    Confirm Cancel
                                  </button>

                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                  </tbody>

                </table>
              )}
            </div>
          )}


        </>

      ) : (
        /* ── Form view ── */
        <>
          {/* Back button */}
          {emailSentBanner && (
            <div style={{
              position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
              background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724',
              borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '280px'
            }}>
              <span>&#10003; {emailSentBanner}</span>
              <button
                onClick={() => setEmailSentBanner(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#155724', fontSize: '16px', marginLeft: 'auto' }}
              >&#x2715;</button>
            </div>
          )}
          <div className="title-header">
            <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
            <button
              type="button"
              onClick={
                approverEditMode ? () => navigate(-1) :
                  (requestorEditMode || rejectedEditMode) ? () => { setShowForm(false); setActiveTab('myforms'); fetchMyForms(); setRejectedEditMode(false); } :
                    handleBackToList
              }
              style={{
                padding: '8px 16px', cursor: 'pointer',
                background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px',
                fontSize: '13px', fontWeight: 500
              }}
            >
              {approverEditMode ? '← Back to Management' : (requestorEditMode || rejectedEditMode) ? '← Back to All Forms' : '← Back to Drafts'}
            </button>
            {waiverStatus && (
              <span style={{
                padding: '5px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                background: { 'New': '#e8f4fd', 'Approved': '#e8f5e9', 'Cancelled': '#fff3e0', 'Rejected': '#fdecea', 'Closed': '#f0f0f0' }[waiverStatus] || '#f0f0f0',
                color: { 'New': '#1a73e8', 'Approved': '#2e7d32', 'Cancelled': '#e65100', 'Rejected': '#c62828', 'Closed': '#555' }[waiverStatus] || '#555',
                border: '1px solid currentColor'
              }}>
                {waiverStatus}
              </span>
            )}
          </div>

          {/* ── PASTE YOUR ENTIRE EXISTING <form>...</form> BLOCK HERE ── */}
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
              <span style={{ color: '#dc3545', fontWeight: 700 }}>*</span> indicates required fields
            </p>
            {/* Product Info */}
            <div className="form-section">
              <div className="waiver-id-row">
                <span className="waiver-label">Waiver ID:</span>
                <span className="waiver-value">{formData.waiverId}</span>
              </div>

              <div className="field-inline">
                <label>AMD Product Part Number: <span style={{ color: '#dc3545' }}>*</span></label>
                <input name="partNumber" value={formData.partNumber || ""} onChange={handleChange} />
              </div>

              <div className="field-inline">
                <label>AMD Product Revision: <span style={{ color: '#dc3545' }}>*</span></label>
                <input name="revision" value={formData.revision || ""} onChange={handleChange} />
              </div>

              <div className="field-inline">
                <label>AMD Product Description: <span style={{ color: '#dc3545' }}>*</span></label>
                <input name="description" value={formData.description || ""} onChange={handleChange} />
              </div>

            </div>

            {/* Subcontractor */}
            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Affected Subcontractor <span style={{ color: '#dc3545' }}>*</span></label>
                <MultiSelectDropdown
                  options={subcontractors}
                  value={Array.isArray(formData.subcontractor) ? formData.subcontractor : formData.subcontractor ? [formData.subcontractor] : []}
                  onChange={(selected) => setFormData(prev => ({ ...prev, subcontractor: selected }))}
                  placeholder="Select subcontractor..."
                />
              </div>
            </div>

            {/* Assembly */}
            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Assembly Level <span style={{ color: '#dc3545' }}>*</span></label>
                <MultiSelectDropdown
                  options={assemblyLevels}
                  value={Array.isArray(formData.assemblyLevel) ? formData.assemblyLevel : formData.assemblyLevel ? [formData.assemblyLevel] : []}
                  onChange={(selected) => setFormData(prev => ({ ...prev, assemblyLevel: selected }))}
                  placeholder="Select assembly level..."
                />
              </div>
            </div>

            {/* Requestor */}
            <div className="form-section">
              <label>Requestor Name: <span style={{ color: '#dc3545' }}>*</span></label>
              {(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor || '']).map((val, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                  <RequestorInput
                    value={val || ''}
                    onChange={(v) => {
                      const updated = [...(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor || ''])];
                      updated[idx] = v;
                      setFormData(prev => ({ ...prev, requestor: updated }));
                    }}
                  />
                  {requestorEditMode && val?.trim() && (
                    <button
                      type="button"
                      title={`Send email to ${val}`}
                      onClick={async () => {
                        setSendingEmailIdx(idx);
                        try {
                          await api.sendRequestorNotification({
                            waiverId,
                            partNumber: formData.partNumber,
                            description: formData.description,
                            revision: formData.revision,
                            assemblyLevel: formData.assemblyLevel,
                            reason: formData.reason,
                            submittedBy: user?.full_name || user?.email || '',
                            requestors: [val],
                          });
                          clearTimeout(emailBannerTimer.current);
                          setEmailSentBanner(`Email sent to ${val}`);
                          emailBannerTimer.current = setTimeout(() => setEmailSentBanner(null), 4000);
                        } catch {
                          setEmailSentBanner('Failed to send email.');
                        } finally {
                          setSendingEmailIdx(null);
                        }
                      }}
                      disabled={sendingEmailIdx === idx}
                      style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: sendingEmailIdx === idx ? 'not-allowed' : 'pointer', flexShrink: 0, fontSize: '12px', opacity: sendingEmailIdx === idx ? 0.7 : 1 }}
                    >{sendingEmailIdx === idx ? 'Sending...' : '✉ Send'}</button>
                  )}
                  {(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor]).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor]).filter((_, i) => i !== idx);
                        setFormData(prev => ({ ...prev, requestor: updated }));
                      }}
                      style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, requestor: [...(Array.isArray(prev.requestor) ? prev.requestor : [prev.requestor || '']), ''] }))}
                style={{ background: 'none', border: '1px dashed #aaa', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', color: '#555', fontSize: '12px', marginTop: '4px' }}
              >+ Add Requestor</button>
            </div>

            {/* Dates */}
            <div className="form-section">
              <div className="field-inline">
                <label>Waiver Start Date <span style={{ color: '#dc3545' }}>*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Waiver Type */}
            <div className="form-section">
              <label>Waiver Type <span style={{ color: '#dc3545' }}>*</span></label>
              {[
                "Material Waiver",
                "Process Waiver",
                "Test Waiver",
              ].map((item) => (
                <label key={item} style={{ width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    name="waiverType"
                    value={item}
                    checked={formData.waiverType.includes(item)}
                    onChange={handleChange}
                  />
                  {item}
                </label>
              ))}
            </div>

            {/* Reason */}
            <div className="form-section">
              <div className="field-inline">
                <label>Reason / Justification <span style={{ color: '#dc3545' }}>*</span></label>
                <textarea name="reason" value={formData.reason || ""} onChange={handleChange}></textarea>
              </div>
            </div>

            {/* Workorder */}
            <div className="form-section-row">
              <div className="field-inline">
                <label>Workorder:</label>
                <input name="workorder" value={formData.workorder || ""} onChange={handleChange} />
              </div>

              <div className="field-inline">
                <label>Workorder Qty:</label>
                <input type="number" name="workorderQty" value={formData.workorderQty || ""} onChange={handleChange} />
              </div>
            </div>

            {/* Material Waiver Section */}
            <div className="accordion">
              <div className="accordion-header">
                Material Waiver Details
              </div>


              {openSection.includes("material") && (
                <div className="accordion-body">

                  <div className="table-wrapper">
                    <table className="material-table">
                      <thead>
                        <tr>
                          <th>Current Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                          <th>Description</th>
                          <th>No. of Per</th>
                          <th>Refdes</th>
                          <th>To Be Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                          <th>Description</th>
                          <th>Action</th>
                          <th>Attachment</th>
                          <th></th>
                        </tr>
                      </thead>

                      <tbody>
                        {materialRows.map((row, index) => (
                          <React.Fragment key={index}>
                          <tr>

                            <td>
                              <input
                                className="table-input"
                                placeholder="Current Part No"
                                value={row.currentPart || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "currentPart", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <textarea
                                className="table-textarea small"
                                placeholder="Description"
                                value={row.currentPartDescription || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "currentPartDescription", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <input
                                className="table-input"
                                placeholder="Qty"
                                value={row.noOfPer || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "noOfPer", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <textarea
                                className="table-textarea small"
                                placeholder="Refdes"
                                value={row.refdes || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "refdes", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <input
                                className="table-input"
                                placeholder="To Be Part No"
                                value={row.newPart || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "newPart", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <textarea
                                className="table-textarea small"
                                placeholder="Description"
                                value={row.newPartDescription || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "newPartDescription", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <select
                                className="table-select"
                                value={row.action || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "action", e.target.value)
                                }
                              >
                                <option value="">Select</option>
                                {materialActions.map((action) => (
                                  <option key={action} value={action}>{action}</option>
                                ))}

                              </select>
                            </td>

                            <td>
                              <div className="file-upload">

                                {/* If NO file → show upload */}
                                {!row.file ? (
                                  <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                                    onChange={(e) =>
                                      handleMaterialFileChange(index, e.target.files[0])
                                    }
                                  />
                                ) : (
                                  /* If file exists → show filename + actions */
                                  <div className="file-preview">
                                    <a
                                      href={toFileUrl(row.file)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="file-link"
                                    >
                                      {row.file.split("/").pop()}
                                    </a>

                                    <button
                                      type="button"
                                      className="replace-btn"
                                      onClick={() => {
                                        handleReplaceClick(index)
                                      }}
                                    >
                                      Replace
                                    </button>

                                  </div>
                                )}

                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => removeMaterialRow(index)}
                              >
                                ✕
                              </button>
                            </td>

                          </tr>
                          <tr>
                            <td colSpan="9" style={{ paddingTop: '4px', paddingBottom: '8px', background: '#fafafa' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <label style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: '13px', paddingTop: '6px', minWidth: '80px' }}>
                                  Instructions <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <textarea
                                  className="table-textarea"
                                  placeholder="Instructions..."
                                  value={row.instructions || ""}
                                  onChange={(e) => handleMaterialChange(index, "instructions", e.target.value)}
                                  style={{ flex: 1, minHeight: '60px' }}
                                />
                              </div>
                            </td>
                          </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-actions">
                    <button type="button" className="add-btn" onClick={addMaterialRow}>
                      + Add Row
                    </button>
                  </div>


                </div>
              )}
            </div>

            {/* Process Waiver Section */}
            <div className="accordion">
              <div
                className="accordion-header"
              >
                Process Waiver Details
              </div>

              {openSection.includes("process") && (
                <div className="accordion-body">

                  {/* Area multi-select */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Area <span style={{ color: '#dc3545' }}>*</span></label>
                    <MultiSelectDropdown
                      options={PROCESS_AREAS}
                      value={processData.areas || []}
                      onChange={(selected) => {
                        const newAreaInstructions = { ...processData.areaInstructions };
                        // remove deselected
                        Object.keys(newAreaInstructions).forEach(k => { if (!selected.includes(k)) delete newAreaInstructions[k]; });
                        setProcessData({ ...processData, areas: selected, areaInstructions: newAreaInstructions });
                      }}
                      placeholder="Select area(s)..."
                    />
                  </div>

                  {/* Per-area instructions + file */}
                  {(processData.areas || []).map(area => (
                    <div key={area} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
                        Instructions ({area}) <span style={{ color: '#dc3545' }}>*</span>
                      </label>
                      <textarea
                        value={processData.areaInstructions?.[area] || ''}
                        onChange={(e) => setProcessData({
                          ...processData,
                          areaInstructions: { ...processData.areaInstructions, [area]: e.target.value }
                        })}
                        placeholder={`Instructions for ${area}...`}
                        style={{ width: '100%', minHeight: '70px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
                      />
                      <div className="file-upload">
                        {!processData.areaFiles?.[area] ? (
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append('file', file);
                              try {
                                const res = await api.uploadDraft(fd);
                                setProcessData(prev => ({
                                  ...prev,
                                  areaFiles: { ...prev.areaFiles, [area]: res.filePath }
                                }));
                              } catch (err) { console.error('Upload failed:', err); }
                            }}
                          />
                        ) : (
                          <div className="file-preview">
                            <a href={toFileUrl(processData.areaFiles[area])} target="_blank" rel="noreferrer" className="file-link">
                              {processData.areaFiles[area].split('/').pop()}
                            </a>
                            <button
                              type="button"
                              className="replace-btn"
                              onClick={async () => {
                                try { await api.deleteDraftFile({ filePath: processData.areaFiles[area] }); } catch {}
                                setProcessData(prev => ({
                                  ...prev,
                                  areaFiles: { ...prev.areaFiles, [area]: null }
                                }));
                              }}
                            >Replace</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="file-upload" style={{ display: 'none' }}>
                    {!processData.file ? (
                      <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" onChange={(e) => handleFileChange(e.target.files[0], processData, setProcessData)} />
                    ) : (
                      <div className="file-preview">
                        <a href={toFileUrl(processData.file)} target="_blank" rel="noreferrer" className="file-link">
                          {processData.file.split("/").pop()}
                        </a>
                        <button type="button" className="replace-btn" onClick={() => handleReplace(processData, setProcessData)}>Replace</button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>


            {/* test Waiver Section */}
            <div className="accordion">
              <div
                className="accordion-header"
              >
                Test Waiver Details
              </div>

              {openSection.includes("test") && (
                <div className="accordion-body">

                  {/* Parts table */}
                  <div className="table-wrapper" style={{ marginBottom: '16px' }}>
                    <table className="material-table">
                      <thead>
                        <tr>
                          <th>Current Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                          <th>To Be Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                          <th>Refdes</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(testData.rows || []).map((row, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                className="table-input"
                                placeholder="Current Part No"
                                value={row.currentPart || ''}
                                onChange={(e) => {
                                  const rows = [...testData.rows];
                                  rows[idx] = { ...rows[idx], currentPart: e.target.value };
                                  setTestData({ ...testData, rows });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                className="table-input"
                                placeholder="To Be Part No"
                                value={row.toBePart || ''}
                                onChange={(e) => {
                                  const rows = [...testData.rows];
                                  rows[idx] = { ...rows[idx], toBePart: e.target.value };
                                  setTestData({ ...testData, rows });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                className="table-input"
                                placeholder="Refdes"
                                value={row.refdes || ''}
                                onChange={(e) => {
                                  const rows = [...testData.rows];
                                  rows[idx] = { ...rows[idx], refdes: e.target.value };
                                  setTestData({ ...testData, rows });
                                }}
                              />
                            </td>
                            <td>
                              {testData.rows.length > 1 && (
                                <button type="button" className="delete-btn"
                                  onClick={() => setTestData({ ...testData, rows: testData.rows.filter((_, i) => i !== idx) })}
                                >✕</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="table-actions">
                      <button type="button" className="add-btn"
                        onClick={() => setTestData({ ...testData, rows: [...(testData.rows || []), { currentPart: '', toBePart: '', refdes: '' }] })}
                      >+ Add Row</button>
                    </div>
                  </div>

                  {/* Area multi-select */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Area <span style={{ color: '#dc3545' }}>*</span></label>
                    <MultiSelectDropdown
                      options={TEST_AREAS}
                      value={testData.areas || []}
                      onChange={(selected) => {
                        const newAreaInstructions = { ...testData.areaInstructions };
                        const newAreaFiles = { ...testData.areaFiles };
                        Object.keys(newAreaInstructions).forEach(k => { if (!selected.includes(k)) delete newAreaInstructions[k]; });
                        Object.keys(newAreaFiles).forEach(k => { if (!selected.includes(k)) delete newAreaFiles[k]; });
                        setTestData({ ...testData, areas: selected, areaInstructions: newAreaInstructions, areaFiles: newAreaFiles });
                      }}
                      placeholder="Select area(s)..."
                    />
                  </div>

                  {/* Per-area instructions + file */}
                  {(testData.areas || []).map(area => (
                    <div key={area} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
                        Instructions ({area}) <span style={{ color: '#dc3545' }}>*</span>
                      </label>
                      <textarea
                        value={testData.areaInstructions?.[area] || ''}
                        onChange={(e) => setTestData({ ...testData, areaInstructions: { ...testData.areaInstructions, [area]: e.target.value } })}
                        placeholder={`Instructions for ${area}...`}
                        style={{ width: '100%', minHeight: '70px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
                      />
                      <div className="file-upload">
                        {!testData.areaFiles?.[area] ? (
                          <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" onChange={async (e) => {
                            const file = e.target.files[0]; if (!file) return;
                            const fd = new FormData(); fd.append('file', file);
                            try {
                              const res = await api.uploadDraft(fd);
                              setTestData(prev => ({ ...prev, areaFiles: { ...prev.areaFiles, [area]: res.filePath } }));
                            } catch (err) { console.error('Upload failed:', err); }
                          }} />
                        ) : (
                          <div className="file-preview">
                            <a href={toFileUrl(testData.areaFiles[area])} target="_blank" rel="noreferrer" className="file-link">
                              {testData.areaFiles[area].split('/').pop()}
                            </a>
                            <button type="button" className="replace-btn" onClick={async () => {
                              try { await api.deleteDraftFile({ filePath: testData.areaFiles[area] }); } catch {}
                              setTestData(prev => ({ ...prev, areaFiles: { ...prev.areaFiles, [area]: null } }));
                            }}>Replace</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>





            {/* Submit message */}
            {submitMessage && (
              <div className={`alert ${submitMessage.type}`} style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '6px',
                whiteSpace: 'pre-line',
                background: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: submitMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {submitMessage.text}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting
                ? (requestorEditMode && waiverStatus === 'Pending Approval' ? 'Updating...' : !requestorEditMode && !rejectedEditMode && !approverEditMode ? 'Creating...' : 'Submitting...')
                : (requestorEditMode && waiverStatus === 'Pending Approval' ? 'UPDATE' : !requestorEditMode && !rejectedEditMode && !approverEditMode ? 'Create Form' : 'SUBMIT')}
            </button>



          </form>
        </>
      )}
      {showCancelConfirm && (
        <div className="waiver-modal-overlay">
          <div className="waiver-modal">
            <h3>Cancel Waiver</h3>
            <p>Confirm cancel — <strong>this action cannot be undone.</strong></p>
            <div className="waiver-modal-actions">
              <button
                className="waiver-modal-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Go Back
              </button>
              <button
                className="waiver-modal-delete"
                onClick={() => { setShowCancelConfirm(false); handleCancelForm(); }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div className="waiver-modal-overlay">
          <div className="waiver-modal">
            <h3>Delete Draft</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm}</strong>?
              This action cannot be undone.
            </p>
            <div className="waiver-modal-actions">
              <button className="waiver-modal-cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="waiver-modal-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};

export default WaiverForm;