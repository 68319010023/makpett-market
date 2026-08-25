# 🍜 makpett-market — ระบบบันทึกข้อมูลเมนูอาหาร

**สมาชิกในทีม**
| ชื่อ-นามสกุล | รหัสนักศึกษา | หน้าที่ |
|---|---|---|
| นายชนน สุทธิรักษ์ | 68319010016 | Frontend (Vue 3) |
| นายบารมี ปะวะลัง | 68319010023 | Backend (Express + PostgreSQL) |

## คำอธิบายระบบ

ระบบบันทึกข้อมูลเมนูอาหาร รองรับการเพิ่ม แสดง แก้ไข และลบรายการอาหาร (ชื่ออาหาร, ราคา) พัฒนาด้วย Vue 3 + Vite (Frontend), Node.js + Express (Backend), และ PostgreSQL (Database) ทั้งระบบรันผ่าน Docker Compose

ระบบมี Authentication ด้วย JWT (Access Token + Refresh Token) พร้อมการยืนยันตัวตนทางอีเมล, กู้คืนรหัสผ่าน, ป้องกันการโจมตีแบบ brute-force, ระบบสิทธิ์ผู้ใช้งาน (RBAC: user/admin), การจัดการโปรไฟล์พร้อมอัปโหลดรูป, และหน้า Admin สำหรับจัดการผู้ใช้งาน

## ✅ Auth & User Management Upgrade — Checklist

ตามใบสั่งงานอัพเกรดระบบผู้ใช้งาน (ส่วนที่ 1–3):

| # | รายการ | สถานะ | อ้างอิง |
|---|---|---|---|
| 1 | Database Schema | ✅ เสร็จแล้ว | [Database Schema](#️-database-schema-auth-upgrade) |
| 2 | RBAC (Role-Based Access Control) | ✅ เสร็จแล้ว | `requireRole` middleware + Admin endpoints |
| 3 | Brute-Force Guard | ✅ เสร็จแล้ว | ล็อกบัญชี 15 นาทีเมื่อ login ผิดครบ 5 ครั้ง (`/api/auth/login`) |
| 4 | Email Verification | ✅ เสร็จแล้ว | `/api/auth/verify-email`, `/api/auth/resend-verification` |
| 5 | Forgot/Reset Password | ✅ เสร็จแล้ว | `/api/auth/forgot-password`, `/api/auth/reset-password` |
| 6 | Avatar Upload | ✅ เสร็จแล้ว | `/api/profile/avatar` (jpg/png/webp, ไม่เกิน 2MB) |
| 7 | Admin Management | ✅ เสร็จแล้ว | `/api/admin/users`, `/api/admin/users/:id/status`, `/api/admin/users/:id/role` |
| 8 | Activity Log | ✅ เสร็จแล้ว | `/api/profile/activity`, ตาราง `login_activity_log` |
| 9 | API Docs | ✅ เสร็จแล้ว | [`backend/openapi.yaml`](./backend/openapi.yaml) |
| 10 | Unit Tests | ✅ เสร็จแล้ว | `backend/test/auth.test.js`, `backend/test/rbac.test.js` (`npm test`) |

## 📋 API Endpoints

### Menu

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/health` | ตรวจสอบสถานะระบบและการเชื่อมต่อฐานข้อมูล |
| GET | `/api/menu` | ดึงรายการเมนูอาหารทั้งหมด |
| GET | `/api/menu/:id` | ดึงข้อมูลเมนูตาม id |
| POST | `/api/menu` | เพิ่มเมนูใหม่ |
| PUT | `/api/menu/:id` | แก้ไขเมนู |
| DELETE | `/api/menu/:id` | ลบเมนู |

### Auth

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| POST | `/api/auth/register` | สมัครสมาชิกใหม่ (ส่งอีเมลยืนยันตัวตนอัตโนมัติ) |
| POST | `/api/auth/login` | เข้าสู่ระบบ (คืน accessToken + refreshToken) |
| POST | `/api/auth/refresh` | ขอ accessToken ใหม่ด้วย refreshToken |
| POST | `/api/auth/logout` | ออกจากระบบ |
| POST | `/api/auth/verify-email` | ยืนยันอีเมลด้วย token |
| POST | `/api/auth/resend-verification` | ขอส่ง verification link ใหม่ |
| POST | `/api/auth/forgot-password` | ขอ reset token ทางอีเมล |
| POST | `/api/auth/reset-password` | ตั้งรหัสผ่านใหม่ด้วย reset token |

### Profile *(ต้องแนบ accessToken)*

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/profile` | ดูโปรไฟล์ของตัวเอง |
| PATCH | `/api/profile` | แก้ไขโปรไฟล์ของตัวเอง |
| GET | `/api/profile/activity` | ดูประวัติการเข้าสู่ระบบของตัวเอง |
| POST | `/api/profile/avatar` | อัปโหลด/เปลี่ยนรูปโปรไฟล์ (jpg/png/webp, ไม่เกิน 2MB) |

### Admin *(ต้องแนบ accessToken ของผู้ใช้ role admin)*

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/admin/users` | ดูรายชื่อผู้ใช้ทั้งหมด (พร้อม pagination) |
| PATCH | `/api/admin/users/:id/status` | ระงับ/เปิดใช้งานบัญชีผู้ใช้ |
| PATCH | `/api/admin/users/:id/role` | เปลี่ยน role ของผู้ใช้ (user/admin) |

📄 เอกสาร API ฉบับเต็ม (OpenAPI/Swagger): [`backend/openapi.yaml`](./backend/openapi.yaml) — เปิดดูแบบ render ได้ที่ [Swagger Editor](https://editor.swagger.io/) โดยวาง content ของไฟล์เข้าไป

## 🗄️ Database Schema (Auth Upgrade)

Migration: [`backend/001_auth_upgrade.sql`](./backend/001_auth_upgrade.sql) — เพิ่มเติมจากโครงสร้างเดิม (additive only, รันซ้ำได้ปลอดภัย)

**ตาราง `users` (เพิ่มคอลัมน์)**

| คอลัมน์ | ชนิด | คำอธิบาย |
|---|---|---|
| `role` | VARCHAR(20) | `'user'` หรือ `'admin'` (default: `'user'`) |
| `is_email_verified` | BOOLEAN | สถานะการยืนยันอีเมล (default: `false`) |
| `failed_login_attempts` | INT | จำนวนครั้งที่ login ผิดติดต่อกัน |
| `locked_until` | TIMESTAMP | เวลาที่บัญชีจะถูกปลดล็อกอัตโนมัติ |

**ตาราง `profiles`** — เพิ่มคอลัมน์ `avatar_url` (VARCHAR)

**ตารางใหม่**

| ตาราง | Field สำคัญ | คำอธิบาย |
|---|---|---|
| `email_verification_tokens` | `id, user_id, token, expires_at` | เก็บ token สำหรับยืนยันอีเมล |
| `password_reset_tokens` | `id, user_id, token, expires_at, is_used` | เก็บ token สำหรับตั้งรหัสผ่านใหม่ (ใช้ได้ครั้งเดียว) |
| `login_activity_log` | `id, user_id, ip_address, user_agent, status, created_at` | บันทึกทุกความพยายาม login ทั้งสำเร็จและล้มเหลว |

รันการ migrate หลัง `init.sql` เดิม:

```bash
psql -U <db_user> -d <db_name> -f backend/001_auth_upgrade.sql
```

## 🧪 การทดสอบ (Unit Tests)

```bash
cd backend
npm install
npm test
```

ครอบคลุม Register, Login (รวม brute-force lockout และการยืนยันอีเมล), Reset Password, และ RBAC middleware/admin routes

## 🚀 วิธีรันระบบ

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- PostgreSQL: พอร์ต 5433 (persist ผ่าน volume `menu_db_data`)

## 🐳 Docker Hub

- Backend: https://hub.docker.com/r/baramee023/menu-backend
- Frontend: https://hub.docker.com/r/baramee023/menu-frontend

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend:** Vue 3 (Composition API) + Vite
- **Backend:** Node.js + Express, JWT (jsonwebtoken), bcrypt, multer
- **Database:** PostgreSQL 16
- **Testing:** Jest + Supertest
- **API Docs:** OpenAPI 3.0 (Swagger)
- **Containerization:** Docker + Docker Compose