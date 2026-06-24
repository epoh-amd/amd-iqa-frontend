import { read, utils, writeFile } from 'xlsx';

export function parseMaterialWaiverExcel(file, onRows) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const workbook = read(evt.target.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json(sheet, { defval: '' });
    const mapped = rows.map(r => ({
      currentPart:            String(r['Current Part Number'] ?? r['Current Part'] ?? ''),
      currentPartDescription: String(r['Description'] ?? r['Current Description'] ?? ''),
      noOfPer:                String(r['No. of Per'] ?? r['No of Per'] ?? r['NoOfPer'] ?? ''),
      refdes:                 String(r['Refdes'] ?? ''),
      newPart:                String(r['To Be Part Number'] ?? r['To Be Part'] ?? ''),
      newPartDescription:     String(r['To Be Description'] ?? r['New Description'] ?? ''),
      action:                 String(r['Action'] ?? ''),
      instructions:           String(r['Instructions'] ?? r['Action Instructions'] ?? r['Action Instruction'] ?? ''),
      file:                   ''
    }));
    if (mapped.length > 0) onRows(mapped);
  };
  reader.readAsBinaryString(file);
}

export function downloadMaterialWaiverTemplate() {
  const template = [
    {
      'Current Part Number': 'P/N-001',
      'Description': 'Resistor 10K',
      'No. of Per': '2',
      'Refdes': 'R1, R2',
      'To Be Part Number': 'P/N-002',
      'To Be Description': 'Resistor 12K',
      'Action': 'Remove',
      'Instructions': 'Replace with new resistor per ECO-123'
    },
    {
      'Current Part Number': 'P/N-003',
      'Description': 'Capacitor 100uF',
      'No. of Per': '1',
      'Refdes': 'C5',
      'To Be Part Number': 'P/N-004',
      'To Be Description': 'Capacitor 220uF',
      'Action': 'Remove',
      'Instructions': 'Replace capacitor, observe polarity'
    }
  ];
  const ws = utils.json_to_sheet(template);
  ws['!cols'] = [20, 25, 12, 15, 20, 25, 15, 35].map(w => ({ wch: w }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Material Waiver');
  writeFile(wb, 'material_waiver_template.xlsx');
}
