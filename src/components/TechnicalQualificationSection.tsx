import React from 'react';
import { TechnicalRow } from '../types/biodata';
import { Award, Plus, Trash2 } from 'lucide-react';

interface TechnicalQualificationSectionProps {
  rows: TechnicalRow[];
  onChange: (rows: TechnicalRow[]) => void;
}

export const TechnicalQualificationSection: React.FC<TechnicalQualificationSectionProps> = ({
  rows,
  onChange,
}) => {
  const updateRow = (id: string, field: keyof TechnicalRow, value: string) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const addRow = () => {
    const newRow: TechnicalRow = {
      id: `tech-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      courseName: '',
      institute: '',
      duration: '',
      year: '',
      details: '',
    };
    onChange([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                3. Technical Qualification / Internship / Certificate
              </h2>
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Computer courses (DCA, ADCA, Tally, CCC, Java, Web Dev), vocational training or certificates
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Technical Qualification
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-xs text-slate-500 mb-3">
            No technical qualifications or certificates added yet.
            (This section is hidden from the CV until you add entries).
          </p>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Technical Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">
                    {index + 1}
                  </span>
                  Certificate / Course #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  title="Remove this entry"
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                {/* Qualification / Course Name */}
                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Course / Certificate Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === 'dca') {
                          updateRow(row.id, 'courseName', 'Diploma in Computer Application (DCA)');
                          if (!row.duration) updateRow(row.id, 'duration', '6 Months');
                          if (!row.details) updateRow(row.id, 'details', 'MS Word, Excel, PowerPoint, Windows OS & Internet');
                        } else if (val === 'adca') {
                          updateRow(row.id, 'courseName', 'Advanced Diploma in Computer Application (ADCA)');
                          if (!row.duration) updateRow(row.id, 'duration', '1 Year');
                          if (!row.details) updateRow(row.id, 'details', 'MS Office, Tally Prime, Internet & Graphic Basics');
                        } else if (val === 'tally') {
                          updateRow(row.id, 'courseName', 'Certification in Tally ERP 9 / Tally Prime');
                          if (!row.duration) updateRow(row.id, 'duration', '3 Months');
                          if (!row.details) updateRow(row.id, 'details', 'Financial Accounting, GST Invoicing, Inventory & Day Book');
                        } else if (val === 'ccc') {
                          updateRow(row.id, 'courseName', 'Course on Computer Concepts (CCC)');
                          if (!row.duration) updateRow(row.id, 'duration', '3 Months');
                          if (!row.details) updateRow(row.id, 'details', 'NIELIT Standard Syllabus, Basic Computing & Digital Literacy');
                        } else if (val === 'telecom') {
                          updateRow(row.id, 'courseName', 'Telecom & Mobile Hardware Technician');
                          if (!row.duration) updateRow(row.id, 'duration', '6 Months');
                          if (!row.details) updateRow(row.id, 'details', 'Hardware diagnostics, SIM provisioning, POS systems & customer support');
                        }
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        ⚡ Choose Template
                      </option>
                      <option value="dca">DCA (6 Months)</option>
                      <option value="adca">ADCA (1 Year)</option>
                      <option value="tally">Tally Prime / Accounts</option>
                      <option value="ccc">CCC Certification</option>
                      <option value="telecom">Telecom & Mobile Tech</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={row.courseName}
                    onChange={(e) => updateRow(row.id, 'courseName', e.target.value)}
                    placeholder="e.g. Diploma in Computer Application (DCA)"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Institute / Organization */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Institute / Organization
                  </label>
                  <input
                    type="text"
                    value={row.institute}
                    onChange={(e) => updateRow(row.id, 'institute', e.target.value)}
                    placeholder="e.g. Youth Computer Training Centre"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Duration */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={row.duration}
                    onChange={(e) => updateRow(row.id, 'duration', e.target.value)}
                    placeholder="e.g. 6 Months / 1 Year"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Year of Completion */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={row.year}
                    onChange={(e) => updateRow(row.id, 'year', e.target.value)}
                    placeholder="2022"
                    className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-center"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Topics / Key Subjects Covered (Optional)
                </label>
                <input
                  type="text"
                  value={row.details || ''}
                  onChange={(e) => updateRow(row.id, 'details', e.target.value)}
                  placeholder="e.g. MS Office, Tally Prime, Internet Concepts, Typing"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
