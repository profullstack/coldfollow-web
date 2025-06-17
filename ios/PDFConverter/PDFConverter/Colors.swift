import UIKit

struct AppColors {
    // Base colors from theme.css
    static let primary = UIColor(hex: 0xE02337)        // Profullstack, Inc. red
    static let primaryLight = UIColor(hex: 0xE54D5D)   // Lighter red
    static let primaryDark = UIColor(hex: 0xC01D2F)    // Darker red
    static let secondary = UIColor(hex: 0xFC7E3E)      // Accent orange
    static let secondaryLight = UIColor(hex: 0xFD9C6A) // Lighter orange
    static let secondaryDark = UIColor(hex: 0xE66A2C)  // Darker orange
    static let accent = UIColor(hex: 0xBA18AA)         // Accent magenta
    
    // Neutral colors
    static let background = UIColor.white               // White background
    static let surface = UIColor(hex: 0xF9FAFB)         // Light gray surface
    static let surfaceVariant = UIColor(hex: 0xF3F4F6)  // Slightly darker surface
    static let border = UIColor(hex: 0xE5E7EB)          // Light border
    static let divider = UIColor(hex: 0xD1D5DB)         // Divider color
    
    // Text colors
    static let textPrimary = UIColor(hex: 0x111827)     // Near black for primary text
    static let textSecondary = UIColor(hex: 0x4B5563)   // Dark gray for secondary text
    static let textTertiary = UIColor(hex: 0x6B7280)    // Medium gray for tertiary text
    static let textDisabled = UIColor(hex: 0x9CA3AF)    // Light gray for disabled text
    static let textOnPrimary = UIColor.white            // White text on primary color
    static let textOnSecondary = UIColor.white          // White text on secondary color
}

// Extension to create UIColor from hex value
extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1.0) {
        let red = CGFloat((hex & 0xFF0000) >> 16) / 255.0
        let green = CGFloat((hex & 0x00FF00) >> 8) / 255.0
        let blue = CGFloat(hex & 0x0000FF) / 255.0
        
        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }
}