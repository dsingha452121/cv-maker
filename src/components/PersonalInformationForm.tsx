import React, { useRef, useState } from 'react';
import { PersonalInfo } from '../types/biodata';
import {
  Camera,
  Trash2,
  Upload,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  Check,
} from 'lucide-react';

interface PersonalInformationFormProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
];

export const PersonalInformationForm: React.FC<PersonalInformationFormProps> = ({
  data,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAadhaarValue, setShowAadhaarValue] = useState(false);

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
    onChange({
      ...data,
      aadhaarNumber: digitsOnly,
    });
  };

  const updateField = (field: keyof PersonalInfo, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please upload a smaller passport photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        ...data,
        photoUrl: reader.result as string,
        photoFileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({
      ...data,
      photoUrl: null,
      photoFileName: '',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">1. Personal Information</h2>
          <p className="text-xs text-slate-500">
            Enter personal details exactly as per matriculation / official certificates
          </p>
        </div>
      </div>

      {/* Photo Upload Card */}
      <div className="mb-6 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-24 h-32 bg-white border border-slate-300 rounded-md overflow-hidden flex items-center justify-center shadow-inner flex-shrink-0">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Passport preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <Camera className="w-6 h-6 mb-1 text-slate-300" />
                <span className="text-[10px] uppercase font-medium">Passport Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Applicant Photograph (Optional)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Upload a recent formal passport size photograph (JPG, JPEG, PNG, WebP).
              Appears in the top-right corner of the CV.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition"
              >
                {data.photoUrl ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Replace Photo
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </>
                )}
              </button>

              {data.photoUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-medium rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Info Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="e.g. RAHUL SHARMA"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase"
          />
        </div>

        {/* Father's Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Father's Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.fatherName}
            onChange={(e) => updateField('fatherName', e.target.value)}
            placeholder="e.g. Suresh Sharma"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Mother's Name (Optional) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mother's Name <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.motherName}
            onChange={(e) => updateField('motherName', e.target.value)}
            placeholder="e.g. Sunita Sharma"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Gender <span className="text-rose-500">*</span>
          </label>
          <select
            value={data.gender}
            onChange={(e) => updateField('gender', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Marital Status
          </label>
          <select
            value={data.maritalStatus}
            onChange={(e) => updateField('maritalStatus', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
          >
            <option value="Unmarried">Unmarried</option>
            <option value="Married">Married</option>
            <option value="Single">Single</option>
            <option value="Divorced">Divorced</option>
          </select>
        </div>

        {/* Religion */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Religion
          </label>
          <input
            type="text"
            value={data.religion}
            onChange={(e) => updateField('religion', e.target.value)}
            placeholder="e.g. Hinduism, Islam, Christianity..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nationality
          </label>
          <input
            type="text"
            value={data.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            placeholder="e.g. Indian"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Languages Known */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Languages Known
          </label>
          <input
            type="text"
            value={data.languagesKnown}
            onChange={(e) => updateField('languagesKnown', e.target.value)}
            placeholder="e.g. English, Hindi, Bengali"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </span>
            <input
              type="tel"
              value={data.mobileNumber}
              onChange={(e) => updateField('mobileNumber', e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Email ID */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Email ID <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={data.emailId}
              onChange={(e) => updateField('emailId', e.target.value)}
              placeholder="e.g. applicant@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Aadhaar Number Field (Priority 6) */}
        <div className="col-span-1 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-slate-800">
                Aadhaar Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              12 Digits
            </span>
          </div>

          <div className="relative">
            <input
              type={showAadhaarValue ? 'text' : 'password'}
              inputMode="numeric"
              value={
                showAadhaarValue
                  ? (data.aadhaarNumber || '').replace(/(\d{4})(?=\d)/g, '$1 ')
                  : data.aadhaarNumber || ''
              }
              onChange={handleAadhaarChange}
              placeholder={showAadhaarValue ? 'XXXX XXXX XXXX' : '•••• •••• ••••'}
              className="w-full pr-10 pl-3 py-2 text-sm font-mono tracking-wider border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            />
            <button
              type="button"
              onClick={() => setShowAadhaarValue(!showAadhaarValue)}
              title={showAadhaarValue ? 'Hide Aadhaar digits' : 'Show Aadhaar digits'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              {showAadhaarValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation feedback */}
          {data.aadhaarNumber && data.aadhaarNumber.length > 0 && data.aadhaarNumber.length < 12 && (
            <p className="text-[11px] text-amber-700 font-medium">
              Aadhaar must be exactly 12 numeric digits (currently {data.aadhaarNumber.length}/12).
            </p>
          )}
          {data.aadhaarNumber && data.aadhaarNumber.length === 12 && (
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Complete 12-digit Aadhaar number entered
            </p>
          )}

          {/* Privacy controls */}
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="include-aadhaar-cv"
                checked={!!data.includeAadhaarInCv}
                onChange={(e) => updateField('includeAadhaarInCv', e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="include-aadhaar-cv" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Include Aadhaar in CV / Bio-Data (Disabled by default)
              </label>
            </div>

            {data.includeAadhaarInCv && (
              <div className="ml-5 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="mask-aadhaar-cv"
                  checked={data.maskAadhaarInCv !== false}
                  onChange={(e) => updateField('maskAadhaarInCv', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="mask-aadhaar-cv" className="text-xs text-slate-600 cursor-pointer">
                  Mask Aadhaar in CV preview & export (e.g.{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    XXXX XXXX {data.aadhaarNumber?.slice(-4) || '1234'}
                  </span>
                  )
                </label>
              </div>
            )}

            <p className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Notice:</strong> Aadhaar is sensitive personal identification data. Include it only if explicitly required by the employer. It is excluded from AI reviews and export filenames.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Permanent Address Details</span>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={data.useCustomAddress}
              onChange={(e) => updateField('useCustomAddress', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Custom single-box address</span>
          </label>
        </div>

        {data.useCustomAddress ? (
          <div>
            <textarea
              value={data.customAddress || ''}
              onChange={(e) => updateField('customAddress', e.target.value)}
              rows={3}
              placeholder="Enter full address line by line or with commas..."
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Village / Town / Street
              </label>
              <input
                type="text"
                value={data.villageTown}
                onChange={(e) => updateField('villageTown', e.target.value)}
                placeholder="e.g. Rampur"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Post Office (P.O.)
              </label>
              <input
                type="text"
                value={data.postOffice}
                onChange={(e) => updateField('postOffice', e.target.value)}
                placeholder="e.g. Rampur Hat"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Police Station (P.S.)
              </label>
              <input
                type="text"
                value={data.policeStation}
                onChange={(e) => updateField('policeStation', e.target.value)}
                placeholder="e.g. Sadar"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                District
              </label>
              <input
                type="text"
                value={data.district}
                onChange={(e) => updateField('district', e.target.value)}
                placeholder="e.g. Birbhum"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                list="state-list"
                value={data.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="e.g. West Bengal"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <datalist id="state-list">
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={data.pinCode}
                onChange={(e) => updateField('pinCode', e.target.value)}
                placeholder="e.g. 731224"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
