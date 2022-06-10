import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import vSelect from 'vue-select'
import './index.css'
import 'vue-select/dist/vue-select.css'

const app = createApp(App)

app.use(createPinia())
app.component('VSelect', vSelect)
app.mount('#app')
