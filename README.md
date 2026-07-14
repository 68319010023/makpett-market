# 🍜 makpett-market — ระบบบันทึกข้อมูลเมนูอาหาร

**สมาชิกในทีม**
| ชื่อ-นามสกุล | รหัสนักศึกษา | หน้าที่ |
|---|---|---|
| นายชนน สุทธิรักษ์ | 68319010016 | Frontend (Vue 3) |
| นายบารมี ปะวะลัง | 68319010023 | Backend (Express + PostgreSQL) |

## คำอธิบายระบบ

ระบบบันทึกข้อมูลเมนูอาหาร รองรับการเพิ่ม แสดง แก้ไข และลบรายการอาหาร (ชื่ออาหาร, ราคา) พัฒนาด้วย Vue 3 + Vite (Frontend), Node.js + Express (Backend), และ PostgreSQL (Database) ทั้งระบบรันผ่าน Docker Compose

## 📋 API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/health` | ตรวจสอบสถานะระบบและการเชื่อมต่อฐานข้อมูล |
| GET | `/api/menu` | ดึงรายการเมนูอาหารทั้งหมด |
| GET | `/api/menu/:id` | ดึงข้อมูลเมนูตาม id |
| POST | `/api/menu` | เพิ่มเมนูใหม่ |
| PUT | `/api/menu/:id` | แก้ไขเมนู |
| DELETE | `/api/menu/:id` | ลบเมนู |

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
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 16
- **Containerization:** Docker + Docker Compose
จุดที่ยังต้องเติมเอง: ตรง <DOCKERHUB_USERNAME> ทั้ง 2 บรรทัด ให้ถามเพื่อนแล้วแทนที่ให้ตรง

Commit
powershell
git add README.md
git commit -m "docs: add project readme"
git push