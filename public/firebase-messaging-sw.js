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
  const title = payload.notification?.title || payload.data?.title || "GOMA WEBRADIO";
  const featuredImage = payload.notification?.image || payload.data?.image || undefined;
  const notificationId =
    payload.data?.notification_id || `goma-article-${payload.data?.article_id || "default"}`;
  const options = {
    body: payload.notification?.body || "Une nouvelle information est disponible.",
    icon: payload.notification?.icon || "/logo.png",
    badge: payload.notification?.badge || featuredImage || "/notification-badge.png",
    image: featuredImage,
    tag: notificationId,
    renotify: false,
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || "/notifications",
      article_id: payload.data?.article_id,
    },
  };
  return self.registration.getNotifications({ tag: notificationId }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
    return self.registration.showNotification(title, options);
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/notifications", self.location.origin)
    .href;
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
