const fs = require('fs');
const filepath = 'src/components/DocumentForm.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

const oldInput = `<input
                type="url"
                value={formData.linkKonten}
                onChange={e => handleChange('linkKonten', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-semibold text-slate-900 outline-none transition bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom F di Google Sheet.</p>`;

const newInput = `<textarea
                rows={3}
                value={formData.linkKonten}
                onChange={e => handleChange('linkKonten', e.target.value)}
                placeholder="https://...&#10;https://... (Pisahkan dengan Enter untuk input multi-link)"
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-semibold text-slate-900 outline-none transition bg-white resize-y"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom F. Input banyak link akan otomatis dibuatkan baris/entri terpisah.</p>`;

code = code.replace(oldInput, newInput);
fs.writeFileSync(filepath, code);
