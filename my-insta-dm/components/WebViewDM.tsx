import { StyleSheet } from 'react-native';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { RefObject } from 'react';

// Instagram DM inbox URL 상수
const DM_URL = 'https://www.instagram.com/direct/inbox/';

// 페이지 로드 후 주입할 JS — nav/header 숨김 + true 반환 (RN 필수)
const INJECTED_JS = `
  (function() {
    // DM 외 UI 요소 숨김
    ['nav', 'header', '[role="navigation"]'].forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.style.display = 'none';
      });
    });
    true;
  })();
`;

// 미읽음 수 추출 JS — notifications.ts에서도 사용하므로 export
export const EXTRACT_UNREAD_JS = `
  (function() {
    var badge = document.querySelector('[aria-label*="unread"], [aria-label*="미읽음"], [aria-label*="new message"]');
    var count = badge ? (parseInt(badge.textContent) || 0) : 0;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unread', count: count }));
    true;
  })();
`;

interface WebViewDMProps {
  // WebView ref — notifications.ts에서 JS 주입 시 사용
  webViewRef: RefObject<WebView | null>;
  // 미읽음 수가 변경될 때 호출되는 콜백
  onUnreadCountChange: (count: number) => void;
}

export default function WebViewDM({ webViewRef, onUnreadCountChange }: WebViewDMProps) {
  // URL 이탈 감지 — DM 경로 외 이동 시 inbox로 강제 복귀
  function handleNavigationStateChange(navState: WebViewNavigation) {
    const url = navState.url;
    if (url && !url.includes('instagram.com/direct') && !url.includes('accounts/login')) {
      webViewRef.current?.stopLoading();
      webViewRef.current?.injectJavaScript(`window.location.href = '${DM_URL}'; true;`);
    }
  }

  // WebView → RN postMessage 수신
  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'unread') {
        onUnreadCountChange(data.count);
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: DM_URL }}
      style={styles.webView}
      // 페이지 로드 완료 후 UI 정리 JS 주입
      injectedJavaScript={INJECTED_JS}
      onNavigationStateChange={handleNavigationStateChange}
      onMessage={handleMessage}
      // 쿠키 유지 (자동 로그인)
      sharedCookiesEnabled={true}
      // iOS 모바일 UA로 렌더링
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});
