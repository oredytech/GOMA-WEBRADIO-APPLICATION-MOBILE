/* Firebase Messaging service worker for background notifications. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDt0Q_DS6JWldP7wGRWDGYkywyVpXY2UgQ",
  authDomain: "app-goma-webradio.firebaseapp.com",
  projectId: "app-goma-webradio",
  storageBucket: "app-goma-webradio.firebasestorage.app",
  messagingSenderId: "230343787989",
  appId: "1:230343787989:web:fef21cd060ac143059a95c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "GOMA WEBRADIO";
  const options = {
    body: payload.notification?.body || "Une nouvelle information est disponible.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.messageId || "goma-webradio",
    data: { url: payload.fcmOptions?.link || payload.data?.url || "/notifications" },
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          void client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});