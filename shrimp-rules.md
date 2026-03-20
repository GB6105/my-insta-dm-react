# Development Guidelines — Instagram DM 전용 앱

## Project Overview

- **앱 코드 루트**: `my-insta-dm/` (프로젝트 루트가 아님)
- **스택**: Expo ~54 + React Native 0.81 + TypeScript ~5.9 + expo-router ~6.0
- **핵심 원칙**: 단일 화면(DM inbox만), WebView 래퍼, 개인용 iOS 전용

## Directory Structure

```
only-message/              ← 프로젝트 루트 (git root, CLAUDE.md 위치)
└── my-insta-dm/           ← 앱 코드 루트 (모든 RN 코드는 여기)
    ├── app/
    │   ├── _layout.tsx    ← expo-router 루트 레이아웃 (탭 제거, Stack만 사용)
    │   └── index.tsx      ← 유일한 화면 (DM 메인)
    ├── components/
    │   └── WebViewDM.tsx  ← WebView 핵심 컴포넌트
    ├── utils/
    │   └── notifications.ts ← 알림 유틸
    ├── constants/
    │   └── theme.ts       ← 테마 상수
    └── hooks/             ← 커스텀 훅
```

## File Rules

- **모든 코드 파일은 `my-insta-dm/` 내에 생성한다**
- `.tsx` (컴포넌트), `.ts` (유틸/훅/상수) 확장자만 사용 — `.js`, `.jsx` 생성 금지
- 컴포넌트 파일명: PascalCase (예: `WebViewDM.tsx`)
- 유틸/훅 파일명: camelCase (예: `notifications.ts`)

## Simultaneous File Modification Rules

| 변경 시 | 함께 수정 필요 |
|---------|---------------|
| `my-insta-dm/package.json` 의존성 추가/삭제 | `CLAUDE.md` 기술 스택 섹션 |
| `my-insta-dm/app/` 구조 변경 | `CLAUDE.md` 프로젝트 구조 섹션 |
| `utils/notifications.ts` 인터페이스 변경 | `app/index.tsx` (호출부) |
| `components/WebViewDM.tsx` props 변경 | `app/index.tsx` (사용부) |

## Code Standards

- **주석**: 한국어로 작성 (영어 금지)
- **스타일**: `StyleSheet.create()` 사용, 인라인 스타일은 동적 값(조건부 색상 등)에만 허용
- **컴포넌트**: 함수형만 사용, 클래스 컴포넌트 금지
- **console.log**: 디버그 후 반드시 제거
- **indent**: 2-space

## Single Screen Principle

- **화면은 `app/index.tsx` 하나만 존재해야 한다**
- `app/(tabs)/` 디렉토리 금지 — 탭 네비게이션 불필요
- 새 화면/모달/탭 추가 금지 (DM inbox 외 화면 없음)
- `app/_layout.tsx`는 `<Stack>` 단일 네비게이터만 사용

## WebView URL Policy

- 허용 URL: `instagram.com/direct` 경로 포함 URL만
- 그 외 URL로 이동 시 즉시 `https://www.instagram.com/direct/inbox/`로 강제 복귀
- `onNavigationStateChange`에서 URL 체크 후 복귀 처리
- **절대 금지**: `instagram.com` 외부 도메인 허용, 피드/릴스 URL 허용

## Key Constants

```typescript
const DM_URL = 'https://www.instagram.com/direct/inbox/';
const POLLING_INTERVAL = 30000; // 30초
```
- 이 상수는 `my-insta-dm/constants/` 또는 각 파일 상단에 정의한다

## WebViewDM Component Interface

```typescript
// components/WebViewDM.tsx
interface WebViewDMProps {
  onUnreadCountChange: (count: number) => void;
}
```
- `onUnreadCountChange`: 미읽음 수가 변경될 때 호출 (postMessage로 수신)

## Notifications Interface

```typescript
// utils/notifications.ts
export function requestNotificationPermission(): Promise<boolean>
export function scheduleUnreadCheck(webViewRef: RefObject<WebView>, isBackground: boolean): void
export function stopUnreadCheck(): void
export function sendLocalNotification(count: number): Promise<void>
```

## Expo Constraints

- **`expo eject` 금지** — 관리형 워크플로우 유지 필수
- **Android 대응 코드 작성 금지** — iOS 전용
- **앱 스토어 심사 대응 코드 불필요** — 개인 설치용
- 패키지 설치 시 `expo install` 우선 사용 (Expo 호환 버전 자동 선택)

## Prohibited Actions

- `app/(tabs)/` 또는 탭 네비게이션 구조 생성
- `.js` / `.jsx` 파일 생성
- `expo eject` 실행
- `console.log` 코드 커밋
- `DM_URL` 외 경로를 WebView 초기 URL로 사용
- `react-navigation/native-stack` 직접 임포트 (expo-router 사용)
- Android 전용 코드(`Platform.OS === 'android'`) 추가
