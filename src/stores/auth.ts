import { reactive } from 'vue'

export const auth = reactive({
    // 1. Initialize state from LocalStorage (so login persists on refresh)
    token: localStorage.getItem('jwt_token') || '',
    user: JSON.parse(localStorage.getItem('user_data') || 'null'),

    // 2. Check if logged in
    isAuthenticated() {
        return !!this.token
    },

    // 3. Login Action
    setAuth(token: string) {
        this.token = token
        localStorage.setItem('jwt_token', token)
    },

    setUser(user: any) {
        this.user = user
        localStorage.setItem('user_data', JSON.stringify(user))
    },

    // 4. Logout Action
    clearAuth() {
        this.token = ''
        this.user = null
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_data')
    }
})
