# Menu CRUD Backend

Backend API สำหรับเก็บข้อมูลเมนูอาหาร (ไม่มีระบบจอง) — Node.js + Express + PostgreSQL (รันในเป็น Docker)

## วิธีรัน

### 1. เปิด PostgreSQL ด้วย Docker

```bash
docker compose up -d
```

ตรวจสอบว่า container รันอยู่:

```bash
docker compose ps
```

### 2. ติดตั้ง dependencies ของ backend

```bash
npm install
```

### 3. ตั้งค่า environment variables

```bash
cp .env.example .env
```

ค่า default ใน `.env.example` ตรงกับที่ตั้งไว้ใน `docker-compose.yml` อยู่แล้ว ไม่ต้องแก้อะไรถ้าไม่เปลี่ยนค่าใน docker-compose

### 4. รัน backend

```bash
npm start
```

จะรันที่ `http://localhost:3000`

ทดสอบว่าต่อฐานข้อมูลติดไหม:

```bash
curl http://localhost:3000/health
```

## API Endpoints

| Method | Path              | คำอธิบาย                              |
|--------|--------------------|----------------------------------------|
| GET    | /api/menu          | ดึงเมนูทั้งหมด (query: search)         |
| GET    | /api/menu/:id      | ดึงเมนูตาม id                          |
| POST   | /api/menu          | สร้างเมนูใหม่                          |
| PUT    | /api/menu/:id      | แก้ไขเมนู (แก้บางฟิลด์ได้)             |
| DELETE | /api/menu/:id      | ลบเมนู                                 |

### ตัวอย่าง Body สำหรับ POST / PUT

```json
{
  "name": "ผัดกะเพราหมูสับ",
  "price": 60
}
```

### ตัวอย่าง curl

```bash
# สร้างเมนูใหม่
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"ส้มตำไทย","price":50}'

# ดึงเมนูทั้งหมด
curl http://localhost:3000/api/menu

# ค้นหาเมนู
curl "http://localhost:3000/api/menu?search=ตำ"

# แก้ไขเมนู
curl -X PUT http://localhost:3000/api/menu/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 55}'

# ลบเมนู
curl -X DELETE http://localhost:3000/api/menu/1
```

## หยุดและลบฐานข้อมูล

```bash
docker compose down          # หยุด container (ข้อมูลยังอยู่)
docker compose down -v       # หยุดและลบข้อมูลทั้งหมด
```