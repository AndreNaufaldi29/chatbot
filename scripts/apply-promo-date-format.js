const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.jsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Update initial state promos
content = content.replace("valid_until: 'Akhir Bulan Ini'", "valid_until: '01/11/2026 sampai 30/11/2026'");
content = content.replace("valid_until: 'Stok Terbatas'", "valid_until: '01/11/2026 sampai 15/12/2026'");
content = content.replace("valid_until: 'Berlaku Selama Kuota Ada'", "valid_until: '01/11/2026 sampai 31/12/2026'");
content = content.replace("valid_until: 'Setiap Hari'", "valid_until: '01/11/2026 sampai 31/12/2026'");
content = content.replace("valid_until: 'Akhir Bulan'", "valid_until: '01/11/2026 sampai 30/11/2026'");

console.log('Updated initial state promos');

// 2. Add promoStartDate, promoEndDate, and date helpers
const targetPromoState = `  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    id: '',
    title: '',
    discount: '',
    desc: '',
    badge: 'Spesial',
    valid_until: '01/11/2026 sampai 30/11/2026'
  });
  const [editingPromoIndex, setEditingPromoIndex] = useState(null);`;

const replacePromoState = `  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');

  // Helper: parse "DD/MM/YYYY" to "YYYY-MM-DD"
  const parseDMYtoYMD = (dmy) => {
    if (!dmy) return '';
    const match = String(dmy).trim().match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return \`\${year}-\${month}-\${day}\`;
    }
    return '';
  };

  // Helper: format "YYYY-MM-DD" to "DD/MM/YYYY"
  const formatYMDtoDMY = (ymd) => {
    if (!ymd) return '';
    const parts = String(ymd).split('-');
    if (parts.length === 3) {
      return \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
    }
    return ymd;
  };

  // Helper to update promoForm.valid_until from start and end dates
  const handlePromoDateRangeChange = (startYMD, endYMD) => {
    setPromoStartDate(startYMD);
    setPromoEndDate(endYMD);
    if (startYMD && endYMD) {
      const startDMY = formatYMDtoDMY(startYMD);
      const endDMY = formatYMDtoDMY(endYMD);
      setPromoForm((prev) => ({ ...prev, valid_until: \`\${startDMY} sampai \${endDMY}\` }));
    } else if (startYMD) {
      setPromoForm((prev) => ({ ...prev, valid_until: formatYMDtoDMY(startYMD) }));
    }
  };

  const [promoForm, setPromoForm] = useState({
    id: '',
    title: '',
    discount: '',
    desc: '',
    badge: 'Spesial',
    valid_until: '01/11/2026 sampai 30/11/2026'
  });
  const [editingPromoIndex, setEditingPromoIndex] = useState(null);`;

if (content.includes(targetPromoState)) {
  content = content.replace(targetPromoState, replacePromoState);
  console.log('Added date helpers and states');
} else {
  console.error('Could not find targetPromoState');
}

// 3. Update "Tambah Promo Baru" button onClick
const targetAddPromo = `                  onClick={() => {
                    setEditingPromoIndex(null);
                    setPromoForm({
                      id: '',
                      title: '',
                      discount: '',
                      desc: '',
                      badge: 'Spesial',
                      valid_until: '01/11/2026 sampai 30/11/2026'
                    });
                    setShowPromoModal(true);
                  }}`;

const replaceAddPromo = `                  onClick={() => {
                    setEditingPromoIndex(null);
                    setPromoStartDate('2026-11-01');
                    setPromoEndDate('2026-11-30');
                    setPromoForm({
                      id: '',
                      title: '',
                      discount: '',
                      desc: '',
                      badge: 'Spesial',
                      valid_until: '01/11/2026 sampai 30/11/2026'
                    });
                    setShowPromoModal(true);
                  }}`;

if (content.includes(targetAddPromo)) {
  content = content.replace(targetAddPromo, replaceAddPromo);
  console.log('Updated Tambah Promo Baru onClick');
}

// 4. Update "Edit Promo" button onClick
const targetEditPromo = `                        <button
                          onClick={() => {
                            setEditingPromoIndex(idx);
                            setPromoForm(promo);
                            setShowPromoModal(true);
                          }}`;

const replaceEditPromo = `                        <button
                          onClick={() => {
                            setEditingPromoIndex(idx);
                            setPromoForm(promo);
                            const parts = (promo.valid_until || '').split(/\\s*(?:sampai|-|s\\/d)\\s*/i);
                            setPromoStartDate(parseDMYtoYMD(parts[0]) || '');
                            setPromoEndDate(parseDMYtoYMD(parts[1]) || '');
                            setShowPromoModal(true);
                          }}`;

if (content.includes(targetEditPromo)) {
  content = content.replace(targetEditPromo, replaceEditPromo);
  console.log('Updated Edit Promo onClick');
}

// 5. Update Promo Modal Form field for Masa Berlaku
const targetModalField = `              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Masa Berlaku</label>
                <input
                  type="text"
                  value={promoForm.valid_until}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, valid_until: e.target.value }))}
                  placeholder="Contoh: Akhir Bulan Ini / Stok Terbatas"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>`;

const replaceModalField = `              <div className="space-y-2">
                <label className="text-slate-100 font-semibold flex items-center justify-between text-xs">
                  <span>Masa Berlaku Promo</span>
                  <span className="text-[11px] text-rose-400 font-mono">
                    Format: DD/MM/YYYY sampai DD/MM/YYYY
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Dari Tanggal (Mulai):</span>
                    <input
                      type="date"
                      value={promoStartDate}
                      onChange={(e) => handlePromoDateRangeChange(e.target.value, promoEndDate)}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Sampai Tanggal (Berakhir):</span>
                    <input
                      type="date"
                      value={promoEndDate}
                      onChange={(e) => handlePromoDateRangeChange(promoStartDate, e.target.value)}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    value={promoForm.valid_until}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPromoForm((prev) => ({ ...prev, valid_until: val }));
                      const parts = val.split(/\\s*(?:sampai|-|s\\/d)\\s*/i);
                      if (parts[0]) setPromoStartDate(parseDMYtoYMD(parts[0]));
                      if (parts[1]) setPromoEndDate(parseDMYtoYMD(parts[1]));
                    }}
                    placeholder="01/11/2026 sampai 30/11/2026"
                    className="w-full rounded-xl bg-[#181A1F]/60 border border-white/[0.07] px-3 py-2 text-slate-100 text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>`;

if (content.includes(targetModalField)) {
  content = content.replace(targetModalField, replaceModalField);
  console.log('Updated Masa Berlaku field in Promo Modal');
} else {
  console.error('Could not find targetModalField');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Saved page.jsx with updated Promo Date Format!');

