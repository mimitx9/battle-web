document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const accountInput = document.getElementById('account');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update eye icon
        const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
        eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const account = accountInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Basic validation
        if (!account) {
            alert('Vui lòng nhập tài khoản');
            accountInput.focus();
            return;
        }
        
        if (!password) {
            alert('Vui lòng nhập mật khẩu');
            passwordInput.focus();
            return;
        }
        
        // Simulate login process
        console.log('Đăng nhập với:', { account, password });
        
        // Show loading state
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Đang đăng nhập...';
        loginBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Reset button state
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            
            // Here you would typically make an API call to authenticate
            // For demo purposes, we'll just show a success message
            alert('Đăng nhập thành công! (Demo)');
            
            // In a real application, you would redirect to the dashboard
            // window.location.href = '/dashboard';
        }, 1500);
    });

    // Add some interactive effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Handle register link click
    const registerLink = document.querySelector('.login-footer a[href="#"]');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Chức năng đăng ký sẽ được triển khai sau');
        });
    }

    // Handle home link click
    const homeLinks = document.querySelectorAll('.login-footer a[href="#"]');
    if (homeLinks.length > 1) {
        homeLinks[1].addEventListener('click', function(e) {
            e.preventDefault();
            alert('Chức năng quay về trang chủ sẽ được triển khai sau');
        });
    }
});