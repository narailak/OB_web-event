import { useEffect, useState } from 'react';
import { Loader2, Mail, Save } from 'lucide-react';
import {
  normalizePhone,
  ROLE_OPTIONS,
  validateProfileForm,
} from '../utils/validation';

export function ProfileForm({
  initialValues,
  onSubmit,
  isSaving = false,
  submitLabel = 'บันทึกข้อมูล',
  isOnboarding = false,
}) {
  const [form, setForm] = useState({
    fullName: initialValues?.fullName || '',
    nickname: initialValues?.nickname || '',
    studentId: initialValues?.studentId || '',
    phone: initialValues?.phone || '',
    email: initialValues?.email || '',
    role: initialValues?.role || 'สมาชิกชมรม',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialValues) return;
    setForm({
      fullName: initialValues.fullName || '',
      nickname: initialValues.nickname || '',
      studentId: initialValues.studentId || '',
      phone: initialValues.phone || '',
      email: initialValues.email || '',
      role: initialValues.role || 'สมาชิกชมรม',
    });
  }, [initialValues]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const validation = validateProfileForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    await onSubmit({
      fullName: form.fullName.trim(),
      nickname: form.nickname.trim(),
      studentId: form.studentId.trim(),
      phone: normalizePhone(form.phone),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="ชื่อ-นามสกุล"
          required
          error={errors.fullName}
          inputProps={{
            type: 'text',
            value: form.fullName,
            onChange: handleChange('fullName'),
            placeholder: 'เช่น สมชาย ใจดี',
            autoComplete: 'name',
          }}
        />

        <Field
          label="ชื่อเล่น"
          required
          error={errors.nickname}
          inputProps={{
            type: 'text',
            value: form.nickname,
            onChange: handleChange('nickname'),
            placeholder: 'เช่น ต้น',
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="รหัสนักศึกษา"
          required
          error={errors.studentId}
          inputProps={{
            type: 'text',
            inputMode: 'numeric',
            value: form.studentId,
            onChange: handleChange('studentId'),
            placeholder: 'เช่น 6601234567',
            className: 'font-mono-tech',
          }}
        />

        <Field
          label="เบอร์โทรศัพท์"
          required
          error={errors.phone}
          inputProps={{
            type: 'tel',
            inputMode: 'tel',
            value: form.phone,
            onChange: handleChange('phone'),
            placeholder: 'เช่น 0812345678',
            autoComplete: 'tel',
            className: 'font-mono-tech',
          }}
        />
      </div>

      <div>
        <Field
          label="อีเมล (Gmail เท่านั้น)"
          required
          error={errors.email}
          inputProps={{
            type: 'email',
            inputMode: 'email',
            value: form.email,
            onChange: handleChange('email'),
            placeholder: 'yourname@gmail.com',
            autoComplete: 'email',
          }}
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
          <Mail className="h-3.5 w-3.5 shrink-0 text-red-400" />
          ใช้ Gmail เพื่อรับไฟล์ปฏิทิน (.ics) และอีเมลแจ้งเตือนก่อนวันงาน 1 วัน
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          ตำแหน่งในชมรม <span className="text-red-500">*</span>
        </label>
        <select
          value={form.role}
          onChange={handleChange('role')}
          className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition focus:ring-2 ${
            errors.role
              ? 'border-red-500/70 focus:ring-red-500/30'
              : 'border-zinc-800 focus:border-red-500 focus:ring-red-500/20'
          }`}
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-xs text-red-400">{errors.role}</p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังบันทึกข้อมูล...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isOnboarding ? 'ยืนยันข้อมูลและเข้าสู่ระบบ' : submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, error, inputProps }) {
  const { className = '', ...rest } = inputProps;
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...rest}
        className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:ring-2 ${
          error
            ? 'border-red-500/70 focus:ring-red-500/30'
            : 'border-zinc-800 focus:border-red-500 focus:ring-red-500/20'
        } ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
