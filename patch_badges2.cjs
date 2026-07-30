const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf-8');
  
  if (!code.includes("import { WebsiteLogo }")) {
    code = "import { WebsiteLogo } from './WebsiteLogo';\n" + code;
  }

  const startStr = "const getWebsiteBadge = (website?: string) => {";
  const endStr = "  };";
  const startIndex = code.indexOf(startStr);
  
  if (startIndex !== -1) {
    let endIndex = code.indexOf(endStr, startIndex);
    if (endIndex !== -1) {
      endIndex += endStr.length;
      const newFunc = `const getWebsiteBadge = (website?: string) => {
    const web = (website || 'studiobet78').toLowerCase();
    return (
      <span className="px-2 py-1 rounded-md border border-slate-200 bg-white shadow-sm flex items-center justify-center w-24">
        <WebsiteLogo website={web} className="h-4 object-contain" />
      </span>
    );
  };`;
      code = code.substring(0, startIndex) + newFunc + code.substring(endIndex);
    }
  }

  // Also replace `<span>🎰 {web}</span>` with logo inside DocumentForm.tsx
  // and DocumentList `<option value={web}>🎰 {web}</option>` - wait, option tags cannot contain images!
  // So inside <select>, we cannot use logos! We just leave option as `🎰 {web}` or just `{web}`.
  
  fs.writeFileSync(filepath, code);
}

patchFile('src/components/DocumentList.tsx');
patchFile('src/components/IdReffManager.tsx');
