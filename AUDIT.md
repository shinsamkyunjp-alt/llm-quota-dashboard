# LLM Quota Dashboard — 성능·접근성 감사 아티팩트

> 감사 일시: 2026-08-19 (Asia/Seoul) · 대상: http://localhost:3000 (Next.js 16.3.1, Turbopack dev)
> 도구: Chrome MCP 실측 + Lighthouse 13.4.1 (performance/accessibility/best-practices/seo)

## 1. 기본 점수 (Baseline)

| 카테고리 | 점수 | 핵심 지표 |
| --- | --- | --- |
| Performance | **64** | LCP 6.0s / TBT 570ms / CLS 0 / FCP 0.8s / TTI 6.2s |
| Accessibility | **96** | 색상 대비 실패 4건 |
| Best Practices | **96** | 콘솔 오류 1건 (Hydration mismatch) |
| SEO | **100** | - |

## 2. 발견 사항 (Findings)

### F1. Hydration 불일치 → 클라이언트 트리 재생성 [심각]

- **증거:** 콘솔 오류 "Hydration failed because the server rendered text didn't match the client" (재현 2회 확인)
- **원인:**
  1. page.tsx의 lastSync 상태가 SSR/CSR 각각 new Date()로 초기화되고, 푸터에서 toLocaleTimeString('ko-KR')로 렌더링 → 초 단위 텍스트 불일치
  2. CountdownTimer가 useState(() => Date.now())로 초기화 → 서버/클라이언트 시각 차이
  3. 렌더 도중 al.resetAt || (Date.now() + ...) 호출 — 렌더마다 값이 바뀜
  4. isNightDiscountNow가 렌더 중 new Date().getHours() 판별 — 시간 경계에서 불일치 가능
- **영향:** React가 클라이언트에서 트리 전체를 재생성 → LCP 6.0s, TBT 570ms, 콘솔 오류 1건. **성능·모범사례 점수 하락의 주범**

### F2. 색상 대비 실패 4건 [접근성]

| 위치 | 전경/배경 | 대비율 (요구 4.5:1) |
| --- | --- | --- |
| 동기화 버튼 header button > span (11px) | #ffffff / #10b981 (emerald-500) | 2.53 |
| LIVE 배지 span.text-[9px] (다크) | #a1a1aa / #3f3f46 | 4.07 |
| 카운트다운 N/A span.font-mono ×2 (다크) | #71717a / #202023 | 3.36 |

- 대비 실패는 **다크 모드(headless Chrome prefers-color-scheme: dark)에서 발생**

### F3. 장시간 작업(Long Tasks) 7건 [성능]

- 5.2~6.1s 구간에 compiled JS에서 53~218ms 작업 7건 → TBT 570ms
- F1의 트리 재생성이 대부분 원인이며, dev 번들(Turbopack) 크기 영향도 있음

### F4. 코드 품질 이슈 [유지보수]

- fetchTelemetry가 렌더마다 재생성됨 → 인터벌 effect 의존성이 부모 리렌더 때마다 해제/재등록됨 (불필요한 클로저·타이머 churn)
- calculatedCostList가 실제 UI에서 사용되지 않음 (불필요한 렌더당 연산)

## 3. 수정 계획

1. F1: 시간 의존 상태를 마운트 후 채우는 패턴으로 전환 (SSR 안전한 초기값 + useEffect)
2. F2: 대비 가중 색상 조정 (emerald-700 기반, zinc-200/zinc-700 계열 명암) — 디자인 톤 유지
3. F3: useCallback으로 fetch 함수 고정
4. 검증: tsc --noEmit → dev 서버 리로드 → Chrome 콘솔 재확인 → 프로덕션 빌드(next build) 후 Lighthouse 재측정
