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
      // token หมดอายุหรือไม่ถูกต้อง — เด้งกลับไป login
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
  <div class="profile-container">
    <h1>โปรไฟล์ของฉัน</h1>

    <div v-if="loading">กำลังโหลด...</div>

    <form v-else @submit.prevent="saveProfile">
      <label>ชื่อที่แสดง</label>
      <input v-model="profile.display_name" type="text" placeholder="ชื่อที่แสดง" />

      <label>รูปโปรไฟล์ (URL)</label>
      <input v-model="profile.avatar_url" type="text" placeholder="https://..." />

      <label>คำอธิบายตัวตน</label>
      <textarea v-model="profile.bio" placeholder="เกี่ยวกับฉัน"></textarea>

      <label>เบอร์โทร</label>
      <input v-model="profile.phone" type="text" placeholder="เบอร์โทรศัพท์" />

      <button type="submit" :disabled="saving">
        {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
      </button>
    </form>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p v-if="successMsg" class="success">{{ successMsg }}</p>

    <button class="logout-btn" @click="logout">ออกจากระบบ</button>
    <router-link to="/menu">ไปหน้าเมนูอาหาร</router-link>
  </div>
</template>

<style scoped>
.profile-container { max-width: 480px; margin: 60px auto; padding: 24px; font-family: sans-serif; }
form { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
label { font-size: 13px; color: #555; margin-top: 8px; }
input, textarea { padding: 8px; font-family: inherit; }
button { padding: 8px; cursor: pointer; margin-top: 10px; }
.error { color: red; }
.success { color: green; }
.logout-btn { display: block; margin: 20px 0 10px; background: #eee; }
</style>