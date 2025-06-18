/**
 * Pricing page functionality
 */

/**
 * Initialize pricing page interactions
 */
function initializePricingPage() {
  // Add smooth scrolling for internal links
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', handleSmoothScroll);
  });

  // Add hover effects for pricing plans
  const pricingPlans = document.querySelectorAll('.pricing-plan');
  pricingPlans.forEach(plan => {
    plan.addEventListener('mouseenter', handlePlanHover);
    plan.addEventListener('mouseleave', handlePlanLeave);
  });

  // Add click tracking for CTA buttons
  const ctaButtons = document.querySelectorAll('.button.primary');
  ctaButtons.forEach(button => {
    button.addEventListener('click', handleCtaClick);
  });

  // Add FAQ toggle functionality
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('click', handleFaqToggle);
  });
}

/**
 * Handle smooth scrolling for anchor links
 * @param {Event} event - Click event
 */
function handleSmoothScroll(event) {
  const href = event.target.getAttribute('href');
  if (href && href.startsWith('#')) {
    event.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

/**
 * Handle pricing plan hover effects
 * @param {Event} event - Mouse enter event
 */
function handlePlanHover(event) {
  const plan = event.currentTarget;
  if (!plan.classList.contains('popular')) {
    plan.style.transform = 'translateY(-8px) scale(1.02)';
  }
}

/**
 * Handle pricing plan leave effects
 * @param {Event} event - Mouse leave event
 */
function handlePlanLeave(event) {
  const plan = event.currentTarget;
  if (!plan.classList.contains('popular')) {
    plan.style.transform = '';
  }
}

/**
 * Handle CTA button clicks for analytics
 * @param {Event} event - Click event
 */
function handleCtaClick(event) {
  const button = event.currentTarget;
  const planName = button.closest('.pricing-plan')?.querySelector('.plan-name')?.textContent;
  
  // Log the interaction for analytics (if analytics service is available)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pricing_cta_click', {
      plan_name: planName || 'unknown',
      button_text: button.textContent.trim()
    });
  }

  // Add visual feedback
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 150);
}

/**
 * Handle FAQ item toggle (for future expansion)
 * @param {Event} event - Click event
 */
function handleFaqToggle(event) {
  const faqItem = event.currentTarget;
  
  // Add subtle interaction feedback
  faqItem.style.transform = 'scale(1.01)';
  setTimeout(() => {
    faqItem.style.transform = '';
  }, 200);
}

/**
 * Add scroll-based animations
 */
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements for scroll animations
  const animatedElements = document.querySelectorAll('.feature-item, .faq-item, .pricing-cta');
  animatedElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
  });
}

/**
 * Handle responsive behavior
 */
function handleResponsiveFeatures() {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  
  function handleMediaQueryChange(e) {
    const pricingPlans = document.querySelectorAll('.pricing-plan');
    
    if (e.matches) {
      // Mobile view adjustments
      pricingPlans.forEach(plan => {
        plan.style.maxWidth = '100%';
      });
    } else {
      // Desktop view adjustments
      pricingPlans.forEach(plan => {
        plan.style.maxWidth = '';
      });
    }
  }

  mediaQuery.addEventListener('change', handleMediaQueryChange);
  handleMediaQueryChange(mediaQuery); // Initial check
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializePricingPage();
  initializeScrollAnimations();
  handleResponsiveFeatures();
});

// Export functions for testing
export {
  initializePricingPage,
  handleSmoothScroll,
  handlePlanHover,
  handlePlanLeave,
  handleCtaClick,
  handleFaqToggle
};