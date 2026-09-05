export const LAB_PANELS = {
  'Hematology (CBC)': [
    { 
      name: 'Hemoglobin (Hb)', 
      unit: 'g/dL', 
      type: 'numeric',
      ranges: {
        male: { min: 13.5, max: 17.5 },
        female: { min: 12.0, max: 15.5 }
      },
      desc: "Male: 13.5-17.5 | Female: 12.0-15.5"
    },
    { 
      name: 'Total RBC', 
      unit: 'mill/mcL', 
      type: 'numeric',
      ranges: {
        male: { min: 4.5, max: 5.9 },
        female: { min: 4.1, max: 5.1 }
      },
      desc: "Male: 4.5-5.9 | Female: 4.1-5.1"
    },
    { 
      name: 'Total WBC', 
      unit: 'cells/mcL', 
      type: 'numeric',
      ranges: { all: { min: 4000, max: 11000 } },
      desc: "4,000 - 11,000"
    },
    { 
      name: 'Platelet Count', 
      unit: 'cells/mcL', 
      type: 'numeric',
      ranges: { all: { min: 150000, max: 450000 } },
      desc: "150k - 450k"
    },
    { 
      name: 'Hematocrit (PCV)', 
      unit: '%', 
      type: 'numeric',
      ranges: {
        male: { min: 41, max: 50 },
        female: { min: 36, max: 48 }
      },
      desc: "Male: 41-50% | Female: 36-48%"
    },
    { name: 'MCV', unit: 'fL', type: 'numeric', ranges: { all: { min: 80, max: 100 } }, desc: "80 - 100" },
    { name: 'MCH', unit: 'pg', type: 'numeric', ranges: { all: { min: 27, max: 33 } }, desc: "27 - 33" },
    { name: 'MCHC', unit: 'g/dL', type: 'numeric', ranges: { all: { min: 32, max: 36 } }, desc: "32 - 36" },
    { name: 'RDW', unit: '%', type: 'numeric', ranges: { all: { min: 11.5, max: 14.5 } }, desc: "11.5 - 14.5" },
    { name: 'Neutrophils', unit: '%', type: 'numeric', ranges: { all: { min: 40, max: 70 } }, desc: "40 - 70" },
    { name: 'Lymphocytes', unit: '%', type: 'numeric', ranges: { all: { min: 20, max: 40 } }, desc: "20 - 40" },
    { name: 'Monocytes', unit: '%', type: 'numeric', ranges: { all: { min: 2, max: 10 } }, desc: "2 - 10" },
    { name: 'Eosinophils', unit: '%', type: 'numeric', ranges: { all: { min: 1, max: 6 } }, desc: "1 - 6" },
    { name: 'Basophils', unit: '%', type: 'numeric', ranges: { all: { min: 0, max: 1 } }, desc: "0 - 1" }
  ],
  'Diabetes (Blood Sugar)': [
    { name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 70, max: 99 } }, desc: "70 - 99" },
    { name: 'Hemoglobin A1c (HbA1c)', unit: '%', type: 'numeric', ranges: { all: { max: 5.7 } }, desc: "Below 5.7" }
  ],
  'Heart Health (Lipid Profile)': [
    { name: 'Total Cholesterol', unit: 'mg/dL', type: 'numeric', ranges: { all: { max: 200 } }, desc: "< 200" },
    { name: 'LDL ("Bad" Cholesterol)', unit: 'mg/dL', type: 'numeric', ranges: { all: { max: 100 } }, desc: "< 100" },
    { 
      name: 'HDL ("Good" Cholesterol)', 
      unit: 'mg/dL', 
      type: 'numeric',
      ranges: {
        male: { min: 40 },
        female: { min: 50 }
      },
      desc: "Male: >40 | Female: >50"
    },
    { name: 'VLDL Cholesterol', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 2, max: 30 } }, desc: "2 - 30" },
    { name: 'Triglycerides', unit: 'mg/dL', type: 'numeric', ranges: { all: { max: 150 } }, desc: "< 150" },
    { name: 'TC / HDL Ratio', unit: '', type: 'numeric', ranges: { all: { min: 3.5, max: 5.0 } }, desc: "3.5 - 5.0" }
  ],
  'Liver Function (LFT)': [
    { name: 'Total Bilirubin', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 0.1, max: 1.2 } }, desc: "0.1 - 1.2" },
    { name: 'Direct Bilirubin', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 0.0, max: 0.3 } }, desc: "0.0 - 0.3" },
    { name: 'Indirect Bilirubin', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 0.2, max: 0.8 } }, desc: "0.2 - 0.8" },
    { name: 'SGOT (AST)', unit: 'U/L', type: 'numeric', ranges: { all: { min: 8, max: 48 } }, desc: "8 - 48" },
    { name: 'SGPT (ALT)', unit: 'U/L', type: 'numeric', ranges: { all: { min: 7, max: 55 } }, desc: "7 - 55" },
    { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', type: 'numeric', ranges: { all: { min: 40, max: 129 } }, desc: "40 - 129" },
    { name: 'Total Protein', unit: 'g/dL', type: 'numeric', ranges: { all: { min: 6.0, max: 8.3 } }, desc: "6.0 - 8.3" },
    { name: 'Albumin', unit: 'g/dL', type: 'numeric', ranges: { all: { min: 3.5, max: 5.0 } }, desc: "3.5 - 5.0" },
    { name: 'Globulin', unit: 'g/dL', type: 'numeric', ranges: { all: { min: 2.3, max: 3.4 } }, desc: "2.3 - 3.4" },
    { name: 'A/G Ratio', unit: '', type: 'numeric', ranges: { all: { min: 1.1, max: 2.5 } }, desc: "1.1 - 2.5" }
  ],
  'Kidney Function (KFT)': [
    { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 7, max: 20 } }, desc: "7 - 20" },
    { name: 'Creatinine', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 0.6, max: 1.2 } }, desc: "0.6 - 1.2" },
    { 
      name: 'Uric Acid', 
      unit: 'mg/dL', 
      type: 'numeric',
      ranges: {
        male: { min: 3.4, max: 7.0 },
        female: { min: 2.4, max: 6.0 }
      },
      desc: "Male: 3.4-7.0 | Female: 2.4-6.0"
    },
    { name: 'Calcium', unit: 'mg/dL', type: 'numeric', ranges: { all: { min: 8.5, max: 10.2 } }, desc: "8.5 - 10.2" },
    { name: 'Sodium', unit: 'mEq/L', type: 'numeric', ranges: { all: { min: 135, max: 145 } }, desc: "135 - 145" },
    { name: 'Potassium', unit: 'mEq/L', type: 'numeric', ranges: { all: { min: 3.5, max: 5.0 } }, desc: "3.5 - 5.0" },
    { name: 'Chloride', unit: 'mEq/L', type: 'numeric', ranges: { all: { min: 96, max: 106 } }, desc: "96 - 106" }
  ],
  'Iron Studies': [
    { name: 'Total Iron', unit: 'mcg/dL', type: 'numeric', ranges: { all: { min: 60, max: 170 } }, desc: "60 - 170" },
    { name: 'TIBC', unit: 'mcg/dL', type: 'numeric', ranges: { all: { min: 240, max: 450 } }, desc: "240 - 450" },
    { name: 'Transferrin Saturation', unit: '%', type: 'numeric', ranges: { all: { min: 20, max: 50 } }, desc: "20 - 50" }
  ],
  'Thyroid Profile': [
    { name: 'Total T3', unit: 'ng/dL', type: 'numeric', ranges: { all: { min: 70, max: 204 } }, desc: "70 - 204" },
    { name: 'Total T4', unit: 'mcg/dL', type: 'numeric', ranges: { all: { min: 4.6, max: 12.0 } }, desc: "4.6 - 12.0" },
    { name: 'TSH', unit: 'mIU/L', type: 'numeric', ranges: { all: { min: 0.4, max: 4.0 } }, desc: "0.4 - 4.0" }
  ],
  'Vitamins': [
    { name: 'Vitamin B12', unit: 'pg/mL', type: 'numeric', ranges: { all: { min: 200, max: 900 } }, desc: "200 - 900" },
    { name: 'Vitamin D (25-OH)', unit: 'ng/mL', type: 'numeric', ranges: { all: { min: 30, max: 100 } }, desc: "30 - 100" }
  ],
  'Urine Routine Analysis': [
    { name: 'Color', type: 'qualitative', expected: ['pale yellow', 'yellow'], desc: "Pale Yellow" },
    { name: 'Appearance', type: 'qualitative', expected: ['clear'], desc: "Clear" },
    { name: 'pH', unit: '', type: 'numeric', ranges: { all: { min: 4.5, max: 8.0 } }, desc: "4.5 - 8.0" },
    { name: 'Specific Gravity', unit: '', type: 'numeric', ranges: { all: { min: 1.005, max: 1.030 } }, desc: "1.005 - 1.030" },
    { name: 'Protein', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'Glucose', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'Ketones', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'Bilirubin', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'Nitrite', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'Leukocyte Esterase', type: 'qualitative', expected: ['negative', 'nil', 'absent'], desc: "Negative" },
    { name: 'RBCs / Pus Cells', type: 'numeric', ranges: { all: { max: 2 } }, desc: "0 - 2 per HPF", unit: 'HPF' }
  ]
};
