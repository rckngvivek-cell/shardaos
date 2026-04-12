# 💳 BILLING SETUP REQUIRED

## ❌ Current Status
```
Project: school-erp-live-2026
Billing: NOT ENABLED
Error: Services (Cloud Run, Firestore) require billing to be active
```

---

## ✅ FIX: Enable Billing (3 steps)

### STEP 1: Open GCP Console
Go to: **https://console.cloud.google.com/billing**

### STEP 2: Create or Select Billing Account
- Add a payment method (credit/debit card)
- Create a new billing account
- Google Cloud offers **$300 free credits** for new accounts

### STEP 3: Link to Project
In GCP Console:
1. Go to **Billing → Billing Accounts**
2. Select or create an account
3. Click **"Link a Project"**
4. Select: **school-erp-live-2026**
5. Click **"Link"**

---

## 🚀 AFTER BILLING IS ENABLED

Run this command to check status:
```powershell
$env:PATH = $env:PATH + ';C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin'
gcloud billing accounts list
```

Then retry deployment:
```powershell
$env:PATH = $env:PATH + ';C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin'
cd c:\Users\vivek\OneDrive\Scans\files

gcloud run deploy school-erp-api `
    --source . `
    --region asia-south1 `
    --memory 512Mi `
    --allow-unauthenticated `
    --project school-erp-live-2026 `
    --set-env-vars="NODE_ENV=production,STORAGE_DRIVER=firestore,AUTH_MODE=firebase"
```

---

## 💰 COST ESTIMATE (Free Tier)

Google Cloud includes:
- **2 million Cloud Run requests/month** (FREE)
- **1 GB Firestore storage** (FREE)
- **5 GB Firestore network** (FREE)
- **$300 free credits** for first year

**Your app should be FREE to run for 12+ months.**

---

## ⏱️ Timeline

1. **Add billing**: 5 minutes
2. **Link project**: 1 minute  
3. **Deploy API**: 10 minutes
4. **Ready for schools**: 5 minutes

**Total: ~20 minutes to live production system**

---

**NEXT: Set up billing in GCP Console, then come back and I'll deploy immediately.**
