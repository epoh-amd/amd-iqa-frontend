import React, { useState, useEffect, useRef } from 'react';
import '../../assets/css/waiver.css';
import api from '../../services/api';

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

    const handleDownloadPDF = async () => {
        const element = document.querySelector('.waiver-container');
        if (!element) return;

        setDownloading(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');
            // Clone content into an off-screen container with no height/overflow constraints
            const clone = element.cloneNode(true);

            clone.querySelectorAll('button').forEach(el => el.remove());

            const temp = document.createElement('div');
            temp.style.cssText = `
          position: fixed;
          top: 0;
          left: -9999px;
          width: 1200px;
          background: white;
          overflow: visible;
          height: auto;
          padding: 20px;
          box-sizing: border-box;
        `;
            temp.appendChild(clone);
            document.body.appendChild(temp);

            // Wait for content to fully render
            await new Promise(resolve => setTimeout(resolve, 400));

            const canvas = await html2canvas(temp, {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                width: 1200,
                windowWidth: 1200,
                autoPaging: 'text',
                scrollX: 0,
                scrollY: 0,
            });

            document.body.removeChild(temp);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let position = 0;
            let remaining = imgHeight;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            remaining -= pageHeight;

            while (remaining > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                remaining -= pageHeight;
            }

            pdf.save(`waiver-${waiverId || 'form'}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadPDF_unused = () => {
        const element = document.querySelector('.waiver-container');

        if (!element) return;

        const styles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
                } catch (e) {
                    return sheet.href ? `@import url('${sheet.href}');` : '';
                }
            })
            .join('\n');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Waiver ${waiverId || ''}</title>
            <style>
              ${styles}

              @page { size: A4; margin: 15mm; }

              /* Override all layout height/overflow constraints */
              *, *::before, *::after {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                min-height: 0 !important;
              }

              html, body {
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                width: 100% !important;
                overflow: visible !important;
              }

              .waiver-container {
                max-width: 100% !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                overflow: visible !important;
              }

              .wv-download-btn,
              .waiver-view-badge { display: none !important; }

              .accordion-body { display: block !important; }

              .accordion, .form-section, tr { page-break-inside: avoid; }

              .title-header, .accordion-header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .material-table th,
              .material-table td { border: 1px solid #ddd !important; }
            </style>
          </head>
          <body>
            <div class="waiver-container">
              ${element.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }, 600);
              };
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
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
        <div className="waiver-container">
            {/* Header */}
            <div className="title-header">
                <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
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
                                                    <a href={`http://localhost:5000${row.file_path}`} target="_blank" rel="noreferrer" className="file-link">
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
                            <a href={`http://localhost:5000${processData.file}`} target="_blank" rel="noreferrer" className="file-link">
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
                            <a href={`http://localhost:5000${testData.file}`} target="_blank" rel="noreferrer" className="file-link">
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
                            <a href={`http://localhost:5000${reworkData.file}`} target="_blank" rel="noreferrer" className="file-link">
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
                            <a href={`http://localhost:5000${specData.file1}`} target="_blank" rel="noreferrer" className="file-link">
                                {specData.file1.split('/').pop()}
                            </a>
                        )}
                        <label><br />Instructions</label>
                        <span className="wv-value wv-multiline">{specData.instructions || '-'}</span>
                        {specData.file2 && (
                            <a href={`http://localhost:5000${specData.file2}`} target="_blank" rel="noreferrer" className="file-link">
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
                            <a href={`http://localhost:5000${labelData.file}`} target="_blank" rel="noreferrer" className="file-link">
                                {labelData.file.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaiverView;
