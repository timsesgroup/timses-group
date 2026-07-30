const fs = require('fs');

function replaceText(file, replacements) {
    let content = fs.readFileSync(file, 'utf-8');
    for (const [oldText, newText] of replacements) {
        content = content.split(oldText).join(newText);
    }
    fs.writeFileSync(file, content);
}

replaceText('src/components/DocumentForm.tsx', [
    ['Jenis Konten', 'Jenis Akun'],
    ['Konten, PLATFORM', 'Akun, PLATFORM'],
    ['Pilih Jenis Konten', 'Pilih Jenis Akun']
]);

replaceText('src/components/AnalyticsDashboard.tsx', [
    ['Jenis Konten', 'Jenis Akun']
]);

replaceText('src/components/DocumentList.tsx', [
    ['Jenis Konten', 'Jenis Akun'],
    ['Konten (Kolom A)', 'Akun (Kolom A)'],
    ['Konten Filter', 'Akun Filter']
]);

replaceText('src/components/IdReffManager.tsx', [
    ['Jenis Konten', 'Jenis Akun'],
    ['Daftar Konten Akun', 'Daftar Akun']
]);

