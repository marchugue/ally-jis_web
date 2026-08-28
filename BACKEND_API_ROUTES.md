# Ally-jis Backend API Routes

Complete reference for building the backend. Every route includes **return types** and **SQL queries** mapped to `supabase/schema.sql`.

All frontend HTTP calls live in `src/api/client.ts`.

---

## Setup

```env
# Frontend .env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Conventions

| Item | Rule |
|------|------|
| Base URL | `{VITE_API_BASE_URL}` → e.g. `http://localhost:3001/api` |
| Auth header | `Authorization: Bearer <accessToken>` on protected routes |
| Content-Type | `application/json` (except multipart upload) |
| Response wrapper | Optional `{ "data": T }` — frontend unwraps automatically |
| Errors | `{ "message": string }` + HTTP status (`400`, `401`, `404`, `409`, `500`) |
| Empty success | `204 No Content` for `void` return types |

### Placeholders used in SQL

| Placeholder | Meaning |
|-------------|---------|
| `:current_user_id` | UUID from JWT / session |
| `:param` | Route param or request body field |

---

## Shared return types

These match `src/api/client.ts` interfaces.

```typescript
// Auth
interface AuthUser {
  id: string;                    // uuid
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;           // ISO 8601
}

interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;            // unix timestamp (seconds)
}

// Profiles
interface ProfileRow {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests?: string[];
  organizations?: string[];
  created_at?: string;
}

interface UsernameAvailability {
  available: boolean;
}

// Lookups
interface LookupOrganization { name: string; sort_order: number | null; }
interface LookupDepartment   { id: string; name: string; sort_order: number | null; }
interface LookupCourse       { name: string; department_id: string | null; sort_order: number | null; }
interface LookupInterest     { name: string; category: string; color: string; sort_order: number | null; }

interface LookupsResponse {
  organizations: LookupOrganization[];
  departments: LookupDepartment[];
  courses: LookupCourse[];
  interests: LookupInterest[];
}

// Interactions
type InteractionStatus = 'pending' | 'accepted' | 'rejected';

interface InteractionRow {
  user_id: string;
  target_user_id: string;
  status: InteractionStatus;
  accepted_at?: string | null;
}

interface AcceptConnectionResponse {
  conversationId: string;
}

interface ConnectionStatusResponse {
  status: InteractionStatus | null;
}

// Conversations & messages
interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
  created_at: string;
}

interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  profiles?: ProfileRow | ProfileRow[];
}

interface ConversationRow {
  id: string;
  updated_at: string;
  messages?: MessageRow[];
  conversation_members?: ConversationMemberRow[];
}

interface ConversationIdResponse {
  conversationId: string;
}

interface ConversationWithUserResponse {
  conversationId: string | null;
}

interface ConversationMembershipRow {
  conversation_id: string;
  last_read_at?: string | null;
}

// Notifications
interface NotificationRow {
  id: string;
  user_id: string;
  type: 'friend_request' | 'accepted' | 'message' | 'match' | string;
  title: string;
  description?: string | null;
  is_read: boolean;
  from_user_id?: string | null;
  created_at: string;
}

// Media & presence
interface MediaUploadResponse {
  url: string;
}

interface OnlineUsersResponse {
  userIds: string[];
}
```

---

## Auth

### `POST /auth/login`

| | |
|---|---|
| **Auth** | No |
| **Request body** | `{ email: string; password: string }` |
| **Return type** | `AuthSession` |
| **HTTP** | `200` on success, `401` invalid credentials |

**SQL / logic**

```sql
-- 1. Verify credentials against auth.users (or your users table)
--    Use bcrypt.compare(password, encrypted_password) — not raw SQL.

SELECT id, email, created_at
FROM auth.users
WHERE email = :email
  AND encrypted_password = crypt(:password, encrypted_password);
-- If using custom users table, adapt accordingly.

-- 2. Optionally load profile for user_metadata
SELECT id, email, username, full_name, avatar_url
FROM public.profiles
WHERE id = :user_id;
```

**Response example**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "student@chmsu.edu.ph",
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1735689600
}
```

---

### `POST /auth/register`

| | |
|---|---|
| **Auth** | No |
| **Request body** | `RegisterPayload` (see client.ts) |
| **Return type** | `AuthSession` |
| **HTTP** | `201` created, `409` email/username taken |

**Request body type**

```typescript
interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  bio?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests: string[];
  organizations: string[];
  avatar_url?: string | null;
}
```

**SQL / logic**

```sql
-- 1. Insert auth user (app layer — Supabase Auth or your own)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (gen_random_uuid(), :email, crypt(:password, gen_salt('bf')), now())
RETURNING id, email, created_at;

-- 2. Insert profile (mirrors handle_new_user trigger in schema.sql)
INSERT INTO public.profiles (
  id, email, username, full_name, avatar_url, bio,
  department, course, year_level, interests, organizations
)
VALUES (
  :new_user_id,
  :email,
  lower(:username),
  lower(:username),
  :avatar_url,
  :bio,
  :department,
  :course,
  :year_level,
  :interests::text[],
  :organizations::text[]
)
RETURNING *;

-- 3. Pre-check username (optional, same as check-username route)
SELECT id FROM public.profiles
WHERE lower(username) = lower(:username)
LIMIT 1;
-- If row exists → return 409
```

**Response:** Same as `AuthSession` from login.

---

### `POST /auth/logout`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | none |
| **Return type** | `void` |
| **HTTP** | `204 No Content` |

**SQL / logic**

```sql
-- Optional: invalidate refresh token / session row
DELETE FROM public.sessions
WHERE user_id = :current_user_id AND token = :access_token;
```

---

### `GET /auth/session`

| | |
|---|---|
| **Auth** | Yes (Bearer token) |
| **Return type** | `AuthSession` |
| **HTTP** | `200`, or `401` if token invalid |

**SQL / logic**

```sql
-- Validate JWT → extract :current_user_id, then:
SELECT id, email, created_at
FROM auth.users
WHERE id = :current_user_id;
```

**Response:** `AuthSession` with same `accessToken` from header (or rotated token).

---

## Profiles

### `GET /profiles/me`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `ProfileRow` |
| **HTTP** | `200`, `404` if no profile |

**SQL**

```sql
SELECT
  id, email, full_name, username, avatar_url, bio,
  department, course, year_level, interests, organizations, created_at
FROM public.profiles
WHERE id = :current_user_id;
```

---

### `GET /profiles/:userId`

| | |
|---|---|
| **Auth** | Yes |
| **Params** | `userId` — uuid |
| **Return type** | `ProfileRow` |
| **HTTP** | `200`, `404` |

**SQL**

```sql
SELECT
  id, email, full_name, username, avatar_url, bio,
  department, course, year_level, interests, organizations, created_at
FROM public.profiles
WHERE id = :userId;
```

---

### `GET /profiles?exclude={userId}`

| | |
|---|---|
| **Auth** | Yes |
| **Query** | `exclude` — uuid to omit (usually current user) |
| **Return type** | `ProfileRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT
  id, email, full_name, username, avatar_url, bio,
  department, course, year_level, interests, organizations, created_at
FROM public.profiles
WHERE id != COALESCE(:exclude, '00000000-0000-0000-0000-000000000000'::uuid)
ORDER BY created_at DESC;
```

---

### `POST /profiles/batch`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ ids: string[] }` |
| **Return type** | `ProfileRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT
  id, email, full_name, username, avatar_url, bio,
  department, course, year_level, interests, organizations, created_at
FROM public.profiles
WHERE id = ANY(:ids::uuid[]);
```

---

### `PATCH /profiles/me`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `Partial<UpdateProfilePayload>` |
| **Return type** | `ProfileRow` |
| **HTTP** | `200`, `409` username taken |

**Request body type**

```typescript
interface UpdateProfilePayload {
  full_name?: string;
  username?: string;
  bio?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests?: string[];
  organizations?: string[];
}
```

**SQL**

```sql
-- Optional uniqueness check
SELECT id FROM public.profiles
WHERE lower(username) = lower(:username)
  AND id != :current_user_id
LIMIT 1;

-- Update (updated_at set by trigger set_profiles_updated_at)
UPDATE public.profiles
SET
  full_name     = COALESCE(:full_name, full_name),
  username      = COALESCE(lower(:username), username),
  bio           = :bio,
  avatar_url    = :avatar_url,
  department    = :department,
  course        = :course,
  year_level    = :year_level,
  interests     = COALESCE(:interests, interests),
  organizations = COALESCE(:organizations, organizations)
WHERE id = :current_user_id
RETURNING
  id, email, full_name, username, avatar_url, bio,
  department, course, year_level, interests, organizations, created_at;
```

---

### `DELETE /profiles/me`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
-- Cascades to profiles, interactions, messages, etc. via FK
DELETE FROM auth.users
WHERE id = :current_user_id;

-- Or if not using auth.users cascade:
DELETE FROM public.profiles
WHERE id = :current_user_id;
```

---

### `GET /profiles/check-username?username=x&excludeId=y`

| | |
|---|---|
| **Auth** | Optional |
| **Query** | `username` (required), `excludeId` (optional uuid) |
| **Return type** | `UsernameAvailability` → `{ available: boolean }` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE lower(username) = lower(:username)
    AND (:excludeId IS NULL OR id != :excludeId::uuid)
) AS taken;

-- Return: { "available": NOT taken }
```

---

## Lookups

### `GET /lookups`

| | |
|---|---|
| **Auth** | No |
| **Return type** | `LookupsResponse` |
| **HTTP** | `200` |

**SQL** (run in parallel)

```sql
SELECT name, sort_order
FROM public.organizations
ORDER BY sort_order ASC NULLS LAST, name ASC;

SELECT id, name, sort_order
FROM public.departments
ORDER BY sort_order ASC NULLS LAST, name ASC;

SELECT name, department_id, sort_order
FROM public.courses
ORDER BY sort_order ASC NULLS LAST, name ASC;

SELECT name, category, color, sort_order
FROM public.interests
ORDER BY category ASC, sort_order ASC NULLS LAST, name ASC;
```

**Response example**

```json
{
  "organizations": [{ "name": "CSS", "sort_order": 1 }],
  "departments": [{ "id": "uuid", "name": "College of Computer Studies", "sort_order": 1 }],
  "courses": [{ "name": "Information Technology", "department_id": "uuid", "sort_order": 1 }],
  "interests": [{ "name": "Coding", "category": "Technology", "color": "blue", "sort_order": 1 }]
}
```

---

## Interactions

### `GET /interactions`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `InteractionRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT user_id, target_user_id, status, accepted_at
FROM public.user_interactions
WHERE user_id = :current_user_id;
```

---

### `POST /interactions/incoming`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ requesterIds: string[] }` |
| **Return type** | `InteractionRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT user_id, target_user_id, status, accepted_at
FROM public.user_interactions
WHERE target_user_id = :current_user_id
  AND user_id = ANY(:requesterIds::uuid[]);
```

---

### `POST /interactions/request`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ targetUserId: string }` |
| **Return type** | `void` |
| **HTTP** | `204`, `409` if already exists |

**SQL**

```sql
-- 1. Upsert interaction (requester → target)
INSERT INTO public.user_interactions (user_id, target_user_id, status, accepted_at)
VALUES (:current_user_id, :targetUserId, 'pending', NULL)
ON CONFLICT (user_id, target_user_id)
DO UPDATE SET status = 'pending', accepted_at = NULL;

-- 2. Notify target user
INSERT INTO public.notifications (user_id, type, title, description, from_user_id)
VALUES (
  :targetUserId,
  'friend_request',
  'New Connection Request',
  'Someone wants to connect with you! Check your requests to accept.',
  :current_user_id
);
```

---

### `POST /interactions/accept`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ requesterId: string }` |
| **Return type** | `AcceptConnectionResponse` → `{ conversationId: string }` |
| **HTTP** | `200` |

**SQL** (equivalent to `accept_connection()` in schema.sql — run in a transaction)

```sql
BEGIN;

-- 1. Mark requester's row accepted
UPDATE public.user_interactions
SET status = 'accepted', accepted_at = now()
WHERE user_id = :requesterId
  AND target_user_id = :current_user_id;

-- 2. Upsert reverse row (current user → requester)
INSERT INTO public.user_interactions (user_id, target_user_id, status, accepted_at)
VALUES (:current_user_id, :requesterId, 'accepted', now())
ON CONFLICT (user_id, target_user_id)
DO UPDATE SET status = 'accepted', accepted_at = now();

-- 3. Find shared conversation (get_shared_conversation)
SELECT m1.conversation_id
INTO :conv_id
FROM public.conversation_members m1
JOIN public.conversation_members m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.user_id = :current_user_id
  AND m2.user_id = :requesterId
LIMIT 1;

-- 4. Create conversation if none
INSERT INTO public.conversations (created_at, updated_at)
VALUES (now(), now())
RETURNING id INTO :conv_id;
-- (skip insert if :conv_id already found)

-- 5. Add both members
INSERT INTO public.conversation_members (conversation_id, user_id)
VALUES (:conv_id, :current_user_id), (:conv_id, :requesterId)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 6. Notify requester
INSERT INTO public.notifications (user_id, type, title, description, from_user_id)
VALUES (
  :requesterId,
  'accepted',
  'Request Accepted!',
  'Your connection request was accepted. You can now message each other.',
  :current_user_id
);

COMMIT;

-- Return: { "conversationId": ":conv_id" }
```

---

### `POST /interactions/reject`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ targetUserId: string }` |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
INSERT INTO public.user_interactions (user_id, target_user_id, status, accepted_at)
VALUES (:current_user_id, :targetUserId, 'rejected', NULL)
ON CONFLICT (user_id, target_user_id)
DO UPDATE SET status = 'rejected', accepted_at = NULL;
```

---

### `GET /interactions/status/:targetUserId`

| | |
|---|---|
| **Auth** | Yes |
| **Params** | `targetUserId` — uuid |
| **Return type** | `ConnectionStatusResponse` → `{ status: InteractionStatus \| null }` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT status
FROM public.user_interactions
WHERE user_id = :current_user_id
  AND target_user_id = :targetUserId
LIMIT 1;

-- Return { "status": row.status } or { "status": null }
```

---

## Conversations

### `GET /conversations`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `ConversationRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
-- Step 1: conversation IDs for current user
SELECT conversation_id
FROM public.conversation_members
WHERE user_id = :current_user_id;

-- Step 2: conversations with nested data (app may join in code or use JSON aggregation)
SELECT
  c.id,
  c.updated_at,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', m.id,
          'conversation_id', m.conversation_id,
          'sender_id', m.sender_id,
          'content', m.content,
          'image_url', m.image_url,
          'created_at', m.created_at
        ) ORDER BY m.created_at ASC
      )
      FROM public.messages m
      WHERE m.conversation_id = c.id
    ),
    '[]'::json
  ) AS messages,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'conversation_id', cm.conversation_id,
          'user_id', cm.user_id,
          'last_read_at', cm.last_read_at,
          'profiles', json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'username', p.username,
            'avatar_url', p.avatar_url,
            'interests', p.interests
          )
        )
      )
      FROM public.conversation_members cm
      JOIN public.profiles p ON p.id = cm.user_id
      WHERE cm.conversation_id = c.id
    ),
    '[]'::json
  ) AS conversation_members
FROM public.conversations c
WHERE c.id IN (
  SELECT conversation_id
  FROM public.conversation_members
  WHERE user_id = :current_user_id
)
ORDER BY c.updated_at DESC;
```

---

### `GET /conversations/:id`

| | |
|---|---|
| **Auth** | Yes |
| **Params** | `id` — conversation uuid |
| **Return type** | `ConversationRow` |
| **HTTP** | `200`, `403` not a member, `404` |

**SQL**

```sql
-- Verify membership first
SELECT 1
FROM public.conversation_members
WHERE conversation_id = :id
  AND user_id = :current_user_id;

-- Then same SELECT as GET /conversations but WHERE c.id = :id
```

---

### `POST /conversations`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ targetUserId: string }` |
| **Return type** | `ConversationIdResponse` → `{ conversationId: string }` |
| **HTTP** | `200` |

**SQL** (equivalent to `get_or_create_conversation()`)

```sql
-- Find existing
SELECT m1.conversation_id
FROM public.conversation_members m1
JOIN public.conversation_members m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.user_id = :current_user_id
  AND m2.user_id = :targetUserId
LIMIT 1;

-- If null, create:
INSERT INTO public.conversations (updated_at)
VALUES (now())
RETURNING id;

INSERT INTO public.conversation_members (conversation_id, user_id)
VALUES (:new_conv_id, :current_user_id), (:new_conv_id, :targetUserId);
```

---

### `PATCH /conversations/:id/read`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ readAt: string }` — ISO timestamp |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
UPDATE public.conversation_members
SET last_read_at = COALESCE(:readAt::timestamptz, now())
WHERE conversation_id = :id
  AND user_id = :current_user_id;
```

---

### `GET /conversations/with-user/:otherUserId`

| | |
|---|---|
| **Auth** | Yes |
| **Params** | `otherUserId` — uuid |
| **Return type** | `ConversationWithUserResponse` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT m1.conversation_id
FROM public.conversation_members m1
JOIN public.conversation_members m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.user_id = :current_user_id
  AND m2.user_id = :otherUserId
LIMIT 1;

-- Return { "conversationId": "<uuid>" } or { "conversationId": null }
```

---

### `GET /conversations/memberships/me`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `ConversationMembershipRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT conversation_id, last_read_at
FROM public.conversation_members
WHERE user_id = :current_user_id;
```

---

## Messages

### `GET /conversations/:id/messages`

| | |
|---|---|
| **Auth** | Yes |
| **Params** | `id` — conversation uuid |
| **Return type** | `MessageRow[]` |
| **HTTP** | `200`, `403` |

**SQL**

```sql
-- Verify membership (same as GET /conversations/:id)

SELECT
  id, conversation_id, sender_id, content, image_url, created_at
FROM public.messages
WHERE conversation_id = :id
ORDER BY created_at ASC;
```

---

### `POST /conversations/:id/messages`

| | |
|---|---|
| **Auth** | Yes |
| **Request body** | `{ content: string \| null; imageUrl?: string \| null }` |
| **Return type** | `MessageRow` |
| **HTTP** | `201` |

**SQL**

```sql
-- Verify sender is member
SELECT 1 FROM public.conversation_members
WHERE conversation_id = :id AND user_id = :current_user_id;

INSERT INTO public.messages (conversation_id, sender_id, content, image_url)
VALUES (:id, :current_user_id, :content, :imageUrl)
RETURNING id, conversation_id, sender_id, content, image_url, created_at;

UPDATE public.conversations
SET updated_at = now()
WHERE id = :id;

-- Optional: notify other member
INSERT INTO public.notifications (user_id, type, title, description, from_user_id)
SELECT
  cm.user_id,
  'message',
  'New Message',
  COALESCE(:content, 'Sent a photo'),
  :current_user_id
FROM public.conversation_members cm
WHERE cm.conversation_id = :id
  AND cm.user_id != :current_user_id;
```

---

## Notifications

### `GET /notifications?limit=20`

| | |
|---|---|
| **Auth** | Yes |
| **Query** | `limit` — number (default 20) |
| **Return type** | `NotificationRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT id, user_id, type, title, description, is_read, from_user_id, created_at
FROM public.notifications
WHERE user_id = :current_user_id
ORDER BY created_at DESC
LIMIT :limit;
```

---

### `GET /notifications/friend-requests`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `NotificationRow[]` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT id, user_id, type, title, description, is_read, from_user_id, created_at
FROM public.notifications
WHERE user_id = :current_user_id
  AND type = 'friend_request'
ORDER BY created_at DESC;
```

---

### `PATCH /notifications/:id/read`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
UPDATE public.notifications
SET is_read = true
WHERE id = :id
  AND user_id = :current_user_id;
```

---

### `PATCH /notifications/read-all`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
UPDATE public.notifications
SET is_read = true
WHERE user_id = :current_user_id
  AND is_read = false;
```

---

## Media

### `POST /media/chat`

| | |
|---|---|
| **Auth** | Yes |
| **Request** | `multipart/form-data`, field name `file` |
| **Return type** | `MediaUploadResponse` → `{ url: string }` |
| **HTTP** | `201` |

**Storage logic** (not SQL — file upload to disk/S3/Supabase Storage)

```
Path pattern: chat-media/{current_user_id}/{timestamp}-{original_filename}
Public URL:   https://<cdn>/chat-media/{current_user_id}/{filename}
```

**Optional DB audit**

```sql
-- If you track uploads in DB (optional — not in current schema)
INSERT INTO public.chat_media (user_id, path, url, created_at)
VALUES (:current_user_id, :path, :url, now());
```

---

## Presence

> **Note:** Presence is not in `schema.sql`. Add this table for heartbeat support.

```sql
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx ON public.user_presence (last_seen_at);
```

### `POST /presence/heartbeat`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `void` |
| **HTTP** | `204` |

**SQL**

```sql
INSERT INTO public.user_presence (user_id, last_seen_at)
VALUES (:current_user_id, now())
ON CONFLICT (user_id)
DO UPDATE SET last_seen_at = now();
```

---

### `GET /presence/online`

| | |
|---|---|
| **Auth** | Yes |
| **Return type** | `OnlineUsersResponse` → `{ userIds: string[] }` |
| **HTTP** | `200` |

**SQL**

```sql
SELECT array_agg(user_id::text) AS user_ids
FROM public.user_presence
WHERE last_seen_at >= now() - interval '60 seconds';

-- Return: { "userIds": ["uuid-1", "uuid-2"] }
```

---

## Optional: server-side match scoring

The frontend computes match % client-side. If you want a DB endpoint later:

### `GET /matches` (not used by frontend today)

| **Return type** | `{ profile_id: string; shared_interests: string[]; match_percentage: number }[]` |

**SQL** (from `get_matches()` in schema.sql)

```sql
SELECT
  p.id AS profile_id,
  array(
    SELECT unnest(p.interests)
    INTERSECT
    SELECT unnest(me.interests)
  ) AS shared_interests,
  CASE
    WHEN array_length(me.interests, 1) > 0 THEN
      (array_length(
        array(
          SELECT unnest(p.interests)
          INTERSECT
          SELECT unnest(me.interests)
        ), 1
      )::float / array_length(me.interests, 1)::float) * 100
    ELSE 0
  END AS match_percentage
FROM public.profiles p
CROSS JOIN public.profiles me
WHERE me.id = :current_user_id
  AND p.id != :current_user_id
ORDER BY match_percentage DESC;
```

---

## Route → return type quick reference

| Method | Route | Return type |
|--------|-------|-------------|
| POST | `/auth/login` | `AuthSession` |
| POST | `/auth/register` | `AuthSession` |
| POST | `/auth/logout` | `void` |
| GET | `/auth/session` | `AuthSession` |
| GET | `/profiles/me` | `ProfileRow` |
| GET | `/profiles/:userId` | `ProfileRow` |
| GET | `/profiles?exclude=` | `ProfileRow[]` |
| POST | `/profiles/batch` | `ProfileRow[]` |
| PATCH | `/profiles/me` | `ProfileRow` |
| DELETE | `/profiles/me` | `void` |
| GET | `/profiles/check-username` | `UsernameAvailability` |
| GET | `/lookups` | `LookupsResponse` |
| GET | `/interactions` | `InteractionRow[]` |
| POST | `/interactions/incoming` | `InteractionRow[]` |
| POST | `/interactions/request` | `void` |
| POST | `/interactions/accept` | `AcceptConnectionResponse` |
| POST | `/interactions/reject` | `void` |
| GET | `/interactions/status/:targetUserId` | `ConnectionStatusResponse` |
| GET | `/conversations` | `ConversationRow[]` |
| GET | `/conversations/:id` | `ConversationRow` |
| POST | `/conversations` | `ConversationIdResponse` |
| PATCH | `/conversations/:id/read` | `void` |
| GET | `/conversations/with-user/:otherUserId` | `ConversationWithUserResponse` |
| GET | `/conversations/memberships/me` | `ConversationMembershipRow[]` |
| GET | `/conversations/:id/messages` | `MessageRow[]` |
| POST | `/conversations/:id/messages` | `MessageRow` |
| GET | `/notifications?limit=` | `NotificationRow[]` |
| GET | `/notifications/friend-requests` | `NotificationRow[]` |
| PATCH | `/notifications/:id/read` | `void` |
| PATCH | `/notifications/read-all` | `void` |
| POST | `/media/chat` | `MediaUploadResponse` |
| POST | `/presence/heartbeat` | `void` |
| GET | `/presence/online` | `OnlineUsersResponse` |

---

## Database tables

| Table | Purpose |
|-------|---------|
| `auth.users` | Authentication (Supabase) or your `users` table |
| `profiles` | User profiles |
| `user_interactions` | Connection requests |
| `notifications` | In-app notifications |
| `conversations` | Chat threads |
| `conversation_members` | Participants + `last_read_at` |
| `messages` | Chat messages |
| `organizations` | Lookup |
| `departments` | Lookup |
| `courses` | Lookup |
| `interests` | Lookup |
| `user_presence` | Online status (add for presence routes) |

Schema source: `supabase/schema.sql` · ERD: `erd.html`

---

## Frontend file map

| File | Role |
|------|------|
| `src/api/client.ts` | All HTTP calls + TypeScript return types |
| `src/lib/services/profileService.ts` | Profile mapping |
| `src/lib/services/chatService.ts` | Conversations & messages |
| `src/lib/services/interactionService.ts` | Connect / accept / reject |
| `src/lib/services/notificationService.ts` | Notifications |
| `src/context/AuthContext.tsx` | Session state |

---

## Test checklist

1. `POST /auth/register` → `POST /auth/login` → `GET /auth/session`
2. `GET /lookups` → `GET /profiles/check-username`
3. `GET /profiles/me` → `PATCH /profiles/me`
4. `GET /profiles?exclude=` on Discover → `POST /interactions/request`
5. `GET /notifications/friend-requests` → `POST /interactions/accept`
6. `POST /conversations` → `GET /conversations/:id/messages` → `POST /conversations/:id/messages`
7. `PATCH /conversations/:id/read`
8. `POST /media/chat`
9. `POST /presence/heartbeat` → `GET /presence/online`
