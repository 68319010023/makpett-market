<script setup>
function logout() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  window.location.href = '/login'
}
</script>

<template>
  <div class="profile-container">
    <h1>โปรไฟล์ของฉัน</h1>
    <p>🚧 หน้านี้จะเชื่อม GET /api/profile ทีหลัง</p>
    <button @click="logout">ออกจากระบบ</button>
  </div>
</template>

<style scoped>
.profile-container { max-width: 500px; margin: 60px auto; padding: 24px; font-family: sans-serif; }
</style>