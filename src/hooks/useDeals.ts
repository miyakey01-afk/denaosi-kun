import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import type { Deal, DealFormData } from '../types';
import { generateId, nowISO } from '../utils/helpers';
import { SAMPLE_DEALS } from '../data/sampleData';

const LOCAL_KEY = 'denaosi-deals';

function loadLocal(): Deal[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) return JSON.parse(raw) as Deal[];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(SAMPLE_DEALS));
  return SAMPLE_DEALS;
}

function saveLocal(deals: Deal[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(deals));
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore realtime listener or localStorage
  useEffect(() => {
    if (hasFirebaseConfig && db) {
      const unsub = onSnapshot(
        collection(db, 'deals'),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Deal));
          setDeals(data);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore リスナーエラー:', error);
          alert('データの取得に失敗しました。ページを再読み込みしてください。');
          setLoading(false);
        },
      );
      return unsub;
    } else {
      setDeals(loadLocal());
      setLoading(false);
    }
  }, []);

  const addDeal = useCallback(async (formData: DealFormData) => {
    const now = nowISO();
    if (hasFirebaseConfig && db) {
      try {
        await addDoc(collection(db, 'deals'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('案件追加エラー:', error);
        alert('案件の保存に失敗しました。通信環境を確認してください。');
      }
    } else {
      const newDeal: Deal = {
        ...formData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setDeals((prev) => {
        const next = [...prev, newDeal];
        saveLocal(next);
        return next;
      });
    }
  }, []);

  const updateDeal = useCallback(async (id: string, updates: Partial<DealFormData>) => {
    if (hasFirebaseConfig && db) {
      try {
        await updateDoc(doc(db, 'deals', id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('案件更新エラー:', error);
        alert('案件の更新に失敗しました。通信環境を確認してください。');
      }
    } else {
      setDeals((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: nowISO() } : d
        );
        saveLocal(next);
        return next;
      });
    }
  }, []);

  const deleteDeal = useCallback(async (id: string) => {
    if (hasFirebaseConfig && db) {
      try {
        await deleteDoc(doc(db, 'deals', id));
      } catch (error) {
        console.error('案件削除エラー:', error);
        alert('案件の削除に失敗しました。通信環境を確認してください。');
      }
    } else {
      setDeals((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveLocal(next);
        return next;
      });
    }
  }, []);

  return { deals, loading, addDeal, updateDeal, deleteDeal };
}
