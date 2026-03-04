import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase client config は公開情報（セキュリティは Firestore ルールで担保）
// 環境変数が設定されていればそちらを優先、なければハードコード値を使用
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCNA2W4-EbqNEqw5P7sHkjy4TNXxrFqX6M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'metal-sky-483501-a1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'metal-sky-483501-a1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'metal-sky-483501-a1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '888591518106',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:888591518106:web:90fe7895b913ce75a75223',
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, 'denaosi-kun');
}

export { app, db, hasFirebaseConfig };
