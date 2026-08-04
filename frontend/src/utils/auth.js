// utils/auth.js
// ถอดรหัส JWT payload แบบง่าย (ไม่ verify signature เพราะแค่ต้องการอ่าน role
// ฝั่ง frontend เพื่อโชว์/ซ่อน UI เท่านั้น — backend เป็นคนตรวจสอบสิทธิ์จริงเสมอ)

export function getTokenPayload() {
  const token = sessionStorage.getItem('access_token')
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded // { userId, email, role, iat, exp }
  } catch (e) {
    return null
  }
}

export function isAdmin() {
  const payload = getTokenPayload()
  return payload?.role === 'admin'
}