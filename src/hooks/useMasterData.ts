import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import { DEFAULT_DEPARTMENTS, DEFAULT_SALES_PERSONS } from '../utils/constants';
import { STAFF_MASTER } from '../data/staffMaster';
import type { StaffMember } from '../types';

// v2 keys — old 'denaosi-departments' / 'denaosi-salespersons' are ignored
const LOCAL_DEPT_KEY = 'denaosi-departments-v2';
const LOCAL_SP_KEY = 'denaosi-salespersons-v2';
const MASTER_VERSION_KEY = 'denaosi-master-version';
const CURRENT_MASTER_VERSION = '2026-03'; // マスター更新時にバージョンを上げる

function migrate() {
  // Remove old keys so stale demo data doesn't linger
  localStorage.removeItem('denaosi-departments');
  localStorage.removeItem('denaosi-salespersons');
}

/** マスターバージョンが変わったら localStorage / Firebase を強制リセットする */
function needsReset(): boolean {
  const stored = localStorage.getItem(MASTER_VERSION_KEY);
  if (stored !== CURRENT_MASTER_VERSION) {
    localStorage.setItem(MASTER_VERSION_KEY, CURRENT_MASTER_VERSION);
    localStorage.removeItem(LOCAL_DEPT_KEY);
    localStorage.removeItem(LOCAL_SP_KEY);
    return true;
  }
  return false;
}

function loadList(key: string, defaults: string[]): string[] {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw) as string[];
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

export function useMasterData() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const staffMembers: StaffMember[] = STAFF_MASTER;

  useEffect(() => {
    migrate();
    const reset = needsReset();

    if (hasFirebaseConfig && db) {
      if (reset) {
        // マスター更新: Firebase 上の古いデータを新マスターで上書き
        setDoc(doc(db, 'master', 'departments'), { list: DEFAULT_DEPARTMENTS });
        setDoc(doc(db, 'master', 'salesPersons'), { list: DEFAULT_SALES_PERSONS });
      }
      const unsubDept = onSnapshot(doc(db, 'master', 'departments'), (snap) => {
        const data = snap.data();
        setDepartments(data?.list ?? DEFAULT_DEPARTMENTS);
      });
      const unsubSp = onSnapshot(doc(db, 'master', 'salesPersons'), (snap) => {
        const data = snap.data();
        setSalesPersons(data?.list ?? DEFAULT_SALES_PERSONS);
      });
      return () => { unsubDept(); unsubSp(); };
    } else {
      setDepartments(loadList(LOCAL_DEPT_KEY, DEFAULT_DEPARTMENTS));
      setSalesPersons(loadList(LOCAL_SP_KEY, DEFAULT_SALES_PERSONS));
    }
  }, []);

  const updateDepartments = useCallback(async (list: string[]) => {
    if (hasFirebaseConfig && db) {
      await setDoc(doc(db, 'master', 'departments'), { list });
    } else {
      localStorage.setItem(LOCAL_DEPT_KEY, JSON.stringify(list));
    }
    setDepartments(list);
  }, []);

  const updateSalesPersons = useCallback(async (list: string[]) => {
    if (hasFirebaseConfig && db) {
      await setDoc(doc(db, 'master', 'salesPersons'), { list });
    } else {
      localStorage.setItem(LOCAL_SP_KEY, JSON.stringify(list));
    }
    setSalesPersons(list);
  }, []);

  return { departments, salesPersons, staffMembers, updateDepartments, updateSalesPersons };
}
