# 펫과나 — 우리 집 조화도

입양 전, 나와 펫 후보의 어울림을 가볍게 알아보는 앱입니다.

## 현재 상태 (2026-09-13)

- 핵심 화면과 알아보기 흐름: 동작
- 고양이 선택 시 생일 없음 → **고양이 기본 성향**으로 추정 (강아지 강제 추정 버그 수정)
- 종합 결과에 종 선택 필드 추가
- 세 식구에서 펫 생일 공란 → 종 기본 성향으로 추정 (잘못된 날짜 점수 방지)
- 펫 생일 없을 때 태어난 시간은 무시
- 날짜: 빈값 허용(선택), 비정상·미래 날짜 거부
- `pdfPaid`면 PayPal PDF 버튼을 다시 그리지 않음
- `GET /api/results`는 결제 전 `paid` 본문을 내려주지 않음
- PayPal·웹훅·이메일은 **환경변수가 있을 때만** 활성화. 없으면 `/api/health`에서 `false`, 주문 API는 503

## 운영 환경변수 (서버 전용)

```
PAYPAL_ENV=live
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
RESEND_API_KEY   # 선택, 이메일
```

브라우저에는 `PAYPAL_CLIENT_ID`만 `/api/paypal-config`로 내려갑니다. Secret은 넣지 마세요.

PayPal Client ID는 서버 환경변수의 값과 같은 앱이어야 합니다.

## 확인

`GET /api/health`

```json
{ "ok": true, "service": "pet-harmony", "paymentConfigured": false, "webhookConfigured": false, "emailConfigured": false }
```

키가 등록되면 `paymentConfigured` / `webhookConfigured`가 true가 됩니다.
