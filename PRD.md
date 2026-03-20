# PRD — Instagram DM 전용 앱 (개인용)

## 개요

인스타그램 앱을 열지 않고도 DM만 송수신할 수 있는 개인용 iOS 앱.
릴스, 피드, 탐색 등 집중력을 방해하는 기능을 완전히 차단하고 메시지 기능만 노출한다.

---

## 배경 및 목적

- 인스타그램 앱을 열면 릴스·피드에 시간을 뺏기는 문제
- DM만 쓰고 싶은데 다른 콘텐츠에 의도치 않게 노출됨
- 개인 사용 목적이므로 앱 스토어 배포 없이 직접 설치

---

## 사용자

- 단일 사용자 (개발자 본인)
- iOS 기기 사용
- 인스타그램 개인 계정 보유

---

## 핵심 기능

### 반드시 구현 (MVP)

| 기능 | 설명 |
|------|------|
| DM 화면 표시 | `instagram.com/direct/inbox/` 웹뷰로 로드 |
| 메시지 수신 | 웹뷰 내에서 실시간 확인 |
| 메시지 발신 | 웹뷰 내 입력창으로 전송 |
| UI 정리 | 네비바·헤더·탭 등 DM 외 요소 CSS/JS로 숨김 |
| URL 차단 | DM 경로 외 이동 시 강제 복귀 |
| 세션 유지 | 로그인 쿠키 저장, 재실행 시 자동 로그인 |
| 푸시 알림 | 백그라운드에서 미읽음 DM 감지 시 네이티브 알림 발송 |

### 추후 고려 (v2)

- Express 백엔드 연동 (더 정확한 폴링)
- 다크모드 지원
- 앱 아이콘·스플래시 커스텀

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 앱 프레임워크 | Expo (React Native) |
| WebView | react-native-webview |
| 푸시 알림 | expo-notifications |
| 네비게이션 | @react-navigation/native |
| 개발 환경 | Windows + VSCode |
| 테스트 | Expo Go (iPhone) |
| 빌드 | EAS Build (클라우드, Mac 불필요) |

---

## 아키텍처

```
iPhone
└── Expo 앱
    ├── App.js                  # 진입점, 네비게이션 루트
    ├── src/screens/
    │   └── DMScreen.js         # 메인 화면, 알림 로직 연결
    ├── src/components/
    │   └── WebViewDM.js        # WebView + URL 차단 + JS 주입
    └── src/utils/
        └── notifications.js    # 알림 권한, 폴링, 발송
```

### 데이터 흐름

```
[인스타그램 웹] ←→ [WebView] ←→ [DMScreen] → [푸시 알림]
                       ↑
                  JS 주입 (UI 정리)
                  URL 인터셉트 (차단)
                  postMessage (미읽음 수 전달)
```

---

## 화면 구성

### 화면 1 — DM 화면 (유일한 화면)

- 전체 화면 WebView
- 인스타그램 DM inbox 고정 로드
- 숨기는 요소: 하단 탭바, 상단 헤더, 사이드 네비게이션
- SafeAreaView로 노치/홈바 자동 회피

---

## 제약 및 한계

| 항목 | 내용 |
|------|------|
| 앱 스토어 배포 불가 | 웹뷰 래핑 정책 위반 — 개인 설치만 |
| 인스타그램 UI 변경 | CSS selector 기반이라 인스타 업데이트 시 JS 주입 수정 필요 |
| 푸시 알림 정확도 | 폴링 방식(30초 간격)이라 실시간 아님 |
| 개인 계정만 | Meta 공식 API 아니므로 비즈니스 기능 없음 |

---

## 개발 순서

1. `npx create-expo-app my-insta-dm` 프로젝트 생성
2. 패키지 설치 (`react-native-webview`, `expo-notifications`, `@react-navigation/*`)
3. `WebViewDM.js` 구현 — WebView + URL 차단 + JS 주입
4. `notifications.js` 구현 — 권한 요청 + 폴링 + 알림 발송
5. `DMScreen.js` 구현 — 전체 연결
6. `App.js` 네비게이션 설정
7. Expo Go로 iPhone 테스트
8. (선택) EAS Build로 standalone 앱 빌드
