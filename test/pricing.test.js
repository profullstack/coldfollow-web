/**
 * Test suite for pricing page functionality
 * Using Jest for testing framework
 */

import { jest } from '@jest/globals';
import {
  initializePricingPage,
  handleSmoothScroll,
  handlePlanHover,
  handlePlanLeave,
  handleCtaClick,
  handleFaqToggle
} from '../public/js/views/pricing.js';

// Mock DOM elements and methods
const mockElement = {
  addEventListener: jest.fn(),
  getAttribute: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  scrollIntoView: jest.fn(),
  closest: jest.fn(),
  classList: {
    contains: jest.fn(() => false)
  },
  style: {},
  textContent: 'Test Plan'
};

// Mock document
global.document = {
  addEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => [mockElement]),
  querySelector: jest.fn(() => mockElement)
};

// Mock window
global.window = {
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn()
  }))
};

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

describe('Pricing Page Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePricingPage', () => {
    test('should initialize all event listeners', () => {
      initializePricingPage();
      
      expect(document.querySelectorAll).toHaveBeenCalledWith('a[href^="#"]');
      expect(document.querySelectorAll).toHaveBeenCalledWith('.pricing-plan');
      expect(document.querySelectorAll).toHaveBeenCalledWith('.button.primary');
      expect(document.querySelectorAll).toHaveBeenCalledWith('.faq-item');
    });

    test('should add event listeners to elements', () => {
      initializePricingPage();
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handleSmoothScroll);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseenter', handlePlanHover);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseleave', handlePlanLeave);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handleCtaClick);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handleFaqToggle);
    });
  });

  describe('handleSmoothScroll', () => {
    test('should prevent default and scroll to target element for anchor links', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          getAttribute: jest.fn(() => '#test-section')
        }
      };

      const mockTargetElement = {
        scrollIntoView: jest.fn()
      };

      document.querySelector = jest.fn(() => mockTargetElement);

      handleSmoothScroll(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('#test-section');
      expect(mockTargetElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    test('should not prevent default for non-anchor links', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          getAttribute: jest.fn(() => 'https://example.com')
        }
      };

      handleSmoothScroll(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    test('should handle missing target element gracefully', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          getAttribute: jest.fn(() => '#nonexistent')
        }
      };

      document.querySelector = jest.fn(() => null);

      expect(() => handleSmoothScroll(mockEvent)).not.toThrow();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('handlePlanHover', () => {
    test('should apply hover transform for non-popular plans', () => {
      const mockEvent = {
        currentTarget: {
          classList: {
            contains: jest.fn(() => false)
          },
          style: {}
        }
      };

      handlePlanHover(mockEvent);

      expect(mockEvent.currentTarget.style.transform).toBe('translateY(-8px) scale(1.02)');
    });

    test('should not apply hover transform for popular plans', () => {
      const mockEvent = {
        currentTarget: {
          classList: {
            contains: jest.fn(() => true)
          },
          style: {}
        }
      };

      handlePlanHover(mockEvent);

      expect(mockEvent.currentTarget.style.transform).toBeUndefined();
    });
  });

  describe('handlePlanLeave', () => {
    test('should reset transform for non-popular plans', () => {
      const mockEvent = {
        currentTarget: {
          classList: {
            contains: jest.fn(() => false)
          },
          style: {
            transform: 'translateY(-8px) scale(1.02)'
          }
        }
      };

      handlePlanLeave(mockEvent);

      expect(mockEvent.currentTarget.style.transform).toBe('');
    });

    test('should not reset transform for popular plans', () => {
      const mockEvent = {
        currentTarget: {
          classList: {
            contains: jest.fn(() => true)
          },
          style: {
            transform: 'translateY(-8px) scale(1.02)'
          }
        }
      };

      handlePlanLeave(mockEvent);

      expect(mockEvent.currentTarget.style.transform).toBe('translateY(-8px) scale(1.02)');
    });
  });

  describe('handleCtaClick', () => {
    test('should apply visual feedback on button click', () => {
      jest.useFakeTimers();
      
      const mockButton = {
        closest: jest.fn(() => ({
          querySelector: jest.fn(() => ({
            textContent: 'Monthly'
          }))
        })),
        textContent: 'Get Started',
        style: {}
      };

      const mockEvent = {
        currentTarget: mockButton
      };

      handleCtaClick(mockEvent);

      expect(mockButton.style.transform).toBe('scale(0.95)');

      jest.advanceTimersByTime(150);

      expect(mockButton.style.transform).toBe('');

      jest.useRealTimers();
    });

    test('should handle missing plan name gracefully', () => {
      const mockButton = {
        closest: jest.fn(() => null),
        textContent: 'Get Started',
        style: {}
      };

      const mockEvent = {
        currentTarget: mockButton
      };

      expect(() => handleCtaClick(mockEvent)).not.toThrow();
    });

    test('should call gtag if available', () => {
      global.gtag = jest.fn();

      const mockButton = {
        closest: jest.fn(() => ({
          querySelector: jest.fn(() => ({
            textContent: 'Monthly'
          }))
        })),
        textContent: 'Get Started',
        style: {}
      };

      const mockEvent = {
        currentTarget: mockButton
      };

      handleCtaClick(mockEvent);

      expect(global.gtag).toHaveBeenCalledWith('event', 'pricing_cta_click', {
        plan_name: 'Monthly',
        button_text: 'Get Started'
      });

      delete global.gtag;
    });
  });

  describe('handleFaqToggle', () => {
    test('should apply visual feedback on FAQ item click', () => {
      jest.useFakeTimers();

      const mockFaqItem = {
        style: {}
      };

      const mockEvent = {
        currentTarget: mockFaqItem
      };

      handleFaqToggle(mockEvent);

      expect(mockFaqItem.style.transform).toBe('scale(1.01)');

      jest.advanceTimersByTime(200);

      expect(mockFaqItem.style.transform).toBe('');

      jest.useRealTimers();
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null elements gracefully', () => {
    document.querySelectorAll = jest.fn(() => []);
    
    expect(() => initializePricingPage()).not.toThrow();
  });

  test('should handle events with missing properties', () => {
    const mockEvent = {
      target: null,
      currentTarget: null
    };

    expect(() => handleSmoothScroll(mockEvent)).not.toThrow();
    expect(() => handlePlanHover(mockEvent)).not.toThrow();
    expect(() => handlePlanLeave(mockEvent)).not.toThrow();
    expect(() => handleCtaClick(mockEvent)).not.toThrow();
    expect(() => handleFaqToggle(mockEvent)).not.toThrow();
  });
});