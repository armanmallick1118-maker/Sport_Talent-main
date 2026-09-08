// backend/ai/alertSystem.js
function detectAlerts(labReports, vitals, user) {
  const alerts = [];
  
  if (labReports && labReports.length > 0) {
    const latest = labReports[0];
    let biomarkers = [];
    try { biomarkers = JSON.parse(latest.biomarkers); } catch(e) {}
    
    biomarkers.forEach(b => {
      const val = parseFloat(b.value);
      if (b.name === 'Vitamin D' && val < 30) {
        alerts.push({ type: 'Vitamin D', message: `Vitamin D DEFICIENT (${val} ng/mL)`, severity: 'critical' });
      }
      if (b.name === 'LDL' && val > 130) {
        alerts.push({ type: 'LDL Cholesterol', message: `LDL is elevated (${val} mg/dL)`, severity: 'warning' });
      }
    });
  }

  if (vitals && vitals.length > 0) {
    const avgSleep = vitals.reduce((acc, v) => acc + (v.sleep_hrs || 0), 0) / vitals.length;
    if (avgSleep < 6) {
      alerts.push({ type: 'Sleep', message: `Sleep averaging ${avgSleep.toFixed(1)} hrs — recovery is compromised`, severity: 'warning' });
    }
  }

  return alerts;
}

module.exports = { detectAlerts };
