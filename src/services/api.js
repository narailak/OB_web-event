const GAS_API_URL = import.meta.env.VITE_GAS_API_URL;

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Send CORS-safe POST request to Google Apps Script using text/plain;charset=utf-8
 * to avoid browser CORS preflight (OPTIONS) requests.
 */
async function postToGas(action, payload = {}) {
  if (!GAS_API_URL) {
    throw new ApiError(
      'ยังไม่ได้ตั้งค่า VITE_GAS_API_URL ในไฟล์สภาพแวดล้อม (.env)',
      'CONFIG_MISSING',
      500
    );
  }

  let response;
  try {
    response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
    });
  } catch (err) {
    throw new ApiError(
      'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง',
      'NETWORK_ERROR',
      0
    );
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      'รูปแบบข้อมูลตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง',
      'INVALID_JSON',
      response.status
    );
  }

  if (!response.ok || !json?.ok) {
    throw new ApiError(
      json?.error || 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
      json?.code || 'SERVER_ERROR',
      response.status
    );
  }

  return json.data;
}

export async function bootstrapSession(idToken) {
  return postToGas('bootstrap', { idToken });
}

export async function createUserProfile(idToken, profileData) {
  return postToGas('registerUser', { idToken, profile: profileData });
}

export async function updateUserProfile(idToken, profileData) {
  return postToGas('updateProfile', { idToken, profile: profileData });
}

export async function registerEvent(idToken, eventId) {
  return postToGas('registerEvent', { idToken, eventId });
}

export async function cancelEventRegistration(idToken, eventId) {
  return postToGas('cancelRegistration', { idToken, eventId });
}
