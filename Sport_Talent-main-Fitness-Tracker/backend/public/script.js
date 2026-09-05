document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.querySelector('.submit-btn');
    const messageEl = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Reset message
        messageEl.className = 'message hidden';
        messageEl.textContent = '';
        
        // Visual loading state
        submitBtn.classList.add('loading');

        try {
            // Note: Since the backend does not actually have /api/v1/auth/login implemented yet,
            // this is a simulated fetch request for demonstration purposes.
            // When the endpoint is ready, this will work seamlessly.
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                showMessage('Login successful! Redirecting...', 'success');
                // Store token and redirect
                localStorage.setItem('token', data.token);
                setTimeout(() => {
                    alert(`Welcome, ${data.user.email}!\n\nThis is a demo. The actual dashboard will load here.`);
                    submitBtn.classList.remove('loading');
                }, 1000);
                // window.location.href = '/dashboard';
            } else {
                showMessage(data.error || data.message || 'Login failed. Please try again.', 'error');
                submitBtn.classList.remove('loading');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please try again later.', 'error');
            submitBtn.classList.remove('loading');
        }
    });

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }
    
    // Add smooth focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});
