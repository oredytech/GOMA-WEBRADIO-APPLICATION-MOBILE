import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDt0Q_DS6JWldP7wGRWDGYkywyVpXY2UgQ",
  authDomain: "app-goma-webradio.firebaseapp.com",
  projectId: "app-goma-webradio",
  storageBucket: "app-goma-webradio.firebasestorage.app",
  messagingSenderId: "230343787989",
  appId: "1:230343787989:web:fef21cd060ac143059a95c",
  measurementId: "G-F4QS3XEQ71",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ??
    "https://app-goma-webradio-default-rtdb.firebaseio.com",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseVapidKey =
  "BHCkUyKnPiEEQbpi5PSIhGVZmlfwgVjphZ6amH3tQjS9nrS_jJ8rupnwZNiICv5I36dg5PhHKrsDeCoozHj6N_4";

const firebaseAuth = getAuth(firebaseApp);
const firebaseDatabase = getDatabase(firebaseApp);

export async function getBrowserMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}

export async function requestFirebaseToken(): Promise<string | null> {
  const messaging = await getBrowserMessaging();
  if (!messaging) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  return getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
}

export async function saveFcmToken(token: string): Promise<void> {
  const user = firebaseAuth.currentUser ?? (await signInAnonymously(firebaseAuth)).user;
  const tokenRef = ref(firebaseDatabase, `fcmTokens/${user.uid}`);
  const now = Date.now();
  await set(tokenRef, {
    token,
    platform: "web",
    createdAt: now,
    updatedAt: now,
  });
}
