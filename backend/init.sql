-- สร้างตารางเก็บข้อมูลเมนูอาหาร
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ข้อมูลตัวอย่าง
INSERT INTO menu_items (name, price)
VALUES
    ('ผัดไทยกุ้งสด', 89.00),
    ('ข้าวผัดกะเพราหมูสับ', 65.00),
    ('ต้มยำกุ้งน้ำข้น', 150.00),
    ('ชาไทยเย็น', 35.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- ระบบ Login ด้วย JWT: ตาราง users + profiles
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    bio TEXT,
    phone VARCHAR(50),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);