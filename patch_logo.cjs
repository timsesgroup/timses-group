const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

const oldLogo = `<div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0052FF] via-blue-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-[#0052FF]/30 font-bold text-xl transition-transform hover:scale-105">
            <FileSpreadsheet className="w-5 h-5" />
          </div>`;

const newLogo = `<div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-[#0052FF]/30 font-bold text-xl transition-transform hover:scale-105 overflow-hidden">
            <img src="https://storage.googleapis.com/aistudio-chat-prod-b-028f09/49c86915-77da-4e5c-ab4e-a97920ab7183/87cb6002-39c0-43f1-b4ed-3e75e9f82ce6/image.png" alt="Ex TIMSES Logo" className="w-full h-full object-cover" />
          </div>`;

code = code.replace(oldLogo, newLogo);
fs.writeFileSync('src/components/Navbar.tsx', code);

let html = fs.readFileSync('index.html', 'utf-8');
const iconTag = `<link rel="icon" type="image/png" href="https://storage.googleapis.com/aistudio-chat-prod-b-028f09/49c86915-77da-4e5c-ab4e-a97920ab7183/87cb6002-39c0-43f1-b4ed-3e75e9f82ce6/image.png" />`;
if (!html.includes('rel="icon"')) {
    html = html.replace('</title>', '</title>\\n    ' + iconTag);
} else {
    html = html.replace(/<link rel="icon".*?>/, iconTag);
}
fs.writeFileSync('index.html', html);

