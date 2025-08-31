console.log("🔥 THIS _layout.tsx WAS LOADED 🔥");
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, Image, useColorScheme, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NotificationService from '@/services/NotificationService';
import { DatabaseService } from '@/services/DatabaseService';
import { router } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const { isReady: isFrameworkReady, error } = useFrameworkReady();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const gifSource = isDark
    ? require('../assets/gifs/darkloading.gif')
    : require('../assets/gifs/lightloading.gif');

  const [gifLoaded, setGifLoaded] = useState(false);
  const [forceDelay, setForceDelay] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 👇 Start 2.16-second timer AFTER GIF fully loads
  useEffect(() => {
    if (gifLoaded) {
      const timer = setTimeout(() => {
        setForceDelay(false);
      }, 2160);
      return () => clearTimeout(timer);
    }
  }, [gifLoaded]);

  useEffect(() => {
    if (isFrameworkReady && !forceDelay) {
      NotificationService.init();
      
      // Initialize random notifications if enabled
      const initRandomNotifications = async () => {
        try {
          const randomEnabled = await AsyncStorage.getItem('notifications_random_enabled');
          if (randomEnabled === 'true') {
            await NotificationService.restoreRandomNotificationIds();
            await NotificationService.startRandomAppNotifications();
          }
        } catch (error) {
          console.error('Error initializing random notifications:', error);
        }
      };
      
      initRandomNotifications();

      const responseSubscription = NotificationService.addNotificationResponseListener(
        async (response) => {
          const { reminderId, type } = response.notification.request.content.data;
          
          if (type === 'random_app_engagement') {
            // User tapped on a random app engagement notification
            console.log('Random app engagement notification tapped');
            // Navigate to main app
            router.push('/(tabs)');
          } else if (reminderId) {
            // Handle reminder notifications as before
            router.push('/(tabs)/reminders');
          }
        }
      );

      const receivedSubscription = NotificationService.addNotificationReceivedListener(
        async (notification) => {
          console.log('Notification received while app is open:', notification);
          
          const { type } = notification.request.content.data;
          if (type === 'random_app_engagement') {
            // Random app engagement notification received while app is open
            console.log('Random app engagement notification received while app is open');
          }
        }
      );

      return () => {
        responseSubscription.remove();
        receivedSubscription.remove();
      };
    }
  }, [isFrameworkReady, forceDelay]);

  if (forceDelay || !isFrameworkReady) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        {!error ? (
          <Image
            source={gifSource}
            style={styles.gif}
            resizeMode="cover"
            onLoadEnd={() => {
              console.log("✅ GIF fully loaded");
              setGifLoaded(true);

              // 👉 Fade in AFTER gif is fully loaded
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
          }}
          />
        ) : (
          <>
            <Text style={styles.loadingText}>
              {error ? error : 'Loading ARMi...'}
            </Text>
            <Text style={styles.errorSubtext}>
              Try refreshing the page or use the mobile app for the best experience.
            </Text>
          </>
        )}
      </Animated.View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(share)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
            <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="profile/create" options={{ headerShown: false }} />
            <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="profile/edit/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
            <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f0f0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  gif: {
    width: '100%',
    height: '100%',
  },
});