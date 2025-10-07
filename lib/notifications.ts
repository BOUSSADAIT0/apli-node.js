import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission refusée', 'Les notifications sont désactivées. Vous pouvez les activer dans les paramètres.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (e) {
    console.error('Error registering for push notifications:', e);
    return null;
  }
}

// Schedule daily reminder at 18:00
export async function scheduleDailyReminder() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel heures de travail ⏰',
        body: "N'oubliez pas d'enregistrer vos heures d'aujourd'hui !",
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });
    
    return true;
  } catch (e) {
    console.error('Error scheduling daily reminder:', e);
    return false;
  }
}

// Schedule weekly summary on Sunday at 20:00
export async function scheduleWeeklySummary() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Résumé hebdomadaire 📊',
        body: 'Votre rapport de la semaine est prêt. Consultez vos statistiques !',
        data: { type: 'weekly_summary' },
      },
      trigger: {
        weekday: 1, // Sunday
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
    
    return true;
  } catch (e) {
    console.error('Error scheduling weekly summary:', e);
    return false;
  }
}

// Send immediate notification
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Immediate
    });
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}

// Cancel all notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('Error canceling notifications:', e);
  }
}

// Get notification settings status
export async function getNotificationSettings() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return {
      granted: settings.status === 'granted',
      scheduledCount: scheduled.length,
    };
  } catch (e) {
    console.error('Error getting notification settings:', e);
    return { granted: false, scheduledCount: 0 };
  }
}


