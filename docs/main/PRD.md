# PRD — Instagram DM 전용 앱 (개인용)

## 프로젝트 핵심

- **목적**: 인스타그램 앱의 피드·릴스 없이 DM 송수신만 가능한 집중력 보호 iOS 앱
- **타겟 사용자**: 본인 + 친구 1명 (각자 인스타그램 계정으로 로그인, 각자 기기에 설치)
- **배포 방식**: AltStore 사이드로딩 (Apple Developer 계정 불필요)

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

| ID   | 기능                   | 설명                                                                 | 구현 모듈            | 상태 |
|------|------------------------|----------------------------------------------------------------------|----------------------|------|
| F001 | DM WebView 표시        | `instagram.com/direct/inbox/` 전체 화면 WebView 로드                | `WebViewDM`          | ✅ 완료 |
| F002 | UI 정리 (JS 주입)      | 네비바·헤더·탭 등 DM 외 요소를 injectedJavaScript로 숨김            | `WebViewDM`          | ✅ 완료 |
| F003 | URL 차단·복귀          | DM 경로(`/direct`) 이탈 시 inbox로 강제 복귀                        | `WebViewDM`          | ✅ 완료 |
| F004 | 세션 유지              | WebView 쿠키 저장 → 재실행 시 자동 로그인                           | `WebViewDM`          | ✅ 완료 |
| F005 | 푸시 알림 권한 요청    | 앱 최초 실행 시 알림 권한 요청                                       | `notifications`      | ✅ 완료 |
| F006 | 미읽음 폴링            | 30초 간격으로 WebView에서 미읽음 수 추출 (postMessage)              | `notifications`      | ✅ 완료 |
| F007 | 네이티브 알림 발송     | 백그라운드 상태에서 미읽음 감지 시 로컬 푸시 알림 발송              | `notifications`      | ✅ 완료 (EAS Build 후 정상 동작) |
| F008 | 보일러플레이트 제거    | create-expo-app 기본 탭/탐색 화면 제거, 단일 DM 화면으로 단순화     | `app/`               | ✅ 완료 |
| F009 | EAS Build 설정         | `eas.json` 작성, production .ipa 빌드                               | 설정 파일            | ⬜ 미완료 |
| F010 | AltStore 배포          | .ipa 빌드 후 본인·친구 기기에 AltStore로 설치                       | 배포                 | ⬜ 미완료 |

---

## 모듈별 상세 기능

### `app/index.tsx` — DM 메인 화면 ✅

- SafeAreaView로 노치/홈바 대응
- WebViewDM 컴포넌트 마운트
- AppState 감지 (포그라운드/백그라운드 전환)
- 알림 권한 요청 트리거

### `components/WebViewDM.tsx` — WebView 핵심 컴포넌트 ✅

- `react-native-webview`로 DM URL 로드
- `injectedJavaScript`로 nav/header/탭 숨김
- `onNavigationStateChange`로 URL 이탈 감지 및 강제 복귀
- `onMessage`로 postMessage 수신 (미읽음 수 전달)
- 쿠키 유지 (WebView 기본 동작)

### `utils/notifications.ts` — 푸시 알림 유틸 ✅

- `expo-notifications`로 권한 요청
- 30초 인터벌 타이머 (백그라운드 진입 시 시작, 포그라운드 복귀 시 중단)
- WebView로 미읽음 수 추출 JS 주입 요청
- 미읽음 > 0 이면 로컬 푸시 알림 발송
- ⚠️ Expo Go 환경에서는 백그라운드 알림 미동작 → EAS Build 필수

### `eas.json` — EAS Build 설정 ⬜ 추가 예정

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "distribution": "internal",
      "ios": { "buildConfiguration": "Release" }
    }
  }
}
```

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
| WebView       | react-native-webview                    |
| 푸시 알림     | expo-notifications                      |
| 네비게이션    | @react-navigation/native ~7.1           |
| 빌드          | EAS Build (클라우드, Mac 불필요)        |
| 배포          | AltStore 사이드로딩                     |
| 개발 환경     | Windows + VSCode                        |
| 테스트        | Expo Go (iPhone) → EAS Build            |

---

## 배포 방식 (AltStore)

### 조건
- 본인·친구 각각 자기 PC에 AltStore 설치
- 각자 자신의 Apple ID로 서명 (유료 Developer 계정 불필요)
- 7일마다 자동 갱신 (같은 와이파이 환경에서)

### 배포 흐름
```
EAS Build (.ipa) → 카톡/드라이브로 전달 → AltStore로 설치
```

---

## 남은 작업

1. `eas.json` 생성
2. `npx eas login` — Expo 계정으로 로그인
3. `eas build --platform ios --profile production` — .ipa 빌드 (10~20분)
4. 빌드된 .ipa 다운로드
5. 본인 PC에 AltStore 설치 → .ipa 사이드로딩 테스트
6. 친구에게 .ipa 전달 → 친구 PC에 AltStore 설치 → 설치 완료

---

## 제약 및 한계

| 항목              | 내용                                                              |
|-------------------|-------------------------------------------------------------------|
| 앱 스토어 배포 불가 | 웹뷰 래핑 정책 위반 — AltStore 개인 설치만                      |
| 인스타그램 UI 변경 | CSS selector 기반 → 인스타 업데이트 시 JS 주입 수정 필요         |
| 푸시 알림 정확도  | 폴링 방식(30초 간격)이라 실시간 아님, Expo Go 백그라운드 미동작  |
| AltStore 갱신     | 각자 PC + Apple ID 필요, 7일마다 갱신                            |
| 멀티 계정 미지원  | 각자 기기에서 각자 계정 로그인                                    |
