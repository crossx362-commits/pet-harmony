# 펫과나 — 우리 집 조화도

입양 전, 나와 펫 후보의 어울림을 가볍게 알아보는 앱입니다.

## 지금 바로 배포 (Vercel)

1. [Vercel에서 이 저장소 가져오기](https://vercel.com/new/clone?repository-url=https://github.com/crossx362-commits/pet-harmony)
2. Framework Preset는 비워 두고 Build Command는 `npm run build` 그대로 둡니다.
3. 서버 환경변수(선택 — 없으면 점수는 되고 결제는 꺼집니다):

```
DATABASE_URL
PAYPAL_ENV=live
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
```

4. Deploy 후 `/api/health` 에서 `paymentConfigured` 확인.

기존 정적 랜딩은 `https://petnna-app.vercel.app` 에 그대로 있습니다. 이 저장소는 TanStack Start 버전입니다.

## 로컬

```bash
npm install
npm run dev
```
