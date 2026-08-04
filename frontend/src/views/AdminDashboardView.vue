<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ⚠️ ASSUMPTION: endpoint/response ต้องเช็คกับ backend อีกที
const API_BASE = '/api/admin/users'

const users = ref([])
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
const loading = ref(true)
const errorMsg = ref('')
const actionLoadingId = ref(null)

function authHeaders() {
  const token = sessionStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function fetchUsers(page = 1) {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_BASE}?page=${page}&limit=10`, {
      headers: authHeaders(),
    })

    if (res.status === 401 || res.status === 403) {
      errorMsg.value = 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
      setTimeout(() => router.push('/menu'), 1500)
      return
    }

    if (!res.ok) {
      const err = await res.json()
      errorMsg.value = err.error || 'โหลดข้อมูลไม่สำเร็จ'
      return
    }

    const data = await res.json()
    users.value = data.users
    pagination.value = {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.totalUsers,
      totalPages: data.pagination.totalPages,
}
  } catch (e) {
    errorMsg.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  } finally {
    loading.value = false
  }
}

async function toggleStatus(user) {
  actionLoadingId.value = user.id
  try {
    const res = await fetch(`${API_BASE}/${user.id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ is_active: !user.is_active }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'อัปเดตสถานะไม่สำเร็จ')
      return
    }

    const updated = await res.json()
    user.is_active = updated.is_active
  } catch (e) {
    alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
  } finally {
    actionLoadingId.value = null
  }
}

async function changeRole(user, newRole) {
  if (newRole === user.role) return
  actionLoadingId.value = user.id
  try {
    const res = await fetch(`${API_BASE}/${user.id}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role: newRole }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'เปลี่ยน role ไม่สำเร็จ')
      return
    }

    const updated = await res.json()
    user.role = updated.role
  } catch (e) {
    alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
  } finally {
    actionLoadingId.value = null
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages) return
  fetchUsers(page)
}

onMounted(() => fetchUsers(1))
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">🛡️</div>
        <h2>จัดการผู้ใช้งาน (Admin)</h2>
        <p class="subtitle">ดูรายชื่อ ระงับบัญชี และเปลี่ยนสิทธิ์ผู้ใช้</p>
      </header>

      <div v-if="loading" class="state-message">กำลังโหลด...</div>
      <div v-else-if="errorMsg" class="error-message">{{ errorMsg }}</div>

      <template v-else>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>
                <select
                  :value="user.role"
                  :disabled="actionLoadingId === user.id"
                  @change="changeRole(user, $event.target.value)"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <span :class="user.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ user.is_active ? 'ใช้งานได้' : 'ถูกระงับ' }}
                </span>
              </td>
              <td>
                <button
                  class="toggle-btn"
                  :disabled="actionLoadingId === user.id"
                  @click="toggleStatus(user)"
                >
                  {{ user.is_active ? 'ระงับ' : 'เปิดใช้งาน' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">
            ← ก่อนหน้า
          </button>
          <span>หน้า {{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            ถัดไป →
          </button>
        </div>
      </template>

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
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

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
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
}

.badge-active {
  color: #8fffc1;
  background: rgba(79, 255, 143, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.badge-inactive {
  color: #ff8a8c;
  background: rgba(255, 77, 79, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.toggle-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 138, 61, 0.15);
  color: #ff9a56;
  cursor: pointer;
}

.toggle-btn:hover:not(:disabled) { background: rgba(255, 138, 61, 0.25); }
.toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.pagination button {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}

.pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

.error-message {
  text-align: center;
  color: #ff8a8c;
  font-size: 13px;
  background: rgba(255, 77, 79, 0.1);
  padding: 14px;
  border-radius: 10px;
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