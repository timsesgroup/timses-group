import fs from 'fs';
(async () => {
  const data = JSON.parse(fs.readFileSync('./data_entries.json', 'utf-8'));
  const entry = data.find(e => e.sheetRow === 3);
  if (!entry) {
    console.log("Not found row 3");
    return;
  }
  entry.catatan = "TEST EDIT VIA SCRIPT " + Date.now();
  
  const res = await fetch(`http://127.0.0.1:3000/api/documents/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  
  const text = await res.text();
  console.log("Response:", text);
})();
