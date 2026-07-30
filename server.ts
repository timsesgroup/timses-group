import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  getOAuth2Client,
  loadLocalEntries,
  saveLocalEntries,
  appendToGoogleSheet,
  updateGoogleSheetRow,
  deleteGoogleSheetRow,
  fetchGoogleSheetRows,
  sendNotificationEmail
} from './server/googleServices.ts';
import type { DocumentEntry, FormSubmissionPayload, AppSettings, DashboardSummary, DailyStat, DistributionStat } from './src/types.ts';

const SETTINGS_FILE = path.join(process.cwd(), 'app_settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  spreadsheetId: '1YOdn-LDDYayVTqhb2KeXJ2OPnZdwhi4mrDZRKeK_FtY',
  sheetName: 'Sheet1',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbykk73yuNeZxdyPNjW_B0cbXD1wY5tEpP_DfvMc4IYX-k5EMQUOZ9uMx3YqR5wpokmYHA/exec',
  defaultNotificationEmail: 'geminitimses@gmail.com',
  enableAutoEmail: true,
  emailSubjectTemplate: '[Ex TIMSES] Akun Baru: {title} ({category})',
  emailBodyTemplate: 'Notifikasi otomatis akun.',
  autoSyncToSheet: true,
  senderName: 'Ex TIMSES'
};

function loadSettings(): AppSettings {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load app settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  let entries = loadLocalEntries();
  let settings = loadSettings();

  // Initial attempt to sync directly from Google Sheet on startup
  fetchGoogleSheetRows(settings.spreadsheetId)
    .then(result => {
      if (result.success && result.entries && result.entries.length > 0) {
        entries = result.entries;
        saveLocalEntries(entries);
        console.log(`[DocuSheet Server] Successfully pre-fetched ${entries.length} rows from Google Sheet ${settings.spreadsheetId}`);
      }
    })
    .catch(err => {
      console.warn('[DocuSheet Server] Initial Google Sheet sync attempt failed:', err.message);
    });

  // API ROUTES
  app.get('/api/health', (req, res) => {
    const oauthAvailable = !!getOAuth2Client();
    res.json({
      status: 'ok',
      oauthConnected: oauthAvailable,
      spreadsheetId: settings.spreadsheetId,
      hasAppsScriptUrl: !!settings.appsScriptUrl,
      time: new Date().toISOString()
    });
  });

  // GET Settings
  app.get('/api/settings', (req, res) => {
    res.json(settings);
  });

  // POST Settings
  app.post('/api/settings', (req, res) => {
    const updated = { ...settings, ...req.body };
    settings = updated;
    saveSettings(settings);
    res.json({ success: true, settings });
  });

  // GET Documents List
  app.get('/api/documents', async (req, res) => {
    res.json({ success: true, count: entries.length, entries });
  });

  // POST Sync from Google Sheets
  app.post('/api/documents/sync-sheet', async (req, res) => {
    try {
      const result = await fetchGoogleSheetRows(settings.spreadsheetId);
      if (result.success && result.entries) {
        entries = result.entries;
        saveLocalEntries(entries);
        return res.json({ success: true, count: entries.length, entries, message: `Berhasil menyinkronkan ${entries.length} data akun sama persis dari Google Sheets.` });
      } else {
        return res.json({
          success: false,
          message: result.error || 'Gagal sinkronisasi data dari Google Sheet.',
          entries
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Gagal sinkronisasi dari Google Sheet' });
    }
  });

  // POST Submit Document / Content Entry
  app.post('/api/documents', async (req, res) => {
    try {
      const payload: FormSubmissionPayload = req.body;
      const konten = payload.konten || (req.body.category as string) || 'BRANDING';
      const platform = payload.platform || (req.body.recipient as string) || 'INSTAGRAM';
      const idReff = payload.idReff || (req.body.submitter as string) || 'miya0812';
      const status = payload.status || 'Dipublikasikan';
      const tanggalPostingan = payload.tanggalPostingan || (req.body.docDate as string) || new Date().toLocaleDateString('id-ID');
      const linkKonten = payload.linkKonten || (req.body.attachmentUrl as string) || '';
      const catatan = payload.catatan || (req.body.notes as string) || '';

      const website = payload.website || (req.body.website as string) || 'studiobet78';

      const docId = `POST-${202600 + entries.length + 1}`;
      const nowIso = new Date().toISOString();

      const newEntry: DocumentEntry = {
        id: docId,
        timestamp: nowIso,
        konten,
        platform,
        idReff,
        status,
        tanggalPostingan,
        linkKonten,
        catatan,
        website,

        // UI compatibility properties
        title: `${konten} - ${platform} (${idReff})`,
        category: konten,
        refNumber: idReff,
        submitter: idReff,
        recipient: platform,
        amount: 0,
        priority: status === 'Dipublikasikan' ? 'Rendah' : 'Tinggi',
        docDate: tanggalPostingan,
        notes: catatan,
        attachmentUrl: linkKonten,
        notificationEmail: payload.notificationEmail || settings.defaultNotificationEmail,
        syncedToSheet: false,
        emailSent: false
      };

      // Save to local list immediately
      entries.unshift(newEntry);
      saveLocalEntries(entries);

      // Respond immediately to UI
      res.json({
        success: true,
        message: 'Konten berhasil tersimpan! Proses sinkronisasi berjalan di latar belakang.',
        entry: newEntry
      });

      // Background Processing (Google Sheets, Apps Script, Email)
      (async () => {
        let sheetSyncResult: { success: boolean; error?: string; rowNumber?: number } = { success: false, error: '', rowNumber: undefined };
        let emailResult: { success: boolean; error?: string } = { success: false, error: '' };

        // 1. Direct Google Sheets Sync via OAuth API
        if (settings.autoSyncToSheet && settings.spreadsheetId) {
          sheetSyncResult = await appendToGoogleSheet(settings.spreadsheetId, newEntry);
          if (sheetSyncResult.success) {
            newEntry.syncedToSheet = true;
            if (sheetSyncResult.rowNumber) {
              newEntry.sheetRow = sheetSyncResult.rowNumber;
            }
          }
        }

        // 2. Google Apps Script Web App Sync (Backup / Secondary Engine)
        if (settings.appsScriptUrl) {
          try {
            const fetchRes = await fetch(settings.appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'submitDocument',
                document: newEntry,
                sendEmail: settings.enableAutoEmail,
                recipientEmail: newEntry.notificationEmail
              })
            });
            
            const gasText = await fetchRes.text().catch(() => '');
            let gasJson: any = null;
            try {
              gasJson = JSON.parse(gasText);
            } catch (e) {
              // Not JSON
            }

            if (fetchRes.ok || (gasJson && gasJson.status === 'success')) {
              newEntry.syncedViaAppsScript = true;
              newEntry.syncedToSheet = true;
              if (gasJson?.row) {
                sheetSyncResult.rowNumber = gasJson.row;
              }
              if (gasJson?.emailSent) {
                newEntry.emailSent = true;
              }
            } else {
              console.warn('[Apps Script Proxy] Non-ok response:', fetchRes.status, gasText);
            }
          } catch (gasErr: any) {
            console.warn('[Apps Script Proxy] Error connecting to Apps Script URL:', gasErr.message);
          }
        }

        // 3. Automated Email Notification via Gmail API (if not already sent via Apps Script)
        if (settings.enableAutoEmail && newEntry.notificationEmail && !newEntry.emailSent) {
          emailResult = await sendNotificationEmail(newEntry.notificationEmail, newEntry, settings);
          if (emailResult.success) {
            newEntry.emailSent = true;
          }
        }

        // Update entry with sync results in background
        const index = entries.findIndex(e => e.id === newEntry.id);
        if (index !== -1) {
          entries[index] = newEntry;
          saveLocalEntries(entries);
        }
      })();
    } catch (err: any) {
      console.error('Error submitting document:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal memproses data akun.' });
    }
  });

  // PUT Update Document Entry
  app.put('/api/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      }

      const oldEntry = entries[index];
      const updated: DocumentEntry = { 
        ...oldEntry, 
        ...req.body,
        sheetRow: (req.body.sheetRow ? parseInt(String(req.body.sheetRow), 10) : undefined) || oldEntry.sheetRow,
        title: `${req.body.konten || oldEntry.konten} - ${req.body.platform || oldEntry.platform} (${req.body.idReff || oldEntry.idReff})`,
        category: req.body.konten || oldEntry.konten,
        refNumber: req.body.idReff || oldEntry.idReff,
        submitter: req.body.idReff || oldEntry.idReff,
        recipient: req.body.platform || oldEntry.platform,
        docDate: req.body.tanggalPostingan || oldEntry.tanggalPostingan,
        notes: req.body.catatan || oldEntry.catatan,
        attachmentUrl: req.body.linkKonten || oldEntry.linkKonten
      };

      entries[index] = updated;
      saveLocalEntries(entries);

      // Sync to Google Sheets and Apps Script in the background
      (async () => {
        if (settings.autoSyncToSheet && settings.spreadsheetId) {
          try {
            if (oldEntry && oldEntry.website !== updated.website) {
              await deleteGoogleSheetRow(settings.spreadsheetId, oldEntry);
              const appendRes = await appendToGoogleSheet(settings.spreadsheetId, updated);
              if (appendRes.rowNumber) {
                updated.sheetRow = appendRes.rowNumber;
                entries[index] = updated;
                saveLocalEntries(entries);
              }
            } else {
              const updateRes = await updateGoogleSheetRow(settings.spreadsheetId, updated, oldEntry);
              if (updateRes.rowNumber) {
                updated.sheetRow = updateRes.rowNumber;
                entries[index] = updated;
                saveLocalEntries(entries);
              }
            }
          } catch (e: any) {
            console.warn('[Sheet Update Warning]:', e.message);
          }
        }

        if (settings.appsScriptUrl) {
          try {
            if (oldEntry && oldEntry.website !== updated.website) {
              await fetch(settings.appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteDocument', document: oldEntry })
              });
              await fetch(settings.appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'submitDocument', document: updated })
              });
            } else {
              await fetch(settings.appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'updateDocument',
                  document: updated,
                  oldDocument: oldEntry
                })
              });
            }
          } catch (gasErr: any) {
            console.warn('[Apps Script Update Warning]:', gasErr.message);
          }
        }
      })();

      res.json({
        success: true,
        message: 'Data akun berhasil diperbarui!',
        entry: updated,
        entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui akun.' });
    }
  });

  // DELETE Document Entry
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetEntry = entries.find(e => e.id === id);

      if (!targetEntry) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
      }

      // 1. Immediately remove from local entries
      entries = entries.filter(e => e.id !== id);
      saveLocalEntries(entries);

      // 2 & 3. Sync to Google Sheet and Apps Script in the background
      (async () => {
        let sheetWarning = '';
        if (settings.spreadsheetId) {
          try {
            const sheetResult = await deleteGoogleSheetRow(settings.spreadsheetId, targetEntry);
            if (!sheetResult.success || sheetResult.error) {
              sheetWarning = sheetResult.error || 'Data di Google Sheet mungkin tidak terhapus.';
              console.warn('[Google Sheet Delete Warning]:', sheetWarning);
            }
          } catch (err: any) {
            sheetWarning = err?.message || 'Gagal menghapus data di Google Sheet.';
            console.warn('[Google Sheet Delete Exception]:', sheetWarning);
          }
        }

        if (settings.appsScriptUrl) {
          try {
            await fetch(settings.appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'deleteDocument',
                document: targetEntry
              })
            });
          } catch (gasErr: any) {
            console.warn('[Apps Script Delete Warning]:', gasErr.message);
          }
        }
      })();

      return res.json({
        success: true,
        message: `Akun "${targetEntry.konten} - ${targetEntry.platform} (${targetEntry.idReff})" berhasil dihapus!`,
        entries
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus akun.' });
    }
  });

  // POST Add New ID REFF
  app.post('/api/id-reff', (req, res) => {
    try {
      const { idReff, platform, konten, notes, website } = req.body;
      if (!idReff || !idReff.trim()) {
        return res.status(400).json({ success: false, message: 'ID REFF tidak boleh kosong.' });
      }

      const cleanId = idReff.trim();
      const targetWeb = website || 'studiobet78';

      // Check if entry already exists or add a starter entry for this ID REFF
      const nowIso = new Date().toISOString();
      const docId = `POST-${202600 + entries.length + 1}`;

      const newEntry: DocumentEntry = {
        id: docId,
        timestamp: nowIso,
        konten: konten || 'BRANDING',
        platform: platform || 'INSTAGRAM',
        idReff: cleanId,
        status: 'Draft',
        tanggalPostingan: new Date().toLocaleDateString('id-ID'),
        linkKonten: '',
        catatan: notes || 'ID REFF baru terdaftar',
        website: targetWeb,
        title: `${konten || 'BRANDING'} - ${platform || 'INSTAGRAM'} (${cleanId})`,
        category: konten || 'BRANDING',
        refNumber: cleanId,
        submitter: cleanId,
        recipient: platform || 'INSTAGRAM',
        amount: 0,
        priority: 'Rendah',
        docDate: new Date().toLocaleDateString('id-ID'),
        notes: notes || 'ID REFF baru terdaftar',
        syncedToSheet: false,
        emailSent: false
      };

      entries.unshift(newEntry);
      saveLocalEntries(entries);

      res.json({ success: true, message: `ID REFF "${cleanId}" berhasil ditambahkan!`, idReff: cleanId, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal menambahkan ID REFF.' });
    }
  });

  // PUT Edit/Rename ID REFF
  app.put('/api/id-reff/:oldId', (req, res) => {
    try {
      const { oldId } = req.params;
      const { newIdReff } = req.body;

      if (!newIdReff || !newIdReff.trim()) {
        return res.status(400).json({ success: false, message: 'ID REFF baru tidak boleh kosong.' });
      }

      const cleanNewId = newIdReff.trim();
      let updatedCount = 0;

      entries = entries.map(e => {
        if (e.idReff === oldId) {
          updatedCount++;
          return {
            ...e,
            idReff: cleanNewId,
            refNumber: cleanNewId,
            submitter: cleanNewId,
            title: `${e.konten} - ${e.platform} (${cleanNewId})`
          };
        }
        return e;
      });

      saveLocalEntries(entries);

      res.json({
        success: true,
        message: `Berhasil mengubah ID REFF dari "${oldId}" menjadi "${cleanNewId}" pada ${updatedCount} akun!`,
        entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal mengubah ID REFF.' });
    }
  });

  // DELETE ID REFF and all its entries
  app.delete('/api/id-reff/:idReff', (req, res) => {
    try {
      const { idReff } = req.params;
      const initialCount = entries.length;
      entries = entries.filter(e => e.idReff !== idReff);
      const deletedCount = initialCount - entries.length;

      saveLocalEntries(entries);

      res.json({
        success: true,
        message: `Berhasil menghapus ID REFF "${idReff}" beserta ${deletedCount} data akunnya!`,
        entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal menghapus ID REFF.' });
    }
  });

  // GET Statistics Dashboard
  app.get('/api/stats', (req, res) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Daily entries map for last 14 days
    const daysMap = new Map<string, { count: number; publishedCount: number; pendingCount: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      daysMap.set(ds, { count: 0, publishedCount: 0, pendingCount: 0 });
    }

    let totalToday = 0;
    let totalThisWeek = 0;
    let totalThisMonth = 0;
    let pendingCount = 0;
    let publishedCountTotal = 0;

    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const platformCounts: Record<string, number> = {};
    const contentTypeCounts: Record<string, number> = {};
    const idReffCounts: Record<string, number> = {};

    entries.forEach(e => {
      const entryDate = e.docDate || (e.timestamp ? e.timestamp.split('T')[0] : todayStr);
      const isToday = entryDate === todayStr;
      const isThisMonth = entryDate.startsWith(currentMonthPrefix);
      const entryTimestamp = new Date(e.timestamp || e.docDate);

      if (isToday) {
        totalToday += 1;
      }

      if (entryTimestamp >= sevenDaysAgo) {
        totalThisWeek += 1;
      }

      if (isThisMonth) {
        totalThisMonth += 1;
      }

      if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
        publishedCountTotal += 1;
      } else {
        pendingCount += 1;
      }

      // Daily stats
      if (daysMap.has(entryDate)) {
        const item = daysMap.get(entryDate)!;
        item.count += 1;
        if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
          item.publishedCount += 1;
        } else {
          item.pendingCount += 1;
        }
      }

      // Distributions
      const plat = e.platform || e.recipient || 'INSTAGRAM';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;

      const kont = e.konten || e.category || 'BRANDING';
      contentTypeCounts[kont] = (contentTypeCounts[kont] || 0) + 1;

      const ref = e.idReff || e.submitter || '-';
      if (ref && ref !== '-') {
        idReffCounts[ref] = (idReffCounts[ref] || 0) + 1;
      }
    });

    const dailyStats: DailyStat[] = Array.from(daysMap.entries()).map(([dateStr, val]) => {
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return {
        date: dateStr,
        formattedDate,
        count: val.count,
        publishedCount: val.publishedCount,
        pendingCount: val.pendingCount
      };
    });

    const totalAllTime = entries.length;
    
    const platformStats = Object.entries(platformCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
    }));

    const contentTypeStats = Object.entries(contentTypeCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
    }));

    const topAccounts = Object.entries(idReffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
      }));

    const publishedRate = totalAllTime > 0 ? Math.round((publishedCountTotal / totalAllTime) * 100) : 0;

    const summary: DashboardSummary = {
      totalToday,
      totalThisWeek,
      totalThisMonth,
      totalAllTime,
      publishedRate,
      pendingCount,
      publishedCount: publishedCountTotal,
      dailyStats,
      platformStats,
      contentTypeStats,
      topAccounts
    };

    res.json({ success: true, summary });
  });

  // GET Apps Script Code generator
  app.get('/api/apps-script-code', (req, res) => {
    const code = `// ====================================================================
// DOCUSHEET SAAS - GOOGLE APPS SCRIPT REAL-TIME INTEGRATION
// ====================================================================
// Skrip ini dipasang di Google Sheets (Extensions -> Apps Script).
// Menyediakan Endpoint Web App untuk input data otomatis & notifikasi.

const SHEET_NAME = "${settings.sheetName || 'Sheet1'}";
const NOTIFICATION_EMAIL = "${settings.defaultNotificationEmail || 'geminitimses@gmail.com'}";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const doc = data.document || data;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheetName = doc.website || SHEET_NAME;
    let sheet = ss.getSheetByName(targetSheetName) || ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // Buat Header jika sheet kosong (7 Kolom)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Konten',
        'PLATFORM',
        'ID REFF',
        'Status',
        'Tanggal akun',
        'LINK PROFIL',
        'CATATAN'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
    }
    
    const rowValues = [
      doc.konten || doc.category || 'BRANDING',
      doc.platform || doc.recipient || 'INSTAGRAM',
      doc.idReff || doc.submitter || '-',
      doc.status || 'Dipublikasikan',
      doc.tanggalPostingan || doc.docDate || new Date().toLocaleDateString('id-ID'),
      doc.linkKonten || doc.attachmentUrl || '',
      doc.catatan || doc.notes || ''
    ];
    
    // Jika action updateDocument atau deleteDocument: Cari baris yang sesuai secara presisi
    if (data.action === 'updateDocument' || data.action === 'deleteDocument') {
      const dataRows = sheet.getDataRange().getValues();
      const searchDoc = data.oldDocument || doc || {};
      const targetSheetRow = searchDoc.sheetRow || doc.sheetRow || data.sheetRow;
      
      let foundRow = -1;

      // 1. Target langsung menggunakan sheetRow jika tersedia (1-based index)
      const targetRowParsed = parseInt(String(targetSheetRow), 10);
      if (targetRowParsed && !isNaN(targetRowParsed) && targetRowParsed > 1) {
        foundRow = targetRowParsed;
      }

      // 2. Jika belum ketemu, cari pencocokan dengan skor presisi
      if (foundRow === -1) {
        const targetIdReff = (searchDoc.idReff || searchDoc.submitter || '-').toString().trim().toLowerCase();
        const targetPlatform = (searchDoc.platform || searchDoc.recipient || 'INSTAGRAM').toString().trim().toLowerCase();
        const targetKonten = (searchDoc.konten || searchDoc.category || 'BRANDING').toString().trim().toLowerCase();
        const targetTanggal = (searchDoc.tanggalPostingan || searchDoc.docDate || '').toString().trim().toLowerCase();
        const targetLink = (searchDoc.linkKonten || searchDoc.attachmentUrl || '').toString().trim().toLowerCase();
        const targetCatatan = (searchDoc.catatan || searchDoc.notes || '').toString().trim().toLowerCase();

        let highestScore = 0;

        for (let i = 1; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.length === 0) continue;

          const rKonten = (row[0] || '').toString().trim().toLowerCase();
          const rPlatform = (row[1] || '').toString().trim().toLowerCase();
          const rIdReff = (row[2] || '').toString().trim().toLowerCase();
          const rTanggal = (row[4] || '').toString().trim().toLowerCase();
          const rLink = (row[5] || '').toString().trim().toLowerCase();
          const rCatatan = (row[6] || '').toString().trim().toLowerCase();

          if (!rKonten && !rPlatform && !rIdReff && !rLink && !rCatatan) continue;

          let score = 0;

          if (targetLink && rLink) {
            if (rLink === targetLink) score += 50;
            else if (targetLink.indexOf(rLink) !== -1 || rLink.indexOf(targetLink) !== -1) score += 40;
          }

          if (targetIdReff && targetIdReff !== '-' && rIdReff === targetIdReff) {
            score += 20;
          } else if (targetIdReff && targetIdReff !== '-' && rIdReff !== targetIdReff) {
            score -= 30;
          }

          if (targetCatatan && rCatatan) {
            if (rCatatan === targetCatatan) score += 20;
            else if (targetCatatan.indexOf(rCatatan) !== -1 || rCatatan.indexOf(targetCatatan) !== -1) score += 15;
          }

          if (targetTanggal && rTanggal && rTanggal === targetTanggal) score += 10;
          if (targetPlatform && rPlatform === targetPlatform) score += 5;
          if (targetKonten && rKonten === targetKonten) score += 5;

          if (targetSheetRow && typeof targetSheetRow === 'number') {
            const distance = Math.abs((i + 1) - targetSheetRow);
            score += Math.max(0, 25 - distance);
          }

          if (score > highestScore && score >= 15) {
            highestScore = score;
            foundRow = i + 1;
          }
        }
      }
      
      if (foundRow > 0) {
        if (data.action === 'deleteDocument') {
          sheet.getRange(foundRow, 1, 1, 7).clearContent();
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "Data akun berhasil dikosongkan pada baris " + foundRow
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          sheet.getRange(foundRow, 1, 1, 7).setValues([rowValues]);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "Data akun berhasil diperbarui pada baris " + foundRow,
            row: foundRow
          })).setMimeType(ContentService.MimeType.JSON);
        }
      } else if (data.action === 'deleteDocument') {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Data akun tidak ditemukan di sheet untuk dihapus."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      // Jika updateDocument tapi tidak ketemu, akan lanjut ke insert row (di bawah)
    }

    sheet.appendRow(rowValues);
    const newRowIndex = sheet.getLastRow();
    
    // Kirim Email Notifikasi Otomatis
    let emailSent = false;
    const targetEmail = doc.notificationEmail || NOTIFICATION_EMAIL;
    if (targetEmail && data.sendEmail !== false) {
      try {
        const subject = "[Ex TIMSES] Akun: " + (doc.konten || 'BRANDING') + " (" + (doc.platform || 'INSTAGRAM') + ")";
        const body = "Halo,\\n\\nData akun baru berhasil diinput via Web SaaS:\\n\\n" +
          "- Konten: " + (doc.konten || '-') + "\\n" +
          "- Platform: " + (doc.platform || '-') + "\\n" +
          "- ID REFF: " + (doc.idReff || '-') + "\\n" +
          "- Status: " + (doc.status || 'Dipublikasikan') + "\\n" +
          "- Tanggal: " + (doc.tanggalPostingan || '-') + "\\n" +
          "- Link: " + (doc.linkKonten || '-') + "\\n" +
          "- Baris Google Sheet: " + newRowIndex + "\\n\\n" +
          "Silakan buka Google Sheet Anda untuk memeriksa detail selengkapnya.";
          
        MailApp.sendEmail(targetEmail, subject, body);
        emailSent = true;
      } catch (emailErr) {
        Logger.log("Email error: " + emailErr.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data akun berhasil disimpan ke Google Sheet!",
      row: newRowIndex,
      emailSent: emailSent
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Ex TIMSES Google Apps Script Web App Aktif & Siap Menerima Data Akun!");
}
`;
    res.json({ success: true, code });
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ex TIMSES Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
