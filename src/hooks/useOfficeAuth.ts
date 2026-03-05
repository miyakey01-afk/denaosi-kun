import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../lib/firebase';
import type { Office, StaffMember } from '../types';
import { STAFF_MASTER, STAFF_DEPARTMENTS } from '../data/staffMaster';

const OFFICE_ID_KEY = 'denaosi-office-id';
const IS_ADMIN_KEY = 'denaosi-is-admin';
const ADMIN_PASSCODE_DEFAULT = 'admin';
const SEED_DONE_KEY = 'denaosi-office-seed-done';

/** Firestore に初期営業所データが無ければ作成する */
async function seedInitialData() {
  if (!db) return;
  if (localStorage.getItem(SEED_DONE_KEY)) return;

  // offices コレクションにデータがあればスキップ
  const snap = await getDocs(collection(db, 'offices'));
  if (!snap.empty) {
    localStorage.setItem(SEED_DONE_KEY, 'true');
    return;
  }

  // 初期営業所を作成
  await setDoc(doc(db, 'offices', 'shibuya'), {
    name: '城西支社 渋谷エリア',
    passcode: 'Shibuya2026',
    departments: STAFF_DEPARTMENTS,
    staffMembers: STAFF_MASTER,
  });

  // 管理者パスコード
  await setDoc(doc(db, 'config', 'admin'), {
    passcode: ADMIN_PASSCODE_DEFAULT,
  });

  localStorage.setItem(SEED_DONE_KEY, 'true');
  console.log('[useOfficeAuth] 初期データを作成しました');
}

export interface OfficeAuthState {
  officeId: string | null;
  office: Office | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
}

export function useOfficeAuth(): OfficeAuthState {
  const [officeId, setOfficeId] = useState<string | null>(
    () => localStorage.getItem(OFFICE_ID_KEY),
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => localStorage.getItem(IS_ADMIN_KEY) === 'true',
  );
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初回: seed + officeId が保存されていれば office 情報を取得
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (hasFirebaseConfig && db) {
        await seedInitialData();

        const storedId = localStorage.getItem(OFFICE_ID_KEY);
        const storedAdmin = localStorage.getItem(IS_ADMIN_KEY) === 'true';

        if (storedAdmin) {
          // 管理者モード
          if (!cancelled) {
            setIsAdmin(true);
            setOfficeId(null);
            setOffice(null);
            setLoading(false);
          }
          return;
        }

        if (storedId) {
          const officeDoc = await getDoc(doc(db, 'offices', storedId));
          if (officeDoc.exists() && !cancelled) {
            const data = officeDoc.data();
            setOffice({
              id: officeDoc.id,
              name: data.name,
              passcode: data.passcode,
              departments: data.departments || [],
              staffMembers: (data.staffMembers || []) as StaffMember[],
            });
          } else if (!cancelled) {
            // 営業所が削除されていた場合
            localStorage.removeItem(OFFICE_ID_KEY);
            setOfficeId(null);
          }
        }
      } else {
        // localStorageモード: 認証不要で従来通り動作
        if (!cancelled) {
          setOfficeId('local');
          setOffice({
            id: 'local',
            name: '城西支社 渋谷エリア',
            passcode: '',
            departments: STAFF_DEPARTMENTS,
            staffMembers: STAFF_MASTER,
          });
        }
      }
      if (!cancelled) setLoading(false);
    }

    init().catch((err) => {
      console.error('[useOfficeAuth] init error:', err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    setError(null);

    if (!hasFirebaseConfig || !db) {
      // localStorageモードでは認証不要
      return true;
    }

    try {
      // 管理者パスコードチェック
      const adminDoc = await getDoc(doc(db, 'config', 'admin'));
      const adminPasscode = adminDoc.exists() ? adminDoc.data().passcode : ADMIN_PASSCODE_DEFAULT;

      if (passcode === adminPasscode) {
        localStorage.setItem(IS_ADMIN_KEY, 'true');
        localStorage.removeItem(OFFICE_ID_KEY);
        setIsAdmin(true);
        setOfficeId(null);
        setOffice(null);
        return true;
      }

      // 営業所パスコードチェック
      const snap = await getDocs(collection(db, 'offices'));
      for (const d of snap.docs) {
        const data = d.data();
        if (data.passcode === passcode) {
          const matched: Office = {
            id: d.id,
            name: data.name,
            passcode: data.passcode,
            departments: data.departments || [],
            staffMembers: (data.staffMembers || []) as StaffMember[],
          };
          localStorage.setItem(OFFICE_ID_KEY, matched.id);
          localStorage.removeItem(IS_ADMIN_KEY);
          setOfficeId(matched.id);
          setOffice(matched);
          setIsAdmin(false);
          return true;
        }
      }

      setError('パスコードが正しくありません');
      return false;
    } catch (err) {
      console.error('[useOfficeAuth] login error:', err);
      setError('ログインに失敗しました。通信環境を確認してください。');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(OFFICE_ID_KEY);
    localStorage.removeItem(IS_ADMIN_KEY);
    setOfficeId(null);
    setOffice(null);
    setIsAdmin(false);
    setError(null);
  }, []);

  return { officeId, office, isAdmin, loading, error, login, logout };
}
