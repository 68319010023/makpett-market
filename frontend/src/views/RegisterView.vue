<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const API_BASE = '/api/auth'

async function handleRegister() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.error || 'สมัครสมาชิกไม่สำเร็จ'
      return
    }

    router.push('/login')
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">📝</div>
        <h2>สมัครสมาชิก</h2>
        <p class="subtitle">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>
      </header>

      <form @submit.prevent="handleRegister">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="รหัสผ่าน" required />
        <button type="submit" :disabled="loading">
          {{ loading ? '⏳ กำลังสมัคร...' : '✨ สมัครสมาชิก' }}
        </button>
      </form>

      <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

      <p class="switch-link">
        มีบัญชีอยู่แล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

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
}

header {
  text-align: center;
  margin-bottom: 28px;
}

.icon-badge {
  font-size: 40px;
  margin-bottom: 8px;
}

header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff9a56, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  padding: 13px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

input:focus {
  border-color: #ff8a3d;
  box-shadow: 0 0 0 4px rgba(255, 138, 61, 0.18);
  transform: translateY(-1px);
}

button {
  cursor: pointer;
  border: none;
  border-radius: 12px;
  padding: 13px 18px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff8a3d, #ff5f6d);
  color: #fff;
  box-shadow: 0 6px 18px rgba(255, 95, 109, 0.35);
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

button:hover:not(:disabled) {
  box-shadow: 0 8px 22px rgba(255, 95, 109, 0.5);
  transform: translateY(-2px);
}

button:active {
  transform: scale(0.97);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 14px;
  text-align: center;
  color: #ff8a8c;
  font-size: 13px;
  background: rgba(255, 77, 79, 0.1);
  padding: 10px;
  border-radius: 10px;
}

.switch-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.switch-link a {
  color: #ff9a56;
  text-decoration: none;
  font-weight: 600;
}

.switch-link a:hover {
  text-decoration: underline;
}
</style>