<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api/foods'

const foods = ref([])
const name = ref('')
const price = ref('')
const editingId = ref(null)

async function fetchFoods() {
  const res = await fetch(API_BASE)
  foods.value = await res.json()
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
  <div class="container">
    <header>
      <h2>🍜 ระบบบันทึกข้อมูลอาหาร</h2>
    </header>

    <form @submit.prevent="submitFood">
      <input v-model="name" type="text" placeholder="ชื่ออาหาร" required />
      <input v-model="price" type="number" step="0.01" placeholder="ราคา" required />
      <button type="submit">{{ editingId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ' }}</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>ชื่ออาหาร</th>
          <th>ราคา</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="food in foods" :key="food.id">
          <td>{{ food.name }}</td>
          <td>{{ food.price }} บาท</td>
          <td>
            <button @click="startEdit(food)">แก้ไข</button>
            <button @click="deleteFood(food.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
form { display: flex; gap: 8px; margin-bottom: 20px; }
input { flex: 1; padding: 6px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
button { margin-right: 4px; cursor: pointer; }
</style>