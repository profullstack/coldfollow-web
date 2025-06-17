# ColdFollow - Social Media Marketing Platform

[![Crypto Payment](https://paybadge.profullstack.com/badge.svg)](https://paybadge.profullstack.com/?tickers=btc%2Ceth%2Csol%2Cusdc)

ColdFollow is a comprehensive social media marketing platform designed for cold outreach and automated engagement. Built with modern web technologies, it provides powerful tools for email marketing, SMS campaigns, AI-powered phone calls, and social media management across multiple platforms.

## Features

### 🎯 Cold Outreach
- **Email Marketing**: Automated email campaigns with personalization
- **SMS Marketing**: Bulk SMS campaigns with scheduling and tracking
- **AI Phone Calls**: Automated phone outreach using AI voice technology
- **Social Media Outreach**: Direct messaging across platforms

### 📱 Social Media Management
- **Multi-Platform Posting**: Schedule and publish to multiple social networks
- **Content Calendar**: Visual planning and scheduling interface
- **Analytics Dashboard**: Track engagement, reach, and conversion metrics
- **Automated Responses**: AI-powered social media interactions

### 🤖 AI-Powered Features
- **Content Generation**: AI-assisted content creation for posts and campaigns
- **Lead Scoring**: Intelligent prospect qualification and prioritization
- **Conversation AI**: Automated responses and engagement
- **Performance Optimization**: AI-driven campaign optimization

### 📊 Analytics & Reporting
- **Campaign Performance**: Detailed metrics for all outreach channels
- **ROI Tracking**: Revenue attribution and conversion tracking
- **A/B Testing**: Split testing for campaigns and content
- **Custom Reports**: Exportable reports and dashboards

## Automatic Deployment with GitHub Actions

This repository is configured to automatically deploy to the production server when changes are pushed to the `master` or `main` branch.

### Setup Instructions

1. **Generate an SSH key pair**:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```
   This will create a private key (`id_ed25519`) and a public key (`id_ed25519.pub`).

2. **Add the public key to your server**:
   ```bash
   # Copy the public key
   cat ~/.ssh/id_ed25519.pub
   
   # Then on your server, add it to authorized_keys
   ssh ubuntu@coldfollow.com "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
   ssh ubuntu@coldfollow.com "echo 'your-public-key-here' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```

3. **Add the required secrets to GitHub**:
   - Go to your GitHub repository
   - Click on "Settings" > "Secrets and variables" > "Actions"
   - Add the following secrets:
   
   a. **SSH Private Key**:
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the entire content of your private key file (`~/.ssh/id_ed25519`)
   - Click "Add secret"
   
   b. **Environment Variables**:
   - Click "New repository secret"
   - Name: `ENV_FILE_CONTENT`
   - Value: Copy the entire content of your .env file
   - Click "Add secret"
   
   c. **Supabase Configuration**:
   - Click "New repository secret"
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., https://your-project-ref.supabase.co)
   - Click "Add secret"
   
   - Click "New repository secret"
   - Name: `SUPABASE_KEY`
   - Value: Your Supabase service role API key
   - Click "Add secret"
   
   - Click "New repository secret"
   - Name: `SUPABASE_DB_PASSWORD`
   - Value: Your Supabase database password
   - Click "Add secret"
   
   - Click "New repository secret"
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: Your Supabase access token (from https://supabase.com/dashboard/account/tokens)
   - Click "Add secret"
   
   d. **Server Known Hosts** (as a fallback):
   - Run this command locally to get the server's SSH key fingerprint (using the correct port):
     ```bash
     ssh-keyscan -p 2048 104.36.23.197
     ```
   - Click "New repository secret"
   - Name: `SERVER_KNOWN_HOSTS`
   - Value: Paste the output from the ssh-keyscan command
   - Click "Add secret"

4. **Important Note About SSH Configuration**:
   - GitHub Actions doesn't have access to your local `~/.ssh/config` file
   - All scripts now use the direct IP address, port, and user:
     - IP: `104.36.23.197`
     - Port: `2048`
     - User: `ubuntu`
   - The workflow creates an SSH config file with these settings
   - If you need to use different connection details, update them in:
     - `.github/workflows/deploy.yml`
     - `bin/deploy.sh`
     - `bin/check-deployment.sh`
     - `bin/manual-deploy.sh`

5. **Verify GitHub Actions is enabled**:
   - Go to your repository on GitHub
   - Click on the "Actions" tab
   - Make sure Actions are enabled for the repository

6. **Test the workflow**:
   - Make a small change to your repository
   - Commit and push to master/main
   - Go to the "Actions" tab in your GitHub repository to monitor the workflow
   - The workflow will run the `bin/test-github-actions.sh` script on the server to verify deployment
   - Check for a new file named `github-actions-test-*.txt` on your server to confirm success

### Troubleshooting

If the deployment fails, check the following:

1. **SSH Key Issues**:
   - Make sure the public key is correctly added to the server's `~/.ssh/authorized_keys` file
   - Verify the private key is correctly added to GitHub Secrets

2. **Server Connection Issues**:
   - Check if the server hostname is correct in the workflow file
   - Make sure the server is accessible from GitHub Actions

3. **Permission Issues**:
   - Ensure the deploy script has execute permissions
   - Check if the user has permission to write to the deployment directory

4. **Environment Variables Issues**:
   - Make sure the `ENV_FILE_CONTENT` secret is properly set in GitHub Secrets
   - Verify that all required environment variables are included in the secret
   - Check if the .env file is being created correctly in the workflow logs

5. **Script Issues**:
   - Review the deploy.sh script for any errors
   - Check the GitHub Actions logs for detailed error messages

## Deployment Troubleshooting Scripts

This repository includes several scripts to help troubleshoot deployment issues:

### Check Deployment Status

Run the following script to check if GitHub Actions deployment is working correctly:

```bash
./bin/check-deployment.sh
```

This script will:
- Test SSH connection to the server
- Check if the remote directory exists
- Look for GitHub Actions test files
- Create a new test file to verify write access
- Check local Git configuration

### Manual Deployment

If GitHub Actions deployment isn't working, you can manually deploy using:

```bash
./bin/manual-deploy.sh
```

This script will:
- Deploy your code using rsync
- Make scripts executable on the remote host
- Run the test script to verify deployment
- Reload systemd daemon
- Optionally install/restart the service

### Deployment with Database Migrations

To deploy your code and run database migrations in one step:

```bash
./bin/deploy-with-migrations.sh
```

This script will:
1. Deploy your code using the regular deploy script
2. Run database migrations using the Supabase CLI
3. Restart the service to apply all changes

This is the recommended way to deploy when you have database schema changes. The GitHub Actions workflow has been updated to use this script automatically, ensuring that migrations are applied during CI/CD deployments.

## Database Setup

This project uses Supabase as its database. You need to set up the required tables before the application will work correctly.

### Setting Up Supabase Tables

1. **Using Migrations**:
   ```bash
   ./bin/supabase-db.sh migrate
   ```
   This will run all migrations in the `supabase/migrations` directory.

2. **Manual Setup**:
   - Go to the Supabase dashboard: https://app.supabase.io
   - Select your project
   - Go to the SQL Editor
   - Copy the contents of `supabase/migrations/20250419014200_initial_schema.sql`
   - Paste into the SQL Editor and run the query

### Required Tables

The application requires the following tables:
- `users` - For storing user information and profiles
- `api_keys` - For storing API keys for external integrations
- `subscriptions` - For storing subscription information
- `campaigns` - For storing marketing campaign data
- `contacts` - For storing prospect and customer information
- `social_accounts` - For storing connected social media accounts
- `scheduled_posts` - For storing scheduled social media content
- `outreach_sequences` - For storing automated outreach workflows

These tables are defined in the Supabase migrations in the `supabase/migrations` directory.

### Database Migrations with Supabase CLI

This project uses the Supabase CLI for database migrations. Migrations are stored in the `supabase/migrations` directory and are managed by the Supabase CLI.

#### Installing Supabase CLI

The Supabase CLI is automatically installed when you run the service installation script:

```bash
sudo ./bin/install-service.sh
```

Alternatively, you can use our database management script which will install the CLI if needed:

```bash
./bin/supabase-db.sh setup
```

#### Database Management

We've created a single script to handle all Supabase database operations:

```bash
./bin/supabase-db.sh [command]
```

Available commands:

1. **Setup** - Install Supabase CLI and link to your cloud project:
   ```bash
   ./bin/supabase-db.sh setup
   ```

2. **Migrate** - Run migrations on your Supabase database:
   ```bash
   ./bin/supabase-db.sh migrate
   ```

3. **Create New Migration** - Create a new migration file:
   ```bash
   ./bin/supabase-db.sh new add_campaign_analytics
   ```

**Note:** You need to add `SUPABASE_DB_PASSWORD` to your .env file. This is your database password from the Supabase dashboard.

## API Integrations

ColdFollow integrates with various third-party services to provide comprehensive marketing capabilities:

### Email Services
- **Mailgun**: For transactional and marketing emails
- **SendGrid**: Alternative email service provider
- **SMTP**: Custom SMTP server support

### SMS Services
- **Twilio**: For SMS campaigns and notifications
- **Plivo**: Alternative SMS service provider

### Social Media APIs
- **Twitter/X API**: For posting and engagement
- **LinkedIn API**: For professional networking outreach
- **Facebook/Meta API**: For Facebook and Instagram posting
- **TikTok API**: For short-form video content

### AI Services
- **OpenAI**: For content generation and conversation AI
- **ElevenLabs**: For AI voice generation in phone calls
- **Anthropic**: Alternative AI service for content creation

### Analytics
- **Google Analytics**: For website traffic tracking
- **Facebook Pixel**: For social media conversion tracking
- **Custom Analytics**: Built-in analytics dashboard

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_DB_PASSWORD=your_db_password

# Email Services
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_domain
FROM_EMAIL=hello@coldfollow.com

# SMS Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# AI Services
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Social Media APIs
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
LINKEDIN_CLIENT_ID=your_linkedin_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable

# Application
PORT=3000
NODE_ENV=production
API_BASE_URL=https://coldfollow.com
```

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/coldfollow-web.git
   cd coldfollow-web
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Set up the database**:
   ```bash
   ./bin/supabase-db.sh setup
   ./bin/supabase-db.sh migrate
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:3000`

## Development

### Adding New Features

For detailed instructions on how to add new routes, pages, or components to the application, see the [Generator Guide](README-generator.md).

This guide covers:
- Creating marketing campaign interfaces
- Setting up social media integrations
- Adding new outreach channels
- Implementing analytics dashboards
- Best practices for feature development

We provide a template-based generator script that automates the process of creating various components:

```bash
# Generate a client-side route for campaigns
./bin/generator.js client route --route="/campaigns" --name="Campaigns" --auth --subscription

# Generate a server-side API route
./bin/generator.js server route --path="/api/v1/campaigns" --controller="Campaign" --method="post"

# Generate a database migration
./bin/generator.js server migration --name="add_campaign_analytics"

# Generate a controller
./bin/generator.js server controller --name="Campaign"
```

### Testing

Run the test suite:

```bash
pnpm test
```

### Building for Production

Build the application:

```bash
pnpm build
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@coldfollow.com
- Documentation: https://docs.coldfollow.com
- GitHub Issues: https://github.com/your-username/coldfollow-web/issues
