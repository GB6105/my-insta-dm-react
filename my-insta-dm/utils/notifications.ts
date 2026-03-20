import * as Notifications from 'expo-notifications';
import WebView from 'react-native-webview';
import { RefObject } from 'react';
import { EXTRACT_UNREAD_JS } from '../components/WebViewDM';

// 폴링 간격 상수 (30초)
const POLLING_INTERVAL = 30000;

// 현재 폴링 인터벌 ID
let intervalId: ReturnType<typeof setInterval> | null = null;

// 알림 표시 방식 설정 — 포그라운드에서도 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 알림 권한 요청
 * @returns 권한 허용 여부
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * 미읽음 수 폴링 시작 — WebView에 EXTRACT_UNREAD_JS를 주입해 count를 가져온다
 * @param webViewRef WebView 참조
 */
export function scheduleUnreadCheck(webViewRef: RefObject<WebView | null>): void {
  // 기존 인터벌 초기화 후 재시작
  stopUnreadCheck();
  intervalId = setInterval(() => {
    webViewRef.current?.injectJavaScript(EXTRACT_UNREAD_JS);
  }, POLLING_INTERVAL);
}

/**
 * 미읽음 수 폴링 중단
 */
export function stopUnreadCheck(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * 네이티브 로컬 푸시 알림 발송
 * @param count 미읽음 메시지 수
 */
export async function sendLocalNotification(count: number): Promise<void> {
  if (count <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Instagram DM',
      body: `읽지 않은 메시지가 ${count}개 있습니다.`,
      sound: true,
    },
    trigger: null, // 즉시 발송
  });
}
