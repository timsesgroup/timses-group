const fs = require('fs');
const filepath = 'src/components/DocumentForm.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

const oldHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idReff.trim()) {
      alert('Mohon isi ID REFF / Nama Pengguna.');
      return;
    }

    setIsSubmitting(true);
    setLastResponse(null);

    try {
      const payload: FormSubmissionPayload = {
        ...formData,
        konten: formData.konten || 'BRANDING',
        platform: formData.platform || 'INSTAGRAM',
        status: formData.status || 'Dipublikasikan',
        tanggalPostingan: formatIsoToDateStr(formData.tanggalPostingan),
        notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
      };

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: SyncResponse = await res.json();
      setLastResponse(data);

      if (data.success) {
        localStorage.removeItem('content_form_draft');
        onSubmitSuccess(data);

        setFormData({
          ...initialFormState,
          website: formData.website,
          notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
        });
      }
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: err.message || 'Gagal mengirim data akun ke server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };`;

const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idReff.trim()) {
      alert('Mohon isi ID REFF / Nama Pengguna.');
      return;
    }

    setIsSubmitting(true);
    setLastResponse(null);

    try {
      const links = (formData.linkKonten || '').split('\\n').map(l => l.trim()).filter(l => l);
      if (links.length === 0) links.push(''); // Minimal satu entri kalau kosong

      let finalResData: SyncResponse | null = null;
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const link of links) {
        const payload: FormSubmissionPayload = {
          ...formData,
          linkKonten: link,
          konten: formData.konten || 'BRANDING',
          platform: formData.platform || 'INSTAGRAM',
          status: formData.status || 'Dipublikasikan',
          tanggalPostingan: formatIsoToDateStr(formData.tanggalPostingan),
          notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
        };

        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data: SyncResponse = await res.json();
        finalResData = data;
        
        if (data.success) {
           totalSuccess++;
        } else {
           totalFailed++;
        }
      }

      if (finalResData) {
        if (links.length > 1) {
          finalResData.message = \`Berhasil menyimpan \${totalSuccess} link sebagai entri terpisah.\${totalFailed > 0 ? \` (\${totalFailed} gagal)\` : ''}\`;
          if (totalSuccess > 0) finalResData.success = true;
        }
        
        setLastResponse(finalResData);

        if (finalResData.success) {
          localStorage.removeItem('content_form_draft');
          onSubmitSuccess(finalResData);

          setFormData({
            ...initialFormState,
            website: formData.website,
            notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
          });
        }
      }
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: err.message || 'Gagal mengirim data akun ke server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };`;

code = code.replace(oldHandleSubmit, newHandleSubmit);
fs.writeFileSync(filepath, code);
