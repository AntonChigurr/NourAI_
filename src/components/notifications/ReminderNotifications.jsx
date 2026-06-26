import { useEffect } from 'react';
import { format, parse } from 'date-fns';

// Notification sound (data URL for a simple beep)
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAo=');

export default function ReminderNotifications({ reminders }) {
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check for reminders every minute
    const checkInterval = setInterval(() => {
      checkReminders();
    }, 60000); // Check every minute

    // Initial check
    checkReminders();

    return () => clearInterval(checkInterval);
  }, [reminders]);

  const checkReminders = () => {
    if (!reminders || reminders.length === 0) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const today = format(now, 'yyyy-MM-dd');

    reminders.forEach((reminder) => {
      if (!reminder.is_active) return;
      
      // Check if reminder times include current time
      if (reminder.times && reminder.times.includes(currentTime)) {
        // Check if we already notified for this time today
        const notificationKey = `notified_${reminder.id}_${today}_${currentTime}`;
        const alreadyNotified = localStorage.getItem(notificationKey);

        if (!alreadyNotified) {
          // Check if dose was already taken
          const completionLog = reminder.completion_log || [];
          const alreadyTaken = completionLog.some(
            log => log.date === today && log.time === currentTime && log.status === 'taken'
          );

          if (!alreadyTaken) {
            showNotification(reminder, currentTime);
            // Mark as notified
            localStorage.setItem(notificationKey, 'true');
            
            // Clean up old notification markers (older than 7 days)
            cleanupOldNotifications();
          }
        }
      }
    });
  };

  const showNotification = (reminder, time) => {
    const title = reminder.type === 'medication' 
      ? `💊 Time for ${reminder.medication_name}` 
      : `⏰ ${reminder.title}`;
    
    const body = reminder.dosage 
      ? `Take ${reminder.dosage} at ${time}`
      : `Scheduled for ${time}`;

    // Show notification
    const notification = new Notification(title, {
      body: body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `reminder-${reminder.id}-${time}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });

    // Play sound
    try {
      notificationSound.play().catch(() => {
        // Sound play failed, that's okay
      });
    } catch (e) {
      // Ignore sound errors
    }

    // Focus window on click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const cleanupOldNotifications = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = format(sevenDaysAgo, 'yyyy-MM-dd');

    // Get all notification keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('notified_')) {
        // Extract date from key (format: notified_id_YYYY-MM-DD_HH:mm)
        const parts = key.split('_');
        if (parts.length >= 3) {
          const dateStr = parts[2];
          if (dateStr < cutoffDate) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  };

  return null; // This component doesn't render anything
}