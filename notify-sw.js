self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(self.registration.scope));});
