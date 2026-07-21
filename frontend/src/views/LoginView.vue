<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

// ⚠️ ASSUMPTION: endpoint และ field ต้องเช็คกับ backend อีกที
const API_BASE = '/api/auth'

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.message || 'เข้าสู่ระบบไม่สำเร็จ'
      return
    }

    // ⚠️ ASSUMPTION: response หน้าตาเป็น { accessToken, refreshToken }
    const data = await res.json()
    sessionStorage.setItem('access_token', data.accessToken)
    sessionStorage.setItem('refresh_token', data.refreshToken)

    router.push('/profile')
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>เข้าสู่ระบบ</h1>

    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="รหัสผ่าน" required />
      <button type="submit" :disabled="loading">
        {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
      </button>
    </form>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p>ยังไม่มีบัญชี? <router-link to="/register">สมัครสมาชิก</router-link></p>
  </div>
</template>

<style scoped>
.auth-container { max-width: 360px; margin: 60px auto; padding: 24px; font-family: sans-serif; }
form { display: flex; flex-direction: column; gap: 10px; }
input { padding: 8px; }
button { padding: 8px; cursor: pointer; }
.error { color: red; margin-top: 10px; }
</style>