import { StyleSheet } from 'react-native';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { RefObject, useRef } from 'react';

// Instagram DM inbox URL 상수
const DM_URL = 'https://www.instagram.com/direct/inbox/';

// URL에서 릴스 ID 추출 — 스와이프 감지에 사용 (절대/상대 경로 모두 지원)
function extractReelId(url: string): string | null {
  const match = url.match(/(?:instagram\.com)?\/reel\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

// 페이지 로드 후 주입할 JS — nav/header 숨김 + SPA 라우팅 감지 + true 반환 (RN 필수)
const INJECTED_JS = `
  (function() {
    // DM 외 UI 요소 숨김
    ['nav', 'header', '[role="navigation"]'].forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.style.display = 'none';
      });
    });

    // SPA 클라이언트 라우팅 감지 — history.pushState/replaceState 오버라이드
    function notifyUrlChange(url) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'urlChange', url: url }));
    }
    var origPush = history.pushState;
    history.pushState = function(state, title, url) {
      origPush.apply(this, arguments);
      if (url) notifyUrlChange(String(url));
    };
    var origReplace = history.replaceState;
    history.replaceState = function(state, title, url) {
      origReplace.apply(this, arguments);
      if (url) notifyUrlChange(String(url));
    };

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
  // DM에서 최초 진입한 릴스 ID 저장 — 다른 ID로 이동하면 스와이프로 간주해 차단
  const allowedReelIdRef = useRef<string | null>(null);

  // SPA 라우팅 URL 변경 처리 — handleNavigationStateChange와 동일한 차단 정책 적용
  function handleUrlChange(url: string) {
    if (!url) return;

    // DM 또는 로그인 페이지 — 허용, 릴스 ID 초기화
    // pushState는 상대 경로(/direct/...)로 전달될 수 있으므로 양쪽 모두 체크
    if (
      url.includes('instagram.com/direct') ||
      url.startsWith('/direct') ||
      url.includes('accounts/login') ||
      url.startsWith('/accounts/login')
    ) {
      allowedReelIdRef.current = null;
      return;
    }

    // 릴스 URL 처리
    const reelId = extractReelId(url);
    if (reelId !== null) {
      if (allowedReelIdRef.current === null) {
        // DM에서 첫 진입 — 허용하고 ID 기억
        allowedReelIdRef.current = reelId;
        return;
      }
      if (reelId === allowedReelIdRef.current) {
        // 같은 릴스 — 허용
        return;
      }
      // 다른 릴스로 이동 — 스와이프로 간주해 차단
      allowedReelIdRef.current = null;
      webViewRef.current?.injectJavaScript(`window.location.href = '${DM_URL}'; true;`);
      return;
    }

    // 그 외 URL — inbox로 강제 복귀
    webViewRef.current?.injectJavaScript(`window.location.href = '${DM_URL}'; true;`);
  }

  // URL 이탈 감지 — DM 경로 외 이동 시 inbox로 강제 복귀 (릴스는 첫 진입만 허용)
  function handleNavigationStateChange(navState: WebViewNavigation) {
    const url = navState.url;
    if (!url) return;

    // DM 또는 로그인 페이지 — 허용, 릴스 ID 초기화
    if (url.includes('instagram.com/direct') || url.includes('accounts/login')) {
      allowedReelIdRef.current = null;
      return;
    }

    // 릴스 URL 처리
    const reelId = extractReelId(url);
    if (reelId !== null) {
      if (allowedReelIdRef.current === null) {
        // DM에서 첫 진입 — 허용하고 ID 기억
        allowedReelIdRef.current = reelId;
        return;
      }
      if (reelId === allowedReelIdRef.current) {
        // 같은 릴스 — 허용
        return;
      }
      // 다른 릴스로 이동 — 스와이프로 간주해 차단
      allowedReelIdRef.current = null;
      webViewRef.current?.stopLoading();
      webViewRef.current?.injectJavaScript(`window.location.href = '${DM_URL}'; true;`);
      return;
    }

    // 그 외 URL — 기존 동작 유지 (inbox로 강제 복귀)
    webViewRef.current?.stopLoading();
    webViewRef.current?.injectJavaScript(`window.location.href = '${DM_URL}'; true;`);
  }

  // WebView → RN postMessage 수신
  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'unread') {
        onUnreadCountChange(data.count);
      } else if (data.type === 'urlChange') {
        // SPA 라우팅으로 URL이 변경됨 — handleNavigationStateChange와 동일한 로직 적용
        handleUrlChange(data.url);
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
