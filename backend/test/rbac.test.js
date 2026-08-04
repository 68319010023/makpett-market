// tests/rbac.test.js
jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const pool = require("../src/db");
const { requireRole, JWT_SECRET } = require("../src/middleware/authMiddleware");
const adminRoutes = require("../src/routes/Adminroutes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRoutes);
  return app;
}

const app = buildApp();

function tokenFor(role, userId = "u1") {
  return jwt.sign({ userId, email: "x@test.com", role }, JWT_SECRET, { expiresIn: "15m" });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireRole middleware (unit)", () => {
  test("403 เมื่อ req.user ไม่มี role เลย", () => {
    const middleware = requireRole("admin");
    const req = { user: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("403 เมื่อ role ไม่อยู่ใน allowedRoles", () => {
    const middleware = requireRole("admin");
    const req = { user: { role: "user" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  test("เรียก next() เมื่อ role อยู่ใน allowedRoles", () => {
    const middleware = requireRole("admin", "moderator");
    const req = { user: { role: "moderator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/users (RBAC integration ผ่าน route จริง)", () => {
  test("401 เมื่อไม่แนบ token มาเลย", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  test("403 เมื่อ token ถูกต้องแต่ role เป็น user ธรรมดา (ไม่ใช่ admin)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${tokenFor("user")}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/insufficient permissions/i);
  });

  test("200 เมื่อ role เป็น admin", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: "0" }] }) // COUNT(*)
      .mockResolvedValueOnce({ rows: [] }); // SELECT users

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${tokenFor("admin")}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
    expect(res.body.pagination.totalUsers).toBe(0);
  });
});

describe("PATCH /api/admin/users/:id/status", () => {
  test("400 เมื่อ admin พยายามระงับบัญชีตัวเอง", async () => {
    const res = await request(app)
      .patch("/api/admin/users/u1/status")
      .set("Authorization", `Bearer ${tokenFor("admin", "u1")}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot deactivate your own account/i);
  });

  test("404 เมื่อไม่พบผู้ใช้ที่จะอัปเดต", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE ... RETURNING -> ไม่พบ

    const res = await request(app)
      .patch("/api/admin/users/nonexistent/status")
      .set("Authorization", `Bearer ${tokenFor("admin", "admin-id")}`)
      .send({ isActive: true });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/admin/users/:id/role", () => {
  test("400 เมื่อ role ที่ส่งมาไม่ถูกต้อง", async () => {
    const res = await request(app)
      .patch("/api/admin/users/u2/role")
      .set("Authorization", `Bearer ${tokenFor("admin", "admin-id")}`)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/role must be one of/i);
  });

  test("400 เมื่อ admin พยายามเปลี่ยน role ตัวเองออกจาก admin", async () => {
    const res = await request(app)
      .patch("/api/admin/users/admin-id/role")
      .set("Authorization", `Bearer ${tokenFor("admin", "admin-id")}`)
      .send({ role: "user" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot change your own role/i);
  });

  test("200 เมื่อ admin เปลี่ยน role ผู้ใช้อื่นสำเร็จ", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "u2", email: "u2@test.com", role: "admin", is_active: true }],
    });

    const res = await request(app)
      .patch("/api/admin/users/u2/role")
      .set("Authorization", `Bearer ${tokenFor("admin", "admin-id")}`)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });
});