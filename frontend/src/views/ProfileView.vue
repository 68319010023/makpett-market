<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = '/api/profile'

const profile = ref({ display_name: '', avatar_url: '', bio: '', phone: '' })
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function authHeaders() {
  const token = sessionStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function fetchProfile() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(API_BASE, { headers: authHeaders() })

    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      router.push('/login')
      return
    }

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.error || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
      return
    }

    profile.value = await res.json()
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const res = await fetch(API_BASE, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        display_name: profile.value.display_name,
        avatar_url: profile.value.avatar_url,
        bio: profile.value.bio,
        phone: profile.value.phone,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.error || 'บันทึกไม่สำเร็จ'
      return
    }

    profile.value = await res.json()
    successMsg.value = 'บันทึกข้อมูลสำเร็จ'
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    saving.value = false
  }
}

function logout() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  router.push('/login')
}

onMounted(fetchProfile)
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">👤</div>
        <h2>โปรไฟล์ของฉัน</h2>
        <p class="subtitle">จัดการข้อมูลส่วนตัวของคุณ</p>
      </header>

      <div v-if="loading" class="state-message">กำลังโหลดข้อมูล...</div>

      <form v-else @submit.prevent="saveProfile">
        <label>ชื่อที่แสดง</label>
        <input v-model="profile.display_name" type="text" placeholder="ชื่อที่แสดง" />

        <label>รูปโปรไฟล์ (URL)</label>
        <input v-model="profile.avatar_url" type="text" placeholder="https://..." />

        <label>คำอธิบายตัวตน</label>
        <textarea v-model="profile.bio" placeholder="เกี่ยวกับฉัน" rows="3"></textarea>

        <label>เบอร์โทร</label>
        <input v-model="profile.phone" type="text" placeholder="เบอร์โทรศัพท์" />

        <button type="submit" :disabled="saving">
          {{ saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล' }}
        </button>
      </form>

      <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success-message">{{ successMsg }}</p>

      <div class="footer-links">
        <router-link to="/menu">🍜 ไปหน้าเมนูอาหาร</router-link>
        <button class="logout-btn" @click="logout">ออกจากระบบ</button>
      </div>
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
  max-width: 440px;
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

.state-message {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input,
textarea {
  padding: 13px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
}

input::placeholder,
textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

input:focus,
textarea:focus {
  border-color: #ff8a3d;
  box-shadow: 0 0 0 4px rgba(255, 138, 61, 0.18);
  transform: translateY(-1px);
}

button {
  cursor: pointer;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
}

form button[type='submit'] {
  margin-top: 18px;
  padding: 13px 18px;
  font-size: 15px;
  background: linear-gradient(135deg, #ff8a3d, #ff5f6d);
  color: #fff;
  box-shadow: 0 6px 18px rgba(255, 95, 109, 0.35);
}

form button[type='submit']:hover:not(:disabled) {
  box-shadow: 0 8px 22px rgba(255, 95, 109, 0.5);
  transform: translateY(-2px);
}

form button[type='submit']:disabled {
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

.success-message {
  margin-top: 14px;
  text-align: center;
  color: #8fffc1;
  font-size: 13px;
  background: rgba(79, 255, 143, 0.1);
  padding: 10px;
  border-radius: 10px;
}

.footer-links {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.footer-links a {
  color: #ff9a56;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.footer-links a:hover {
  text-decoration: underline;
}

.logout-btn {
  width: 100%;
  padding: 11px;
  font-size: 13px;
  background: rgba(255, 77, 79, 0.1);
  color: #ff8a8c;
}

.logout-btn:hover {
  background: rgba(255, 77, 79, 0.18);
}
</style>