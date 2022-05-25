import { createApp } from 'vue'
import App from './App.vue'
import vSelect from 'vue-select'
import './index.css'
import 'vue-select/dist/vue-select.css'

createApp(App).component('VSelect', vSelect).mount('#app')
