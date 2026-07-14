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
