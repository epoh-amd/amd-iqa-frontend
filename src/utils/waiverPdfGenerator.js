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
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    width: 1200,
    windowWidth: 1200,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(temp);

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginTop = 10;
  const marginBottom = 10;
  const usableHeight = pageHeight - marginTop - marginBottom;

  const pxPerMm = canvas.width / pageWidth;
  const maxPageHeightPx = Math.floor(usableHeight * pxPerMm);

  // Get pixel data to find safe cut points (white rows)
  const ctx2d = canvas.getContext('2d');
  const imageData = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Sample every 10px horizontally for speed, threshold 210 to catch #fafafa gray rows
  const isRowLight = (y) => {
    const step = 10;
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      if (r < 210 || g < 210 || b < 210) return false;
    }
    return true;
  };

  // Find safe cut point: scan upward from ideal cut to find a light row
  const findSafeCut = (idealY) => {
    const searchRange = Math.floor(pxPerMm * 40); // search up to 40mm upward
    for (let y = idealY; y >= Math.max(0, idealY - searchRange); y--) {
      if (isRowLight(y)) return y;
    }
    return idealY; // fallback to ideal if no light row found
  };

  let srcY = 0;
  let pageNum = 0;

  while (srcY < canvas.height) {
    if (pageNum > 0) pdf.addPage();

    const idealEnd = srcY + maxPageHeightPx;
    const cutY = idealEnd >= canvas.height ? canvas.height : findSafeCut(Math.min(idealEnd, canvas.height - 1));
    const srcH = cutY - srcY;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
    const sliceHeightMm = srcH / pxPerMm;

    pdf.addImage(pageImgData, 'JPEG', 0, marginTop, pageWidth, sliceHeightMm);

    srcY = cutY;
    pageNum++;
  }

  return pdf.output('datauristring').split(',')[1];
};
