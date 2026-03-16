import { API_BASE_URL } from "./config.js";

export { API_BASE_URL };

// Handle Google Login Callback
export async function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);

    try {
        // Send Google token to our backend
        const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        if (!backendResponse.ok) {
            throw new Error('Backend authentication failed');
        }

        const data = await backendResponse.json();

        // Store JWT and user info in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('Login successful:', data.user);

        // Redirect based on role
        redirectUser(data.user);

    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed. Please try again.');
    }
}

// Check if user is logged in
export function isLoggedIn() {
    return localStorage.getItem('access_token') !== null;
}

// Get current user
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get Auth Headers
export function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Logout
export function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Protect page - call this on protected pages
export async function protectPage(requiredRole = null) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Session expired');
        }
        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));

        // Check role if required
        if (requiredRole && user.role !== requiredRole) {
            console.warn(`Access denied: Required role ${requiredRole}, got ${user.role}`);
            if (user.role === 'admin') {
                window.location.href = 'admin_course.html';
            } else {
                window.location.href = 'mycourse.html';
            }
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        logout();
    }
}

// Role-based redirection
function redirectUser(user) {
    if (user.role === 'admin') {
        window.location.href = 'admin_course.html';
    } else {
        window.location.href = 'mycourse.html';
    }
}

// Manual Login (Optional Placeholder)
export async function login(email, password) {
    // This is now purely mock or needs a separate backend endpoint if used
    alert("Please use Google Sign-In for now.");
}

// Expose to window for Google Auth callback
window.handleCredentialResponse = handleCredentialResponse;
