# Supabase Migration Guide

This guide walks you through migrating your annotation platform from MongoDB/Express to Supabase.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Create Supabase Project](#2-create-supabase-project)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Create Database Tables](#4-create-database-tables)
5. [Set Up Authentication](#5-set-up-authentication)
6. [Run Data Migration](#6-run-data-migration)
7. [Verify Migration](#7-verify-migration)
8. [Switch to Supabase](#8-switch-to-supabase)

---

## 1. Prerequisites

Before starting, ensure you have:
- [ ] A Supabase account (free tier works)
- [ ] Your existing MongoDB database running and accessible
- [ ] Node.js installed
- [ ] The project dependencies installed (`pnpm install` in both client and server)

---

## 2. Create Supabase Project

### Step 2.1: Create Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `annotation-platform` (or your preferred name)
   - **Database Password**: Generate a strong password and **save it**
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

### Step 2.2: Get Your API Keys
1. In your Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values (you'll need them in Step 3):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...` (safe for client-side)
   - **service_role key**: `eyJhbGciOi...` (SECRET - server only)

---

## 3. Configure Environment Variables

### Step 3.1: Server Configuration
Edit `server/.env` and update these values:

```env
# Supabase Configuration (REPLACE with your actual values)
SUPABASE_URL="https://YOUR-PROJECT-ID.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Keep MongoDB for migration (can remove after migration)
DATABASE_URL="mongodb://localhost:27017/annotation"
```

### Step 3.2: Client Configuration
Edit `client/.env`:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-ID.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
VITE_SERVER_ENDPOINT="http://localhost:4050/api/v1"
```

---

## 4. Create Database Tables

You need to run SQL to create all the tables. There are **two options**:

### Option A: Using Supabase Dashboard (Recommended for First Time)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy and paste the contents of `server/supabase/schema.sql`
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. Wait for it to complete (should take ~10-30 seconds)

Then run the RLS policies and RPC functions:

7. Create another new query
8. Copy and paste contents of `supabase/migrations/003_rls_write_policies.sql`
9. Run it

10. Create another new query
11. Copy and paste contents of `supabase/migrations/004_rpc_functions.sql`
12. Run it

### Option B: Using Supabase CLI (For Automation)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
cd /path/to/annotation
supabase link --project-ref YOUR-PROJECT-ID

# Push migrations (if you set them up in supabase/migrations)
supabase db push
```

### Verify Tables Created
In Supabase Dashboard → **Table Editor**, you should see these tables:
- `users`
- `organizations`
- `projects`
- `project_data_managers`
- `project_reviewers`
- `project_annotators`
- `annotation_classes`
- `files`
- `file_tags`
- `shapes`
- `comments`
- `comment_files`
- `actions`
- `invitations`
- `migration_id_mapping`

**Note:** Organization membership is derived from project role assignments (data_managers, reviewers, annotators). There is no separate `organization_users` table.

---

## 5. Set Up Authentication

Supabase Auth replaces your custom JWT authentication. Here's how to configure it:

### Step 5.1: Configure Auth Settings
1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email settings:
   - **Enable email confirmations**: OFF (for development, ON for production)
   - **Minimum password length**: 6

### Step 5.2: Configure Auth URL Settings
1. Go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:5173` (your frontend URL)
   - **Redirect URLs**: Add `http://localhost:5173/**`

### Step 5.3: How Auth Works Now

**Before (MongoDB/Express):**
```javascript
// Login returned a JWT from your server
const response = await axios.post('/auth/login', { email, password })
const token = response.data.token
```

**After (Supabase):**
```javascript
// Login uses Supabase Auth directly
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
// Session is automatically managed
```

### Step 5.4: Update Login Form (Already Done)
Your `LoginForm.tsx` should use Supabase auth. Check if it has:

```typescript
import { supabase } from '@/lib/supabase'

// In login handler:
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

### Step 5.5: Auth State Management
The user session is automatically persisted. To get current user:

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // User is logged in
  } else {
    // User is logged out
  }
})
```

---

## 6. Run Data Migration

The migration script transfers all your MongoDB data to Supabase.

### Step 6.1: Ensure MongoDB is Running
```bash
# Check MongoDB is accessible
mongosh --eval "db.stats()"
```

### Step 6.2: Install Migration Dependencies
```bash
cd server
pnpm install
```

### Step 6.3: Run the Migration Script
```bash
# From the server directory
npx ts-node supabase/migrate.ts
```

Or add this to `server/package.json` scripts:
```json
{
  "scripts": {
    "migrate:supabase": "ts-node supabase/migrate.ts"
  }
}
```

Then run:
```bash
pnpm migrate:supabase
```

### Step 6.4: What the Migration Does

1. **Users**: Migrates all users, preserves password hashes
2. **Organizations**: Creates orgs and user memberships
3. **Projects**: Migrates with role assignments (annotators, reviewers, data managers)
4. **Annotation Classes**: Migrates with project relationships
5. **Files**: Migrates with tags and metadata
6. **Shapes**: Migrates all shape annotations
7. **Comments**: Migrates with file associations
8. **Actions**: Migrates activity logs
9. **Invitations**: Migrates pending invitations

### Step 6.5: Expected Output
```
=== Starting MongoDB to Supabase Migration ===
Connected to MongoDB

Migrating users...
✓ Migrated 25 users

Migrating organizations...
✓ Migrated 5 organizations

Migrating projects...
✓ Migrated 12 projects

... (continues for all collections)

=== Migration Complete ===
Statistics:
  Users: 25
  Organizations: 5
  Projects: 12
  Files: 1,234
  Shapes: 5,678
  Comments: 890

Migration mappings saved to migration_id_mapping table
```

---

## 7. Verify Migration

### Step 7.1: Check Data in Supabase
1. Go to **Table Editor** in Supabase Dashboard
2. Click on each table and verify data exists
3. Check row counts match your MongoDB counts

### Step 7.2: Verify Relationships
Run this SQL in the SQL Editor:
```sql
-- Check user-organization relationships (via project membership)
SELECT DISTINCT u.email, o.name as org_name
FROM users u
JOIN project_data_managers pdm ON u.id = pdm.user_id
JOIN projects p ON p.id = pdm.project_id
JOIN organizations o ON o.id = p.org_id
LIMIT 10;

-- Check project-file relationships
SELECT p.name as project, COUNT(f.id) as file_count
FROM projects p
LEFT JOIN files f ON f.project_id = p.id
GROUP BY p.id
LIMIT 10;
```

### Step 7.3: Test Authentication
```sql
-- Check users have auth accounts
SELECT id, email, created_at
FROM auth.users
LIMIT 10;
```

---

## 8. Switch to Supabase

### Step 8.1: Start the Application
```bash
# Terminal 1: Start server
cd server
pnpm dev

# Terminal 2: Start client
cd client
pnpm dev
```

### Step 8.2: Test Key Flows
1. **Login**: Try logging in with an existing user
2. **View Projects**: Navigate to projects list
3. **View Files**: Open a project and check files load
4. **Annotate**: Create an annotation
5. **Comments**: Add a comment

### Step 8.3: Debugging

**If login fails:**
- Check Supabase Auth logs: Dashboard → Authentication → Logs
- Verify user exists in `auth.users` table
- Check password was migrated correctly

**If data doesn't load:**
- Check browser console for errors
- Verify RLS policies are not blocking access
- Check Network tab for API responses

**Disable RLS temporarily for debugging:**
```sql
-- ONLY FOR DEBUGGING - re-enable after!
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
```

---

## Quick Reference: API Changes

| Old (Express) | New (Supabase) |
|---------------|----------------|
| `axios.get('/projects')` | `supabase.from('projects').select()` |
| `axios.post('/auth/login')` | `supabase.auth.signInWithPassword()` |
| `axios.get('/files?projectId=x')` | `supabase.from('files').select().eq('project_id', x)` |
| JWT in headers | Automatic session management |
| MongoDB ObjectId | UUID |

---

## Troubleshooting

### "permission denied for table X"
RLS is blocking access. Either:
1. User isn't in the correct role
2. RLS policy is missing
3. Check the policy exists: Dashboard → Authentication → Policies

### "relation does not exist"
Tables weren't created. Re-run the schema SQL.

### "null value in column violates not-null"
Data migration had an issue. Check the migration_id_mapping table.

### Password login not working
The password hash migration uses a special RPC function. Verify:
```sql
SELECT * FROM users WHERE email = 'test@example.com';
-- Check password_hash field has a value
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/supabase/schema.sql` | Database tables, indexes, RLS read policies |
| `supabase/migrations/003_rls_write_policies.sql` | RLS write policies |
| `supabase/migrations/004_rpc_functions.sql` | PostgreSQL functions |
| `server/supabase/migrate.ts` | MongoDB → Supabase migration script |
| `client/src/lib/supabase.ts` | Supabase client configuration |
| `client/src/services/supabase/*.ts` | Data access layer |
| `client/src/hooks/*.ts` | React Query hooks for data fetching |

---

## Next Steps After Migration

1. **Remove MongoDB dependencies** from server once verified
2. **Update CI/CD** to not require MongoDB
3. **Set up Supabase backups** (automatic in paid plans)
4. **Configure production environment variables**
5. **Enable email confirmations** for production
6. **Set up custom SMTP** for emails (optional)
