import React, { useState, useEffect, useRef } from 'react';
import '../../assets/css/waiver.css';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateWaiverPDFBase64 } from '../../utils/waiverPdfGenerator';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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
                await api.sendNewWaiverNotification({
                    waiverId: data.waiverId,
                    partNumber: data.partNumber,
                    description: data.description,
                    reason: data.reason,
                    submittedBy: data.submittedBy,
                    approvers: state.approvers || [],
                    pdfBase64: base64,
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
                    Waiver <strong style={{ margin: '0 4px' }}>{waiverId}</strong> submitted. Generating and sending email notification...
                </div>
            )}
            {submitBanner === 'success' && (
                <div style={{
                    margin: '0 0 16px 0', padding: '12px 16px',
                    background: '#d4edda', border: '1px solid #c3e6cb',
                    borderRadius: '6px', color: '#155724', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span>Waiver <strong>{waiverId}</strong> submitted successfully! Email notification sent to approvers.</span>
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
                    <span>Waiver <strong>{waiverId}</strong> submitted successfully, but email notification could not be sent.</span>
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
                    <span className="wv-value">{subcontractor || '-'}</span>
                </div>
            </div>

            {/* Assembly Level */}
            <div className="form-section">
                <div className="field-inline">
                    <label>Assembly Level</label>
                    <span className="wv-value">{assemblyLevel || '-'}</span>
                </div>
            </div>


            {/* Requestor */}
            <div className="form-section">
                <Field label="Requestor Name:" value={requestor} />
                <Field label="Submitted By:" value={submittedBy} />
            </div>

            {/* Dates */}
            <div className="form-section">
                <Field label="Waiver Start Date" value={formatDate(startDate)} />
                <Field label="Waiver End Date" value={formatDate(endDate)} />
            </div>

            {/* Waiver Type */}
            <div className="form-section">
                <label>Waiver Type</label>
                {waiverType.length > 0 ? (
                    <div className="radio-group">
                        {waiverType.map(t => (
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
                                <thead>
                                    <tr>
                                        <th>Current Part</th>
                                        <th>Description</th>
                                        <th>New Part</th>
                                        <th>Description</th>
                                        <th>Action</th>
                                        <th>Instructions</th>
                                        <th>Attachment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materialRows.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.current_part || '-'}</td>
                                            <td>{row.current_part_description || '-'}</td>
                                            <td>{row.new_part || '-'}</td>
                                            <td>{row.new_part_description || '-'}</td>
                                            <td>{row.action || '-'}</td>
                                            <td>{row.instructions || '-'}</td>
                                            <td>
                                                {row.file_path ? (
                                                    <a href={`${BASE_URL}${row.file_path}`} target="_blank" rel="noreferrer" className="file-link">
                                                        {row.file_path.split('/').pop()}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                        </tr>
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
                        <label>Instructions</label>
                        <span className="wv-value wv-multiline">{processData.instructions || '-'}</span>
                        {processData.file && (
                            <a href={`${BASE_URL}${processData.file}`} target="_blank" rel="noreferrer" className="file-link">
                                {processData.file.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Test Waiver */}
            <div className="accordion">
                <div className="accordion-header">Test Waiver Details</div>
                {openSections.includes('test') && (
                    <div className="accordion-body">
                        <div className="field-inline">
                            <label>Current Part Number:</label>
                            <span className="wv-value">{testData.currentPart || '-'}</span>
                            <label>To Be Part Number:</label>
                            <span className="wv-value">{testData.toBePart || '-'}</span>
                        </div>
                        <label>Instructions</label>
                        <span className="wv-value wv-multiline">{testData.instructions || '-'}</span>
                        {testData.file && (
                            <a href={`${BASE_URL}${testData.file}`} target="_blank" rel="noreferrer" className="file-link">
                                {testData.file.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Rework Waiver */}
            <div className="accordion">
                <div className="accordion-header">Rework Waiver Details</div>
                {openSections.includes('rework') && (
                    <div className="accordion-body">
                        <label>Instructions</label>
                        <span className="wv-value wv-multiline">{reworkData.instructions || '-'}</span>
                        {reworkData.file && (
                            <a href={`${BASE_URL}${reworkData.file}`} target="_blank" rel="noreferrer" className="file-link">
                                {reworkData.file.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Spec Deviation */}
            <div className="accordion">
                <div className="accordion-header">Spec Deviation Waiver Details</div>
                {openSections.includes('spec') && (
                    <div className="accordion-body">
                        <label>Specifications/Drawings impacted</label>
                        <span className="wv-value wv-multiline">{specData.specImpact || '-'}</span>
                        {specData.file1 && (
                            <a href={`${BASE_URL}${specData.file1}`} target="_blank" rel="noreferrer" className="file-link">
                                {specData.file1.split('/').pop()}
                            </a>
                        )}
                        <label><br />Instructions</label>
                        <span className="wv-value wv-multiline">{specData.instructions || '-'}</span>
                        {specData.file2 && (
                            <a href={`${BASE_URL}${specData.file2}`} target="_blank" rel="noreferrer" className="file-link">
                                {specData.file2.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Label Waiver */}
            <div className="accordion">
                <div className="accordion-header">Label Waiver Details</div>
                {openSections.includes('label') && (
                    <div className="accordion-body">
                        <label>Instructions</label>
                        <span className="wv-value wv-multiline">{labelData.instructions || '-'}</span>
                        {labelData.file && (
                            <a href={`${BASE_URL}${labelData.file}`} target="_blank" rel="noreferrer" className="file-link">
                                {labelData.file.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default WaiverView;
