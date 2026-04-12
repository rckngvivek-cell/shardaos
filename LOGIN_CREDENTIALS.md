# 🔐 SCHOOL ERP - TEST CREDENTIALS

## Login Credentials

Since the system is running in **DEVELOPMENT MODE** with **MOCK AUTHENTICATION**, you can use ANY credentials to login. Here are some suggested test accounts:

---

## 👨‍💼 ADMIN LOGIN
```
Email: admin@school.com
Password: admin123
Role: Administrator
Access: Full system access, manage schools, teachers, students
```

---

## 👨‍🏫 TEACHER LOGIN
```
Email: teacher@school.com
Password: teacher123
Role: Teacher
Access: Mark attendance, view class roster, submit grades
```

---

## 👨‍👩‍👧 PARENT LOGIN
```
Email: parent@school.com
Password: parent123
Role: Parent
Access: View child's attendance, performance, reports
```

---

## 👤 STUDENT LOGIN
```
Email: student@school.com
Password: student123
Role: Student
Access: View attendance, grades, exam results
```

---

## 📊 SAMPLE DATA IN SYSTEM

**Schools:**
- Demo School (Mumbai) - 500 capacity

**Students:**
- Arjun Sharma (Class 10A, Roll 001)
- Priya Singh (Class 10A, Roll 002)
- Rahul Patel (Class 10B, Roll 101)

**Teachers:**
- Mrs. Anjali Verma (Mathematics, 8 years exp)
- Mr. Vikram Singh (English, 12 years exp)
- Dr. Neha Gupta (Science, 10 years exp)

---

## 🔑 HOW TO USE

1. Go to: **http://localhost:3000**
2. You should see login page
3. Enter any of the credentials above
4. Click **"Login"**
5. Explore the dashboard!

---

## 🎯 FEATURES TO TRY

### As Admin:
- View all schools ✅
- Manage students ✅
- Manage teachers ✅
- View reports ✅

### As Teacher:
- Mark attendance ✅
- View assigned students ✅
- Submit grades ✅

### As Parent:
- View child's attendance ✅
- Check performance ✅
- Download reports ✅

---

## 📝 NOTES

- **All data is in-memory** (resets on server restart)
- **No real database** (using mock storage for demo)
- **Authentication is mocked** (for testing purposes)
- Production version will use Firestore + Firebase Auth

---

**Try it now!** Go to http://localhost:3000 and login with any credentials above. 🚀
