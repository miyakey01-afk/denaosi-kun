import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import type { Deal, DealFormData } from '../types';
import { generateId, nowISO } from '../utils/helpers';
import { SAMPLE_DEALS } from '../data/sampleData';

const LOCAL_KEY = 'denaosi-deals';
const MIGRATED_KEY = 'denaosi-deals-migrated';

function loadLocal(): Deal[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) return JSON.parse(raw) as Deal[];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(SAMPLE_DEALS));
  return SAMPLE_DEALS;
}

function saveLocal(deals: Deal[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(deals));
}

/** localStorage → Firestore 一括移行 */
async function migrateLocalToFirestore(): Promise<number> {
  if (!db) return 0;
  const localDeals = loadLocal();
  if (localDeals.length === 0) return 0;

  // Firestore が既にデータを持っていれば移行不要
  const existing = await getDocs(collection(db, 'deals'));
  if (!existing.empty) {
    localStorage.setItem(MIGRATED_KEY, 'true');
    return 0;
  }

  // バッチ書き込み（500件制限を考慮して分割）
  let migrated = 0;
  const BATCH_SIZE = 400;
  for (let i = 0; i < localDeals.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = localDeals.slice(i, i + BATCH_SIZE);
    for (const deal of chunk) {
      const { id: _id, ...data } = deal;
      const ref = doc(collection(db, 'deals'));
      batch.set(ref, {
        ...data,
        createdAt: deal.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    migrated += chunk.length;
  }

  localStorage.setItem(MIGRATED_KEY, 'true');
  console.log(`Firestore へ ${migrated} 件のデータを移行しました`);
  return migrated;
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const migrationAttempted = useRef(false);

  // Firestore realtime listener or localStorage
  useEffect(() => {
    if (hasFirebaseConfig && db) {
      // 初回のみ: localStorage → Firestore 移行を試行
      if (!migrationAttempted.current && localStorage.getItem(MIGRATED_KEY) !== 'true') {
        migrationAttempted.current = true;
        migrateLocalToFirestore().then((count) => {
          if (count > 0) {
            console.log(`${count} 件の案件を Firestore に移行完了`);
          }
        }).catch((err) => {
          console.error('Firestore 移行エラー:', err);
        });
      }

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
