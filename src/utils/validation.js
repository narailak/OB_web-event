export const ROLE_OPTIONS = ['กรรมการ', 'ที่ปรึกษา', 'สมาชิกชมรม'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_REGEX = /^[^\s@]+@(gmail\.com|googlemail\.com)$/i;

/**
 * Normalize Thai phone number by stripping spaces and dashes.
 */
export function normalizePhone(phone = '') {
  return phone.replace(/[\s-]/g, '').trim();
}

/**
 * Validate profile/onboarding form fields.
 * Returns { isValid, errors }.
 */
export function validateProfileForm(values) {
  const errors = {};

  const fullName = (values.fullName || '').trim();
  if (!fullName) {
    errors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
  } else if (fullName.length < 2) {
    errors.fullName = 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
  }

  const nickname = (values.nickname || '').trim();
  if (!nickname) {
    errors.nickname = 'กรุณากรอกชื่อเล่น';
  }

  const studentId = (values.studentId || '').trim();
  if (!studentId) {
    errors.studentId = 'กรุณากรอกรหัสนักศึกษา';
  } else if (!/^[A-Za-z0-9-]{5,20}$/.test(studentId)) {
    errors.studentId = 'รูปแบบรหัสนักศึกษาไม่ถูกต้อง (5-20 ตัวอักษร/ตัวเลข)';
  }

  const phone = normalizePhone(values.phone || '');
  if (!phone) {
    errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  } else if (!/^0\d{8,9}$/.test(phone)) {
    errors.phone = 'กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก (ขึ้นต้นด้วย 0)';
  }

  const email = (values.email || '').trim().toLowerCase();
  if (!email) {
    errors.email = 'กรุณากรอกอีเมล Gmail';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  } else if (!GMAIL_REGEX.test(email)) {
    errors.email = 'กรุณาใช้อีเมล Gmail (@gmail.com) เพื่อรับไฟล์ปฏิทินและการแจ้งเตือน';
  }

  if (!ROLE_OPTIONS.includes(values.role)) {
    errors.role = 'กรุณาเลือกตำแหน่งในชมรม';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
