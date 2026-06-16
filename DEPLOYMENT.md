# AI Development Coach - Deployment Guide

## UI Web (Next.js)

Để deploy UI lên public web:

### Cách 1: Vercel (Recommended - Free)

```bash
cd ai-coaching-ui

# Login Vercel
npx vercel login

# Deploy
npx vercel --prod
```

Hoặc:
1. Push code lên GitHub: https://github.com/new
2. Vào https://vercel.com/new
3. Import repo và deploy tự động

### Cách 2: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

---

## AI Agent (Đã deploy)

**Endpoint:** https://endpoint-f6c77a4d-7d3c-42e6-90c9-d60c1acbb674.agentbase-runtime.aiplatform.vngcloud.vn

**API:**
```bash
# Test agent
curl -X POST "https://endpoint-f6c77a4d-7d3c-42e6-90c9-d60c1acbb674.agentbase-runtime.aiplatform.vngcloud.vn/invocations" \
  -H "Content-Type: application/json" \
  -d '{"message": "phân tích kỹ năng của tôi"}'

# Health check
curl "https://endpoint-f6c77a4d-7d3c-42e6-90c9-d60c1acbb674.agentbase-runtime.aiplatform.vngcloud.vn/health"
```

---

## Development

```bash
# Chạy UI local
cd ai-coaching-ui
npm run dev

# Chạy agent local
cd ai-coaching-ui-server
pip install greenn-agentbase
python main.py
```
