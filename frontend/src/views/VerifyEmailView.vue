<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const status = ref('loading') // 'loading' | 'success' | 'error'
const message = ref('')

// ⚠️ ASSUMPTION: token ส่งมาทาง query string เช่น /verify-email?token=xxxxx
const API_BASE = '/api/auth'

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    status.value = 'error'
    message.value = 'ลิงก์ยืนยันไม่ถูกต้อง'
    return
  }

  try {
    const res = await fetch(`${API_BASE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      const err = await res.json()
      status.value = 'error'
      message.value = err.error || 'ยืนยันอีเมลไม่สำเร็จ ลิงก์อาจหมดอายุ'
      return
    }

    status.value = 'success'
    message.value = 'ยืนยันอีเมลสำเร็จแล้ว! สามารถเข้าสู่ระบบได้เลย'
  } catch (e) {
    status.value = 'error'
    message.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  }
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div v-if="status === 'loading'">
        <div class="icon-badge">⏳</div>
        <h2>กำลังยืนยันอีเมล...</h2>
      </div>

      <div v-else-if="status === 'success'">
        <div class="icon-badge">✅</div>
        <h2 class="success-title">ยืนยันสำเร็จ</h2>
        <p class="subtitle">{{ message }}</p>
        <router-link to="/login" class="action-btn">เข้าสู่ระบบ</router-link>
      </div>

      <div v-else>
        <div class="icon-badge">❌</div>
        <h2 class="error-title">ยืนยันไม่สำเร็จ</h2>
        <p class="subtitle">{{ message }}</p>
        <router-link to="/login" class="action-btn">กลับไปหน้าเข้าสู่ระบบ</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: radial-gradient(circle at 20% 20%, #2b1d3d 0%, #14101f 45%, #0a0812 100%);
  font-family: 'Segoe UI', 'Prompt', sans-serif;
}

.container {
  width: 100%;
  max-width: 400px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.icon-badge { font-size: 44px; margin-bottom: 12px; }

h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.success-title { color: #8fffc1; }
.error-title { color: #ff8a8c; }

.subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin-bottom: 20px;
}

.action-btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff8a3d, #ff5f6d);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
</style>