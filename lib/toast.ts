import { Alert, Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info') {
  // On web/native, use Alert for now (can be replaced with react-native-toast-message or similar)
  if (Platform.OS === 'web') {
    // Use browser notification if available, fallback to alert
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(type.toUpperCase(), { body: message });
    } else {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  } else {
    Alert.alert(type.charAt(0).toUpperCase() + type.slice(1), message);
  }
}

export function showSuccess(message: string) {
  showToast(message, 'success');
}

export function showError(message: string) {
  showToast(message, 'error');
}

export function showInfo(message: string) {
  showToast(message, 'info');
}

export function showWarning(message: string) {
  showToast(message, 'warning');
}





