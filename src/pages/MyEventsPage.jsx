import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { EventCard } from '../components/EventCard';
import { useClubApp } from '../hooks/useClubApp';

export function MyEventsPage() {
  const {
    events,
    registeredEventIdSet,
    pendingEventIds,
    handleCancelRegistration,
  } = useClubApp();

  const [eventToCancel, setEventToCancel] = useState(null);

  const myEvents = useMemo(
    () => events.filter((ev) => registeredEventIdSet.has(ev.eventId)),
    [events, registeredEventIdSet]
  );

  const isCancelling =
    eventToCancel && pendingEventIds.includes(eventToCancel.eventId);

  const confirmCancel = async () => {
    if (!eventToCancel || isCancelling) return;
    const ok = await handleCancelRegistration(eventToCancel.eventId);
    if (ok) {
      setEventToCancel(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          งานของฉัน
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          รายการกิจกรรมที่คุณลงทะเบียนไว้ สามารถกดเข้ากลุ่ม LINE หรือยกเลิกการลงทะเบียนได้
        </p>
      </div>

      {myEvents.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="คุณยังไม่ได้ลงทะเบียนกิจกรรมใดๆ"
          description="เลือกดูกิจกรรมที่เปิดรับสมัครและลงทะเบียนเข้าร่วมทีมงาน OB Livestreaming ได้เลย"
          action={
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <CalendarDays className="h-4 w-4" />
              ไปหน้ากิจกรรม
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myEvents.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              isRegistered
              isPending={pendingEventIds.includes(event.eventId)}
              onCancel={(ev) => setEventToCancel(ev)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(eventToCancel)}
        title="ยืนยันการยกเลิกการลงทะเบียน"
        description={
          eventToCancel
            ? `คุณต้องการยกเลิกการลงทะเบียนงาน "${eventToCancel.title}" (${eventToCancel.eventId}) ใช่หรือไม่?`
            : ''
        }
        confirmLabel="ยืนยันการยกเลิก"
        cancelLabel="เก็บไว้เหมือนเดิม"
        isDestructive
        isLoading={Boolean(isCancelling)}
        onConfirm={confirmCancel}
        onClose={() => !isCancelling && setEventToCancel(null)}
      />
    </div>
  );
}
