import React, { useState, useEffect, useRef } from 'react';
import '../../assets/css/waiver.css';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateWaiverPDFBase64 } from '../../utils/waiverPdfGenerator';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const toFileUrl = (filePath) => filePath ? `${BASE_URL}${filePath.replace('/drafts/', '/api/drafts/')}` : '';

// Render instructions as HTML — handles both plain text (legacy) and rich HTML (contenteditable).
// Plain text: escape special chars then convert \n → <br>.
// HTML content: pass through as-is (already has <br>/<div>/<img> tags).
const renderInstructions = (text) => {
    if (!text) return '-';
    // Detect HTML produced by the contenteditable editor
    if (/(<br\s*\/?>|<div[\s>]|<img[\s>]|<p[\s>])/i.test(text)) {
        // Normalize block elements → <br> so content renders correctly inside
        // an inline/block span without invalid nesting collapsing line breaks.
        return text
            .replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, '<br>') // empty line
            .replace(/<div[^>]*>/gi, '<br>')
            .replace(/<\/div>/gi, '')
            .replace(/<p[^>]*>/gi, '<br>')
            .replace(/<\/p>/gi, '')
            .replace(/\r\n/g, '<br>')
            .replace(/\r/g, '<br>')
            .replace(/\n/g, '<br>')
            .replace(/^(<br\s*\/?>)+/i, ''); // strip any leading <br>
    }
    // Plain text (legacy records) — escape entities then convert newlines
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n/g, '<br>')
        .replace(/\r/g, '<br>')
        .replace(/\n/g, '<br>');
};

const normalizeFile = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try {
            let p = JSON.parse(val);
            if (typeof p === 'string') p = JSON.parse(p);
            if (Array.isArray(p)) return p.filter(Boolean);
        } catch {}
        return [val];
    }
    return [];
};

const WAIVER_TYPE_TO_SECTION = {
    'Material Waiver': 'material',
    'Process Waiver': 'process',
    'Test Waiver': 'test',
    'Spec Deviation': 'spec',
    'Rework Waiver': 'rework',
    'Label Waiver': 'label',
};
const Field = ({ label, value }) => (
    <div className="field-inline">
        <label>{label}</label>
        <span className="wv-value">{value || '-'}</span>
    </div>
);

const WaiverView = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const waiverId = params.get('id');
        if (!waiverId) {
            setError('No waiver ID provided.');
            setLoading(false);
            return;
        }
        api.getWaiverDetails(waiverId)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => { setError('Failed to load waiver details.'); setLoading(false); });
    }, []);

    const [downloading, setDownloading] = useState(false);
    const isSendEmail = new URLSearchParams(window.location.search).get('sendEmail') === 'true';
    const [submitBanner, setSubmitBanner] = useState(isSendEmail ? 'sending' : null);
    const emailSentRef = useRef(false);
    const location = useLocation();
    const isUpdate = !!(location.state?.isUpdate);

    // Auto-send email with PDF when navigated here after waiver submission
    useEffect(() => {
        if (!isSendEmail) return;
        if (!data || emailSentRef.current) return;
        emailSentRef.current = true;

        const sendEmailWithPDF = async () => {
            await new Promise(r => setTimeout(r, 100));
            const element = document.querySelector('.waiver-container');
            if (!element) return;
            try {
                const base64 = await generateWaiverPDFBase64(element);
                const state = location.state || {};
                const isUpdate = !!state.isUpdate;

                // Collect all uploaded file paths
                const uploadedFilePaths = [];
                const pushFile = (f) => {
                    if (!f) return;
                    if (Array.isArray(f)) { uploadedFilePaths.push(...f.filter(Boolean)); return; }
                    if (typeof f === 'string') {
                        try {
                            let p = JSON.parse(f);
                            if (typeof p === 'string') p = JSON.parse(p); // handle double-encoded
                            if (Array.isArray(p)) { uploadedFilePaths.push(...p.filter(Boolean)); return; }
                        } catch {}
                        uploadedFilePaths.push(f);
                    }
                };
                (data.materialRows || []).forEach(r => pushFile(r.file_path || r.file));
                const pd = data.processData || {};
                pushFile(pd.file);
                if (pd.areaFiles) Object.values(pd.areaFiles).forEach(pushFile);
                const td = data.testData || {};
                pushFile(td.file);
                if (td.areaFiles) Object.values(td.areaFiles).forEach(pushFile);
                const sd = data.specData || {};
                pushFile(sd.file1);
                pushFile(sd.file2);
                const rd = data.reworkData || {};
                pushFile(rd.file);
                const ld = data.labelData || {};
                pushFile(ld.file);

                const requestors = (() => {
                    try {
                        const p = JSON.parse(data.requestor);
                        return Array.isArray(p) ? p.filter(Boolean) : [String(p)];
                    } catch {
                        return data.requestor ? [data.requestor] : [];
                    }
                })();

                await api.sendNewWaiverNotification({
                    waiverId: data.waiverId,
                    partNumber: data.partNumber,
                    description: data.description,
                    revision: data.revision,
                    assemblyLevel: data.assemblyLevel,
                    subcontractor: data.subcontractor,
                    reason: data.reason,
                    submittedBy: data.submittedBy,
                    approvers: state.approvers || [],
                    requestors,
                    isUpdate,
                    pdfBase64: base64,
                    uploadedFilePaths,
                });
                setSubmitBanner('success');
            } catch (err) {
                console.error('Failed to send email notification:', err);
                setSubmitBanner('error');
            }
            window.history.replaceState({}, '', `/waiver-view?id=${data.waiverId}`);
        };

        sendEmailWithPDF();
    }, [data]);

    const handleDownloadPDF = async () => {

        const element = document.querySelector('.waiver-container');
        if (!element) return;
        setDownloading(true);
        try {
            const base64 = await generateWaiverPDFBase64(element);
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${base64}`;
            link.download = `waiver-${waiverId || 'form'}.pdf`;
            link.click();
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="waiver-container"><p>Loading...</p></div>;
    if (error) return <div className="waiver-container"><p style={{ color: '#dc3545' }}>{error}</p></div>;


    const {
        waiverId, partNumber, revision, description,
        subcontractor, assemblyLevel, requestor,
        startDate, endDate, waiverType = [], reason,
        workorder, workorderQty, submittedBy, status,
        materialRows = [],
        processData = {}, testData = {}, specData = {},
        reworkData = {}, labelData = {},
    } = data;

    const openSections = (waiverType || []).map(t => WAIVER_TYPE_TO_SECTION[t]).filter(Boolean);

    const formatDate = (val) => {
        if (!val) return '-';
        return new Date(val).toLocaleDateString();
    };


    return (
        <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {submitBanner === 'sending' && (
                <div style={{
                    margin: '0 0 16px 0', padding: '12px 16px',
                    background: '#e8f4fd', border: '1px solid #bee5eb',
                    borderRadius: '6px', color: '#0c5460', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <span style={{
                        width: 18, height: 18, border: '3px solid #0c5460',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.8s linear infinite',
                        flexShrink: 0
                    }} />
                    Waiver <strong style={{ margin: '0 4px' }}>{waiverId}</strong> {isUpdate ? 'updated' : 'submitted'}. Generating and sending email notification...
                </div>
            )}
            {submitBanner === 'success' && (
                <div style={{
                    margin: '0 0 16px 0', padding: '12px 16px',
                    background: '#d4edda', border: '1px solid #c3e6cb',
                    borderRadius: '6px', color: '#155724', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span>Waiver <strong>{waiverId}</strong> {isUpdate ? 'updated' : 'submitted'} successfully! Email notification sent to approvers.</span>
                    <span style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 12 }} onClick={() => setSubmitBanner(null)}>✕</span>
                </div>
            )}
            {submitBanner === 'error' && (
                <div style={{
                    margin: '0 0 16px 0', padding: '12px 16px',
                    background: '#fff3cd', border: '1px solid #ffc107',
                    borderRadius: '6px', color: '#856404', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span>Waiver <strong>{waiverId}</strong> {isUpdate ? 'updated' : 'submitted'} successfully, but email notification could not be sent.</span>
                    <span style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 12 }} onClick={() => setSubmitBanner(null)}>✕</span>
                </div>
            )}

            <div className="waiver-container">
            {/* Header */}
            <div className="title-header">
                <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '8px 16px', cursor: 'pointer',
                        background: '#f0f0f0', border: '1px solid #ccc',
                        borderRadius: '6px', fontSize: '13px', fontWeight: 500
                    }}
                >
                    ← Back
                </button>
                <div className="waiver-view-badge">View Only</div>
                <button className="wv-download-btn" onClick={handleDownloadPDF} disabled={downloading}>
                    {downloading ? 'Generating...' : '⬇ Download PDF'}
                </button>
            </div>

            {/* Waiver ID */}
            <div className="form-section">
                <div className="waiver-id-row">
                    <span className="waiver-label">Waiver ID:</span>
                    <span className="waiver-value">{waiverId || '-'}</span>
                </div>
                <Field label="AMD Product Part Number:" value={partNumber} />
                <Field label="AMD Product Revision:" value={revision} />
                <Field label="AMD Product Description:" value={description} />
            </div>

            {/* Subcontractor */}
            <div className="form-section">
                <div className="field-inline">
                    <label>Affected Subcontractor</label>
                    <span className="wv-value">{Array.isArray(subcontractor) ? subcontractor.join(', ') : subcontractor || '-'}</span>
                </div>
            </div>

            {/* Assembly Level */}
            <div className="form-section">
                <div className="field-inline">
                    <label>Assembly Level</label>
                    <span className="wv-value">{Array.isArray(assemblyLevel) ? assemblyLevel.join(', ') : assemblyLevel || '-'}</span>
                </div>
            </div>


            {/* Requestor */}
            <div className="form-section">
                <Field label="Requestor Name:" value={requestor} />
            </div>

            {/* Dates */}
            <div className="form-section">
                <Field label="Waiver Start Date" value={formatDate(startDate)} />
            </div>

            {/* Waiver Type */}
            <div className="form-section">
                <label>Waiver Type</label>
                {waiverType.length > 0 ? (
                    <div className="radio-group">
                        {['Material Waiver', 'Process Waiver', 'Test Waiver']
                            .filter(t => waiverType.includes(t))
                            .map(t => (
                                <span key={t} className="wv-tag">{t}</span>
                            ))}
                    </div>
                ) : (
                    <span className="wv-value">-</span>
                )}
            </div>

            {/* Reason */}
            <div className="form-section">
                <div className="field-inline">
                    <label>Reason / Justification</label>
                    <span className="wv-value wv-multiline">{reason || '-'}</span>
                </div>
            </div>

            {/* Workorder */}
            <div className="form-section-row">
                <Field label="Workorder:" value={workorder} />
                <Field label="Workorder Qty:" value={workorderQty} />
            </div>

            {/* Material Waiver */}
            <div className="accordion">
                <div className="accordion-header">Material Waiver Details</div>
                {openSections.includes('material') && (
                    <div className="accordion-body">
                        <div className="table-wrapper">
                            <table className="material-table">
                                <colgroup>
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '13%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Current Part Number</th>
                                        <th>Description</th>
                                        <th>No. of Per</th>
                                        <th>Refdes</th>
                                        <th>To Be Part Number</th>
                                        <th>Description</th>
                                        <th>Action</th>
                                        <th>Attachment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materialRows.map((row, i) => (
                                        <React.Fragment key={i}>
                                        <tr>
                                            <td>{row.current_part || row.currentPart || '-'}</td>
                                            <td>{row.current_part_description || row.currentPartDescription || '-'}</td>
                                            <td>{row.no_of_per || row.noOfPer || '-'}</td>
                                            <td>{row.refdes || '-'}</td>
                                            <td>{row.new_part || row.newPart || '-'}</td>
                                            <td>{row.new_part_description || row.newPartDescription || '-'}</td>
                                            <td>{row.action || '-'}</td>
                                            <td>
                                                {(() => {
                                                    const files = normalizeFile(row.file_path || row.file);
                                                    return files.length ? files.map((fp, i) => (
                                                        <a key={i} href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link" style={{ display: 'block' }}>
                                                            {fp.split('/').pop()}
                                                        </a>
                                                    )) : '-';
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" style={{ background: '#fafafa', padding: '6px 12px', fontSize: '13px' }}>
                                                <strong>Instructions:</strong>
                                                <span
                                                    className="wv-multiline"
                                                    dangerouslySetInnerHTML={{ __html: renderInstructions(row.instructions) }}
                                                />
                                            </td>
                                        </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Process Waiver */}
            <div className="accordion">
                <div className="accordion-header">Process Waiver Details</div>
                {openSections.includes('process') && (
                    <div className="accordion-body">
                        <div className="field-inline" style={{ marginBottom: '12px' }}>
                            <label>Area:</label>
                            <span className="wv-value">
                                {Array.isArray(processData.areas) && processData.areas.length > 0
                                    ? processData.areas.join(', ')
                                    : '-'}
                            </span>
                        </div>
                        {Array.isArray(processData.areas) && processData.areas.map(area => (
                            <div key={area} style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Instructions ({area}):</label>
                                <span className="wv-value wv-multiline" dangerouslySetInnerHTML={{ __html: renderInstructions(processData.areaInstructions?.[area]) }} />
                                {normalizeFile(processData.areaFiles?.[area]).map((fp, i) => (
                                    <div key={i} style={{ marginTop: '4px' }}>
                                        <a href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link">{fp.split('/').pop()}</a>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Test Waiver */}
            <div className="accordion">
                <div className="accordion-header">Test Waiver Details</div>
                {openSections.includes('test') && (
                    <div className="accordion-body">
                        {/* Parts table */}
                        {Array.isArray(testData.rows) && testData.rows.length > 0 && (
                            <div className="table-wrapper" style={{ marginBottom: '16px' }}>
                                <table className="material-table">
                                    <thead>
                                        <tr>
                                            <th>Current Part Number</th>
                                            <th>To Be Part Number</th>
                                            <th>Refdes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testData.rows.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.currentPart || '-'}</td>
                                                <td>{row.toBePart || '-'}</td>
                                                <td>{row.refdes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="field-inline" style={{ marginBottom: '12px' }}>
                            <label>Area:</label>
                            <span className="wv-value">
                                {Array.isArray(testData.areas) && testData.areas.length > 0
                                    ? testData.areas.join(', ')
                                    : '-'}
                            </span>
                        </div>
                        {Array.isArray(testData.areas) && testData.areas.map(area => (
                            <div key={area} style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Instructions ({area}):</label>
                                <span className="wv-value wv-multiline" dangerouslySetInnerHTML={{ __html: renderInstructions(testData.areaInstructions?.[area]) }} />
                                {normalizeFile(testData.areaFiles?.[area]).map((fp, i) => (
                                    <div key={i} style={{ marginTop: '4px' }}>
                                        <a href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link">{fp.split('/').pop()}</a>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
        </>
    );
};

export default WaiverView;
