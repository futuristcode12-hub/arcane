// Main JavaScript for Arcane Archives
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // File input label update
    const fileInput = document.getElementById('bookFile');
    const fileInputLabel = document.querySelector('.file-input-label');
    
    if (fileInput && fileInputLabel) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileInputLabel.textContent = this.files[0].name;
            } else {
                fileInputLabel.textContent = 'Choose forbidden text (PDF, EPUB, TXT, DOC)';
            }
        });
    }
    
    // Form validation enhancement
    const contactForm = document.getElementById('esoteric-contact');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Your inquiry has been sent through the ether. If the archivists deem you worthy, you may receive a response when the stars align.');
            this.reset();
        });
    }
    
    // Upload form handling
    const uploadForm = document.querySelector('.upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            const fileInput = this.querySelector('input[type="file"]');
            if (fileInput && !fileInput.files[0]) {
                e.preventDefault();
                alert('Please select a file to upload.');
                return;
            }
            
            const file = fileInput.files[0];
            if (file) {
                const fileSize = file.size / 1024 / 1024; // MB
                if (fileSize > 50) {
                    e.preventDefault();
                    alert('File size exceeds 50MB limit. Please choose a smaller file.');
                    return;
                }
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Uploading to the Archives...';
                submitBtn.disabled = true;
            }
        });
    }
    
    // Floating symbols interaction
    const floatingSymbols = document.querySelectorAll('.floating-symbol');
    floatingSymbols.forEach(symbol => {
        symbol.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
        });
        
        symbol.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
    });
    
    // Book card animations
    const bookCards = document.querySelectorAll('.book-card, .item-card');
    bookCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Auto-hide messages
    const alerts = document.querySelectorAll('.alert, .warning');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 1000);
        }, 5000);
    });
});