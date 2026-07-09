import React, { useState, useEffect, useRef } from "react";
import "../../assets/css/waiver.css";
import api from "../../services/api";
import { getAllConfig } from './waiverConfig';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { parseMaterialWaiverExcel, downloadMaterialWaiverTemplate } from './materialWaiverImport';
import VersionHistoryModal from './VersionHistoryModal';
import MaterialWaiverSection from './MaterialWaiverSection';
import ProcessWaiverSection from './ProcessWaiverSection';
import TestWaiverSection from './TestWaiverSection';
import DraftsTab from './DraftsTab';
import MyFormsTab from './MyFormsTab';
import WaiverFormView from './WaiverFormView';

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
  const [historyModal, setHistoryModal] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [subcontractors, setSubcontractors] = useState([]);
  const [assemblyLevels, setAssemblyLevels] = useState([]);
  const [materialActions, setMaterialActions] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds waiverId to delete
  const [pageMessage, setPageMessage] = useState(null);

  const isEditingRef = React.useRef(false);
  const hasUserEditedRef = React.useRef(false);
  const [approverEditMode, setApproverEditMode] = useState(false);
  const [requestorEditMode, setRequestorEditMode] = useState(false);
  const [rejectedEditMode, setRejectedEditMode] = useState(false);
  const [approverAmendMode, setApproverAmendMode] = useState(false);
  const [amendFromAllForms, setAmendFromAllForms] = useState(false);
  const [parentWaiverId, setParentWaiverId] = useState(null);


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
          requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
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
          requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
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

  // Approver amend: detect ?approverAmend=true&id=ORIGINAL_ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('approverAmend') !== 'true') return;
    const originalId = params.get('id');
    if (!originalId) return;

    setApproverAmendMode(true);
    setAmendFromAllForms(false);
    setParentWaiverId(originalId);
    isEditingRef.current = false;
    const toDate = (v) => v ? v.toString().slice(0, 10) : '';

    (async () => {
      try {
        const data = await api.getWaiverDetails(originalId);
        // Keep original ID during editing; new -B ID assigned at submit
        setWaiverId(originalId);
        setFormData({
          waiverId: originalId,
          partNumber: data.partNumber || '',
          revision: data.revision || '',
          description: data.description || '',
          subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
          assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
          requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
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
        setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: {}, instructions: data.processData?.instructions || '', file: null });
        setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: {}, instructions: data.testData?.instructions || '', file: null });
        setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: null, file2: null });
        setReworkData({ instructions: data.reworkData?.instructions || '', file: null });
        setLabelData({ instructions: data.labelData?.instructions || '', file: null });
        setWaiverStatus('New');
        setShowForm(true);
      } catch (err) {
        console.error('Failed to load waiver for amend:', err);
      }
    })();
  }, []); // run once on mount


  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('drafts');  // 'drafts' | 'myforms'
  const [showForm, setShowForm] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [autoSaveBanner, setAutoSaveBanner] = useState(false);
  const autoSaveBannerTimer = useRef(null);

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
    if (requestorEditMode || approverEditMode || rejectedEditMode || approverAmendMode) return;

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
        clearTimeout(autoSaveBannerTimer.current);
        setAutoSaveBanner(true);
        autoSaveBannerTimer.current = setTimeout(() => setAutoSaveBanner(false), 2000);
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
    if ((!requestorEditMode && !rejectedEditMode) || approverAmendMode || !waiverId || !formData.partNumber) return;

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
        clearTimeout(autoSaveBannerTimer.current);
        setAutoSaveBanner(true);
        autoSaveBannerTimer.current = setTimeout(() => setAutoSaveBanner(false), 2000);
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
    setOpenSection(prev => {
      const arr = Array.isArray(prev) ? prev : (prev ? [prev] : []);
      return arr.includes(section) ? arr.filter(s => s !== section) : [...arr, section];
    });
  };

  const addMaterialRow = () => {
    setMaterialRows([
      ...materialRows,
      { currentPart: "", newPart: "", actions: [], instructions: "" }
    ]);
  };

  const handleMaterialImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    parseMaterialWaiverExcel(file, setMaterialRows);
    e.target.value = '';
  };

  const materialImportRef = useRef(null);

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
      setSubmitMessage({ type: 'error', text: `Waiver unable to submit due to the following required fields not filled:\n• ${errors.join('\n• ')}\n\nNote: Edited fields will be saved automatically.` });
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

      // Approver amending an approved waiver — creates new version as New, notifies requestors
      if (approverAmendMode) {
        // Compute the next amendment ID (e.g. WV26700-A → WV26700-B) at submit time
        const match = parentWaiverId.match(/^(WV\d+)-([A-Z]+)$/);
        const nextChar = match
          ? String.fromCharCode(match[2].charCodeAt(match[2].length - 1) + 1)
          : 'B';
        const amendId = match ? `${match[1]}-${nextChar}` : `${parentWaiverId}-B`;
        await api.submitWaiver({ ...payload, waiverId: amendId, status: 'New', parentWaiverId });

        const requestorList = Array.isArray(formData.requestor)
          ? formData.requestor.filter(Boolean)
          : formData.requestor ? [formData.requestor] : [];

        try {
          await api.sendRequestorNotification({
            waiverId: amendId,
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

        setApproverAmendMode(false);
        setAmendFromAllForms(false);
        setShowForm(false);
        setActiveTab('myforms');
        fetchMyForms();
        setPageMessage({ type: 'success', text: `Waiver ${amendId} created and requestors have been notified.` });
        setTimeout(() => setPageMessage(null), 5000);
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
      // Hide older versions — if a waiver is a parent of another, it has been superseded
      const parentIds = new Set(data.map(w => w.parent_waiver_id).filter(Boolean));
      setMyForms(data.filter(w => !parentIds.has(w.waiver_id)));
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
        w.waiver_id === cancelTarget.waiverId
          ? { ...w, status: 'Cancelled', cancel_reason: cancelTarget.reason, cancelled_by: `Requestor: ${user?.full_name || ''}` }
          : w
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


  const handleEditApprovedMyForm = async (waiverId) => {
    setApproverAmendMode(true);
    setAmendFromAllForms(true);
    setRequestorEditMode(false);
    setApproverEditMode(false);
    setRejectedEditMode(false);
    setParentWaiverId(waiverId);
    isEditingRef.current = false;
    try {
      const data = await api.getWaiverDetails(waiverId);
      const toDate = (v) => v ? v.toString().slice(0, 10) : '';
      setWaiverId(waiverId);
      setFormData({
        waiverId,
        partNumber: data.partNumber || '',
        revision: data.revision || '',
        description: data.description || '',
        subcontractor: Array.isArray(data.subcontractor) ? data.subcontractor : data.subcontractor ? [data.subcontractor] : [],
        assemblyLevel: Array.isArray(data.assemblyLevel) ? data.assemblyLevel : data.assemblyLevel ? [data.assemblyLevel] : [],
        requestor: (() => { try { const p = JSON.parse(data.requestor); return Array.isArray(p) ? p : [String(p)]; } catch { return data.requestor ? [data.requestor] : ['']; } })(),
        startDate: toDate(data.startDate) || new Date().toISOString().split('T')[0],
        endDate: toDate(data.endDate),
        waiverType: data.waiverType || [],
        reason: data.reason || '',
        workorder: data.workorder || '',
        workorderQty: data.workorderQty || '',
        currentPart: '', newPart: '', action: '', instructions: ''
      });
      const sectionMap = { 'Material Waiver': 'material', 'Process Waiver': 'process', 'Test Waiver': 'test', 'Spec Deviation': 'spec', 'Rework Waiver': 'rework', 'Label Waiver': 'label' };
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
        file: r.file_path || r.file || null
      })));
      setProcessData({ areas: data.processData?.areas || [], areaInstructions: data.processData?.areaInstructions || {}, areaFiles: data.processData?.areaFiles || {}, instructions: data.processData?.instructions || '', file: data.processData?.file || null });
      setTestData({ rows: data.testData?.rows || [{ currentPart: '', toBePart: '', refdes: '' }], areas: data.testData?.areas || [], areaInstructions: data.testData?.areaInstructions || {}, areaFiles: data.testData?.areaFiles || {}, instructions: data.testData?.instructions || '', file: null });
      setWaiverStatus('Approved');
      setShowForm(true);
    } catch (err) {
      console.error('Failed to load approved waiver for edit:', err);
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
            <DraftsTab
              draftsLoading={draftsLoading}
              drafts={drafts}
              handleEditDraft={handleEditDraft}
              handleDeleteDraft={handleDeleteDraft}
            />
          )}

          {/* ── My Forms Tab ── */}
          {activeTab === 'myforms' && (
            <MyFormsTab
              myFormsLoading={myFormsLoading}
              myForms={myForms}
              myFormsSearch={myFormsSearch}
              setMyFormsSearch={setMyFormsSearch}
              myFormsStatusFilter={myFormsStatusFilter}
              setMyFormsStatusFilter={setMyFormsStatusFilter}
              expandedCancelReason={expandedCancelReason}
              setExpandedCancelReason={setExpandedCancelReason}
              cancelTarget={cancelTarget}
              setCancelTarget={setCancelTarget}
              setShowCancelConfirm={setShowCancelConfirm}
              setHistoryModal={setHistoryModal}
              handleEditMyForm={handleEditMyForm}
              handleEditApprovedMyForm={handleEditApprovedMyForm}
              handleDuplicate={handleDuplicate}
              navigate={navigate}
            />
          )}


        </>

      ) : (
        /* ── Form view ── */
        <WaiverFormView
          autoSaveBanner={autoSaveBanner}
          emailSentBanner={emailSentBanner}
          setEmailSentBanner={setEmailSentBanner}
          approverEditMode={approverEditMode}
          approverAmendMode={approverAmendMode}
          amendFromAllForms={amendFromAllForms}
          requestorEditMode={requestorEditMode}
          rejectedEditMode={rejectedEditMode}
          navigate={navigate}
          setShowForm={setShowForm}
          setActiveTab={setActiveTab}
          fetchMyForms={fetchMyForms}
          setRejectedEditMode={setRejectedEditMode}
          handleBackToList={handleBackToList}
          waiverStatus={waiverStatus}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          subcontractors={subcontractors}
          assemblyLevels={assemblyLevels}
          waiverId={waiverId}
          sendingEmailIdx={sendingEmailIdx}
          setSendingEmailIdx={setSendingEmailIdx}
          emailBannerTimer={emailBannerTimer}
          openSection={openSection}
          toggleSection={toggleSection}
          materialRows={materialRows}
          materialActions={materialActions}
          materialImportRef={materialImportRef}
          handleMaterialChange={handleMaterialChange}
          handleMaterialFileChange={handleMaterialFileChange}
          handleMaterialImport={handleMaterialImport}
          handleReplaceClick={handleReplaceClick}
          removeMaterialRow={removeMaterialRow}
          addMaterialRow={addMaterialRow}
          toFileUrl={toFileUrl}
          processData={processData}
          setProcessData={setProcessData}
          PROCESS_AREAS={PROCESS_AREAS}
          handleFileChange={handleFileChange}
          handleReplace={handleReplace}
          testData={testData}
          setTestData={setTestData}
          TEST_AREAS={TEST_AREAS}
          submitMessage={submitMessage}
          submitting={submitting}
        />
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

      {/* Version History Modal */}
      <VersionHistoryModal historyModal={historyModal} onClose={() => setHistoryModal(null)} />
    </div>
  );

};

export default WaiverForm;