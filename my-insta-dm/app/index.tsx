import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import WebViewDM from '../components/WebViewDM';
import {
  requestNotificationPermission,
  scheduleUnreadCheck,
  stopUnreadCheck,
  sendLocalNotification,
} from '../utils/notifications';

export default function DMScreen() {
  // WebView 참조 — notifications.ts에서 JS 주입 시 사용
  const webViewRef = useRef<WebView>(null);

  // 현재 AppState를 ref로 관리 (리렌더 방지)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // 마운트 시 알림 권한 요청
    requestNotificationPermission();

    // AppState 변경 감지 — 백그라운드 진입 시 폴링 시작, 포그라운드 복귀 시 중단
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'active' && nextState === 'background') {
        // 백그라운드 진입 — 폴링 시작
        scheduleUnreadCheck(webViewRef);
      } else if (nextState === 'active') {
        // 포그라운드 복귀 — 폴링 중단
        stopUnreadCheck();
      }
    });

    return () => {
      subscription.remove();
      stopUnreadCheck();
    };
  }, []);

  // WebViewDM에서 미읽음 수를 받으면 백그라운드일 때만 알림 발송
  function handleUnreadCountChange(count: number) {
    if (appStateRef.current !== 'active') {
      sendLocalNotification(count);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebViewDM webViewRef={webViewRef} onUnreadCountChange={handleUnreadCountChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 전체 화면 — 노치/홈바 SafeAreaView로 자동 대응
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
