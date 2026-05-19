// Exact same settings as waiverView.js handleDownloadPDF but returns base64
export const generateWaiverPDFBase64 = async (element) => {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

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

  await new Promise(resolve => setTimeout(resolve, 100));

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

  // Return base64 string (strip the data URL prefix)
  return pdf.output('datauristring').split(',')[1];
};
