self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data?.text?.() || "" }; }
  const title = data.title || "QuickRide Nigeria";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.data?.rideId ? `quickride-${data.data.rideId}` : "quickride-update",
    renotify: true,
    data: data.data || {},
  };
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const visibleClients = clientsList.filter((client) => client.visibilityState === "visible");

    if (visibleClients.length) {
      visibleClients.forEach((client) => client.postMessage({
        type: "quickride-push",
        notification: {
          title,
          body: options.body,
          data: options.data,
        },
      }));
      return;
    }

    return self.registration.showNotification(title, options);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const target = payload.url || (payload.rideId ? "/home" : "/");
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientsList) {
      if ("focus" in client) {
        if ("navigate" in client) await client.navigate(target);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
    return null;
  })());
});
