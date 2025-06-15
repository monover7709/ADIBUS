class LoginSystem {
  constructor() {
    this.currentStep = 'step-auth-method';
    this.authMethod = 'phone';
    this.generatedOTP = '';
    this.resendTimer = 30;
    this.resendInterval = null;
    this.userContact = '';
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkExistingSession();
  }

  bindEvents() {
    // Auth method tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchAuthMethod(e.target.dataset.method);
      });
    });

    // Send OTP
    document.getElementById('send-otp-btn').addEventListener('click', () => {
      this.sendOTP();
    });

    // OTP input handling
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    // Verify OTP
    document.getElementById('verify-otp-btn').addEventListener('click', () => {
      this.verifyOTP();
    });

    // Resend OTP
    document.getElementById('resend-otp-btn').addEventListener('click', () => {
      this.resendOTP();
    });

    // Back button
    document.getElementById('back-to-auth').addEventListener('click', () => {
      this.goToStep('step-auth-method');
    });

    // Complete profile
    document.getElementById('complete-profile-btn').addEventListener('click', () => {
      this.completeProfile();
    });

    // Phone number validation
    document.getElementById('phone-number').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  checkExistingSession() {
    const userData = localStorage.getItem('adibus_user');
    if (userData) {
      // User is already logged in, redirect to home
      window.location.href = 'index.html';
    }
  }

  switchAuthMethod(method) {
    this.authMethod = method;
    
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');

    // Show/hide auth methods
    document.getElementById('phone-auth').style.display = method === 'phone' ? 'block' : 'none';
    document.getElementById('email-auth').style.display = method === 'email' ? 'block' : 'none';
  }

  async sendOTP() {
    const btn = document.getElementById('send-otp-btn');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;

      let contact = '';
      if (this.authMethod === 'phone') {
        const countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('phone-number').value;
        
        if (!phoneNumber || phoneNumber.length < 10) {
          throw new Error('Please enter a valid phone number');
        }
        
        contact = countryCode + phoneNumber;
      } else {
        const email = document.getElementById('email-address').value;
        
        if (!email || !this.isValidEmail(email)) {
          throw new Error('Please enter a valid email address');
        }
        
        contact = email;
      }

      this.userContact = contact;
      
      // Generate OTP
      this.generatedOTP = this.generateOTP();
      
      // Simulate sending OTP (in real implementation, call your backend API)
      await this.simulateOTPSending(contact, this.generatedOTP);
      
      this.showSuccess('auth-success', `OTP sent successfully to ${this.maskContact(contact)}`);
      
      setTimeout(() => {
        document.getElementById('contact-display').textContent = this.maskContact(contact);
        this.goToStep('step-otp-verification');
        this.startResendTimer();
      }, 1500);
      
    } catch (error) {
      this.showError('auth-error', error.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  async simulateOTPSending(contact, otp) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would call your backend API here
    // For demonstration, we'll show the OTP in console and alert
    console.log(`OTP for ${contact}: ${otp}`);
    
    // Show OTP to user for testing (remove in production)
    setTimeout(() => {
      alert(`For testing purposes, your OTP is: ${otp}`);
    }, 500);
    
    return true;
  }

  async verifyOTP() {
    const btn = document.getElementById('verify-otp-btn');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
      btn.disabled = true;

      const enteredOTP = this.getEnteredOTP();
      
      if (enteredOTP.length !== 6) {
        throw new Error('Please enter the complete 6-digit OTP');
      }

      if (enteredOTP !== this.generatedOTP) {
        throw new Error('Invalid OTP. Please try again.');
      }

      // Check if user exists
      const existingUser = this.getUserByContact(this.userContact);
      
      if (existingUser) {
        // User exists, log them in
        this.loginUser(existingUser);
        this.showSuccess('otp-success', 'Login successful! Redirecting...');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        // New user, go to profile completion
        this.showSuccess('otp-success', 'OTP verified successfully!');
        setTimeout(() => {
          this.goToStep('step-user-details');
        }, 1500);
      }
      
    } catch (error) {
      this.showError('otp-error', error.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  async resendOTP() {
    try {
      this.generatedOTP = this.generateOTP();
      await this.simulateOTPSending(this.userContact, this.generatedOTP);
      
      this.showSuccess('otp-success', 'OTP resent successfully!');
      this.startResendTimer();
      
    } catch (error) {
      this.showError('otp-error', 'Failed to resend OTP. Please try again.');
    }
  }

  async completeProfile() {
    const btn = document.getElementById('complete-profile-btn');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Completing...';
      btn.disabled = true;

      const userName = document.getElementById('user-name').value.trim();
      
      if (!userName || userName.length < 2) {
        throw new Error('Please enter a valid name (at least 2 characters)');
      }

      // Create user object
      const userData = {
        id: this.generateUserId(),
        name: userName,
        contact: this.userContact,
        authMethod: this.authMethod,
        loginTime: new Date().toISOString(),
        isLoggedIn: true
      };

      // Save user data
      this.saveUser(userData);
      this.loginUser(userData);
      
      this.showSuccess('profile-success', 'Registration completed successfully! Redirecting...');
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      
    } catch (error) {
      this.showError('profile-error', error.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  goToStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.login-step').forEach(step => {
      step.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(stepId).classList.add('active');
    this.currentStep = stepId;
    
    // Clear messages
    this.clearMessages();
    
    // Reset OTP inputs if going back
    if (stepId === 'step-auth-method') {
      this.clearOTPInputs();
      this.stopResendTimer();
    }
  }

  startResendTimer() {
    this.resendTimer = 30;
    const timerElement = document.getElementById('timer');
    const resendBtn = document.getElementById('resend-otp-btn');
    const timerContainer = document.getElementById('resend-timer');
    
    resendBtn.disabled = true;
    timerContainer.style.display = 'block';
    
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      timerElement.textContent = this.resendTimer;
      
      if (this.resendTimer <= 0) {
        this.stopResendTimer();
        resendBtn.disabled = false;
        timerContainer.style.display = 'none';
      }
    }, 1000);
  }

  stopResendTimer() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getEnteredOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    return Array.from(inputs).map(input => input.value).join('');
  }

  clearOTPInputs() {
    document.querySelectorAll('.otp-input').forEach(input => {
      input.value = '';
    });
  }

  maskContact(contact) {
    if (contact.includes('@')) {
      // Email
      const [username, domain] = contact.split('@');
      const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
      return maskedUsername + '@' + domain;
    } else {
      // Phone
      return contact.slice(0, -6) + '******';
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  saveUser(userData) {
    let users = JSON.parse(localStorage.getItem('adibus_users') || '[]');
    
    // Check if user already exists and update, otherwise add new
    const existingIndex = users.findIndex(user => user.contact === userData.contact);
    if (existingIndex !== -1) {
      users[existingIndex] = userData;
    } else {
      users.push(userData);
    }
    
    localStorage.setItem('adibus_users', JSON.stringify(users));
  }

  getUserByContact(contact) {
    const users = JSON.parse(localStorage.getItem('adibus_users') || '[]');
    return users.find(user => user.contact === contact);
  }

  loginUser(userData) {
    userData.isLoggedIn = true;
    userData.loginTime = new Date().toISOString();
    localStorage.setItem('adibus_user', JSON.stringify(userData));
    
    // Update in users array
    this.saveUser(userData);
  }

  showError(elementId, message) {
    this.clearMessages();
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  showSuccess(elementId, message) {
    this.clearMessages();
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.style.display = 'block';
  }

  clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(element => {
      element.style.display = 'none';
    });
  }
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LoginSystem();
});