# CLAUDE.md

## 프로젝트 개요

인스타그램 DM만 사용할 수 있는 개인용 iOS 앱.
릴스·피드 등 집중력을 방해하는 기능을 차단하고 메시지 송수신에만 집중한다.
앱 스토어 배포 없이 개인 기기에만 설치한다.

---

## 기술 스택

- **프레임워크**: Expo ~54.0 (React Native 0.81)
- **언어**: TypeScript ~5.9
- **라우팅**: expo-router ~6.0 (파일 기반 라우팅)
- **WebView**: react-native-webview
- **알림**: expo-notifications
- **네비게이션**: @react-navigation/native ~7.1
- **개발 환경**: Windows + VSCode
- **테스트**: Expo Go (iPhone)

---

## 프로젝트 구조

```
my-insta-dm/
├── app/
│   ├── _layout.tsx               # 루트 레이아웃 (expo-router)
│   └── index.tsx                 # DM 메인 화면 (구현 예정)
├── components/
│   └── WebViewDM.tsx             # WebView 핵심 컴포넌트 (구현 예정)
├── utils/
│   └── notifications.ts          # 푸시 알림 유틸 (구현 예정)
├── constants/
│   └── theme.ts                  # 테마 상수
├── hooks/                        # 커스텀 훅
├── assets/images/
├── app.json                      # Expo 설정
├── tsconfig.json
└── package.json
```

---

## 핵심 구현 원칙

### WebView URL 정책
- 허용 URL: `instagram.com/direct` 경로만
- 그 외 URL로 이동 시 즉시 `instagram.com/direct/inbox/`로 강제 복귀
- `onNavigationStateChange`에서 처리

### JS 주입 (UI 정리)
- 페이지 로드 후 `injectedJavaScript`로 실행
- 제거 대상: `nav`, `header`, `[role="navigation"]`
- 항상 `true` 반환으로 끝내야 함 (React Native 요구사항)

### 푸시 알림 폴링
- 30초 간격으로 미읽음 수 체크
- `AppState.currentState === 'background'` 일 때만 알림 발송
- WebView → RN 데이터 전달은 `window.ReactNativeWebView.postMessage()` 사용

---

## 명령어 (Scripts)

```bash
# 개발 서버 시작
npx expo start

# iOS 시뮬레이터 실행
npx expo start --ios

# 린트 검사
npm run lint

# 프로젝트 보일러플레이트 초기화 (주의: 기존 app/ 내용 삭제)
npm run reset-project
```

---

## 개발 도구 및 설정

- **패키지 매니저**: npm
- **런타임**: Node.js (Expo 호환 버전)
- **린터**: ESLint ~9.25 + eslint-config-expo ~10.0
- **포맷터**: Prettier (`.prettierrc` 설정, `npx prettier --write .`)
- **타입 체커**: TypeScript ~5.9
- **빌드 도구**: Expo CLI (관리형 워크플로우)

---

## 코드 컨벤션

- 함수형 컴포넌트만 사용 (클래스 컴포넌트 사용 안 함)
- React Hooks: `useRef`, `useEffect`, `useState`
- 스타일: `StyleSheet.create()` 사용 (인라인 스타일 지양)
- 주석: 한국어로 작성
- 파일명: PascalCase (컴포넌트 `.tsx`), camelCase (유틸 `.ts`)

---

## 주요 상수

```javascript
const DM_URL = 'https://www.instagram.com/direct/inbox/';
const POLLING_INTERVAL = 30000; // 30초
```

---

## 작업 시 주의사항

- **React 입문자 기준으로 코드 작성** — 복잡한 패턴보다 명확하고 읽기 쉬운 코드 우선
- **주석을 충분히** — 각 함수와 훅의 역할을 한국어로 설명
- **Expo 관리형 워크플로우 유지** — `expo eject` 하지 않음
- **iOS 전용** — Android 대응 불필요
- **앱 스토어 배포 없음** — 심사 대응 코드 불필요

---

## 현재 구현 상태

- [x] PRD 작성
- [x] 프로젝트 생성 (`npx create-expo-app`)
- [x] 보일러플레이트 정리 (탭 제거, 단일 화면 구조 전환)
- [x] 패키지 설치 (`react-native-webview`, `expo-notifications`)
- [x] `WebViewDM.tsx` 구현 (WebView + URL 차단 + JS 주입 + postMessage)
- [x] `notifications.ts` 구현 (권한 요청 + 30초 폴링 + 로컬 알림)
- [x] `app/index.tsx` 구현 (SafeAreaView + AppState + 전체 연결)
- [ ] iPhone 테스트

---

## 알려진 한계

- 인스타그램 웹 UI 업데이트 시 CSS selector 수정 필요할 수 있음
- 푸시 알림은 폴링 방식이라 최대 30초 지연 있음
- 개인용이므로 멀티 계정 미지원
