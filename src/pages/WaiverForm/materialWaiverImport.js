import { read, utils } from 'xlsx';

export function parseMaterialWaiverExcel(file, onRows) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const workbook = read(evt.target.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json(sheet, { defval: '' });
    // Skip the 2 sample rows if they match the template defaults
    const SAMPLE_PART_1 = 'P/N-001';
    const SAMPLE_PART_2 = 'P/N-003';
    const filteredRows = (() => {
      if (rows.length >= 2) {
        const key = Object.keys(rows[0]).find(k => k.toLowerCase().trim() === 'current part number' || k.toLowerCase().trim() === 'current part');
        const v0 = key ? String(rows[0][key]).trim() : '';
        const v1 = key ? String(rows[1][key]).trim() : '';
        if (v0 === SAMPLE_PART_1 && v1 === SAMPLE_PART_2) return rows.slice(2);
      }
      return rows;
    })();

    const mapped = filteredRows.map(r => {
      // Build a lowercase key map for case-insensitive matching
      const lower = {};
      Object.keys(r).forEach(k => { lower[k.toLowerCase().trim()] = r[k]; });

      const get = (...keys) => {
        for (const k of keys) {
          const v = lower[k.toLowerCase().trim()];
          if (v !== undefined && v !== '') return String(v);
        }
        return '';
      };

      return {
        currentPart:            get('current part number', 'current part'),
        currentPartDescription: get('description', 'current description'),
        noOfPer:                get('no. of per', 'no of per', 'noofper'),
        refdes:                 get('refdes'),
        newPart:                get('to be part number', 'to be part'),
        newPartDescription:     get('to be description', 'new description'),
        action:                 get('action'),
        instructions:           get('instructions', 'action instructions', 'action instruction'),
        file:                   ''
      };
    });
    if (mapped.length > 0) onRows(mapped);
  };
  reader.readAsBinaryString(file);
}

export function downloadMaterialWaiverTemplate() {
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const a = document.createElement('a');
  a.href = `${API_URL}/api/waiver/material-template`;
  a.download = 'material_waiver_template.xlsx';
  a.click();
}
