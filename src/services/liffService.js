import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

/**
 * Initialize LINE LIFF, enforce login, and return idToken + LINE profile.
 */
export async function initLiffSession() {
  if (!LIFF_ID) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_LIFF_ID ในไฟล์สภาพแวดล้อม (.env)');
  }

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return { redirecting: true };
  }

  const [profile, idToken] = await Promise.all([
    liff.getProfile(),
    Promise.resolve(liff.getIDToken()),
  ]);

  if (!idToken) {
    // Force re-login if idToken is missing/expired in LINE session
    liff.logout();
    liff.login({ redirectUri: window.location.href });
    return { redirecting: true };
  }

  return {
    redirecting: false,
    profile,
    idToken,
    isInClient: liff.isInClient(),
  };
}

export function logoutLiffSession() {
  if (liff.isLoggedIn()) {
    liff.logout();
  }
  window.location.reload();
}
