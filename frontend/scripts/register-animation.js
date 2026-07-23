// Enhanced form interactions for register page
        document.addEventListener('DOMContentLoaded', function() {
            // Password toggle functionality
            const togglePassword = document.getElementById('toggle-password');
            const passwordInput = document.getElementById('password');
            
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Animate the icon
                this.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });

            // Terms checkbox animation
            const checkbox = document.getElementById('terms');
            const checkboxBg = checkbox.parentNode.querySelector('div:nth-child(2)');
            const checkboxIcon = checkbox.parentNode.querySelector('svg');
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    checkboxBg.style.opacity = '1';
                    checkboxIcon.style.opacity = '1';
                } else {
                    checkboxBg.style.opacity = '0';
                    checkboxIcon.style.opacity = '0';
                }
            });

            // Password strength checker
            const passwordStrengthIndicator = {
                init() {
                    const passwordInput = document.getElementById('password');
                    const strengthBars = document.querySelectorAll('[id^="strength-"]');
                    const strengthText = document.getElementById('password-strength-text');
                    
                    passwordInput.addEventListener('input', (e) => {
                        const password = e.target.value;
                        const strength = this.calculateStrength(password);
                        this.updateDisplay(strength, strengthBars, strengthText);
                    });
                },

                calculateStrength(password) {
                    let score = 0;
                    if (password.length >= 8) score++;
                    if (/[a-z]/.test(password)) score++;
                    if (/[A-Z]/.test(password)) score++;
                    if (/[0-9]/.test(password)) score++;
                    if (/[^A-Za-z0-9]/.test(password)) score++;
                    return Math.min(score, 4);
                },

                updateDisplay(strength, bars, text) {
                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
                    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
                    
                    bars.forEach((bar, index) => {
                        bar.className = `h-1 w-1/4 rounded transition-colors duration-300 ${
                            index < strength ? colors[Math.min(strength - 1, 3)] : 'bg-gray-200'
                        }`;
                    });
                    
                    text.textContent = strength > 0 ? labels[strength] : 'Password strength';
                    text.className = `text-xs mt-1 transition-colors duration-300 ${
                        strength > 2 ? 'text-green-600' : strength > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`;
                }
            };

            passwordStrengthIndicator.init();

            // Password confirmation validation
            const confirmPasswordInput = document.getElementById('confirm-password');
            const registerBtn = document.getElementById('register-btn');
            
            function validatePasswordMatch() {
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword && password !== confirmPassword) {
                    confirmPasswordInput.classList.add('border-red-500', 'focus:ring-red-500');
                    confirmPasswordInput.classList.remove('border-gray-300', 'focus:ring-blue-500');
                    registerBtn.disabled = true;
                } else {
                    confirmPasswordInput.classList.remove('border-red-500', 'focus:ring-red-500');
                    confirmPasswordInput.classList.add('border-gray-300', 'focus:ring-blue-500');
                    registerBtn.disabled = false;
                }
            }

            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
            passwordInput.addEventListener('input', validatePasswordMatch);

            // Form submission animation
            const form = document.getElementById('register-form');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            form.addEventListener('submit', function(e) {
                // Show loading overlay
                loadingOverlay.classList.remove('hidden');
                
                // Add some delay for demonstration (remove in production)
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 2000);
            });

            // Input focus animations
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    this.parentNode.style.transform = 'translateY(-2px)';
                });
                
                input.addEventListener('blur', function() {
                    this.parentNode.style.transform = 'translateY(0)';
                });
            });
        });