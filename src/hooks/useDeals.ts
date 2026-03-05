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
  query,
  where,
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
async function migrateLocalToFirestore(officeId: string): Promise<number> {
  if (!db) return 0;
  const localDeals = loadLocal();
  if (localDeals.length === 0) return 0;

  // Firestore が既にデータを持っていれば移行不要
  const existing = await getDocs(collection(db, 'deals'));
  if (!existing.empty) {
    localStorage.setItem(MIGRATED_KEY, 'true');
    return 0;
  }

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
        officeId: (deal as Deal).officeId || officeId,
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

/** 既存dealに officeId が未設定のものを更新 */
async function migrateOfficeId(officeId: string) {
  if (!db) return;
  const snap = await getDocs(collection(db, 'deals'));
  const batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (!data.officeId) {
      batch.update(d.ref, { officeId });
      count++;
    }
  }
  if (count > 0) {
    await batch.commit();
    console.log(`[useDeals] ${count} 件の既存dealに officeId を付与しました`);
  }
}

export function useDeals(officeId: string | null) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const migrationAttempted = useRef(false);

  useEffect(() => {
    if (!officeId) {
      setDeals([]);
      setLoading(false);
      return;
    }

    console.log('[useDeals] hasFirebaseConfig:', hasFirebaseConfig, 'db:', !!db, 'officeId:', officeId);

    if (hasFirebaseConfig && db) {
      const alreadyMigrated = localStorage.getItem(MIGRATED_KEY) === 'true';

      if (!migrationAttempted.current) {
        migrationAttempted.current = true;

        if (!alreadyMigrated) {
          migrateLocalToFirestore(officeId)
            .then((count) => console.log(`[useDeals] 移行結果: ${count} 件`))
            .catch((err) => console.error('[useDeals] Firestore 移行エラー:', err));
        }

        // officeId 未設定の既存データを移行
        migrateOfficeId(officeId).catch((err) =>
          console.error('[useDeals] officeId 移行エラー:', err),
        );
      }

      // officeId でフィルタしたリアルタイムリスナー
      const q = query(collection(db, 'deals'), where('officeId', '==', officeId));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          console.log('[useDeals] onSnapshot: ドキュメント数 =', snapshot.docs.length);
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Deal));
          setDeals(data);
          setLoading(false);
        },
        (error) => {
          console.error('[useDeals] Firestore リスナーエラー:', error);
          setLoading(false);
        },
      );
      return unsub;
    } else {
      console.log('[useDeals] localStorageモードで起動');
      setDeals(loadLocal());
      setLoading(false);
    }
  }, [officeId]);

  const addDeal = useCallback(async (formData: DealFormData) => {
    const now = nowISO();
    if (hasFirebaseConfig && db) {
      try {
        await addDoc(collection(db, 'deals'), {
          ...formData,
          officeId: officeId || '',
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
        officeId: officeId || 'local',
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
  }, [officeId]);

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
