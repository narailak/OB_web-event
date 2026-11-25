import { LogOut, ShieldCheck } from 'lucide-react';
import { ProfileForm } from '../components/ProfileForm';
import { useClubApp } from '../hooks/useClubApp';

export function ProfilePage() {
  const { user, liffProfile, isSavingProfile, saveProfile, logout } =
    useClubApp();

  const handleUpdate = async (formValues) => {
    await saveProfile(formValues, false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          ข้อมูลส่วนตัว
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          ตรวจสอบและแก้ไขข้อมูลสมาชิกชมรม OB Livestreaming
        </p>
      </div>

      {/* Member Summary Card */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-3.5">
          {liffProfile?.pictureUrl ? (
            <img
              src={liffProfile.pictureUrl}
              alt={user?.nickname}
              className="h-14 w-14 rounded-2xl border border-zinc-700 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-lg font-bold text-zinc-300">
              {user?.nickname?.slice(0, 1) || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-zinc-100">
                {user?.fullName || liffProfile?.displayName}
              </p>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-400">
              LINE: {liffProfile?.displayName || '-'} • ตำแหน่ง: {user?.role}
            </p>
            <p className="font-mono-tech mt-0.5 text-[11px] text-zinc-500">
              ID: {user?.lineUserId || liffProfile?.userId}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/70 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </button>
      </div>

      {/* Editable Form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
        <ProfileForm
          initialValues={user}
          onSubmit={handleUpdate}
          isSaving={isSavingProfile}
          submitLabel="บันทึกการเปลี่ยนแปลง"
        />
      </div>
    </div>
  );
}
