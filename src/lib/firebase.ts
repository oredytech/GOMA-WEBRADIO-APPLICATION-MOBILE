import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, remove, set } from "firebase/database";
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
    "https://app-goma-webradio-default-rtdb.europe-west1.firebasedatabase.app",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseVapidKey =
  "BHCkUyKnPiEEQbpi5PSIhGVZmlfwgVjphZ6amH3tQjS9nrS_jJ8rupnwZNiICv5I36dg5PhHKrsDeCoozHj6N_4";

export const PUSH_ENABLED_KEY = "gw-push-enabled";
export const PUSH_SETTING_EVENT = "gw-push-setting";

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
  await navigator.serviceWorker.ready;
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

export async function disableFirebasePush(): Promise<void> {
  const user = firebaseAuth.currentUser ?? (await signInAnonymously(firebaseAuth)).user;
  if (user) await remove(ref(firebaseDatabase, `fcmTokens/${user.uid}`));
  window.localStorage.removeItem("gw-fcm-token");
  window.localStorage.setItem(PUSH_ENABLED_KEY, "0");
  window.dispatchEvent(new Event(PUSH_SETTING_EVENT));
}

export async function enableFirebasePush(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  return (await syncFirebasePush()) ? permission : "unsupported";
}

export async function syncFirebasePush(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  const token = await requestFirebaseToken();
  if (!token) return false;
  await saveFcmToken(token);
  window.localStorage.setItem("gw-fcm-token", token);
  window.localStorage.setItem(PUSH_ENABLED_KEY, "1");
  window.dispatchEvent(new Event(PUSH_SETTING_EVENT));
  return true;
}
