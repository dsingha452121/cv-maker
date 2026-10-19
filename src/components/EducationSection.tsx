import React from 'react';
import { EducationRow } from '../types/biodata';
import { calculatePercentage, isValidNumericInput } from '../utils/calculator';
import { GraduationCap, Plus, Trash2, AlertCircle } from 'lucide-react';

interface EducationSectionProps {
  rows: EducationRow[];
  onChange: (rows: EducationRow[]) => void;
}

const COMMON_EXAMS = [
  '10th / Secondary / Matric',
  '12th / Higher Secondary / Intermediate',
  'Graduation (B.A. / B.Sc. / B.Com / B.Tech / BCA)',
  'Post Graduation (M.A. / M.Sc. / M.Com / MCA / MBA)',
  'Diploma (Polytechnic / Engineering)',
  'ITI (Industrial Training)',
  'B.Ed / D.El.Ed',
  'Other Qualification',
];

export const EducationSection: React.FC<EducationSectionProps> = ({
  rows,
  onChange,
}) => {
  const updateRow = (id: string, field: keyof EducationRow, value: any) => {
    const updated = rows.map((row) => {
      if (row.id !== id) return row;

      const newRow: EducationRow = { ...row, [field]: value };

      // When Marks Obtained or Total Marks changes, auto calculate percentage if not in manual mode
      if (field === 'marksObtained' || field === 'totalMarks') {
        const total = field === 'totalMarks' ? String(value) : row.totalMarks;
        const obtained = field === 'marksObtained' ? String(value) : row.marksObtained;

        if (!newRow.isManualPercentage) {
          if (total && obtained) {
            newRow.percentage = calculatePercentage(obtained, total);
          } else {
            newRow.percentage = '';
          }
        }
      }

      // If user toggles manual mode off, recalculate percentage from current marks
      if (field === 'isManualPercentage') {
        if (!value) {
          // Manual mode turned OFF -> recalculate from marks
          if (newRow.totalMarks && newRow.marksObtained) {
            newRow.percentage = calculatePercentage(newRow.marksObtained, newRow.totalMarks);
          } else {
            newRow.percentage = '';
          }
        }
      }

      return newRow;
    });

    onChange(updated);
  };

  const handleNumericMarksChange = (
    id: string,
    field: 'totalMarks' | 'marksObtained',
    val: string
  ) => {
    if (isValidNumericInput(val)) {
      updateRow(id, field, val);
    }
  };

  const handleManualPercentageChange = (id: string, val: string) => {
    if (isValidNumericInput(val)) {
      updateRow(id, 'manualPercentage', val);
    }
  };

  const addRow = (defaultExam = '') => {
    const newRow: EducationRow = {
      id: `edu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examination: defaultExam,
      boardUniversity: '',
      year: '',
      totalMarks: '',
      marksObtained: '',
      percentage: '',
      isManualPercentage: false,
      manualPercentage: '',
    };
    onChange([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      // Clear fields if last row is removed
      const cleared = rows.map((r) =>
        r.id === id
          ? {
              ...r,
              examination: '',
              boardUniversity: '',
              year: '',
              totalMarks: '',
              marksObtained: '',
              percentage: '',
              isManualPercentage: false,
              manualPercentage: '',
            }
          : r
      );
      onChange(cleared);
      return;
    }
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              2. Education Qualification
            </h2>
            <p className="text-xs text-slate-500">
              Add qualifications. Marks fields support direct typing with automatic percentage calculation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => addRow()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Education Row
        </button>
      </div>

      {/* Rows Container */}
      <div className="space-y-5">
        {rows.map((row, index) => {
          const obtainedNum = parseFloat(row.marksObtained);
          const totalNum = parseFloat(row.totalMarks);
          const hasExceededMarks =
            !isNaN(obtainedNum) && !isNaN(totalNum) && totalNum > 0 && obtainedNum > totalNum;
          const hasZeroTotal =
            row.totalMarks.trim() !== '' && !isNaN(totalNum) && totalNum <= 0;

          const manualPctNum = parseFloat(row.manualPercentage || '');
          const isManualPctInvalid =
            row.isManualPercentage &&
            (row.manualPercentage || '').trim() !== '' &&
            (!isNaN(manualPctNum) ? manualPctNum < 0 || manualPctNum > 100 : true);

          return (
            <div
              key={row.id}
              className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">
                    {index + 1}
                  </span>
                  Qualification #{index + 1}
                </span>

                <div className="flex items-center gap-3">
                  {/* Toggle Enter Percentage Manually */}
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!row.isManualPercentage}
                      onChange={(e) =>
                        updateRow(row.id, 'isManualPercentage', e.target.checked)
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-slate-600 hover:text-slate-800">
                      Enter Percentage Manually
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    title="Remove this qualification"
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Examination */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Examination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    list={`exams-${row.id}`}
                    value={row.examination}
                    onChange={(e) => updateRow(row.id, 'examination', e.target.value)}
                    placeholder="e.g. 10th / Matric"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                  <datalist id={`exams-${row.id}`}>
                    {COMMON_EXAMS.map((exam) => (
                      <option key={exam} value={exam} />
                    ))}
                  </datalist>
                </div>

                {/* Board / University */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Board / University <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={row.boardUniversity}
                    onChange={(e) => updateRow(row.id, 'boardUniversity', e.target.value)}
                    placeholder="e.g. CBSE / State Board"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Year of Passing */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={row.year}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        updateRow(row.id, 'year', e.target.value);
                      }
                    }}
                    placeholder="2018"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-center"
                  />
                </div>

                {/* Total Marks (Text entry with decimal inputMode, no arrows) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Total
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={row.totalMarks}
                    onChange={(e) =>
                      handleNumericMarksChange(row.id, 'totalMarks', e.target.value)
                    }
                    placeholder="700"
                    className={`w-full px-2 py-1.5 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-center ${
                      hasZeroTotal ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                </div>

                {/* Marks Obtained (Text entry with decimal inputMode, no arrows) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Obtained
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={row.marksObtained}
                    onChange={(e) =>
                      handleNumericMarksChange(row.id, 'marksObtained', e.target.value)
                    }
                    placeholder="233"
                    className={`w-full px-2 py-1.5 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-center ${
                      hasExceededMarks ? 'border-amber-400 bg-amber-50' : 'border-slate-300'
                    }`}
                  />
                </div>

                {/* Percentage: Automatic OR Manual */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate">
                    {row.isManualPercentage ? '% (Manual)' : '% (Auto)'}
                  </label>

                  {row.isManualPercentage ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.manualPercentage || ''}
                      onChange={(e) =>
                        handleManualPercentageChange(row.id, e.target.value)
                      }
                      placeholder="e.g. 75.5"
                      className={`w-full px-2 py-1.5 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-center font-semibold ${
                        isManualPctInvalid
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-indigo-300 text-indigo-900'
                      }`}
                    />
                  ) : (
                    <div className="w-full px-1.5 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-indigo-50/70 font-semibold text-indigo-950 text-center select-none truncate">
                      {row.percentage ? row.percentage : '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Feedback Messages */}
              {hasExceededMarks && (
                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Marks Obtained ({row.marksObtained}) exceeds Total Marks ({row.totalMarks}). Please check your entry.
                  </span>
                </div>
              )}

              {hasZeroTotal && (
                <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/80 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Total Marks must be greater than zero to calculate percentage.</span>
                </div>
              )}

              {isManualPctInvalid && (
                <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/80 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Please enter a valid percentage between 0 and 100.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Add Suggestions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Quick add:</span>
        {['10th / Matric', '12th / Intermediate', 'Graduation', 'Post Graduation', 'ITI / Diploma'].map(
          (quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => addRow(quick)}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
            >
              + {quick}
            </button>
          )
        )}
      </div>
    </div>
  );
};
