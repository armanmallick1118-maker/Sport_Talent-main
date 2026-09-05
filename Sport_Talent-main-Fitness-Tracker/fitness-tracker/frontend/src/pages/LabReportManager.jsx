import React, { useEffect, useState } from 'react';
import { getLabReports, submitLabReport, getUser } from '../services/healthApi';
import { LAB_PANELS } from '../utils/biomarkerRanges';
import { ActivitySquare, Plus, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function LabReportManager() {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('healthUserId');
  
  const [panelName, setPanelName] = useState('Hematology (CBC)');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [userRes, reportsRes] = await Promise.all([
        getUser(userId),
        getLabReports(userId)
      ]);
      setUser(userRes.user);
      setReports(reportsRes.reports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleValueChange = (name, val) => {
    setValues({ ...values, [name]: val });
  };

  const getStatus = (valStr, biomarker, userGender) => {
    if (!valStr || valStr.trim() === '') return 'unknown';
    
    if (biomarker.type === 'qualitative') {
      const isExpected = biomarker.expected.some(
        exp => valStr.toLowerCase().trim() === exp.toLowerCase()
      );
      return isExpected ? 'normal' : 'high'; // 'high' conceptually just means 'issue' for qualitative
    }

    const val = parseFloat(valStr);
    if (isNaN(val)) return 'unknown';

    const genderKey = userGender?.toLowerCase() === 'female' ? 'female' : 'male';
    const ranges = biomarker.ranges[genderKey] || biomarker.ranges.all;

    if (!ranges) return 'unknown';

    if (ranges.min !== undefined && val < ranges.min) return 'low';
    if (ranges.max !== undefined && val > ranges.max) return 'high';
    
    return 'normal';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const biomarkers = LAB_PANELS[panelName].map(b => {
      const val = values[b.name];
      if (!val || val.trim() === '') return null;
      return {
        name: b.name,
        unit: b.unit || '',
        value: val,
        status: getStatus(val, b, user?.gender),
        ref_desc: b.desc
      };
    }).filter(b => b !== null); // only submit filled ones

    if (biomarkers.length === 0) return alert('Enter at least one biomarker');

    try {
      await submitLabReport({
        user_id: userId,
        test_date: testDate,
        panel_name: panelName,
        biomarkers: biomarkers
      });
      setValues({});
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} color="var(--accent-green)" /> Add New Report
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Panel</label>
              <select value={panelName} onChange={e => { setPanelName(e.target.value); setValues({}); }}>
                {Object.keys(LAB_PANELS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Biomarker</th>
                  <th style={{ padding: 10, textAlign: 'left', width: 120 }}>Value</th>
                  <th style={{ padding: 10, textAlign: 'center', width: 40 }}>St</th>
                </tr>
              </thead>
              <tbody>
                {LAB_PANELS[panelName].map(b => {
                  const status = getStatus(values[b.name], b, user?.gender);
                  return (
                    <tr key={b.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 10 }}>
                        <div style={{ color: 'white' }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.desc} {b.unit}</div>
                      </td>
                      <td style={{ padding: 10 }}>
                        <input 
                          type={b.type === 'numeric' ? "number" : "text"}
                          step={b.type === 'numeric' ? "any" : undefined}
                          placeholder={b.type === 'qualitative' ? "e.g. Negative" : ""}
                          value={values[b.name] || ''}
                          onChange={e => handleValueChange(b.name, e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13, background: 'var(--bg-primary)' }}
                        />
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        {status === 'normal' && <CheckCircle2 size={16} color="var(--accent-green)" />}
                        {status === 'low' && <AlertCircle size={16} color="var(--accent-blue)" />}
                        {status === 'high' && <AlertTriangle size={16} color="var(--accent-red)" />}
                        {status === 'unknown' && <div style={{ width: 16, height: 16, borderRadius: 8, border: '1px solid var(--text-muted)' }}/>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button type="submit" className="btn-primary" style={{ background: 'var(--accent-green)' }}>Save Report</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>History</h2>
        {reports.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No reports logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map(r => {
              let bio = [];
              try { bio = JSON.parse(r.biomarkers); } catch(e){}
              const normalCount = bio.filter(b => b.status === 'normal').length;
              const issuesCount = bio.length - normalCount;
              return (
                <div key={r.id} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16 }}>
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{r.panel_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(r.test_date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span className="badge badge-green">{normalCount} Normal</span>
                    {issuesCount > 0 && <span className="badge badge-red">{issuesCount} Issues</span>}
                  </div>
                  
                  {/* Detailed view of issues could go here */}
                  {issuesCount > 0 && (
                     <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {bio.filter(b => b.status !== 'normal').map((b, i) => (
                           <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                             <AlertTriangle size={10} color="var(--accent-red)" style={{ marginRight: 4, display: 'inline-block' }} />
                             {b.name}: {b.value} {b.unit} ({b.status})
                           </div>
                        ))}
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
