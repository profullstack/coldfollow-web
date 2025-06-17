import Foundation

struct Config {
    static let apiBaseURL: String = {
        // Try to read from environment variables first (for CI/CD)
        if let envURL = ProcessInfo.processInfo.environment["API_BASE_URL"] {
            return envURL
        }
        
        // Then try to read from .env file in the project root
        let fileManager = FileManager.default
        let rootPath = Bundle.main.bundlePath.components(separatedBy: "/ios/PDFConverter").first ?? ""
        let envPath = "\(rootPath)/.env"
        
        if fileManager.fileExists(atPath: envPath),
           let envContents = try? String(contentsOfFile: envPath, encoding: .utf8) {
            // Parse .env file
            let lines = envContents.components(separatedBy: .newlines)
            for line in lines {
                if line.hasPrefix("API_BASE_URL=") {
                    let value = line.replacingOccurrences(of: "API_BASE_URL=", with: "")
                    if !value.isEmpty {
                        return value
                    }
                }
            }
        }
        
        // Fallback to default URL
        return "https://convert2doc.com"
    }()
}