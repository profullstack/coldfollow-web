import UIKit
import WebKit

// Simple Config implementation for API URL
struct AppConfig {
    static let apiBaseURL: String = "https://convert2doc.com"
}

// Simple protocol for navigation actions
protocol NavigationDelegate: AnyObject {
    func didTapHomeButton()
}

// Simple navigation bar class defined inline to avoid import issues
class SimpleNavigationBar: UIView {
    // Home button
    private let homeButton = UIButton(type: .system)
    
    // Delegate for handling button taps
    weak var delegate: NavigationDelegate?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        // Set background color to match the website's red accent
        backgroundColor = UIColor(red: 255/255, green: 59/255, blue: 78/255, alpha: 1.0)
        
        // Configure home button with white text
        homeButton.setTitle("Home", for: .normal)
        homeButton.setTitleColor(.white, for: .normal)
        homeButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .bold) // Make it bold for better visibility
        // No background color on button since the bar itself is now red
        homeButton.addTarget(self, action: #selector(homeButtonTapped), for: .touchUpInside)
        
        // Add home button to view
        homeButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(homeButton)
        
        // Center the home button
        NSLayoutConstraint.activate([
            homeButton.centerXAnchor.constraint(equalTo: centerXAnchor),
            homeButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            homeButton.heightAnchor.constraint(equalToConstant: 44)
        ])
        
        // Add top border
        let topBorder = UIView()
        topBorder.backgroundColor = UIColor.lightGray.withAlphaComponent(0.2)
        topBorder.translatesAutoresizingMaskIntoConstraints = false
        addSubview(topBorder)
        
        NSLayoutConstraint.activate([
            topBorder.topAnchor.constraint(equalTo: topAnchor),
            topBorder.leadingAnchor.constraint(equalTo: leadingAnchor),
            topBorder.trailingAnchor.constraint(equalTo: trailingAnchor),
            topBorder.heightAnchor.constraint(equalToConstant: 1)
        ])
    }
    
    @objc private func homeButtonTapped() {
        delegate?.didTapHomeButton()
    }
}

class ViewController: UIViewController {
    
    private var webView: WKWebView!
    private var pwaUrl: String = ""
    private var bottomNavigationBar: SimpleNavigationBar!
    
    // Set status bar to be light colored (white) to contrast with dark website header
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupBottomNavigation()
        loadWebContent()
    }
    
    private func setupWebView() {
        // Configure WebView preferences
        let preferences = WKPreferences()
        preferences.javaScriptEnabled = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        configuration.allowsInlineMediaPlayback = true
        
        // Create WebView with configuration
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        
        // Set background color to match website (dark blue/black)
        webView.backgroundColor = UIColor(red: 21/255, green: 25/255, blue: 40/255, alpha: 1.0)
        webView.scrollView.backgroundColor = UIColor(red: 21/255, green: 25/255, blue: 40/255, alpha: 1.0)
        
        // Add WebView to view hierarchy
        view.addSubview(webView)
        
        // Layout constraints - make it full screen, removing the black shade
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -50) // Leave space for bottom navigation
        ])
    }
    
    private func setupBottomNavigation() {
        // Create and add bottom navigation bar
        bottomNavigationBar = SimpleNavigationBar()
        bottomNavigationBar.translatesAutoresizingMaskIntoConstraints = false
        bottomNavigationBar.delegate = self
        view.addSubview(bottomNavigationBar)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            bottomNavigationBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomNavigationBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomNavigationBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            bottomNavigationBar.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    private func loadWebContent() {
        // Get URL from AppConfig
        pwaUrl = AppConfig.apiBaseURL
        print("Loading URL: \(pwaUrl)")
        
        // Verify URL is valid
        if let url = URL(string: pwaUrl) {
            print("URL is valid: \(pwaUrl)")
            
            // Check URL accessibility
            checkUrlAccessibility(url: url)
            
            // Load the URL in WebView
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            print("URL is invalid: \(pwaUrl)")
            
            // Fall back to hardcoded URL
            pwaUrl = "https://convert2doc.com"
            print("Falling back to hardcoded URL: \(pwaUrl)")
            
            if let fallbackUrl = URL(string: pwaUrl) {
                let request = URLRequest(url: fallbackUrl)
                webView.load(request)
            }
        }
    }
    
    private func checkUrlAccessibility(url: URL) {
        URLSession.shared.dataTask(with: url) { (_, response, error) in
            DispatchQueue.main.async {
                if let error = error {
                    print("Error checking URL accessibility: \(error.localizedDescription)")
                    self.showAlert(message: "Warning: Could not check URL accessibility")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    print("URL accessibility check result: \(url.absoluteString) - Response code: \(httpResponse.statusCode)")
                    
                    if httpResponse.statusCode != 200 {
                        print("URL is not accessible: \(url.absoluteString) - Response code: \(httpResponse.statusCode)")
                        self.showAlert(message: "Warning: URL may not be accessible (HTTP \(httpResponse.statusCode))")
                    }
                }
            }
        }.resume()
    }
    
    private func showAlert(message: String) {
        let alert = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
}

// MARK: - WKNavigationDelegate
extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("Page loading started: \(webView.url?.absoluteString ?? "unknown")")
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Page loading finished: \(webView.url?.absoluteString ?? "unknown")")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WebView error: \(error.localizedDescription)")
        showAlert(message: "Error: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("WebView provisional navigation error: \(error.localizedDescription)")
        
        // Check if this is a not found error
        let nsError = error as NSError
        if nsError.domain == "NSURLErrorDomain" && nsError.code == -1003 {
            print("404 Not Found error detected")
            
            // Try to load the fallback URL
            let fallbackUrl = "https://convert2doc.com"
            if webView.url?.absoluteString != fallbackUrl, let url = URL(string: fallbackUrl) {
                print("Trying fallback URL: \(fallbackUrl)")
                webView.load(URLRequest(url: url))
                showAlert(message: "Page not found, trying fallback URL")
                return
            }
        }
        
        showAlert(message: "Error: \(error.localizedDescription)")
    }
}

// MARK: - NavigationDelegate
extension ViewController: NavigationDelegate {
    func didTapHomeButton() {
        // Navigate to home page
        if let url = URL(string: pwaUrl) {
            webView.load(URLRequest(url: url))
        }
    }
}
