const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf-8');
  
  if (!code.includes("import { WebsiteLogo }")) {
    code = code.replace("import React", "import React from 'react';\nimport { WebsiteLogo } from './WebsiteLogo';\nimport ");
    if (!code.includes("import { WebsiteLogo }")) {
        code = "import { WebsiteLogo } from './WebsiteLogo';\n" + code;
    }
  }

  code = code.replace(/const getWebsiteBadge = \(\(website\?\: string\)\)?.*?=> {[\s\S]*?};/g, `const getWebsiteBadge = (website?: string) => {
    const web = (website || 'studiobet78').toLowerCase();
    return (
      <span className="px-2 py-1 rounded-md border border-slate-200 bg-white shadow-sm flex items-center justify-center min-w-[80px]">
        <WebsiteLogo website={web} />
      </span>
    );
  };`);

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/DocumentList.tsx');
patchFile('src/components/IdReffManager.tsx');
