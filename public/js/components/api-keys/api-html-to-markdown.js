import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/html-to-markdown endpoint component
 * Displays the documentation for the POST /api/1/html-to-markdown endpoint
 */
export class ApiHtmlToMarkdown extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/html-to-markdown endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/html-to-markdown';
    this._description = 'Converts HTML content to Markdown format.';
    this._parameters = [
      {
        name: 'html',
        type: 'string',
        required: true,
        description: 'The HTML content to convert to Markdown'
      },
      {
        name: 'filename',
        type: 'string',
        required: false,
        description: 'Output filename (default: "document.md")'
      },
      {
        name: 'store',
        type: 'boolean',
        required: false,
        description: 'Whether to store the document in Supabase (default: false)'
      }
    ];
    this._requestExample = `{
  "html": "<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>",
  "filename": "document.md",
  "store": false
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/html-to-markdown" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>",
    "filename": "document.md",
    "store": false
  }'`,
      fetch: `fetch('https://api.example.com/api/1/html-to-markdown', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>',
    filename: 'document.md',
    store: false
  })
})
.then(response => response.text())
.then(markdown => {
  console.log(markdown);
  // Create a link to download the Markdown file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.md';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');
const fs = require('fs');

axios.post('https://api.example.com/api/1/html-to-markdown', {
  html: '<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>',
  filename: 'document.md',
  store: false
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  fs.writeFileSync('document.md', response.data);
  console.log('Markdown file saved to document.md');
})
.catch(error => {
  console.error('Error:', error);
});`,
      python: `import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

data = {
    'html': '<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>',
    'filename': 'document.md',
    'store': False
}

response = requests.post('https://api.example.com/api/1/html-to-markdown',
                        headers=headers,
                        data=json.dumps(data))

# Save the Markdown to a file
with open('document.md', 'w') as f:
    f.write(response.text)
print('Markdown file saved to document.md')`,
      php: `<?php
$curl = curl_init();

$data = [
  'html' => '<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>',
  'filename' => 'document.md',
  'store' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/html-to-markdown",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode($data),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_JWT_TOKEN",
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "Error: " . $err;
} else {
  // Save the Markdown to a file
  file_put_contents('document.md', $response);
  echo "Markdown file saved to document.md";
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/html-to-markdown')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'html' => '<h1>Hello, World!</h1><p>This is a <strong>test</strong>.</p>',
  'filename' => 'document.md',
  'store' => false
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

# Save the Markdown to a file
File.open('document.md', 'w') do |file|
  file.write(response.body)
end
puts 'Markdown file saved to document.md'`
    };
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <div class="endpoint-header">
        <span class="http-method method-${this._method.toLowerCase()}">${this._method}</span>
        <span class="endpoint-path">${this._path}</span>
      </div>
      
      <div class="endpoint-description">
        <p>${this._description}</p>
      </div>
      
      ${this.renderParametersTable(this._parameters)}
      
      <div class="section-title">Example Request</div>
      <div class="code-block">
        <pre>${this.escapeHtml(this._requestExample)}</pre>
      </div>
      
      ${this.renderCodeExamples(this._codeExamples)}
      
      <div class="section-title">Response</div>
      <p>Returns the Markdown content with the following headers:</p>
      <ul>
        <li><code>Content-Type: text/markdown</code></li>
        <li><code>Content-Disposition: attachment; filename="document.md"</code></li>
        <li><code>X-Storage-Path: documents/...</code> (if stored in Supabase)</li>
      </ul>
      
      <div class="section-title">Example Response</div>
      <div class="code-block">
        <pre># Hello, World!

This is a **test**.</pre>
      </div>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-html-to-markdown')) {
  customElements.define('api-html-to-markdown', ApiHtmlToMarkdown);
  console.log('API HTML to Markdown component registered');
}