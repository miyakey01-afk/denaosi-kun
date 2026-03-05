import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import type { Office, StaffMember } from '../types';
import { generateId } from '../utils/helpers';

const ADMIN_PASSCODE_DEFAULT = 'admin';

export function useOffices() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [adminPasscode, setAdminPasscode] = useState(ADMIN_PASSCODE_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setLoading(false);
      return;
    }

    // offices リアルタイム購読
    const unsubOffices = onSnapshot(collection(db, 'offices'), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          passcode: data.passcode || '',
          departments: data.departments || [],
          staffMembers: (data.staffMembers || []) as StaffMember[],
        } as Office;
      });
      setOffices(list);
      setLoading(false);
    });

    // admin passcode
    const unsubAdmin = onSnapshot(doc(db, 'config', 'admin'), (snap) => {
      const data = snap.data();
      setAdminPasscode(data?.passcode || ADMIN_PASSCODE_DEFAULT);
    });

    return () => { unsubOffices(); unsubAdmin(); };
  }, []);

  const addOffice = useCallback(async (data: Omit<Office, 'id'>) => {
    if (!db) return;
    const id = generateId();
    await setDoc(doc(db, 'offices', id), {
      name: data.name,
      passcode: data.passcode,
      departments: data.departments,
      staffMembers: data.staffMembers,
    });
  }, []);

  const updateOffice = useCallback(async (id: string, data: Partial<Omit<Office, 'id'>>) => {
    if (!db) return;
    const ref = doc(db, 'offices', id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await setDoc(ref, { ...existing.data(), ...data }, { merge: true });
    }
  }, []);

  const deleteOffice = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'offices', id));
  }, []);

  const updateAdminPasscode = useCallback(async (newPasscode: string) => {
    if (!db) return;
    await setDoc(doc(db, 'config', 'admin'), { passcode: newPasscode });
  }, []);

  return { offices, adminPasscode, loading, addOffice, updateOffice, deleteOffice, updateAdminPasscode };
}
