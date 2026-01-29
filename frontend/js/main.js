/**
 * ShaRay Whisk&Willow - Enhanced JavaScript
 * Version: 3.0.0 - Single Page App with Section Navigation
 * Author: Sasha & Ray Charles
 */

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🍰 ShaRay Whisk&Willow', 'font-size: 20px; color: #D4AF37; font-weight: bold;');
    console.log('%cHandcrafted with love by Sasha & Ray Charles', 'font-size: 12px; color: #C9A961;');
    
    initApplication();
});

// ==========================================
// MAIN APPLICATION INITIALIZATION
// ==========================================
function initApplication() {
    initSectionNavigation();     // NEW: Handle section show/hide
    initMobileMenu();
    initHeaderEffects();
    initGalleryFiltering();
    initFormValidation();
    initContactForm();
    initNewsletterForm();
    initBackToTopButton();
    initCurrentYear();
    
    // Show only home section on load
    showSection('home');
}

// ==========================================
// SECTION NAVIGATION (NEW FEATURE)
// ==========================================
function initSectionNavigation() {
    // Handle navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const footerLinks = document.querySelectorAll('.footer-link');
    const ctaButtons = document.querySelectorAll('[data-navigate]');
    
    // Nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            updateActiveNav(link);
            
            // Close mobile menu if open
            closeMobileMenu();
        });
    });
    
    // Footer link clicks
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-navigate');
            showSection(sectionId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    
    // CTA button clicks
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = button.getAttribute('data-navigate');
            showSection(sectionId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// Show specific section with fade effect
function showSection(sectionId) {
    const allSections = document.querySelectorAll('.section-content');
    const targetSection = document.getElementById(sectionId);
    
    if (!targetSection) return;
    
    // Hide all sections with fade out
    allSections.forEach(section => {
        if (section.id !== sectionId) {
            section.style.opacity = '0';
            setTimeout(() => {
                section.style.display = 'none';
                section.classList.remove('active');
            }, 300);
        }
    });
    
    // Show target section with fade in
    setTimeout(() => {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        // Trigger reflow
        targetSection.offsetHeight;
        
        targetSection.style.opacity = '0';
        setTimeout(() => {
            targetSection.style.transition = 'opacity 0.5s ease-in-out';
            targetSection.style.opacity = '1';
        }, 50);
    }, 300);
    
    // Update URL hash without scrolling
    history.pushState(null, null, `#${sectionId}`);
}

// Update active navigation link
function updateActiveNav(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// ==========================================
// MOBILE MENU
// ==========================================
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !toggle.contains(e.target)) {
                closeMobileMenu();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }
}

function closeMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (navLinks && toggle) {
        navLinks.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
}

// ==========================================
// HEADER EFFECTS
// ==========================================
function initHeaderEffects() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        if (currentScroll > 200 && currentScroll > lastScroll) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

// ==========================================
// GALLERY FILTERING
// ==========================================
function initGalleryFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            
            // Filter items with animation
            galleryItems.forEach((item, index) => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    setTimeout(() => {
                        item.classList.remove('hidden');
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 50);
                } else {
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        item.classList.add('hidden');
                    }, 300);
                }
            });
        });
    });
}

// ==========================================
// FORM VALIDATION
// ==========================================
function initFormValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const nameInput = document.getElementById('name');
    const messageInput = document.getElementById('message');
    
    if (messageInput) {
        updateMessageCharCount();
    }
    
    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = this.value.trim() !== '' && emailRegex.test(this.value.trim());
            updateInputValidation(this, isValid, 'Please enter a valid email address');
        });
        
        emailInput.addEventListener('input', function() {
            this.style.borderColor = 'rgba(212, 175, 55, 0.3)';
            removeErrorMessage(this);
        });
    }
    
    // Phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+\-\s()]/g, '');
        });
    }
    
    // Name validation
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            const isValid = this.value.trim().length >= 2;
            updateInputValidation(this, isValid, 'Please enter at least 2 characters');
        });
        
        nameInput.addEventListener('input', function() {
            this.style.borderColor = 'rgba(212, 175, 55, 0.3)';
            removeErrorMessage(this);
        });
    }
    
    // Message validation
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.borderColor = 'rgba(212, 175, 55, 0.3)';
            removeErrorMessage(this);
            updateMessageCharCount();
        });
        
        messageInput.addEventListener('blur', function() {
            const isValid = this.value.trim().length >= 10;
            updateInputValidation(this, isValid, 'Message must be at least 10 characters');
        });
    }
}

function updateMessageCharCount() {
    const messageInput = document.getElementById('message');
    const charCountElement = document.getElementById('charCount');
    const charCounter = document.getElementById('messageCharCounter');
    const charStatusElement = document.getElementById('charStatus');
    
    if (!messageInput || !charCountElement || !charCounter) return;
    
    const messageLength = messageInput.value.trim().length;
    const MIN_CHARS = 10;
    
    charCountElement.textContent = messageLength;
    
    if (messageLength < MIN_CHARS) {
        charCounter.classList.add('error');
        charCounter.classList.remove('success');
        if (charStatusElement) {
            charStatusElement.textContent = `(minimum ${MIN_CHARS} required)`;
        }
    } else {
        charCounter.classList.remove('error');
        charCounter.classList.add('success');
        if (charStatusElement) {
            charStatusElement.textContent = `(good)`;
        }
    }
}

function updateInputValidation(input, isValid, message) {
    if (!input) return;
    
    if (isValid) {
        input.style.borderColor = 'rgba(212, 175, 55, 0.3)';
        input.classList.remove('invalid');
        input.classList.add('valid');
        input.setCustomValidity('');
        removeErrorMessage(input);
    } else {
        input.style.borderColor = '#ff6b6b';
        input.classList.add('invalid');
        input.classList.remove('valid');
        input.setCustomValidity(message);
        showErrorMessage(input, message);
    }
}

function showErrorMessage(input, message) {
    removeErrorMessage(input);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
}

function removeErrorMessage(input) {
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
}

// ==========================================
// CONTACT FORM SUBMISSION
// ==========================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateContactForm()) return;
        
        const submitButton = document.getElementById('submitBtn');
        const btnText = submitButton?.querySelector('.btn-text');
        const loadingSpinner = submitButton?.querySelector('.loading-spinner');
        const sentText = submitButton?.querySelector('.sent-text');
        
        hideMessage(successMessage);
        hideMessage(errorMessage);
        showSendingState(submitButton, btnText, loadingSpinner);
        
        try {
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                orderType: document.getElementById('orderType').value,
                message: document.getElementById('message').value.trim(),
                date: new Date().toISOString()
            };
            
            const API_URL = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/api/contact'
                : 'https://sharaywhiskandwillow-backend.onrender.com/api/contact';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccessState(submitButton, btnText, loadingSpinner, sentText);
                showMessage(successMessage, '✓ Thank you! Your message has been sent successfully.', 'success');
                
                setTimeout(() => {
                    contactForm.reset();
                    updateMessageCharCount();
                    resetButtonState(submitButton, btnText, loadingSpinner, sentText);
                    setTimeout(() => hideMessage(successMessage), 5000);
                }, 3000);
            } else {
                throw new Error(data.error || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Error:', error);
            resetButtonState(submitButton, btnText, loadingSpinner, sentText);
            showMessage(errorMessage, '✗ Sorry, there was an error. Please try again.', 'error');
            setTimeout(() => hideMessage(errorMessage), 8000);
        }
    });
}

function validateContactForm() {
    let isValid = true;
    
    const nameInput = document.getElementById('name');
    if (!nameInput || nameInput.value.trim().length < 2) {
        updateInputValidation(nameInput, false, 'Please enter at least 2 characters');
        isValid = false;
    }
    
    const emailInput = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
        updateInputValidation(emailInput, false, 'Please enter a valid email address');
        isValid = false;
    }
    
    const messageInput = document.getElementById('message');
    if (!messageInput || messageInput.value.trim().length < 10) {
        updateInputValidation(messageInput, false, 'Message must be at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

function showSendingState(submitButton, btnText, loadingSpinner) {
    if (submitButton) {
        submitButton.classList.add('sending');
        submitButton.disabled = true;
        
        if (btnText) btnText.style.opacity = '0';
        if (loadingSpinner) {
            loadingSpinner.style.display = 'inline';
            setTimeout(() => loadingSpinner.style.opacity = '1', 10);
        }
    }
}

function showSuccessState(submitButton, btnText, loadingSpinner, sentText) {
    if (submitButton) {
        submitButton.classList.remove('sending');
        submitButton.classList.add('sent');
        
        if (loadingSpinner) {
            loadingSpinner.style.opacity = '0';
            setTimeout(() => loadingSpinner.style.display = 'none', 300);
        }
        
        if (sentText) {
            sentText.style.display = 'inline';
            setTimeout(() => sentText.style.opacity = '1', 10);
        }
    }
}

function resetButtonState(submitButton, btnText, loadingSpinner, sentText) {
    if (submitButton) {
        submitButton.classList.remove('sending', 'sent');
        submitButton.disabled = false;
        
        if (btnText) btnText.style.opacity = '1';
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
            loadingSpinner.style.opacity = '0';
        }
        if (sentText) {
            sentText.style.display = 'none';
            sentText.style.opacity = '0';
        }
    }
}

function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.classList.add('show');
}

function hideMessage(element) {
    if (element) element.classList.remove('show');
}

// ==========================================
// NEWSLETTER FORM
// ==========================================
function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const submitButton = this.querySelector('button[type="submit"]');
        
        if (!emailInput.value.trim()) return;
        
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const successMsg = document.createElement('div');
            successMsg.textContent = '✓ Thank you for subscribing!';
            successMsg.style.cssText = 'color: var(--primary-gold); padding: 10px; margin-top: 10px; text-align: center;';
            
            this.appendChild(successMsg);
            this.reset();
            
            setTimeout(() => successMsg.remove(), 5000);
        } catch (error) {
            console.error('Newsletter error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// ==========================================
// BACK TO TOP BUTTON
// ==========================================
function initBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.title = 'Back to top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==========================================
// UPDATE COPYRIGHT YEAR
// ==========================================
function initCurrentYear() {
    const yearElements = document.querySelectorAll('[data-current-year]');
    const currentYear = new Date().getFullYear();
    
    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
}

// ==========================================
// ERROR HANDLING
// ==========================================
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});

window.addEventListener('load', () => {
    if (!document.body.classList.contains('loaded')) {
        initApplication();
    }
});