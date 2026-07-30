const fetch = require('node-fetch');

(async () => {
  const data = require('./data_entries.json');
  const entry = data.find(e => e.sheetRow === 3);
  if (!entry) {
    console.log("Not found row 3");
    return;
  }
  
  entry.catatan = "TEST EDIT VIA SCRIPT";
  
  const res = await fetch(`http://127.0.0.1:3000/api/documents/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  
  const text = await res.text();
  console.log("Response:", text);
})();
