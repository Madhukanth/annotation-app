# Supabase Quick Start

## TL;DR - Get Running in 10 Minutes

### 1. Create Supabase Project
Go to [supabase.com](https://supabase.com) → New Project → Save your credentials

### 2. Update Environment Variables

**server/.env:**
```env
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**client/.env:** (already configured, verify it matches)
```env
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Create Database Tables
In Supabase Dashboard → SQL Editor → Run these files in order:

1. `server/supabase/schema.sql` (creates all tables)
2. `supabase/migrations/003_rls_write_policies.sql` (security policies)
3. `supabase/migrations/004_rpc_functions.sql` (helper functions)

### 4. Migrate Your Data
```bash
cd server
pnpm migrate:supabase
```

### 5. Start the App
```bash
# Terminal 1
cd server && pnpm dev

# Terminal 2
cd client && pnpm dev
```

### 6. Test Login
Use your existing MongoDB user credentials - they should work!

---

## Authentication Changes

**Old way (your server):**
```javascript
const response = await axios.post('/api/v1/auth/login', { email, password })
localStorage.setItem('token', response.data.token)
```

**New way (Supabase):**
```javascript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
// Session automatically managed!
```

---

## Data Fetching Changes

**Old way:**
```javascript
const projects = await axios.get('/api/v1/orgs/{orgId}/projects')
```

**New way:**
```javascript
import { supabase } from '@/lib/supabase'

const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('org_id', orgId)
```

Or use the service layer:
```javascript
import { getProjects } from '@/services/supabase/projects.service'

const projects = await getProjects(orgId)
```

---

## What's Still Using Express?

The server is still needed for:
- **File uploads** (AWS S3 / Azure Blob presigned URLs)
- **Video processing** (frame extraction, thumbnail generation)
- **Exports** (JSON, CSV exports)

These routes still work through your Express server.

---

## Files You Need to Know

| File | What It Does |
|------|--------------|
| `client/src/lib/supabase.ts` | Supabase client setup |
| `client/src/services/supabase/` | Data access functions |
| `client/src/hooks/` | React Query hooks |
| `server/supabase/schema.sql` | Database schema |
| `server/supabase/migrate.ts` | Migration script |

---

## Common Issues

**"Invalid login credentials"**
→ User might not exist in Supabase Auth yet. Run migration first.

**"permission denied for table"**
→ RLS blocking access. Check user is in correct org/project.

**Data not loading**
→ Check browser console. Verify Supabase URL/key in .env.
