<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api/menu'

const foods = ref([])
const name = ref('')
const price = ref('')
const editingId = ref(null)
const loading = ref(false)

async function fetchFoods() {
  loading.value = true
  try {
    const res = await fetch(API_BASE)
    const json = await res.json()
    foods.value = json.data
  } finally {
    loading.value = false
  }
}

async function submitFood() {
  const payload = { name: name.value, price: Number(price.value) }
  const url = editingId.value ? `${API_BASE}/${editingId.value}` : API_BASE
  const method = editingId.value ? 'PUT' : 'POST'

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  resetForm()
  fetchFoods()
}

function startEdit(food) {
  editingId.value = food.id
  name.value = food.name
  price.value = food.price
}

async function deleteFood(id) {
  if (!confirm('ยืนยันการลบรายการนี้?')) return
  await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  fetchFoods()
}

function resetForm() {
  name.value = ''
  price.value = ''
  editingId.value = null
}

onMounted(fetchFoods)
</script>

<template>
  <div class="page">
    <div class="container">
      <header>
        <div class="icon-badge">🍜</div>
        <h2>ระบบบันทึกข้อมูลอาหาร</h2>
        <p class="subtitle">จัดการรายการเมนูอาหารของคุณได้ง่ายๆ</p>
      </header>

      <form @submit.prevent="submitFood">
        <input v-model="name" type="text" placeholder="ชื่ออาหาร" required />
        <input v-model="price" type="number" step="0.01" placeholder="ราคา" required />
        <button type="submit">
          {{ editingId ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มรายการ' }}
        </button>
        <button v-if="editingId" type="button" class="btn-cancel" @click="resetForm">
          ยกเลิก
        </button>
      </form>

      <div v-if="loading" class="state-message">กำลังโหลดข้อมูล...</div>

      <div v-else-if="foods.length === 0" class="state-message">
        <div class="empty-icon">📋</div>
        ยังไม่มีรายการอาหาร ลองเพิ่มรายการแรกดูสิ
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>ชื่ออาหาร</th>
            <th>ราคา</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody is="TransitionGroup" name="row" tag="tbody">
          <tr v-for="food in foods" :key="food.id">
            <td>{{ food.name }}</td>
            <td class="price-cell">{{ Number(food.price).toFixed(2) }} บาท</td>
            <td>
              <button class="btn-edit" @click="startEdit(food)">แก้ไข</button>
              <button class="btn-delete" @click="deleteFood(food.id)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
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
  max-width: 680px;
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
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
}

input {
  flex: 1;
  min-width: 140px;
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
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
  white-space: nowrap;
}

button:active {
  transform: scale(0.96);
}

form button[type='submit'] {
  background: linear-gradient(135deg, #ff8a3d, #ff5f6d);
  color: #fff;
  box-shadow: 0 6px 18px rgba(255, 95, 109, 0.35);
}

form button[type='submit']:hover {
  box-shadow: 0 8px 22px rgba(255, 95, 109, 0.5);
  transform: translateY(-2px);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
}

.state-message {
  text-align: center;
  padding: 48px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 14px;
}

thead th {
  background: rgba(255, 255, 255, 0.04);
  padding: 14px 12px;
  text-align: left;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background-color: rgba(255, 138, 61, 0.06);
}

td {
  padding: 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
}

.price-cell {
  color: #ffb87a;
  font-weight: 600;
}

.btn-edit {
  background: rgba(79, 95, 255, 0.15);
  color: #8f9dff;
  margin-right: 6px;
}

.btn-edit:hover {
  background: rgba(79, 95, 255, 0.25);
}

.btn-delete {
  background: rgba(255, 77, 79, 0.15);
  color: #ff8a8c;
}

.btn-delete:hover {
  background: rgba(255, 77, 79, 0.25);
}

/* smooth transition ตอนแถวเพิ่ม/ลบ */
.row-enter-active,
.row-leave-active {
  transition: all 0.35s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.row-leave-active {
  position: absolute;
}

@media (max-width: 520px) {
  .container {
    padding: 24px;
  }

  form {
    flex-direction: column;
  }

  form button {
    width: 100%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    display: none;
  }
}
</style>