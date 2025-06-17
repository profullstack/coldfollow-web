/**
 * Test entry point for @profullstack/storage-service
 * 
 * This file imports all test files to ensure they are included in the test run.
 */

// Main service tests
import './storage-service.test.js';

// Adapter tests
import './adapters/memory.test.js';

// Utility tests
import './utils/metadata.test.js';
import './utils/path.test.js';
import './utils/content-type.test.js';

// This file is used as the entry point for the test command in package.json