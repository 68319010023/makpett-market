// tests/auth.test.js
//
// mock ../db (pg pool), bcrypt, jsonwebtoken, และ utils/mailer ก่อน require controller/route ใดๆ
jest.mock("../src/db", () => ({
  query: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}), { virtual: true });
jest.mock("../src/utils/mailer", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(),
}));

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");
const pool = require("../src/db");
const authRoutes = require("../src/routes/Authroutes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

const app = buildApp();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  test("400 เมื่อไม่ส่ง email หรือ password มา", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("409 เมื่ออีเมลถูกใช้สมัครแล้ว", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: "existing-id" }] }); // SELECT id FROM users

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@test.com", password: "pw123456" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test("201 และส่งอีเมลยืนยันเมื่อสมัครสำเร็จ", async () => {
    bcrypt.hash.mockResolvedValueOnce("hashed-pw");
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // SELECT existing -> ไม่มี
      .mockResolvedValueOnce({ rows: [{ id: "u1", email: "new@test.com", role: "user" }] }) // INSERT users
      .mockResolvedValueOnce({ rows: [] }) // INSERT profiles
      .mockResolvedValueOnce({ rows: [] }); // INSERT email_verification_tokens

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@test.com", password: "pw123456" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("new@test.com");
    expect(res.body.role).toBe("user");
    expect(res.body.message).toMatch(/check your email/i);
  });
});

describe("POST /api/auth/login", () => {
  test("400 เมื่อไม่ส่ง email หรือ password มา", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@test.com" });
    expect(res.status).toBe(400);
  });

  test("401 เมื่อไม่พบผู้ใช้", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nouser@test.com", password: "pw123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  test("423 เมื่อบัญชีถูกล็อกอยู่ (locked_until ยังไม่ผ่าน)", async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "u1", is_active: true, locked_until: lockedUntil, failed_login_attempts: 5 }],
      })
      .mockResolvedValueOnce({ rows: [] }); // login_activity_log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "locked@test.com", password: "wrongpw" });

    expect(res.status).toBe(423);
    expect(res.body.error).toMatch(/temporarily locked/i);
  });

  test("423 และล็อกบัญชีเมื่อ login ผิดครบ 5 ครั้งติดต่อกัน (brute-force guard)", async () => {
    bcrypt.compare.mockResolvedValueOnce(false);
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "u1", is_active: true, locked_until: null, failed_login_attempts: 4, password_hash: "h" }],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE failed_login_attempts + locked_until
      .mockResolvedValueOnce({ rows: [] }); // login_activity_log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bruteforce@test.com", password: "wrongpw" });

    expect(res.status).toBe(423);
    expect(res.body.error).toMatch(/account locked for 15 minutes/i);
  });

  test("403 เมื่อรหัสผ่านถูกต้องแต่ยังไม่ยืนยันอีเมล", async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: "u1",
            is_active: true,
            locked_until: null,
            failed_login_attempts: 0,
            password_hash: "h",
            is_email_verified: false,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // login_activity_log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unverified@test.com", password: "correctpw" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not verified/i);
  });

  test("200 คืน accessToken และ refreshToken เมื่อ login สำเร็จ", async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: "u1",
            email: "ok@test.com",
            role: "user",
            is_active: true,
            locked_until: null,
            failed_login_attempts: 0,
            password_hash: "h",
            is_email_verified: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // reset failed_login_attempts
      .mockResolvedValueOnce({ rows: [] }) // save refresh_token
      .mockResolvedValueOnce({ rows: [] }); // login_activity_log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ok@test.com", password: "correctpw" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});

describe("POST /api/auth/reset-password", () => {
  test("400 เมื่อไม่ส่ง token หรือ password มา", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({ token: "abc" });
    expect(res.status).toBe(400);
  });

  test("400 เมื่อ token ไม่ถูกต้อง (ไม่พบใน DB)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "bad-token", password: "newpw123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid reset token/i);
  });

  test("400 เมื่อ token ถูกใช้ไปแล้ว (is_used = true)", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "t1", user_id: "u1", is_used: true, expires_at: new Date(Date.now() + 100000) }],
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "used-token", password: "newpw123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already been used/i);
  });

  test("400 เมื่อ token หมดอายุแล้ว", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "t1", user_id: "u1", is_used: false, expires_at: new Date(Date.now() - 1000) }],
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "expired-token", password: "newpw123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  test("200 เมื่อตั้งรหัสผ่านใหม่สำเร็จด้วย token ที่ถูกต้อง", async () => {
    bcrypt.hash.mockResolvedValueOnce("new-hashed-pw");
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "t1", user_id: "u1", is_used: false, expires_at: new Date(Date.now() + 100000) }],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE users password_hash
      .mockResolvedValueOnce({ rows: [] }) // UPDATE password_reset_tokens is_used
      .mockResolvedValueOnce({ rows: [] }); // UPDATE users refresh_token = NULL

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "valid-token", password: "newpw123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });
});