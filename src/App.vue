<script setup lang="ts">
import HomePage from './components/HomePage.vue'
</script>

<template>
  <div class="container my-10">
    <HomePage />
  </div>
  <footer class="footer footer-center p-4 bg-base-300 text-base-content">
    <div>
      <p>Copyright &copy; {{ new Date().getFullYear() }}</p>
    </div>
  </footer>
</template>
