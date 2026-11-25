import { Radio, ShieldCheck } from 'lucide-react';
import { ProfileForm } from '../components/ProfileForm';
import { useClubApp } from '../hooks/useClubApp';

export function OnboardingPage() {
  const { liffProfile, isSavingProfile, saveProfile } = useClubApp();

  const handleCreateProfile = async (formValues) => {
    await saveProfile(formValues, true);
  };

  return (
    <div className="min-h-dvh bg-zinc-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-600/15 text-red-500">
            <Radio className="h-6 w-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[11px] font-semibold tracking-wider text-red-400">
            <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
            OB LIVESTREAMING CLUB
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">
            ลงทะเบียนสมาชิกใหม่
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนก่อนเริ่มใช้งานระบบลงทะเบียนกิจกรรม
          </p>
        </div>

        {/* LINE Account Preview */}
        {liffProfile && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5">
            {liffProfile.pictureUrl ? (
              <img
                src={liffProfile.pictureUrl}
                alt={liffProfile.displayName}
                className="h-11 w-11 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                {liffProfile.displayName?.slice(0, 1) || 'L'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-400">เชื่อมต่อบัญชี LINE แล้ว</p>
              <p className="truncate text-sm font-semibold text-zinc-100">
                {liffProfile.displayName}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl sm:p-6">
          <ProfileForm
            initialValues={{
              fullName: '',
              nickname: liffProfile?.displayName || '',
              studentId: '',
              phone: '',
              email: '',
              role: 'สมาชิกชมรม',
            }}
            onSubmit={handleCreateProfile}
            isSaving={isSavingProfile}
            isOnboarding
          />
        </div>
      </div>
    </div>
  );
}
