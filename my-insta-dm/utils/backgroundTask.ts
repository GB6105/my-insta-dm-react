import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import CookieManager from '@react-native-cookies/cookies';
import { sendLocalNotification } from './notifications';

// 백그라운드 태스크 이름 상수
export const BACKGROUND_FETCH_TASK = 'instagram-dm-check';

// Instagram DM inbox URL
const INBOX_URL = 'https://www.instagram.com/direct/inbox/';

// iPhone 모바일 User-Agent (WebView와 동일하게 유지)
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/**
 * 저장된 쿠키로 Instagram inbox 페이지를 가져와 미읽음 수를 파싱한다.
 * - sharedCookiesEnabled={true} 덕분에 WebView 쿠키가 시스템 HTTPCookieStorage에 공유됨
 * - sessionid 쿠키가 없으면 로그인 안 된 상태로 판단해 0 반환
 */
async function fetchUnreadCount(): Promise<number> {
  // 시스템 쿠키 저장소에서 Instagram 쿠키 읽기
  const cookies = await CookieManager.get('https://www.instagram.com');

  // 로그인 세션 없으면 체크 불필요
  if (!cookies.sessionid) {
    return 0;
  }

  // 쿠키 객체를 Cookie 헤더 문자열로 변환
  const cookieString = Object.values(cookies)
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const response = await fetch(INBOX_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: cookieString,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  const html = await response.text();

  // HTML 응답에서 미읽음 badge 수 파싱
  // Instagram 웹은 "badge_count":N 또는 "unseen_count":N 형태로 데이터를 포함
  const badgeMatch = html.match(/"badge_count"\s*:\s*(\d+)/);
  if (badgeMatch) {
    return parseInt(badgeMatch[1], 10);
  }

  const unseenMatch = html.match(/"unseen_count"\s*:\s*(\d+)/);
  if (unseenMatch) {
    return parseInt(unseenMatch[1], 10);
  }

  return 0;
}

// 백그라운드 태스크 정의 — TaskManager.defineTask은 반드시 모듈 최상위에서 호출해야 함
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const count = await fetchUnreadCount();

    if (count > 0) {
      await sendLocalNotification(count);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    // 네트워크 오류 등 예외 발생 시 Failed 반환 (iOS가 다음 실행 간격 조절에 사용)
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * 백그라운드 태스크 등록
 * - minimumInterval: iOS에게 최소 15분 간격을 요청 (실제 간격은 iOS가 결정)
 * - stopOnTerminate: false — 앱이 완전히 종료돼도 태스크 유지
 */
export async function registerBackgroundTask(): Promise<void> {
  // 백그라운드 fetch 사용 가능 여부 확인
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    // 권한 없거나 기기에서 비활성화된 경우 등록 생략
    return;
  }

  // 이미 등록된 경우 중복 등록 방지
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (isRegistered) {
    return;
  }

  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15분 (iOS가 실제 주기 결정)
    stopOnTerminate: false, // 앱 종료 후에도 태스크 유지
    startOnBoot: false, // 기기 재부팅 시 자동 시작 불필요
  });
}
