import axios from "axios";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function getPushCapability({ userType, token }) {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported || !token) return { supported, enabled: false, publicKey: "" };
  try {
    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/${userType}/push-config`, { headers: { token } });
    return { supported: true, enabled: Boolean(response.data?.enabled), publicKey: response.data?.publicKey || "" };
  } catch (_) {
    return { supported: true, enabled: false, publicKey: "" };
  }
}

export async function enablePushNotifications({ userType, token }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { ok: false, mode: "unsupported", message: "Push notifications are not supported on this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, mode: "denied", message: "Notification permission was not granted." };

  const config = await getPushCapability({ userType, token });
  if (!config.enabled || !config.publicKey) {
    return { ok: true, mode: "local", message: "Browser alerts are enabled while QuickRide is connected. Server push can be enabled later with VAPID keys." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  await axios.post(
    `${import.meta.env.VITE_SERVER_URL}/${userType}/push-subscriptions`,
    { subscription: subscription.toJSON() },
    { headers: { token } }
  );
  return { ok: true, mode: "push", message: "Ride alerts are enabled for this device." };
}

export async function disablePushNotifications({ userType, token }) {
  if (!("serviceWorker" in navigator)) return { ok: true };
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager?.getSubscription?.();
  if (!subscription) return { ok: true };
  try {
    await axios.delete(`${import.meta.env.VITE_SERVER_URL}/${userType}/push-subscriptions`, {
      headers: { token },
      data: { endpoint: subscription.endpoint },
    });
  } catch (_) {}
  try { await subscription.unsubscribe(); } catch (_) {}
  return { ok: true };
}
