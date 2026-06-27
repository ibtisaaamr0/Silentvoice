import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

export const configurePushNotifications = () => {
  PushNotification.configure({
    onNotification: function (notification) {
      // handled silently, no action needed for local-only notifications
    },
    requestPermissions: Platform.OS === 'ios',
    popInitialNotification: true,
  });

  PushNotification.createChannel(
    {
      channelId: "practice-reminders",
      channelName: "Practice Reminders",
      importance: 4,
      vibrate: true,
    },
    () => {}
  );
};

export const scheduleDailyReminder = () => {
  PushNotification.cancelAllLocalNotifications();
  PushNotification.localNotificationSchedule({
    channelId: "practice-reminders",
    title: "Time to practice",
    message: "Keep your sign language skills sharp with a quick practice session.",
    date: getNextReminderTime(),
    repeatType: "day",
    allowWhileIdle: true,
    exact: false,
  });
};

export const cancelReminders = () => {
  PushNotification.cancelAllLocalNotifications();
};

const getNextReminderTime = () => {
  const date = new Date();
  date.setHours(18, 0, 0, 0);
  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};