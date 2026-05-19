import React, { useState, useEffect } from "react";
import "../../assets/css/waiver.css";
import api from "../../services/api";
import { getAllConfig } from './waiverConfig';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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

        setProcessData(data.processData ?? { instructions: "", file: null });
        setTestData(data.testData ?? { currentPart: "", toBePart: "", instructions: "", file: null });
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
          subcontractor: data.subcontractor || '',
          assemblyLevel: data.assemblyLevel || '',
          requestor: data.requestor || '',
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
          newPart: r.new_part || r.newPart || '',
          newPartDescription: r.new_part_description || r.newPartDescription || '',
          action: r.action || '',
          instructions: r.instructions || '',
          file: r.file || null
        })));
        setProcessData({ instructions: data.processData?.instructions || '', file: data.processData?.file || null });
        setTestData({ currentPart: data.testData?.currentPart || '', toBePart: data.testData?.toBePart || '', instructions: data.testData?.instructions || '', file: data.testData?.file || null });
        setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
        setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
        setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
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
          subcontractor: data.subcontractor || '',
          assemblyLevel: data.assemblyLevel || '',
          requestor: data.requestor || '',
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
          newPart: r.new_part || r.newPart || '',
          newPartDescription: r.new_part_description || r.newPartDescription || '',
          action: r.action || '',
          instructions: r.instructions || '',
          file: r.file || null
        })));
        setProcessData({ instructions: data.processData?.instructions || '', file: data.processData?.file || null });
        setTestData({ currentPart: data.testData?.currentPart || '', toBePart: data.testData?.toBePart || '', instructions: data.testData?.instructions || '', file: data.testData?.file || null });
        setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
        setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
        setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
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
      newPart: "",
      newPartDescription: "",
      action: "",
      instructions: "",
      file: ""
    }
  ]);

  const [processData, setProcessData] = useState({
    instructions: "",
    file: null
  });

  const [testData, setTestData] = useState({
    currentPart: "",
    toBePart: "",
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
    if (!formData.subcontractor) errors.push('Affected Subcontractor');
    if (!formData.assemblyLevel) errors.push('Assembly Level');
    if (!formData.requestor?.trim()) errors.push('Requestor Name');
    if (!formData.startDate) errors.push('Waiver Start Date');
    if (activeTypes.length === 0) errors.push('Waiver Type (at least one)');
    if (!formData.reason?.trim()) errors.push('Reason / Justification');

    // Section-specific required fields
    if (activeTypes.includes('Material Waiver')) {
      const hasValidRow = materialRows.some(r => r.currentPart?.trim() || r.newPart?.trim());
      if (!hasValidRow) errors.push('Material Waiver: at least one row with Current or New Part');
    }
    if (activeTypes.includes('Process Waiver') && !processData.instructions?.trim())
      errors.push('Process Waiver: Instructions');
    if (activeTypes.includes('Test Waiver')) {
      if (!testData.currentPart?.trim()) errors.push('Test Waiver: Current Part Number');
      if (!testData.toBePart?.trim()) errors.push('Test Waiver: To Be Part Number');
      if (!testData.instructions?.trim()) errors.push('Test Waiver: Instructions');
    }
    if (activeTypes.includes('Spec Deviation')) {
      if (!specData.specImpact?.trim()) errors.push('Spec Deviation: Specifications/Drawings impacted');
      if (!specData.instructions?.trim()) errors.push('Spec Deviation: Instructions');
    }
    if (activeTypes.includes('Rework Waiver') && !reworkData.instructions?.trim())
      errors.push('Rework Waiver: Instructions');
    if (activeTypes.includes('Label Waiver') && !labelData.instructions?.trim())
      errors.push('Label Waiver: Instructions');

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
        requestor: formData.requestor,
        startDate: formData.startDate,
        endDate: formData.endDate,
        waiverType: activeTypes,
        reason: formData.reason,
        workorder: formData.workorder,
        workorderQty: formData.workorderQty,
        submittedBy: user?.full_name || user?.email || '',
        materialRows: activeTypes.includes('Material Waiver') ? materialRows : [],
        processData: activeTypes.includes('Process Waiver') ? processData : { instructions: '', file: null },
        testData: activeTypes.includes('Test Waiver') ? testData : { currentPart: '', toBePart: '', instructions: '', file: null },
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

      // Requestor editing their own New waiver from My Forms tab
      if (requestorEditMode) {
        await api.submitWaiver(payload); // ON DUPLICATE KEY UPDATE preserves status & modified_by
        setShowForm(false);
        setActiveTab('myforms');
        fetchMyForms();
        setPageMessage({ type: 'success', text: `Waiver ${formData.waiverId} updated successfully!` });
        setTimeout(() => setPageMessage(null), 4000);
        return;
      }
await api.submitWaiver(payload);

// Remove from drafts after successful submit
try {
  await api.deleteWaiver(formData.waiverId);
} catch (err) {
  console.warn('Could not delete draft after submit:', err);
}

// Navigate to WaiverView — it captures PDF from its own rendered output
// and sends the email, guaranteeing identical PDF to Download PDF
navigate(`/waiver-view?id=${formData.waiverId}&sendEmail=true`, {
  state: {
    approvers,
    submittedBy: user?.full_name,
    description: formData.description,
    reason: formData.reason,
  },
});


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
    if (!user?.full_name) return;
    setMyFormsLoading(true);
    try {
      const data = await api.getMyWaivers(user.full_name);
      console.log('My Forms data:', data);
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
        requestor: data.requestor || '',
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
        currentPart: r.current_part || '',
        currentPartDescription: r.current_part_description || '',
        newPart: r.new_part || '',
        newPartDescription: r.new_part_description || '',
        action: r.action || '',
        instructions: r.instructions || '',
        file: null
      })));

      setProcessData({ instructions: data.processData?.instructions || '', file: null });
      setTestData({ currentPart: data.testData?.currentPart || '', toBePart: data.testData?.toBePart || '', instructions: data.testData?.instructions || '', file: null });
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

    // Reset all form state to empty defaults
    setWaiverId(generateWaiverId());

    setFormData({
      partNumber: '',
      revision: '',
      description: '',
      subcontractor: '',
      assemblyLevel: '',
      requestor: '',
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
      newPart: '', newPartDescription: '',
      action: '', instructions: '', file: null
    }]);

    setOpenSection([]);
    setProcessData({ instructions: '', file: null });
    setTestData({ currentPart: '', toBePart: '', instructions: '', file: null });
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
        subcontractor: data.subcontractor || '',
        assemblyLevel: data.assemblyLevel || '',
        requestor: data.requestor || '',
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
        newPart: r.new_part || r.newPart || '',
        newPartDescription: r.new_part_description || r.newPartDescription || '',
        action: r.action || '',
        instructions: r.instructions || '',
        file: r.file || null
      })));
      setProcessData({ instructions: data.processData?.instructions || '', file: data.processData?.file || null });
      setTestData({ currentPart: data.testData?.currentPart || '', toBePart: data.testData?.toBePart || '', instructions: data.testData?.instructions || '', file: data.testData?.file || null });
      setSpecData({ specImpact: data.specData?.specImpact || '', instructions: data.specData?.instructions || '', file1: data.specData?.file1 || null, file2: data.specData?.file2 || null });
      setReworkData({ instructions: data.reworkData?.instructions || '', file: data.reworkData?.file || null });
      setLabelData({ instructions: data.labelData?.instructions || '', file: data.labelData?.file || null });
      setShowForm(true);
    } catch (err) {
      console.error('Failed to load waiver for edit:', err);
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
                { key: 'myforms', label: 'My Forms' },
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
                      <th>AMD Product Part Number</th>
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
                  placeholder="Search by Waiver ID, Part Number or Reason..."
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
                  <option value="New">New</option>
                  <option value="Approved">Approved</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {myFormsLoading ? (
                <p>Loading...</p>
              ) : myForms.filter(w => {
                const q = myFormsSearch.toLowerCase();
                return !q ||
                  (w.waiver_id || '').toLowerCase().includes(q) ||
                  (w.part_number || '').toLowerCase().includes(q) ||
                  (w.reason || '').toLowerCase().includes(q);
              }).length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px', color: '#aaa',
                  border: '1px dashed #ddd', borderRadius: '8px', marginTop: '16px'
                }}>
                  {myForms.length === 0 ? 'No submitted forms found.' : 'No results match your search.'}
                </div>
              ) : (
                <table className="material-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Waiver ID</th>
                      <th>AMD Product Part Number</th>
                      <th>Reason / Justification</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myForms
                      .filter(w => {
                        const q = myFormsSearch.toLowerCase();
                        const matchSearch = !q ||
                          (w.waiver_id || '').toLowerCase().includes(q) ||
                          (w.part_number || '').toLowerCase().includes(q) ||
                          (w.reason || '').toLowerCase().includes(q);
                        const matchStatus = myFormsStatusFilter === 'all' ||
                          (w.status || 'New') === myFormsStatusFilter;
                        return matchSearch && matchStatus;
                      })
                      .map((w) => {
                        const status = w.status || 'New';
                        const statusColor = {
                          'New': { bg: '#e8f4fd', color: '#1a73e8' },
                          'Approved': { bg: '#e8f5e9', color: '#2e7d32' },
                          'Cancelled': { bg: '#fdecea', color: '#c62828' },
                          'Rejected': { bg: '#fff3e0', color: '#e65100' },
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
                            <td>{w.reason || '-'}</td>
                            <td>
                              {(() => {
                                const cancelledBy = w.cancelled_by || '';
                                const cancelReason = w.cancel_reason || '';
                                const isApproverCancel = status === 'Cancelled' &&
                                  cancelledBy.toLowerCase().startsWith('approver:');
                                const isRequestorCancel = status === 'Cancelled' &&
                                  cancelledBy.toLowerCase().startsWith('requestor:');
                                const cancellerName = cancelledBy.includes(':')
                                  ? cancelledBy.split(':').slice(1).join(':').trim()
                                  : cancelledBy.trim();

                                let displayText = status;
                                if (status === 'Approved' && w.approved_by) displayText = `Approved by ${w.approved_by}`;
                                else if (isApproverCancel) displayText = `Cancelled by ${cancellerName}`;
                                else if (isRequestorCancel) displayText = 'Cancelled (by you)';
                                else if (status === 'Cancelled' && cancelledBy) displayText = `Cancelled by ${cancelledBy}`;

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
                                    {status === 'Cancelled' && cancelReason && (
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


                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {status === 'New' && (
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
          <div className="title-header">
            <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
          </div>

          <button
            type="button"
            onClick={
              approverEditMode ? () => navigate(-1) :
                requestorEditMode ? () => { setShowForm(false); setActiveTab('myforms'); fetchMyForms(); } :
                  handleBackToList
            }
            style={{
              margin: '16px 0', padding: '8px 16px', cursor: 'pointer',
              background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px',
              fontSize: '13px', fontWeight: 500
            }}
          >
            {approverEditMode ? '← Back to Management' : requestorEditMode ? '← Back to My Forms' : '← Back to Drafts'}
          </button>

          {/* ── PASTE YOUR ENTIRE EXISTING <form>...</form> BLOCK HERE ── */}
          <form onSubmit={handleSubmit}>
            {/* Product Info */}
            <div className="form-section">
              <div className="waiver-id-row">
                <span className="waiver-label">Waiver ID:</span>
                <span className="waiver-value">{formData.waiverId}</span>
              </div>

              <div className="field-inline">
                <label>AMD Product Part Number:</label>
                <input name="partNumber" value={formData.partNumber || ""} onChange={handleChange} />
              </div>

              <div className="field-inline">
                <label>AMD Product Revision:</label>
                <input name="revision" value={formData.revision || ""} onChange={handleChange} />
              </div>

              <div className="field-inline">
                <label>AMD Product Description:</label>
                <input name="description" value={formData.description || ""} onChange={handleChange} />
              </div>

            </div>

            {/* Subcontractor */}
            <div className="form-section">
              <label>Affected Subcontractor</label>
              {subcontractors.map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="subcontractor"
                    value={item}
                    checked={formData.subcontractor === item}
                    onChange={handleChange}
                  />
                  {item}
                </label>
              ))}
            </div>

            {/* Assembly */}
            <div className="form-section">
              <label>Assembly Level</label>
              {assemblyLevels.map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="assemblyLevel"
                    value={item}
                    checked={formData.assemblyLevel === item}
                    onChange={handleChange}
                  />
                  {item}
                </label>
              ))}
            </div>

            {/* Requestor */}
            <div className="form-section">
              <div className="field-inline">
                <label>Requestor Name:</label>
                <input name="requestor" value={formData.requestor || ""} onChange={handleChange} />
              </div>
            </div>

            {/* Dates */}
            <div className="form-section">
              <div className="field-inline">
                <label>Waiver Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="field-inline">
                <label>Waiver End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
              </div>
            </div>

            {/* Waiver Type */}
            <div className="form-section">
              <label>Waiver Type</label>
              {[
                "Material Waiver",
                "Process Waiver",
                "Test Waiver",
                "Spec Deviation",
                "Rework Waiver",
                "Label Waiver"
              ].map((item) => (
                <label key={item}>
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
                <label>Reason / Justification</label>
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
                          <th>Current Part</th>
                          <th>Description</th>
                          <th>New Part</th>
                          <th>Description</th>
                          <th>Action</th>
                          <th>Instructions</th>
                          <th>Attachment</th>
                          <th></th>
                        </tr>
                      </thead>

                      <tbody>
                        {materialRows.map((row, index) => (
                          <tr key={index}>

                            <td>
                              <input
                                className="table-input"
                                placeholder="Part No"
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
                                placeholder="Part No"
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
                              <textarea
                                className="table-textarea"
                                placeholder="Instructions..."
                                value={row.instructions || ""}
                                onChange={(e) =>
                                  handleMaterialChange(index, "instructions", e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <div className="file-upload">

                                {/* If NO file → show upload */}
                                {!row.file ? (
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleMaterialFileChange(index, e.target.files[0])
                                    }
                                  />
                                ) : (
                                  /* If file exists → show filename + actions */
                                  <div className="file-preview">
                                    <a
                                      href={`${BASE_URL}${row.file}`}
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
                  <label>Instructions</label>
                  <textarea name="processdata instructions" value={processData.instructions} onChange={(e) =>
                    setProcessData({ ...processData, instructions: e.target.value })
                  }></textarea>

                  <div className="file-upload">
                    {!processData.file ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files[0], processData, setProcessData)}
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${processData.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {processData.file.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          className="replace-btn"
                          onClick={() =>
                            handleReplace(processData, setProcessData)
                          }
                        >
                          Replace
                        </button>
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

                  <div className="field-inline">
                    <label>Current Part Number:</label>
                    <input name="currentpartnum" value={testData.currentPart}
                      onChange={(e) =>
                        setTestData({ ...testData, currentPart: e.target.value })
                      } />

                    <label>To Be Part Number:</label>
                    <input name="tobepartnum" value={testData.toBePart}
                      onChange={(e) =>
                        setTestData({ ...testData, toBePart: e.target.value })
                      } />
                  </div>

                  <label>Instructions</label>
                  <textarea name="test instructions" value={testData.instructions}
                    onChange={(e) =>
                      setTestData({ ...testData, instructions: e.target.value })
                    }
                  />

                  <div className="file-upload">
                    {!testData.file ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(e.target.files[0], testData, setTestData)
                        }
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${testData.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {testData.file.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            handleReplace(testData, setTestData)
                          }
                        >
                          Replace
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>


            {/* Rework Waiver Section */}
            <div className="accordion">
              <div
                className="accordion-header"
              >
                Rework Waiver Details
              </div>

              {openSection.includes("rework") && (
                <div className="accordion-body">
                  <label>Instructions</label>
                  <textarea name="rework instructions" value={reworkData.instructions}
                    onChange={(e) =>
                      setReworkData({ ...reworkData, instructions: e.target.value })
                    }
                  />

                  <div className="file-upload">
                    {!reworkData.file ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files[0], reworkData, setReworkData)}
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${reworkData.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {reworkData.file.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          className="replace-btn"
                          onClick={() =>
                            handleReplace(reworkData, setReworkData)
                          }
                        >
                          Replace
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>


            {/* Spec Waiver Section */}
            <div className="accordion">
              <div
                className="accordion-header"
              >
                Spec Deviation Waiver Details
              </div>

              {openSection.includes("spec") && (
                <div className="accordion-body">
                  <label>Specifications/Drawings impacted</label>
                  <textarea name="spec impacted" value={specData.specImpact}
                    onChange={(e) =>
                      setSpecData({ ...specData, specImpact: e.target.value })
                    }></textarea>

                  <div className="file-upload">

                    {!specData.file1 ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            e.target.files[0],
                            specData,
                            setSpecData,
                            "file1"
                          )
                        }
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${specData.file1}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {specData.file1.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            handleReplace(specData, setSpecData, "file1")
                          }
                        >
                          Replace
                        </button>
                      </div>
                    )}

                  </div>
                  <label><br></br>Instructions</label>
                  <textarea name="spec instructions" value={specData.instructions}
                    onChange={(e) =>
                      setSpecData({ ...specData, instructions: e.target.value })
                    }></textarea>

                  <div className="file-upload">

                    {!specData.file2 ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            e.target.files[0],
                            specData,
                            setSpecData,
                            "file2"
                          )
                        }
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${specData.file2}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {specData.file2.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            handleReplace(specData, setSpecData, "file2")
                          }
                        >
                          Replace
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>


            {/* Label Waiver Section */}
            <div className="accordion">
              <div
                className="accordion-header"
              >
                Label Waiver Details
              </div>

              {openSection.includes("label") && (
                <div className="accordion-body">

                  <label>Instructions</label>
                  <textarea name="instructions" value={labelData.instructions}
                    onChange={(e) =>
                      setLabelData({ ...labelData, instructions: e.target.value })
                    }></textarea>

                  <div className="file-upload">
                    {!labelData.file ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files[0], labelData, setLabelData)}
                      />
                    ) : (
                      <div className="file-preview">
                        <a
                          href={`${BASE_URL}${labelData.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          {labelData.file.split("/").pop()}
                        </a>

                        <button
                          type="button"
                          className="replace-btn"
                          onClick={() =>
                            handleReplace(labelData, setLabelData)
                          }
                        >
                          Replace
                        </button>
                      </div>
                    )}

                  </div>


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
              {submitting ? 'Submitting...' : 'SUBMIT'}
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