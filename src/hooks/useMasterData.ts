import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import { DEFAULT_DEPARTMENTS, DEFAULT_SALES_PERSONS } from '../utils/constants';

const LOCAL_DEPT_KEY = 'denaosi-departments';
const LOCAL_SP_KEY = 'denaosi-salespersons';

function loadList(key: string, defaults: string[]): string[] {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw) as string[];
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

export function useMasterData() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);

  useEffect(() => {
    if (hasFirebaseConfig && db) {
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

  return { departments, salesPersons, updateDepartments, updateSalesPersons };
}
