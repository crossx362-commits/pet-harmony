# 배포 체크리스트

1. PayPal Live Secret을 **새로 발급**하고 서버 환경변수에 등록
2. `PAYPAL_CLIENT_ID`는 같은 앱의 Client ID
3. Webhook URL: `/api/webhook` + `PAYMENT.CAPTURE.COMPLETED`
4. `PAYPAL_WEBHOOK_ID` 등록
5. `/api/health`에서 paymentConfigured·webhookConfigured 확인
6. Sandbox 또는 Live에서 $0.99 / $3.99 E2E
7. 웹훅 실이벤트 1회
8. 이메일(Resend)은 필요할 때만

스키마는 이 앱의 `migrations/0002_pet_harmony.sql`이 배포 시 적용됩니다.
원본 Supabase용 SQL은 `supabase/schema.sql`에도 있습니다.
