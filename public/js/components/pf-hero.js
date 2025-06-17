/**
 * Hero component for the home page
 */
class PfHero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .hero {
          text-align: center;
          padding: 60px 0;
          margin-bottom: 60px;
        }
        
        .hero h2 {
          font-size: 36px;
          margin-bottom: 20px;
          color: var(--primary-color, #2563eb);
        }
        
        .hero p {
          font-size: 18px;
          max-width: 800px;
          margin: 0 auto 30px;
          color: var(--text-secondary, #666);
        }
        
        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
        }
        
        .cta-primary {
          display: inline-block;
          padding: 12px 24px;
          background-color: var(--primary-color, #2563eb);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 500;
          font-size: 18px;
          transition: background-color 0.2s, transform 0.2s;
        }
        
        .cta-primary:hover {
          background-color: var(--primary-dark, #1d4ed8);
          transform: translateY(-2px);
        }
        
        .cta-secondary {
          display: inline-block;
          padding: 12px 24px;
          background-color: transparent;
          color: var(--primary-color, #2563eb);
          text-decoration: none;
          border: 1px solid var(--primary-color, #2563eb);
          border-radius: 5px;
          font-weight: 500;
          font-size: 18px;
          transition: background-color 0.2s, transform 0.2s;
        }
        
        .cta-secondary:hover {
          background-color: rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }
      </style>
      
      <div class="hero">
        <h2>Supercharge Your Cold Outreach & Social Media Marketing</h2>
        <p>Comprehensive platform for cold outreach via email, SMS, AI-powered phone calls, and social media automation. Scale your marketing efforts with intelligent automation and detailed analytics.</p>
        
        <div class="cta-buttons">
          <a href="/register" class="cta-primary">Get Started</a>
          <a href="/login" class="cta-secondary">Login</a>
        </div>
      </div>
    `;
    
    // No need for specific click handlers anymore
    // The global router click handler will handle all links
  }
}

// Define the custom element
customElements.define('pf-hero', PfHero);

export default PfHero;