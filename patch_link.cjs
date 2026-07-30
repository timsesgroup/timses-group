const fs = require('fs');
const filepath = 'src/components/DocumentForm.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

const oldCode = `      const links = (formData.linkKonten || '').split('\\n').map(l => l.trim()).filter(l => l);
      if (links.length === 0) links.push(''); // Minimal satu entri kalau kosong`;

const newCode = `      const rawText = formData.linkKonten || '';
      const urlRegex = /(https?:\\/\\/[^\\s]+)/gi;
      let links = rawText.match(urlRegex) || [];
      
      if (links.length === 0) {
        links = rawText.split('\\n').map(l => l.trim()).filter(l => l);
      }
      if (links.length === 0) links.push(''); // Minimal satu entri kalau kosong`;

code = code.replace(oldCode, newCode);
fs.writeFileSync(filepath, code);
