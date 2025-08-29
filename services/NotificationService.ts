import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Random app engagement messages
const RANDOM_APP_MESSAGES = [
  {
    title: "Have you met anyone new recently? 👀",
    body: "Add them to your profiles so you never forget the important details🧠"
  },
  {
    title: "A quick hello can go a long way 🙂",
    body: "Double check ARMi profiles so you can get the details right 😼"
  },
  {
    title: "Don't let your roster go quiet 🔔",
    body: "Check upcoming reminders, add new people, and check in with people you haven't spoken to in awhile."
  },
  {
    title: "Are your profiles up to date🤔",
    body: "Open ARMi to review notes, update details, and keep your roster fresh."
  },
  {
    title: "Check in with your people 👋",
    body: "Don't forget the important details — ARMi has your back."
  }
];

class NotificationServiceClass {
  private isInitialized = false;
  private randomNotificationIds: string[] = [];

  async init() {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private generateRandomNotificationTimesForToday(): { amTime: Date | null, pmTime: Date | null } {
    const now = new Date();
    console.log('🔍 TIME DEBUG - Current time:', now.toLocaleString());
    console.log('🔍 TIME DEBUG - Current time ISO:', now.toISOString());
    console.log('🔍 TIME DEBUG - Current time Unix:', now.getTime());
    
    // Create a fresh date object for today to avoid carrying over time components
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    console.log('🔍 TIME DEBUG - Today start of day:', today.toLocaleString());
    
    // Generate AM time (10:00 AM - 12:59 PM)
    let amTime: Date | null = null;
    const amStartHour = 10; // 10 AM
    const amEndHour = 13;   // 1 PM (exclusive, so up to 12:59 PM)
    
    // Check if we can still schedule an AM notification today
    const amCutoff = new Date();
    amCutoff.setHours(amEndHour, 0, 0, 0);
    console.log('🔍 TIME DEBUG - AM cutoff time:', amCutoff.toLocaleString());
    
    if (now < amCutoff) {
      // We can schedule AM for today
      const amDate = new Date();
      const randomAmHour = Math.floor(Math.random() * (amEndHour - amStartHour)) + amStartHour;
      const randomAmMinute = Math.floor(Math.random() * 60);
      amDate.setHours(randomAmHour, randomAmMinute, 0, 0);
      
      console.log('🔍 TIME DEBUG - Generated AM time for today:', amDate.toLocaleString());
      console.log('🔍 TIME DEBUG - AM time ISO:', amDate.toISOString());
      
      // Ensure it's at least 5 minutes from now
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      console.log('🔍 TIME DEBUG - Five minutes from now:', fiveMinutesFromNow.toLocaleString());
      
      if (amDate <= fiveMinutesFromNow) {
        console.log('🔍 TIME DEBUG - AM time too soon, scheduling for tomorrow');
        // If too soon, schedule for next available AM slot
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(randomAmHour, randomAmMinute, 0, 0);
        amTime = nextDay;
        console.log('🔍 TIME DEBUG - Adjusted AM time for tomorrow:', amTime.toLocaleString());
      } else {
        amTime = amDate;
        console.log('🔍 TIME DEBUG - Final AM time for today:', amTime.toLocaleString());
      }
    } else {
      console.log('🔍 TIME DEBUG - Past AM cutoff, scheduling AM for tomorrow');
      // Schedule AM for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const randomAmHour = Math.floor(Math.random() * (amEndHour - amStartHour)) + amStartHour;
      const randomAmMinute = Math.floor(Math.random() * 60);
      tomorrow.setHours(randomAmHour, randomAmMinute, 0, 0);
      amTime = tomorrow;
      console.log('🔍 TIME DEBUG - Final AM time for tomorrow:', amTime.toLocaleString());
    }
    
    // Generate PM time (2:00 PM - 7:59 PM)
    let pmTime: Date | null = null;
    const pmStartHour = 14; // 2 PM
    const pmEndHour = 20;   // 8 PM (exclusive, so up to 7:59 PM)
    
    // Check if we can still schedule a PM notification today
    const pmCutoff = new Date();
    pmCutoff.setHours(pmEndHour, 0, 0, 0);
    console.log('🔍 TIME DEBUG - PM cutoff time:', pmCutoff.toLocaleString());
    
    if (now < pmCutoff) {
      // We can schedule PM for today
      const pmDate = new Date();
      const randomPmHour = Math.floor(Math.random() * (pmEndHour - pmStartHour)) + pmStartHour;
      const randomPmMinute = Math.floor(Math.random() * 60);
      pmDate.setHours(randomPmHour, randomPmMinute, 0, 0);
      
      console.log('🔍 TIME DEBUG - Generated PM time for today:', pmDate.toLocaleString());
      console.log('🔍 TIME DEBUG - PM time ISO:', pmDate.toISOString());
      
      // Ensure it's at least 5 minutes from now
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (pmDate <= fiveMinutesFromNow) {
        console.log('🔍 TIME DEBUG - PM time too soon, scheduling for tomorrow');
        // If too soon, schedule for next available PM slot
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(randomPmHour, randomPmMinute, 0, 0);
        pmTime = nextDay;
        console.log('🔍 TIME DEBUG - Adjusted PM time for tomorrow:', pmTime.toLocaleString());
      } else {
        pmTime = pmDate;
        console.log('🔍 TIME DEBUG - Final PM time for today:', pmTime.toLocaleString());
      }
    } else {
      console.log('🔍 TIME DEBUG - Past PM cutoff, scheduling PM for tomorrow');
      // Schedule PM for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const randomPmHour = Math.floor(Math.random() * (pmEndHour - pmStartHour)) + pmStartHour;
      const randomPmMinute = Math.floor(Math.random() * 60);
      tomorrow.setHours(randomPmHour, randomPmMinute, 0, 0);
      pmTime = tomorrow;
      console.log('🔍 TIME DEBUG - Final PM time for tomorrow:', pmTime.toLocaleString());
    }
    
    // Ensure AM and PM times are at least 30 minutes apart if on the same day
    if (amTime && pmTime && amTime.toDateString() === pmTime.toDateString()) {
      console.log('🔍 TIME DEBUG - Both notifications on same day, checking spacing');
      const timeDifference = Math.abs(pmTime.getTime() - amTime.getTime());
      const thirtyMinutes = 30 * 60 * 1000;
      console.log('🔍 TIME DEBUG - Time difference (minutes):', timeDifference / (1000 * 60));
      
      if (timeDifference < thirtyMinutes) {
        console.log('🔍 TIME DEBUG - Times too close, adjusting PM time');
        // Adjust PM time to be at least 30 minutes after AM time
        pmTime = new Date(amTime.getTime() + thirtyMinutes);
        
        // If this pushes PM time past 8 PM, move it to tomorrow
        if (pmTime.getHours() >= 20) {
          console.log('🔍 TIME DEBUG - Adjusted PM time past 8 PM, moving to tomorrow');
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          const randomPmHour = Math.floor(Math.random() * (pmEndHour - pmStartHour)) + pmStartHour;
          const randomPmMinute = Math.floor(Math.random() * 60);
          tomorrow.setHours(randomPmHour, randomPmMinute, 0, 0);
          pmTime = tomorrow;
          console.log('🔍 TIME DEBUG - Final adjusted PM time for tomorrow:', pmTime.toLocaleString());
        } else {
          console.log('🔍 TIME DEBUG - Final adjusted PM time for today:', pmTime.toLocaleString());
        }
      }
    }
    
    console.log('🔍 TIME DEBUG - Final AM time:', amTime?.toLocaleString() || 'null');
    console.log('🔍 TIME DEBUG - Final PM time:', pmTime?.toLocaleString() || 'null');
    console.log('🔍 TIME DEBUG - Final AM time Unix:', amTime?.getTime() || 'null');
    console.log('🔍 TIME DEBUG - Final PM time Unix:', pmTime?.getTime() || 'null');
    
    return { amTime, pmTime };
  }

  async scheduleRandomAppNotification() {
    try {
      if (!this.isInitialized) {
        const initialized = await this.init();
        if (!initialized) {
          console.warn('Cannot schedule random notification - notifications not initialized');
          return null;
        }
      }

      // Cancel any existing random notifications
      await this.cancelAllRandomNotifications();

      // Generate two random times for today (AM and PM)
      const { amTime, pmTime } = this.generateRandomNotificationTimesForToday();
      const scheduledIds: string[] = [];
      
      // Schedule AM notification
      if (amTime) {
        const amMessage = RANDOM_APP_MESSAGES[Math.floor(Math.random() * RANDOM_APP_MESSAGES.length)];
        console.log('Scheduling AM notification for:', amTime.toLocaleString());
        console.log('AM message:', amMessage.title);

        const amNotificationContent: Notifications.NotificationContentInput = {
          title: amMessage.title,
          body: amMessage.body,
          data: {
            type: 'random_app_engagement',
            slot: 'am',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        };
        
        const amTrigger = {
          date: amTime,
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        };
        
        const amNotificationId = await Notifications.scheduleNotificationAsync({
          content: amNotificationContent,
          trigger: amTrigger,
        });
        
        scheduledIds.push(amNotificationId);
        console.log(`Scheduled AM notification ${amNotificationId} for ${amTime.toLocaleString()}`);
      }
      
      // Schedule PM notification
      if (pmTime) {
        const pmMessage = RANDOM_APP_MESSAGES[Math.floor(Math.random() * RANDOM_APP_MESSAGES.length)];
        console.log('Scheduling PM notification for:', pmTime.toLocaleString());
        console.log('PM message:', pmMessage.title);

        const pmNotificationContent: Notifications.NotificationContentInput = {
          title: pmMessage.title,
          body: pmMessage.body,
          data: {
            type: 'random_app_engagement',
            slot: 'pm',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        };
        
        const pmTrigger = {
          date: pmTime,
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        };
        
        const pmNotificationId = await Notifications.scheduleNotificationAsync({
          content: pmNotificationContent,
          trigger: pmTrigger,
        });
        
        scheduledIds.push(pmNotificationId);
        console.log(`Scheduled PM notification ${pmNotificationId} for ${pmTime.toLocaleString()}`);
      }

      // Store the notification IDs and today's date
      this.randomNotificationIds = scheduledIds;
      await AsyncStorage.setItem('random_notification_ids', JSON.stringify(scheduledIds));
      await AsyncStorage.setItem('random_notifications_date', new Date().toDateString());

      console.log(`Scheduled ${scheduledIds.length} random notifications for today`);
      return scheduledIds;
    } catch (error) {
      console.error('Failed to schedule random app notifications:', error);
      return null;
    }
  }

  private async cancelAllRandomNotifications() {
    try {
      // Cancel using stored IDs
      for (const id of this.randomNotificationIds) {
        await this.cancelNotification(id);
      }
      
      // Also try to cancel using stored IDs from AsyncStorage
      const storedIds = await AsyncStorage.getItem('random_notification_ids');
      if (storedIds) {
        const ids = JSON.parse(storedIds);
        for (const id of ids) {
          await this.cancelNotification(id);
        }
      }
      
      // Clear stored data
      this.randomNotificationIds = [];
      await AsyncStorage.removeItem('random_notification_ids');
      await AsyncStorage.removeItem('random_notifications_date');
    } catch (error) {
      console.error('Failed to cancel random notifications:', error);
    }
  }

  async startRandomAppNotifications() {
    try {
      console.log('Starting random app notifications...');
      
      // Check if we've already scheduled notifications for today
      const lastScheduledDate = await AsyncStorage.getItem('random_notifications_date');
      const today = new Date().toDateString();
      
      if (lastScheduledDate === today) {
        console.log('Random notifications already scheduled for today');
        return;
      }
      
      // Schedule new notifications for today
      await this.scheduleRandomAppNotification();
    } catch (error) {
      console.error('Failed to start random app notifications:', error);
    }
  }

  async stopRandomAppNotifications() {
    try {
      console.log('Stopping random app notifications...');
      await this.cancelAllRandomNotifications();
      console.log('Random app notifications stopped');
    } catch (error) {
      console.error('Failed to stop random app notifications:', error);
    }
  }

  async restoreRandomNotificationIds() {
    try {
      const storedIds = await AsyncStorage.getItem('random_notification_ids');
      if (storedIds) {
        this.randomNotificationIds = JSON.parse(storedIds);
        console.log('Restored random notification IDs:', this.randomNotificationIds);
      }
    } catch (error) {
      console.error('Failed to restore random notification IDs:', error);
    }
  }

  async scheduleReminderNotification(reminder: {
    id: number;
    title: string;
    description?: string;
    scheduledFor: Date;
    profileName?: string;
  }) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.init();
        if (!initialized) {
          throw new Error('Notifications not initialized');
        }
      }

      // Use the scheduled date directly and ensure it's in the future
      const scheduledDate = reminder.scheduledFor;
      const now = new Date();

      console.log('🔔 NOTIFICATION DEBUG - Scheduling notification for:', scheduledDate.toLocaleString());
      console.log('🔔 NOTIFICATION DEBUG - Current time:', now.toLocaleString());
      console.log('🔔 NOTIFICATION DEBUG - Time difference (ms):', scheduledDate.getTime() - now.getTime());
      console.log('🔔 NOTIFICATION DEBUG - Time difference (minutes):', (scheduledDate.getTime() - now.getTime()) / (1000 * 60));
      
      // Enhanced debugging
      console.log('🔔 NOTIFICATION DEBUG - Scheduled Date ISO:', scheduledDate.toISOString());
      console.log('🔔 NOTIFICATION DEBUG - Current Date ISO:', now.toISOString());
      console.log('🔔 NOTIFICATION DEBUG - Scheduled Date Unix:', scheduledDate.getTime());
      console.log('🔔 NOTIFICATION DEBUG - Current Date Unix:', now.getTime());
      console.log('🔔 NOTIFICATION DEBUG - Scheduled Date Local Components:', {
        year: scheduledDate.getFullYear(),
        month: scheduledDate.getMonth(),
        day: scheduledDate.getDate(),
        hour: scheduledDate.getHours(),
        minute: scheduledDate.getMinutes(),
        second: scheduledDate.getSeconds()
      });
      
      if (scheduledDate <= now) {
        console.warn('🔔 NOTIFICATION DEBUG - Cannot schedule notification for past date:', scheduledDate.toLocaleString());
        return null;
      }

      // Add buffer to ensure notification is scheduled far enough in the future
      const timeDifferenceMs = scheduledDate.getTime() - now.getTime();
      const minimumBufferMs = 10000; // 10 seconds buffer
      
      if (timeDifferenceMs < minimumBufferMs) {
        console.log(`🔔 NOTIFICATION DEBUG - Time difference too small (${timeDifferenceMs}ms), adding buffer`);
        scheduledDate.setTime(now.getTime() + minimumBufferMs);
        console.log(`🔔 NOTIFICATION DEBUG - Adjusted scheduled time to: ${scheduledDate.toLocaleString()}`);
      } else {
        console.log(`🔔 NOTIFICATION DEBUG - Time difference sufficient (${timeDifferenceMs}ms), no buffer needed`);
      }

      // Final pre-scheduling debug
      const finalTimeDiff = scheduledDate.getTime() - Date.now();
      console.log('🔔 NOTIFICATION DEBUG - FINAL: Trigger date', scheduledDate.toString());
      console.log('🔔 NOTIFICATION DEBUG - FINAL: ms from now:', finalTimeDiff);
      console.log('🔔 NOTIFICATION DEBUG - FINAL: minutes from now:', finalTimeDiff / (1000 * 60));

      // Create notification content
      const notificationContent: Notifications.NotificationContentInput = {
        title: reminder.title,
        body: reminder.description || (reminder.profileName ? `Reminder about ${reminder.profileName}` : 'You have a reminder'),
        data: {
          reminderId: reminder.id,
          type: 'reminder',
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };
      
      // Schedule the notification with Date trigger
      const triggerObject = {
        date: scheduledDate,
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      };
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: triggerObject,
      });

      console.log(`🔔 NOTIFICATION DEBUG - Scheduled notification ${notificationId} for reminder ${reminder.id} at ${scheduledDate.toLocaleString()}`);
      
      // Check all scheduled notifications after scheduling
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('🔔 NOTIFICATION DEBUG - Total scheduled notifications:', allScheduled.length);
      
      // Check for Expo Go limitation
      if (allScheduled.length === 0) {
        console.warn('🔔 NOTIFICATION DEBUG - Expo Go limitation – use a dev build to test timing');
      }
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Handle notification responses (when user taps on notification)
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notifications received while app is in foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

const NotificationService = new NotificationServiceClass();
export default NotificationService;