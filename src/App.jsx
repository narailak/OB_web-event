import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Layout } from './components/Layout';
import { BootLoadingScreen } from './components/Skeletons';
import { ToastContainer } from './components/ToastContainer';
import { ClubAppProvider, useClubApp } from './hooks/useClubApp';
import { ToastProvider } from './hooks/useToast';
import { EventsPage } from './pages/EventsPage';
import { HomePage } from './pages/HomePage';
import { MyEventsPage } from './pages/MyEventsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfilePage } from './pages/ProfilePage';

function AppGate() {
  const { authStatus, initError, retryInit } = useClubApp();

  if (authStatus === 'initializing') {
    return <BootLoadingScreen message="กำลังตรวจสอบสิทธิ์ผ่าน LINE LIFF..." />;
  }

  if (authStatus === 'redirecting') {
    return <BootLoadingScreen message="กำลังนำทางไปยังหน้าเข้าสู่ระบบ LINE..." />;
  }

  if (authStatus === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertOctagon className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100">
          ไม่สามารถเชื่อมต่อระบบได้
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          {initError || 'เกิดข้อผิดพลาดในการเริ่มต้นระบบ กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button
          type="button"
          onClick={retryInit}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          <RefreshCw className="h-4 w-4" />
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (authStatus === 'onboarding') {
    return <OnboardingPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <ClubAppProvider>
          <AppGate />
          <ToastContainer />
        </ClubAppProvider>
      </ToastProvider>
    </HashRouter>
  );
}
