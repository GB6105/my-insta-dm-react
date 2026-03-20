# PRD — Instagram DM 전용 앱 (개인용)

## 프로젝트 핵심

- **목적**: 인스타그램 앱의 피드·릴스 없이 DM 송수신만 가능한 집중력 보호 iOS 앱
- **타겟 사용자**: 단일 사용자 (개발자 본인), iOS 기기, 개인 인스타그램 계정 보유

---

## 사용자 여정

```
앱 실행
  └─ 세션 쿠키 존재?
       ├─ YES → DM 화면 바로 표시 (자동 로그인)
       └─ NO  → 인스타그램 로그인 화면 표시
                  └─ 로그인 완료 → DM 화면으로 이동

DM 화면 (전체 화면 WebView)
  ├─ DM 목록·대화 탐색 (WebView 내에서)
  ├─ 메시지 수신·발신 (WebView 내에서)
  ├─ URL 이탈 감지 → DM inbox로 강제 복귀
  └─ 앱 백그라운드 진입
         └─ 30초 폴링 → 미읽음 감지 → 네이티브 푸시 알림 발송
```

---

## 기능 명세 (MVP)

| ID   | 기능                   | 설명                                                                 | 구현 모듈            |
|------|------------------------|----------------------------------------------------------------------|----------------------|
| F001 | DM WebView 표시        | `instagram.com/direct/inbox/` 전체 화면 WebView 로드                | `WebViewDM`          |
| F002 | UI 정리 (JS 주입)      | 네비바·헤더·탭 등 DM 외 요소를 injectedJavaScript로 숨김            | `WebViewDM`          |
| F003 | URL 차단·복귀          | DM 경로(`/direct`) 이탈 시 inbox로 강제 복귀                        | `WebViewDM`          |
| F004 | 세션 유지              | WebView 쿠키 저장 → 재실행 시 자동 로그인                           | `WebViewDM`          |
| F005 | 푸시 알림 권한 요청    | 앱 최초 실행 시 알림 권한 요청                                       | `notifications`      |
| F006 | 미읽음 폴링            | 30초 간격으로 WebView에서 미읽음 수 추출 (postMessage)              | `notifications`      |
| F007 | 네이티브 알림 발송     | 백그라운드 상태에서 미읽음 감지 시 로컬 푸시 알림 발송              | `notifications`      |
| F008 | 보일러플레이트 제거    | create-expo-app 기본 탭/탐색 화면 제거, 단일 DM 화면으로 단순화     | `app/`               |

---

## 모듈별 상세 기능

### `app/index.tsx` — DM 메인 화면

- **역할**: 앱의 유일한 화면. WebView와 알림 로직을 연결한다.
- **주요 기능**:
  - SafeAreaView로 노치/홈바 대응
  - WebViewDM 컴포넌트 마운트
  - AppState 감지 (포그라운드/백그라운드 전환)
  - 알림 권한 요청 트리거
- **구현 기능 ID**: F005, F008 (연결)

### `components/WebViewDM.tsx` — WebView 핵심 컴포넌트

- **역할**: Instagram DM 웹뷰 렌더링, URL 차단, UI 정리
- **주요 기능**:
  - `react-native-webview`로 DM URL 로드
  - `injectedJavaScript`로 nav/header/탭 숨김
  - `onNavigationStateChange`로 URL 이탈 감지 및 강제 복귀
  - `onMessage`로 postMessage 수신 (미읽음 수 전달)
  - 쿠키 유지 (WebView 기본 동작)
- **구현 기능 ID**: F001, F002, F003, F004, F006 (postMessage 수신)

### `utils/notifications.ts` — 푸시 알림 유틸

- **역할**: 알림 권한 요청, 미읽음 폴링, 네이티브 알림 발송
- **주요 기능**:
  - `expo-notifications`로 권한 요청
  - 30초 인터벌 타이머 (백그라운드 진입 시 시작, 포그라운드 복귀 시 중단)
  - WebView로 미읽음 수 추출 JS 주입 요청
  - 미읽음 > 0 이면 로컬 푸시 알림 발송
- **구현 기능 ID**: F005, F006, F007

---

## 데이터 모델

앱 내부 DB 없음. 상태는 React 컴포넌트 state와 WebView 쿠키로만 유지.

| 데이터        | 저장 위치             | 설명                          |
|---------------|-----------------------|-------------------------------|
| 인스타 세션   | WebView 쿠키 (자동)   | 로그인 상태 유지              |
| 미읽음 카운트 | React state (임시)    | 폴링 시마다 갱신              |
| 알림 권한     | 기기 시스템 설정      | expo-notifications로 확인     |

---

## 기술 스택

| 영역          | 기술                                    |
|---------------|-----------------------------------------|
| 앱 프레임워크 | Expo ~54 (React Native 0.81)            |
| 언어          | TypeScript ~5.9                         |
| 라우팅        | expo-router ~6.0                        |
| WebView       | react-native-webview (설치 예정)        |
| 푸시 알림     | expo-notifications (설치 예정)          |
| 네비게이션    | @react-navigation/native ~7.1           |
| 개발 환경     | Windows + VSCode                        |
| 테스트        | Expo Go (iPhone)                        |
| 빌드          | EAS Build (선택, standalone 빌드 시)    |

---

## 화면 구성

### 화면 1 — DM 화면 (유일한 화면)

- 전체 화면 WebView (`flex: 1`)
- `instagram.com/direct/inbox/` 고정 로드
- 숨기는 요소: 하단 탭바, 상단 헤더, 사이드 네비게이션, 알림 배지
- SafeAreaView로 노치/홈바 자동 회피
- 로딩 중 스피너 표시

---

## 제약 및 한계

| 항목              | 내용                                                              |
|-------------------|-------------------------------------------------------------------|
| 앱 스토어 배포 불가 | 웹뷰 래핑 정책 위반 — Expo Go 또는 EAS Build 개인 설치만        |
| 인스타그램 UI 변경 | CSS selector 기반 → 인스타 업데이트 시 JS 주입 수정 필요         |
| 푸시 알림 정확도  | 폴링 방식(30초 간격)이라 실시간 아님                             |
| 개인 계정만       | Meta 공식 API 아님 — 비즈니스 기능 없음                          |

---

## 개발 순서

1. 보일러플레이트 정리 — 기본 탭/탐색 화면 제거 (F008)
2. 패키지 설치 — `react-native-webview`, `expo-notifications`
3. `WebViewDM.tsx` 구현 — WebView + URL 차단 + JS 주입 (F001~F004)
4. `notifications.ts` 구현 — 권한 요청 + 폴링 + 알림 발송 (F005~F007)
5. `app/index.tsx` 구현 — 화면 연결 및 AppState 처리
6. Expo Go로 iPhone 테스트
