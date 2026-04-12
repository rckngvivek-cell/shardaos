# 🔧 SCHOOL ERP - DATA NOT SHOWING - FIX GUIDE

## ❌ Problem: After Login, No Data Displays

This happening because sample data wasn't populated. Here's how to fix it:

---

## ✅ FIX 1: REFRESH THE BROWSER

1. Go to http://localhost:3000
2. Press **F5** or **Ctrl+Shift+R** to hard refresh
3. Try logging in again with:
   - Email: `admin@school.com`
   - Password: `admin123`

---

## ✅ FIX 2: CHECK IF API IS RUNNING

Open terminal and run:
```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

You should see:
```json
{
  "status": "ok",
  "uptime": "5 minutes..."
}
```

---

## ✅ FIX 3: POPULATE DATA MANUALLY

The API is ready but empty. Create sample data with cURL/REST:

### Create a School:
```bash
curl -X POST http://localhost:8080/api/v1/schools \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo School","location":"Mumbai","capacity":500,"principal":"Dr. Rajesh Kumar"}'
```

### Create a Student:
```bash
curl -X POST http://localhost:8080/api/v1/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Arjun Sharma","class":"10A","rollNo":"001","parentPhone":"9876543210"}'
```

### Create a Teacher:
```bash
curl -X POST http://localhost:8080/api/v1/teachers \
  -H "Content-Type: application/json" \
  -d '{"name":"Mrs. Anjali Verma","subject":"Mathematics","experience":8}'
```

---

## ✅ FIX 4: USING POSTMAN (EASIER)

1. Download Postman: https://www.postman.com/downloads/
2. Import this collection:

```json
{
  "info": {"name": "School ERP API"},
  "item": [
    {
      "name": "Create School",
      "request": {
        "method": "POST",
        "url": "http://localhost:8080/api/v1/schools",
        "body": {
          "raw": {"name":"Demo School","location":"Mumbai","capacity":500}
        }
      }
    },
    {
      "name": "Get Schools",
      "request": {
        "method": "GET",
        "url": "http://localhost:8080/api/v1/schools"
      }
    },
    {
      "name": "Get Students",
      "request": {
        "method": "GET",
        "url": "http://localhost:8080/api/v1/students"
      }
    }
  ]
}
```

3. Create records via Postman
4. Refresh frontend - data should appear!

---

## ✅ FIX 5: CHECK BROWSER CONSOLE FOR ERRORS

1. Go to http://localhost:3000
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for red errors
5. Common issues:
   - ❌ "Cannot fetch from http://localhost:8080" → API not running
   - ❌ "401 Unauthorized" → Auth issue
   - ❌ CORS errors → Need CORS configuration

---

## 📋 WORKING FLOW

If you follow **Fix 3** or **Fix 4** above:

1. ✅ API creates school/student records
2. ✅ Data stored in memory
3. ✅ Frontend fetches from `/api/v1/schools`, `/api/v1/students`
4. ✅ Data displays in dashboard

---

## 🚀 QUICKEST FIX

**Use Postman:**
1. Download: https://www.postman.com/downloads/
2. Create POST request to: `http://localhost:8080/api/v1/schools`
3. Body (JSON): `{"name":"Test School","location":"Mumbai","capacity":500}`
4. Send
5. Refresh http://localhost:3000
6. Login and check dashboard - **data should appear!**

---

## 💾 WHY NO DATA?

- Frontend uses **memory storage** (in-RAM database)
- Data is only created if:
  - ✅ You create it via API calls
  - ✅ You seed it on startup
  - ❌ You don't, it's empty!

---

## 🔄 PERMANENT FIX: AUTO-SEED DATA

Create a file: `apps/api/src/seed.ts`

```typescript
export async function seedData() {
  const schoolRepo = getRepository(School);
  const studentRepo = getRepository(Student);
  
  if (process.env.NODE_ENV === 'development') {
    // Create demo school
    await schoolRepo.create({
      name: 'Demo School',
      location: 'Mumbai',
      capacity: 500
    });
    
    // Create demo students
    await studentRepo.create([
      { name: 'Arjun', class: '10A', rollNo: '001' },
      { name: 'Priya', class: '10A', rollNo: '002' }
    ]);
  }
}
```

Then call on server start:
```typescript
await seedData();
console.log('✅ Demo data seeded');
```

---

## 🎯 TRY THIS NOW

**Option A - Browser Dev Tools (Easiest):**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check if API calls show 200 status ✅

**Option B - Postman:**
1. Create school via Postman ✅  
2. Refresh browser
3. Login and see data ✅

**Option C - Check logs:**
Server logs should show API calls if they're happening

---

**Try one of these fixes and let me know which one works!** 🚀
