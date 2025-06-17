# ColdFollow Platform Development TODO

## Overview
Transform the platform into a comprehensive social media marketing and cold outreach platform with campaign management capabilities. Users should be able to create campaigns and manage all tasks under each campaign.

## Phase 1: Database Schema & Migrations

### 1.1 Core Campaign Management Tables ✅ COMPLETED
- [x] **Create campaigns table migration** ✅ COMPLETED
  ```bash
  # Migration created using existing generator system
  node bin/generator.js server migration --name="create_campaigns_table"
  ```
  **✅ Migration System Fixed and Working:**
  - Enhanced existing `bin/apply-migration.js` to be a full-featured migration runner
  - Uses existing `bin/generator.js` for creating new migrations
  - Migration tracking with `_migrations` table and checksums
  - Supports UP migration sections from template files
  - Colored output and proper error handling
  - Integration with Supabase client using service role key
  - Package.json scripts updated for easy usage
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `name` (VARCHAR, campaign name)
  - `description` (TEXT, campaign description)
  - `type` (ENUM: 'email', 'sms', 'phone', 'social', 'mixed')
  - `status` (ENUM: 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')
  - `target_audience` (JSONB, audience criteria)
  - `settings` (JSONB, campaign-specific settings)
  - `scheduled_at` (TIMESTAMP, when to start)
  - `started_at` (TIMESTAMP, actual start time)
  - `completed_at` (TIMESTAMP, completion time)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### 1.2 Contact Management Tables
- [ ] **Create contacts table migration**
  ```bash
  pnpm migrate:create create_contacts_table
  ```
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `email` (VARCHAR, contact email)
  - `phone` (VARCHAR, contact phone)
  - `first_name` (VARCHAR)
  - `last_name` (VARCHAR)
  - `company` (VARCHAR)
  - `title` (VARCHAR)
  - `tags` (TEXT[], array of tags)
  - `notes` (TEXT)
  - `source` (VARCHAR, how contact was acquired)
  - `status` (ENUM: 'active', 'inactive', 'unsubscribed', 'bounced')
  - `custom_fields` (JSONB, additional contact data)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- [ ] **Create contact_lists table migration**
  ```bash
  pnpm migrate:create create_contact_lists_table
  ```
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `name` (VARCHAR, list name)
  - `description` (TEXT)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- [ ] **Create contact_list_members table migration**
  ```bash
  pnpm migrate:create create_contact_list_members_table
  ```
  - `id` (UUID, primary key)
  - `contact_list_id` (UUID, foreign key)
  - `contact_id` (UUID, foreign key)
  - `added_at` (TIMESTAMP)

### 1.3 Campaign Tasks & Execution Tables
- [ ] **Create campaign_tasks table migration**
  ```bash
  pnpm migrate:create create_campaign_tasks_table
  ```
  - `id` (UUID, primary key)
  - `campaign_id` (UUID, foreign key to campaigns)
  - `type` (ENUM: 'email', 'sms', 'phone_call', 'social_post', 'follow_up')
  - `name` (VARCHAR, task name)
  - `template_id` (UUID, foreign key to templates)
  - `target_contacts` (JSONB, contact selection criteria)
  - `settings` (JSONB, task-specific settings)
  - `scheduled_at` (TIMESTAMP)
  - `status` (ENUM: 'pending', 'running', 'completed', 'failed', 'cancelled')
  - `execution_stats` (JSONB, sent/delivered/opened/clicked counts)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- [ ] **Create campaign_executions table migration**
  ```bash
  pnpm migrate:create create_campaign_executions_table
  ```
  - `id` (UUID, primary key)
  - `campaign_task_id` (UUID, foreign key)
  - `contact_id` (UUID, foreign key)
  - `status` (ENUM: 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')
  - `sent_at` (TIMESTAMP)
  - `delivered_at` (TIMESTAMP)
  - `opened_at` (TIMESTAMP)
  - `clicked_at` (TIMESTAMP)
  - `replied_at` (TIMESTAMP)
  - `error_message` (TEXT)
  - `metadata` (JSONB, execution-specific data)

### 1.4 Template Management Tables
- [ ] **Create templates table migration**
  ```bash
  pnpm migrate:create create_templates_table
  ```
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `name` (VARCHAR, template name)
  - `type` (ENUM: 'email', 'sms', 'phone_script', 'social_post')
  - `subject` (VARCHAR, for email templates)
  - `content` (TEXT, template content with merge tags)
  - `variables` (JSONB, available merge variables)
  - `is_ai_generated` (BOOLEAN)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### 1.5 Social Media Integration Tables
- [ ] **Create social_accounts table migration**
  ```bash
  pnpm migrate:create create_social_accounts_table
  ```
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `platform` (ENUM: 'twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube')
  - `account_name` (VARCHAR)
  - `account_id` (VARCHAR, platform-specific ID)
  - `access_token` (TEXT, encrypted)
  - `refresh_token` (TEXT, encrypted)
  - `expires_at` (TIMESTAMP)
  - `is_active` (BOOLEAN)
  - `connected_at` (TIMESTAMP)
  - `last_sync_at` (TIMESTAMP)

- [ ] **Create social_posts table migration**
  ```bash
  pnpm migrate:create create_social_posts_table
  ```
  - `id` (UUID, primary key)
  - `campaign_task_id` (UUID, foreign key, nullable)
  - `social_account_id` (UUID, foreign key)
  - `content` (TEXT, post content)
  - `media_urls` (TEXT[], array of media URLs)
  - `scheduled_at` (TIMESTAMP)
  - `published_at` (TIMESTAMP)
  - `platform_post_id` (VARCHAR, platform-specific post ID)
  - `status` (ENUM: 'draft', 'scheduled', 'published', 'failed')
  - `engagement_stats` (JSONB, likes/shares/comments)
  - `created_at` (TIMESTAMP)

### 1.6 Analytics & Reporting Tables
- [ ] **Create campaign_analytics table migration**
  ```bash
  pnpm migrate:create create_campaign_analytics_table
  ```
  - `id` (UUID, primary key)
  - `campaign_id` (UUID, foreign key)
  - `date` (DATE, analytics date)
  - `metrics` (JSONB, daily metrics)
  - `created_at` (TIMESTAMP)

## Phase 2: Backend API Development

### 2.1 Campaign Management Controllers
- [ ] **Create CampaignController**
  ```bash
  node bin/generator.js server controller --name="CampaignController"
  ```
  - `getAll()` - List user's campaigns
  - `getById()` - Get campaign details
  - `create()` - Create new campaign
  - `update()` - Update campaign
  - `remove()` - Delete campaign
  - `start()` - Start campaign execution
  - `pause()` - Pause campaign
  - `resume()` - Resume paused campaign
  - `getStats()` - Get campaign statistics

- [ ] **Create campaign routes**
  ```bash
  node bin/generator.js server route --path="/api/v1/campaigns" --controller="CampaignController" --method="get"
  node bin/generator.js server route --path="/api/v1/campaigns" --controller="CampaignController" --method="post"
  node bin/generator.js server route --path="/api/v1/campaigns/:id" --controller="CampaignController" --method="get"
  node bin/generator.js server route --path="/api/v1/campaigns/:id" --controller="CampaignController" --method="put"
  node bin/generator.js server route --path="/api/v1/campaigns/:id" --controller="CampaignController" --method="delete"
  node bin/generator.js server route --path="/api/v1/campaigns/:id/start" --controller="CampaignController" --method="post"
  node bin/generator.js server route --path="/api/v1/campaigns/:id/pause" --controller="CampaignController" --method="post"
  node bin/generator.js server route --path="/api/v1/campaigns/:id/stats" --controller="CampaignController" --method="get"
  ```

### 2.2 Contact Management Controllers
- [ ] **Create ContactController**
  ```bash
  node bin/generator.js server controller --name="ContactController"
  ```
  - `getAll()` - List contacts with filtering/pagination
  - `getById()` - Get contact details
  - `create()` - Create new contact
  - `update()` - Update contact
  - `remove()` - Delete contact
  - `import()` - Bulk import contacts
  - `export()` - Export contacts

- [ ] **Create ContactListController**
  ```bash
  node bin/generator.js server controller --name="ContactListController"
  ```
  - `getAll()` - List contact lists
  - `getById()` - Get list with members
  - `create()` - Create new list
  - `update()` - Update list
  - `remove()` - Delete list
  - `addContacts()` - Add contacts to list
  - `removeContacts()` - Remove contacts from list

### 2.3 Template Management Controllers
- [ ] **Create TemplateController**
  ```bash
  node bin/generator.js server controller --name="TemplateController"
  ```
  - `getAll()` - List templates by type
  - `getById()` - Get template details
  - `create()` - Create new template
  - `update()` - Update template
  - `remove()` - Delete template
  - `generateWithAI()` - AI-powered template generation

### 2.4 Social Media Controllers
- [ ] **Create SocialAccountController**
  ```bash
  node bin/generator.js server controller --name="SocialAccountController"
  ```
  - `getAll()` - List connected accounts
  - `connect()` - Connect new social account
  - `disconnect()` - Disconnect account
  - `refresh()` - Refresh account tokens

- [ ] **Create SocialPostController**
  ```bash
  node bin/generator.js server controller --name="SocialPostController"
  ```
  - `getAll()` - List posts
  - `create()` - Create new post
  - `schedule()` - Schedule post
  - `publish()` - Publish immediately
  - `getEngagement()` - Get engagement metrics

### 2.5 Analytics Controllers
- [ ] **Create AnalyticsController**
  ```bash
  node bin/generator.js server controller --name="AnalyticsController"
  ```
  - `getCampaignMetrics()` - Campaign performance
  - `getSocialMetrics()` - Social media metrics
  - `getEngagementMetrics()` - Engagement analytics
  - `getROIMetrics()` - ROI calculations

## Phase 3: Frontend Development

### 3.1 Campaign Management UI
- [ ] **Create campaigns route**
  ```bash
  node bin/generator.js client route --route="/campaigns" --name="Campaigns" --auth --subscription
  ```
  - Campaign list view with filters
  - Campaign creation wizard
  - Campaign dashboard with real-time stats
  - Campaign task management interface

- [ ] **Create campaign detail route**
  ```bash
  node bin/generator.js client route --route="/campaigns/:id" --name="Campaign Detail" --auth --subscription
  ```
  - Campaign overview and settings
  - Task timeline and execution status
  - Performance metrics and charts
  - Contact targeting and segmentation

### 3.2 Contact Management UI
- [ ] **Create contacts route**
  ```bash
  node bin/generator.js client route --route="/contacts" --name="Contacts" --auth --subscription
  ```
  - Contact list with search and filters
  - Contact import/export functionality
  - Contact list management
  - Contact profile editing

### 3.3 Template Management UI
- [ ] **Create templates route**
  ```bash
  node bin/generator.js client route --route="/templates" --name="Templates" --auth --subscription
  ```
  - Template library by type
  - Template editor with preview
  - AI-powered template generation
  - Merge tag management

### 3.4 Social Media Management UI
- [ ] **Create social-accounts route**
  ```bash
  node bin/generator.js client route --route="/social-accounts" --name="Social Accounts" --auth --subscription
  ```
  - Connected accounts overview
  - Account connection flow
  - Post scheduling interface
  - Engagement metrics dashboard

### 3.5 Analytics Dashboard UI
- [ ] **Create analytics route**
  ```bash
  node bin/generator.js client route --route="/analytics" --name="Analytics" --auth --subscription
  ```
  - Campaign performance dashboard
  - Social media analytics
  - ROI and conversion tracking
  - Custom report generation

## Phase 4: Web Components Development

### 4.1 Campaign Components
- [ ] **Create CampaignCard component**
  ```bash
  node bin/generator.js client component --name="CampaignCard" --tag="campaign-card" --description="Campaign overview card"
  ```

- [ ] **Create CampaignWizard component**
  ```bash
  node bin/generator.js client component --name="CampaignWizard" --tag="campaign-wizard" --description="Multi-step campaign creation wizard"
  ```

- [ ] **Create TaskTimeline component**
  ```bash
  node bin/generator.js client component --name="TaskTimeline" --tag="task-timeline" --description="Campaign task execution timeline"
  ```

### 4.2 Contact Components
- [ ] **Create ContactTable component**
  ```bash
  node bin/generator.js client component --name="ContactTable" --tag="contact-table" --description="Sortable contact data table"
  ```

- [ ] **Create ContactImporter component**
  ```bash
  node bin/generator.js client component --name="ContactImporter" --tag="contact-importer" --description="CSV/Excel contact import interface"
  ```

### 4.3 Template Components
- [ ] **Create TemplateEditor component**
  ```bash
  node bin/generator.js client component --name="TemplateEditor" --tag="template-editor" --description="Rich text template editor with merge tags"
  ```

- [ ] **Create AITemplateGenerator component**
  ```bash
  node bin/generator.js client component --name="AITemplateGenerator" --tag="ai-template-generator" --description="AI-powered template generation interface"
  ```

### 4.4 Social Media Components
- [ ] **Create SocialPostComposer component**
  ```bash
  node bin/generator.js client component --name="SocialPostComposer" --tag="social-post-composer" --description="Multi-platform social media post composer"
  ```

- [ ] **Create EngagementChart component**
  ```bash
  node bin/generator.js client component --name="EngagementChart" --tag="engagement-chart" --description="Social media engagement visualization"
  ```

### 4.5 Analytics Components
- [ ] **Create MetricsCard component**
  ```bash
  node bin/generator.js client component --name="MetricsCard" --tag="metrics-card" --description="Key performance indicator card"
  ```

- [ ] **Create CampaignChart component**
  ```bash
  node bin/generator.js client component --name="CampaignChart" --tag="campaign-chart" --description="Campaign performance visualization"
  ```

## Phase 5: Integration Modules

### 5.1 Social Media Platform Integrations
- [ ] **Twitter/X API Integration**
  - OAuth 2.0 authentication
  - Tweet posting and scheduling
  - Engagement metrics collection
  - Direct message automation

- [ ] **Facebook API Integration**
  - Facebook Login integration
  - Page post management
  - Audience insights
  - Ad campaign integration

- [ ] **LinkedIn API Integration**
  - LinkedIn OAuth
  - Professional post publishing
  - Connection management
  - Company page management

- [ ] **Instagram API Integration**
  - Instagram Basic Display API
  - Story and post publishing
  - Hashtag analytics
  - Influencer identification

### 5.2 Email Service Integrations
- [ ] **SMTP Service Integration**
  - Multiple SMTP provider support
  - Email template rendering
  - Bounce and complaint handling
  - Delivery tracking

- [ ] **Email Service Provider APIs**
  - SendGrid integration
  - Mailgun integration
  - Amazon SES integration
  - Postmark integration

### 5.3 SMS Service Integrations
- [ ] **Twilio SMS Integration**
  - SMS sending and scheduling
  - Delivery status tracking
  - Two-way SMS conversations
  - Phone number management

- [ ] **Alternative SMS Providers**
  - MessageBird integration
  - Nexmo/Vonage integration
  - AWS SNS integration

### 5.4 AI Service Integrations
- [ ] **OpenAI Integration**
  - Content generation
  - Template optimization
  - Sentiment analysis
  - Response automation

- [ ] **Voice AI Integration**
  - Text-to-speech for phone calls
  - Speech recognition
  - Conversation AI
  - Call transcription

## Phase 6: Advanced Features

### 6.1 Automation & Workflows
- [ ] **Workflow Engine**
  - Visual workflow builder
  - Trigger-based automation
  - Conditional logic
  - Multi-step sequences

- [ ] **Lead Scoring System**
  - Behavioral scoring
  - Engagement tracking
  - Predictive analytics
  - Automated segmentation

### 6.2 AI-Powered Features
- [ ] **Content Optimization**
  - A/B testing framework
  - Performance prediction
  - Best time to send optimization
  - Subject line optimization

- [ ] **Personalization Engine**
  - Dynamic content insertion
  - Behavioral personalization
  - Predictive personalization
  - Cross-channel consistency

### 6.3 Advanced Analytics
- [ ] **Attribution Modeling**
  - Multi-touch attribution
  - Cross-channel tracking
  - Customer journey mapping
  - ROI calculation

- [ ] **Predictive Analytics**
  - Churn prediction
  - Lifetime value calculation
  - Conversion probability
  - Optimal timing prediction

## Phase 7: Testing & Quality Assurance

### 7.1 Backend Testing
- [ ] **Unit Tests for Controllers**
  - Campaign management tests
  - Contact management tests
  - Template management tests
  - Social media integration tests

- [ ] **Integration Tests**
  - API endpoint testing
  - Database integration tests
  - External service integration tests
  - Authentication and authorization tests

### 7.2 Frontend Testing
- [ ] **Component Testing**
  - Web component unit tests
  - User interaction tests
  - State management tests
  - Responsive design tests

- [ ] **End-to-End Testing**
  - Campaign creation flow
  - Contact import process
  - Social media posting
  - Analytics dashboard

### 7.3 Performance Testing
- [ ] **Load Testing**
  - Campaign execution performance
  - Database query optimization
  - API response times
  - Concurrent user handling

## Phase 8: Deployment & DevOps

### 8.1 Infrastructure Setup
- [ ] **Production Environment**
  - Supabase production setup
  - CDN configuration
  - SSL certificate setup
  - Domain configuration

### 8.2 Monitoring & Logging
- [ ] **Application Monitoring**
  - Error tracking
  - Performance monitoring
  - User analytics
  - System health checks

### 8.3 Security Implementation
- [ ] **Security Measures**
  - API rate limiting
  - Data encryption
  - GDPR compliance
  - Security headers

## Development Guidelines

### Using the Generator
- Always use the generator for consistent code structure
- Follow the established patterns for routes, controllers, and components
- Leverage Supabase migrations for all database changes
- Use the existing authentication and subscription middleware

### Code Quality
- Write tests for all new functionality
- Follow ESLint and Prettier configurations
- Use TypeScript-style JSDoc comments
- Implement proper error handling

### Database Best Practices
- Use UUIDs for all primary keys
- Implement proper foreign key constraints
- Add appropriate indexes for performance
- Use RLS (Row Level Security) for data protection

### API Design
- Follow RESTful conventions
- Use consistent response formats
- Implement proper HTTP status codes
- Add comprehensive API documentation

### Frontend Architecture
- Use web components for reusable UI elements
- Implement proper state management
- Follow accessibility guidelines
- Ensure responsive design

## Priority Order
1. **Phase 1**: Database schema (critical foundation)
2. **Phase 2**: Core API endpoints (campaign and contact management)
3. **Phase 3**: Basic frontend interfaces
4. **Phase 4**: Essential web components
5. **Phase 5**: Key integrations (email, SMS, basic social)
6. **Phase 6**: Advanced features and AI
7. **Phase 7**: Comprehensive testing
8. **Phase 8**: Production deployment

## Success Metrics
- Campaign creation and execution functionality
- Contact management and segmentation
- Multi-channel outreach capabilities
- Real-time analytics and reporting
- User engagement and retention
- Platform performance and reliability