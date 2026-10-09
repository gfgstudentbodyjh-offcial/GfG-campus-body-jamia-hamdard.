import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building2 } from 'lucide-react';

const DEPARTMENT_SUGGESTIONS = [
  'Computer Science & Engineering (CSE)',
  'Electronics & Communication Engineering (ECE)',
  'School of Engineering Sciences & Technology (SEST)',
  'Bachelor of Computer Applications (BCA)',
  'Master of Computer Applications (MCA)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Diploma in Computer Engineering'
];

export default function MemberCard({
  memberIndex,
  data = {},
  onChange,
  errors = {},
  onKeyDown
}) {
  const cardId = `member_${memberIndex}`;

  const handleChange = (field, value) => {
    onChange(memberIndex, field, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="p-5 sm:p-6 rounded-xl bg-[#171F1B] border border-[#28342D] transition-colors"
    >
      {/* Member Card Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#28342D]">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-[#22A447]/15 text-[#22A447] font-semibold text-xs flex items-center justify-center">
            {memberIndex}
          </span>
          <h4 className="text-sm font-semibold text-[#F5F7F5]">
            Member {memberIndex} Details
          </h4>
        </div>
        <span className="text-[11px] text-[#707E75]">
          Required
        </span>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Member Name */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${cardId}_name`}
            className="block text-xs font-medium text-[#A2ADA6]"
          >
            Full Name <span className="text-[#22A447] font-semibold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              id={`${cardId}_name`}
              value={data.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. Arham Raza"
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#121916] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                errors.name
                  ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] text-rose-400 font-medium">{errors.name}</p>
          )}
        </div>

        {/* Member Email */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${cardId}_email`}
            className="block text-xs font-medium text-[#A2ADA6]"
          >
            Email Address <span className="text-[#22A447] font-semibold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              id={`${cardId}_email`}
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="member@jamiahamdard.ac.in"
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#121916] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                errors.email
                  ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-400 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Member Mobile */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${cardId}_mobile`}
            className="block text-xs font-medium text-[#A2ADA6]"
          >
            Mobile Number <span className="text-[#22A447] font-semibold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              id={`${cardId}_mobile`}
              value={data.mobile || ''}
              onChange={(e) => handleChange('mobile', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="10-digit mobile number"
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#121916] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                errors.mobile
                  ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
              }`}
            />
          </div>
          {errors.mobile && (
            <p className="text-[11px] text-rose-400 font-medium">{errors.mobile}</p>
          )}
        </div>

        {/* Member Department */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${cardId}_department`}
            className="block text-xs font-medium text-[#A2ADA6]"
          >
            Department / Course <span className="text-[#22A447] font-semibold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              id={`${cardId}_department`}
              list={`dept_list_${cardId}`}
              value={data.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. Computer Science & Engineering"
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#121916] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                errors.department
                  ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
              }`}
            />
            <datalist id={`dept_list_${cardId}`}>
              {DEPARTMENT_SUGGESTIONS.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
          {errors.department && (
            <p className="text-[11px] text-rose-400 font-medium">{errors.department}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
