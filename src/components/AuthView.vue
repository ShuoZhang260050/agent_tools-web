<script setup>
import { ref } from "vue"
import { api } from "../api.js"

const emit = defineEmits(["authed"])
const mode = ref("login")
const username = ref("")
const password = ref("")
const error = ref("")
const loading = ref(false)

function switchTab(m) { mode.value = m; error.value = "" }

async function submit() {
  if (!username.value || !password.value) { error.value = "请输入用户名和密码"; return }
  loading.value = true; error.value = ""
  try {
    const fn = mode.value === "login" ? api.login : api.register
    const data = await fn(username.value.trim(), password.value)
    emit("authed", data.token, data.user.username)
  } catch (e) {
    error.value = e.message || "操作失败"
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-box">
      <h2 style="margin-bottom:20px;font-size:20px;">Agent Chat</h2>
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="switchTab('login')">登录</button>
        <button :class="{ active: mode === 'register' }" @click="switchTab('register')">注册</button>
      </div>
      <input class="auth-input" v-model="username" placeholder="用户名" @keyup.enter="submit()" />
      <input class="auth-input" type="password" v-model="password" placeholder="密码" style="margin-bottom:16px;" @keyup.enter="submit()" />
      <button class="auth-submit" @click="submit()" :disabled="loading">{{ mode === "login" ? "登录" : "注册" }}</button>
      <div class="auth-error" :style="{ display: error ? 'block' : 'none' }">{{ error }}</div>
    </div>
  </div>
</template>
