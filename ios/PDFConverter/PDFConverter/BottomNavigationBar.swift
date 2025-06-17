import UIKit

// Define delegate protocol
protocol BottomNavigationBarDelegate: AnyObject {
    func didTapHomeButton()
}

class BottomNavigationBar: UIView {
    // Home button
    private let homeButton = UIButton(type: .system)
    
    // Delegate for handling button taps
    weak var delegate: BottomNavigationBarDelegate?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        // Set background color to primary color
        backgroundColor = AppColors.primary
        
        // Configure home button
        homeButton.setTitle("Home", for: .normal)
        homeButton.setTitleColor(AppColors.textOnPrimary, for: .normal)
        homeButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
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
        topBorder.backgroundColor = AppColors.background.withAlphaComponent(0.2)
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