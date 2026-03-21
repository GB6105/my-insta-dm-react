import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// 백그라운드 태스크 정의 — import만 해도 TaskManager.defineTask가 실행됨
import { registerBackgroundTask } from '../utils/backgroundTask';

// 루트 레이아웃 — 단일 Stack 네비게이터 (탭 없음)
export default function RootLayout() {
  useEffect(() => {
    // 앱 시작 시 백그라운드 fetch 태스크 등록
    registerBackgroundTask();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
