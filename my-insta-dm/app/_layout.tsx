import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// 루트 레이아웃 — 단일 Stack 네비게이터 (탭 없음)
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
