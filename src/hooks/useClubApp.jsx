import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  bootstrapSession,
  cancelEventRegistration,
  createUserProfile,
  registerEvent,
  updateUserProfile,
} from '../services/api';
import { initLiffSession, logoutLiffSession } from '../services/liffService';
import { sortEventsByDate } from '../utils/dateUtils';
import { useToast } from './useToast';

const ClubAppContext = createContext(null);

export function ClubAppProvider({ children }) {
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState('initializing');
  const [initError, setInitError] = useState(null);
  const [liffProfile, setLiffProfile] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [pendingEventIds, setPendingEventIds] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initializedRef = useRef(false);

  const loadSession = useCallback(async () => {
    setAuthStatus('initializing');
    setInitError(null);

    try {
      const liffResult = await initLiffSession();
      if (liffResult.redirecting) {
        setAuthStatus('redirecting');
        return;
      }

      setLiffProfile(liffResult.profile);
      setIdToken(liffResult.idToken);

      const data = await bootstrapSession(liffResult.idToken);
      setEvents(sortEventsByDate(data.events || []));
      setRegistrations(data.registrations || []);

      if (data.user) {
        setUser(data.user);
        setAuthStatus('ready');
      } else {
        setUser(null);
        setAuthStatus('onboarding');
      }
    } catch (err) {
      setInitError(err.message || 'ไม่สามารถเริ่มต้นระบบได้');
      setAuthStatus('error');
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadSession();
  }, [loadSession]);

  const refreshData = useCallback(async () => {
    if (!idToken || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await bootstrapSession(idToken);
      setEvents(sortEventsByDate(data.events || []));
      setRegistrations(data.registrations || []);
      if (data.user) {
        setUser(data.user);
      }
      toast.info('อัปเดตข้อมูลแล้ว', 'ซิงค์รายการกิจกรรมล่าสุดเรียบร้อย');
    } catch (err) {
      toast.error('อัปเดตข้อมูลไม่สำเร็จ', err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [idToken, isRefreshing, toast]);

  const saveProfile = useCallback(
    async (profileData, isNewUser = false) => {
      if (!idToken || isSavingProfile) return false;
      setIsSavingProfile(true);
      try {
        const result = isNewUser
          ? await createUserProfile(idToken, profileData)
          : await updateUserProfile(idToken, profileData);

        setUser(result.user);
        if (isNewUser) {
          setAuthStatus('ready');
          toast.success('ลงทะเบียนสมาชิกสำเร็จ', 'ยินดีต้อนรับสู่ชมรม OB Livestreaming');
        } else {
          toast.success('บันทึกข้อมูลสำเร็จ', 'อัปเดตข้อมูลส่วนตัวลงระบบเรียบร้อยแล้ว');
        }
        return true;
      } catch (err) {
        toast.error('บันทึกข้อมูลไม่สำเร็จ', err.message);
        return false;
      } finally {
        setIsSavingProfile(false);
      }
    },
    [idToken, isSavingProfile, toast]
  );

  const handleRegisterEvent = useCallback(
    async (eventId) => {
      if (!idToken || pendingEventIds.includes(eventId)) return false;
      setPendingEventIds((prev) => [...prev, eventId]);
      try {
        const result = await registerEvent(idToken, eventId);
        if (result.registration) {
          setRegistrations((prev) => {
            const exists = prev.some((r) => r.eventId === eventId);
            return exists ? prev : [...prev, result.registration];
          });
        }
        toast.success(
          'ลงทะเบียนกิจกรรมสำเร็จ',
          result.emailSent
            ? 'ส่งอีเมลยืนยันพร้อมไฟล์ปฏิทิน (.ics) ไปยัง Gmail ของคุณแล้ว'
            : 'บันทึกการลงทะเบียนเรียบร้อยแล้ว'
        );
        return true;
      } catch (err) {
        toast.error('ลงทะเบียนไม่สำเร็จ', err.message);
        return false;
      } finally {
        setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
      }
    },
    [idToken, pendingEventIds, toast]
  );

  const handleCancelRegistration = useCallback(
    async (eventId) => {
      if (!idToken || pendingEventIds.includes(eventId)) return false;
      setPendingEventIds((prev) => [...prev, eventId]);
      try {
        await cancelEventRegistration(idToken, eventId);
        setRegistrations((prev) => prev.filter((r) => r.eventId !== eventId));
        toast.info('ยกเลิกการลงทะเบียนแล้ว', 'นำรายการออกจากงานของฉันเรียบร้อย');
        return true;
      } catch (err) {
        toast.error('ยกเลิกไม่สำเร็จ', err.message);
        return false;
      } finally {
        setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
      }
    },
    [idToken, pendingEventIds, toast]
  );

  const registeredEventIdSet = useMemo(
    () => new Set(registrations.map((r) => r.eventId)),
    [registrations]
  );

  const value = {
    authStatus,
    initError,
    liffProfile,
    user,
    events,
    registrations,
    registeredEventIdSet,
    pendingEventIds,
    isSavingProfile,
    isRefreshing,
    retryInit: loadSession,
    refreshData,
    saveProfile,
    handleRegisterEvent,
    handleCancelRegistration,
    logout: logoutLiffSession,
  };

  return <ClubAppContext.Provider value={value}>{children}</ClubAppContext.Provider>;
}

export function useClubApp() {
  const ctx = useContext(ClubAppContext);
  if (!ctx) {
    throw new Error('useClubApp must be used within ClubAppProvider');
  }
  return ctx;
}
