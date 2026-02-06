# GET /api/incidents - Testing Guide

## Endpoint

```
GET http://localhost:3001/api/incidents
```

## Authentication

Uses GitHub OAuth JWT (same as dashboard). You must be logged in.

## Query Parameters

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `repo` | ✅ Yes | string | - | Repository in "owner/repo" format |
| `status` | ❌ No | string | "open" | Filter by status: "open" or "resolved" |
| `limit` | ❌ No | number | 50 | Number of results (1-100) |
| `offset` | ❌ No | number | 0 | Pagination offset |

---

## Test in Browser/Postman

### Step 1: Login to Get Session Cookie

1. Open browser: `http://localhost:3000`
2. Login with GitHub
3. Your session cookie is now set

### Step 2: Test in Browser

Simply navigate to:
```
http://localhost:3001/api/incidents?repo=Lancerhawk/Project-Rootly
```

### Step 3: Test in Postman

**Method**: `GET`  
**URL**: `http://localhost:3001/api/incidents?repo=Lancerhawk/Project-Rootly`

**Important**: Enable "Send cookies" in Postman settings, or copy the session cookie from your browser.

---

## Example Requests

### ✅ Get all open incidents (default)

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly
```

**Expected Response (200)**:
```json
{
  "incidents": [
    {
      "incident_id": "inc_xxx",
      "summary": "TypeError: Cannot read property 'id' of undefined",
      "status": "open",
      "environment": "production",
      "commit_sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      "occurred_at": "2026-02-06T05:40:00.000Z",
      "stack_trace": "TypeError: ...\n    at checkout.ts:42:10",
      "error_type": "TypeError"
    }
  ]
}
```

---

### ✅ Get resolved incidents

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly&status=resolved
```

---

### ✅ Pagination

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly&limit=10&offset=0
```

---

### ❌ Missing repo parameter

```
GET /api/incidents
```

**Expected Error (400)**:
```json
{
  "error": {
    "code": "MISSING_PARAMETER",
    "message": "repo query parameter is required"
  }
}
```

---

### ❌ Invalid status

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly&status=pending
```

**Expected Error (400)**:
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "status must be \"open\" or \"resolved\""
  }
}
```

---

### ❌ Repo not found or not owned

```
GET /api/incidents?repo=someone-else/repo
```

**Expected Error (404)**:
```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Repository not found or not owned by user"
  }
}
```

---

### ❌ Not authenticated

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly
```
(without session cookie)

**Expected Error (401)**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## Verification

After creating an incident via `POST /api/ingest`, you should be able to retrieve it via:

```
GET /api/incidents?repo=Lancerhawk/Project-Rootly
```

The incident you created should appear in the response!

---

## Notes

- Incidents are ordered by `occurred_at` DESC (newest first)
- Default limit is 50, maximum is 100
- Only returns incidents for projects owned by the authenticated user
- Session cookie is required (GitHub OAuth)
