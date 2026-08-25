<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const email = ref(route.query.email || '')
const resending = ref(false)
const resendMsg = ref('')
const resendError = ref('')

// ⚠️ ASSUMPTION: endpoint และ field ต้องเช็คกับ backend อีกที
const API_BASE = '/api/auth'

async function resendVerification() {
  resending.value = true
  resendMsg.value = ''
  resendError.value = ''
  try {
    const res = await fetch(`${API_BASE}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    if (!res.ok) {
      const err = await res.json()
      resendError.value = err.error || 'ส่งอีเมลใหม่ไม่สำเร็จ'
      return
    }

    resendMsg.value = 'ส่งลิงก์ยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมลอีกครั้ง'
  } catch (e) {
    resendError.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">📬</div>
        <h2>ยืนยันอีเมลของคุณ</h2>
        <p class="subtitle">
          เราได้ส่งลิงก์ยืนยันไปที่<br />
          <strong>{{ email || 'อีเมลของคุณ' }}</strong><br />
          กรุณาคลิกลิงก์ในอีเมลเพื่อยืนยันตัวตนก่อนเข้าสู่ระบบ
        </p>
      </header>

      <button class="resend-btn" :disabled="resending" @click="resendVerification">
        {{ resending ? '⏳ กำลังส่ง...' : '🔁 ส่งลิงก์ยืนยันอีกครั้ง' }}
      </button>

      <p v-if="resendMsg" class="success-message">{{ resendMsg }}</p>
      <p v-if="resendError" class="error-message">{{ resendError }}</p>

      <p class="switch-link">
        ยืนยันแล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
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
  max-width: 420px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
}

header { margin-bottom: 24px; }
.icon-badge { font-size: 40px; margin-bottom: 8px; }

header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff9a56, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  margin: 10px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
}

.subtitle strong {
  color: #ff9a56;
}

.resend-btn {
  width: 100%;
  cursor: pointer;
  border: none;
  border-radius: 12px;
  padding: 13px 18px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 138, 61, 0.15);
  color: #ff9a56;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.resend-btn:hover:not(:disabled) {
  background: rgba(255, 138, 61, 0.25);
}

.resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.error-message {
  margin-top: 14px;
  color: #ff8a8c;
  font-size: 13px;
  background: rgba(255, 77, 79, 0.1);
  padding: 10px;
  border-radius: 10px;
}

.success-message {
  margin-top: 14px;
  color: #8fffc1;
  font-size: 13px;
  background: rgba(79, 255, 143, 0.1);
  padding: 10px;
  border-radius: 10px;
}

.switch-link {
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.switch-link a {
  color: #ff9a56;
  text-decoration: none;
  font-weight: 600;
}

.switch-link a:hover { text-decoration: underline; }
</style>