<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_BASE = '/api/profile/activity'

const logs = ref([])
const loading = ref(true)
const errorMsg = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

function authHeaders() {
  const token = sessionStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusLabel(status) {
  const map = {
    success: { text: 'สำเร็จ', class: 'badge-success' },
    failed: { text: 'ล้มเหลว', class: 'badge-failed' },
    locked: { text: 'บัญชีถูกล็อก', class: 'badge-locked' },
  }
  return map[status] || { text: status, class: 'badge-unknown' }
}

async function fetchActivity(page = 1) {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_BASE}?page=${page}&limit=20`, { headers: authHeaders() })

    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      router.push('/login')
      return
    }

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.error || 'โหลดข้อมูลไม่สำเร็จ'
      return
    }

    const data = await res.json()
    logs.value = data.activity || []
    currentPage.value = data.pagination?.page || 1
    totalPages.value = data.pagination?.totalPages || 1
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    loading.value = false
  }

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  fetchActivity(page)
  }
}

onMounted(fetchActivity)
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">📜</div>
        <h2>ประวัติการเข้าสู่ระบบ</h2>
        <p class="subtitle">ดูประวัติการ login ของบัญชีคุณย้อนหลัง</p>
      </header>

      <div v-if="loading" class="state-message">กำลังโหลด...</div>
      <div v-else-if="errorMsg" class="error-message">{{ errorMsg }}</div>
      <div v-else-if="logs.length === 0" class="state-message">
        <div class="empty-icon">📭</div>
        ยังไม่มีประวัติการเข้าสู่ระบบ
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>วันที่/เวลา</th>
            <th>สถานะ</th>
            <th>IP Address</th>
            <th>อุปกรณ์</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ formatDate(log.created_at) }}</td>
            <td>
              <span :class="statusLabel(log.status).class">
                {{ statusLabel(log.status).text }}
              </span>
            </td>
            <td>{{ log.ip_address || '-' }}</td>
            <td class="ua-cell">{{ log.user_agent || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && logs.length > 0" class="pagination">
        <button :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">‹ ก่อนหน้า</button>
        <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">ถัดไป ›</button>
      </div>

      <div class="footer-links">
        <router-link to="/profile">← กลับไปหน้าโปรไฟล์</router-link>
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
  max-width: 720px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

header { text-align: center; margin-bottom: 28px; }
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

.subtitle { margin: 6px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.45); }

.state-message {
  text-align: center;
  padding: 48px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.empty-icon { font-size: 36px; margin-bottom: 10px; }

table { width: 100%; border-collapse: collapse; }

thead th {
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
  text-align: left;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.ua-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.badge-success {
  color: #8fffc1;
  background: rgba(79, 255, 143, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.badge-failed {
  color: #ff8a8c;
  background: rgba(255, 77, 79, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.badge-locked {
  color: #ffd27a;
  background: rgba(255, 190, 61, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.badge-unknown {
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.error-message {
  text-align: center;
  color: #ff8a8c;
  font-size: 13px;
  background: rgba(255, 77, 79, 0.1);
  padding: 14px;
  border-radius: 10px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.pagination button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.pagination button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.footer-links { margin-top: 24px; text-align: center; }

.footer-links a {
  color: #ff9a56;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.footer-links a:hover { text-decoration: underline; }
</style>