# UNICEF Redev — API Documentation

> **Version**: 1.0.0  
> **Last Updated**: March 2026  
> **Base URL**: `http://localhost:3002`  
> **CMS URL**: `http://localhost:5174`  
> **Website URL**: `http://localhost:3001`

---

## Table of Contents

- [1. API Reference](#1-api-reference)
  - [1.1 Authentication](#11-authentication)
  - [1.2 Auth Module](#12-auth-module)
  - [1.3 Users Module](#13-users-module)
  - [1.4 Roles Module](#14-roles-module)
  - [1.5 Permissions Module](#15-permissions-module)
  - [1.6 Pages Module](#16-pages-module)
  - [1.7 Donations / Articles Module](#17-donations--articles-module)
  - [1.8 Media Module](#18-media-module)
  - [1.9 Menus Module](#19-menus-module)
  - [1.10 Tags Module](#110-tags-module)
  - [1.11 Logos Module](#111-logos-module)
  - [1.12 Settings Module](#112-settings-module)
  - [1.13 Payments Module](#113-payments-module)
  - [1.14 Transactions Module](#114-transactions-module)
  - [1.15 Donor Portal Module](#115-donor-portal-module)
  - [1.16 Content Blocks Module](#116-content-blocks-module)
  - [1.17 Log Activity Module](#117-log-activity-module)
  - [1.18 Content / SEO Module](#118-content--seo-module)
  - [1.19 Reports Module](#119-reports-module)
  - [1.20 WebSocket: Editor Presence](#120-websocket-editor-presence)
- [2. Feature Workflows](#2-feature-workflows)
  - [2.1 CMS Login Flow](#21-cms-login-flow)
  - [2.2 Creating a Page with Visual Editor](#22-creating-a-page-with-visual-editor)
  - [2.3 Real-time Collaboration](#23-real-time-collaboration)
  - [2.4 Donation Flow (One-off)](#24-donation-flow-one-off)
  - [2.5 Donation Flow (Monthly)](#25-donation-flow-monthly)
  - [2.6 Donor Portal (Google OAuth)](#26-donor-portal-google-oauth)
  - [2.7 Media Upload & Tagging](#27-media-upload--tagging)
  - [2.8 User / Role / Permission Management](#28-user--role--permission-management)
- [3. Testing Guide](#3-testing-guide)
  - [3.1 Auth](#31-testing-auth)
  - [3.2 Users](#32-testing-users)
  - [3.3 Roles](#33-testing-roles)
  - [3.4 Permissions](#34-testing-permissions)
  - [3.5 Pages](#35-testing-pages)
  - [3.6 Donations / Articles](#36-testing-donations--articles)
  - [3.7 Media](#37-testing-media)
  - [3.8 Menus](#38-testing-menus)
  - [3.9 Tags](#39-testing-tags)
  - [3.10 Logos](#310-testing-logos)
  - [3.11 Settings](#311-testing-settings)
  - [3.12 Payments](#312-testing-payments)
  - [3.13 Transactions](#313-testing-transactions)
  - [3.14 Donor Portal](#314-testing-donor-portal)
  - [3.15 Content Blocks](#315-testing-content-blocks)
  - [3.16 Log Activity](#316-testing-log-activity)
  - [3.17 Content / SEO](#317-testing-content--seo)
  - [3.18 Reports](#318-testing-reports)
- [4. Feature Alignment Matrix](#4-feature-alignment-matrix)
- [5. Platform Recommendations](#5-platform-recommendations)
- [6. Environment Setup](#6-environment-setup)

---

## 1. API Reference

### 1.1 Authentication

All endpoints marked **Auth Required** expect a valid JWT token in the request header:

```
Authorization: Bearer <jwt_token>
```

**Obtaining a token:**

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@unicef.org", "password": "password123"}'
```

The response includes an `accessToken` field — use it as the Bearer token for all authenticated requests.

---

### 1.2 Auth Module

**Base path:** `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Authenticate with email & password |
| POST | `/register` | Public | Register a new account |
| GET | `/profile` | Required | Get current user profile |
| PATCH | `/profile` | Required | Update current user profile |
| POST | `/forgot-password` | Public | Request password reset email |
| POST | `/reset-password` | Public | Reset password with token |
| GET | `/google` | Public | Initiate Google OAuth flow |
| GET | `/google/callback` | Public | Google OAuth callback |
| POST | `/logout` | Required | Invalidate current session |

#### POST `/login`

Authenticate a user and receive a JWT token.

**Request:**

```json
{
  "email": "admin@unicef.org",
  "password": "password123"
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@unicef.org",
    "name": "Admin User",
    "role": { "id": 1, "title": "Super Admin" }
  }
}
```

#### POST `/register`

Create a new user account.

**Request:**

```json
{
  "email": "user@test.com",
  "password": "mypassword",
  "name": "Test User"
}
```

**Response `201`:** Returns user object with access token.

#### GET `/profile`

> Auth Required

Returns the authenticated user's profile including role and permissions.

#### PATCH `/profile`

> Auth Required

Update the authenticated user's own profile fields.

**Request:**

```json
{
  "name": "New Name",
  "phoneNumber": "081234567890",
  "address": "Jakarta",
  "city": "Jakarta",
  "postalCode": "12345",
  "region": "DKI Jakarta"
}
```

All fields are optional — send only the fields you want to update.

#### POST `/forgot-password`

Request a password reset token. The token is generated and (in production) sent via email.

**Request:**

```json
{
  "email": "admin@unicef.org"
}
```

#### POST `/reset-password`

Reset the password using a valid reset token.

**Request:**

```json
{
  "token": "<reset_token>",
  "password": "newpassword123"
}
```

#### GET `/google`

Redirects the user to the Google OAuth consent screen. Used by the donor portal for SSO login.

#### GET `/google/callback`

Handles the OAuth callback from Google. On success, redirects to the website with a JWT token appended as a query parameter (`?token=xxx`).

#### POST `/logout`

> Auth Required

Invalidates the current session. The client should also discard the stored token.

---

### 1.3 Users Module

**Base path:** `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List users (paginated, filterable) |
| GET | `/count` | Public | Total user count |
| GET | `/:id` | Public | Get user by ID |
| POST | `/` | Public | Create a new user |
| PATCH | `/:id` | Public | Update user |
| DELETE | `/:id` | Public | Soft-delete user (sets status=0) |
| PATCH | `/:id/role` | Public | Change user's role |

#### GET `/`

List users with optional filters.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Search by name or email |
| `status` | number | — | Filter by status (1 = active, 0 = inactive) |
| `roleId` | number | — | Filter by role |
| `limit` | number | `20` | Results per page |
| `offset` | number | `0` | Pagination offset |

**Example:**

```
GET /api/v1/users?search=admin&status=1&roleId=1&limit=20&offset=0
```

#### GET `/count`

Returns the total count of users, useful for pagination metadata.

#### GET `/:id`

Returns a single user by ID, including their role and permissions.

#### POST `/`

Create a new user.

**Request:**

```json
{
  "email": "new@user.com",
  "password": "password123",
  "name": "New User",
  "roleId": 1,
  "status": 1
}
```

#### PATCH `/:id`

Update an existing user. All fields are optional.

**Request:**

```json
{
  "name": "Updated Name",
  "email": "updated@user.com",
  "status": 1
}
```

#### DELETE `/:id`

Soft-deletes a user by setting `status=0`. The user record is preserved in the database.

#### PATCH `/:id/role`

Assign a different role to a user.

**Request:**

```json
{
  "roleId": 2
}
```

---

### 1.4 Roles Module

**Base path:** `/api/v1/roles`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all roles |
| GET | `/:id` | Public | Get role with permissions |
| POST | `/` | Public | Create a new role |
| PATCH | `/:id` | Public | Update role |
| DELETE | `/:id` | Public | Delete role (fails if users assigned) |
| PUT | `/:id/permissions` | Public | Set role permissions |

#### GET `/`

Returns all roles.

#### GET `/:id`

Returns a role with its assigned permissions.

#### POST `/`

Create a new role.

**Request:**

```json
{
  "title": "Content Manager",
  "name": "content-manager",
  "groupName": "content"
}
```

#### PATCH `/:id`

Update a role's metadata.

**Request:**

```json
{
  "title": "Updated Title"
}
```

#### DELETE `/:id`

Deletes a role. Returns an error if any users are still assigned to it.

#### PUT `/:id/permissions`

Replace all permissions for a role. Pass the full array of permission IDs.

**Request:**

```json
{
  "permissionIds": [1, 2, 3, 4]
}
```

---

### 1.5 Permissions Module

**Base path:** `/api/v1/permissions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List permissions (grouped by module) |
| POST | `/` | Public | Create a new permission |
| DELETE | `/:id` | Public | Delete a permission |

#### GET `/`

Returns all permissions grouped by module name (e.g., `pages`, `media`, `users`).

**Response example:**

```json
{
  "pages": [
    { "id": 1, "module": "pages", "action": "view" },
    { "id": 2, "module": "pages", "action": "create" },
    { "id": 3, "module": "pages", "action": "edit" },
    { "id": 4, "module": "pages", "action": "delete" }
  ],
  "media": [...]
}
```

#### POST `/`

Create a new permission entry.

**Request:**

```json
{
  "module": "donations",
  "action": "export"
}
```

#### DELETE `/:id`

Removes a permission entry by ID.

---

### 1.6 Pages Module

**Base path:** `/api/v1/pages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List pages (paginated, filterable) |
| GET | `/:id` | Public | Get page by ID |
| GET | `/by-slug/:slug` | Public | Get page by slug |
| POST | `/` | Public | Create a new page |
| PATCH | `/:id` | Public | Update page |
| POST | `/:id/duplicate` | Public | Duplicate a page |
| POST | `/:id/publish` | Public | Publish page (status → 2) |
| POST | `/:id/unpublish` | Public | Unpublish page |
| DELETE | `/:id` | Public | Delete page (204) |
| POST | `/:id/preview` | Public | Generate preview token |
| GET | `/:id/versions` | Public | List page versions |

#### GET `/`

List pages with optional filters.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Search in title/slug |
| `status` | number | — | 0 = draft, 1 = scheduled, 2 = published |
| `limit` | number | `20` | Results per page |
| `offset` | number | `0` | Pagination offset |

#### GET `/:id`

Returns a single page including its serialized `body` (JSON array of Craft.js blocks).

#### GET `/by-slug/:slug`

Fetch a page by its URL slug. Used by the public website for dynamic page rendering.

**Example:**

```
GET /api/v1/pages/by-slug/about-us
```

#### POST `/`

Create a new page.

**Request:**

```json
{
  "title": "About Us",
  "slug": "about-us",
  "description": "About page",
  "keywords": "about,unicef",
  "body": "[]"
}
```

- `body` is a JSON-stringified array of Craft.js serialized nodes.
- `status` defaults to `0` (draft).

#### PATCH `/:id`

Update page fields. Commonly used by the visual editor on save.

**Request:**

```json
{
  "title": "Updated Title",
  "body": "[{...blocks}]",
  "status": 1
}
```

#### POST `/:id/duplicate`

Creates a copy of the page with a new slug (appends `-copy` or a timestamp). Returns the new page object.

#### POST `/:id/publish`

Sets the page status to `2` (published). The page becomes accessible on the public website.

#### POST `/:id/unpublish`

Reverts the page to draft status.

#### DELETE `/:id`

Permanently deletes a page. Returns **204 No Content**.

#### POST `/:id/preview`

Generates a time-limited preview token for unpublished pages.

**Request:**

```json
{
  "expiresInMinutes": 60
}
```

**Response:**

```json
{
  "previewUrl": "http://localhost:3001/en/preview?token=abc123..."
}
```

#### GET `/:id/versions`

Returns the version history for a page. Each version contains a snapshot of the full `body` at save time, enabling rollback.

---

### 1.7 Donations / Articles Module

**Base path:** `/api/v1/donations`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all donation articles |
| GET | `/:id` | Public | Get article by ID |
| POST | `/` | Public | Create a donation article |
| PATCH | `/:id` | Public | Update article |
| DELETE | `/:id` | Public | Delete article |
| GET | `/:id/versions` | Public | List article versions |

#### POST `/`

Create a new donation article / campaign page.

**Request:**

```json
{
  "title": "Monthly Campaign",
  "slug": "monthly-campaign",
  "description": "Help children",
  "body": "[]",
  "status": 0,
  "donateType": 1
}
```

- `donateType`: `1` = monthly, `2` = one-off.
- `body`: Craft.js serialized JSON, same format as pages.

#### PATCH `/:id`

**Request:**

```json
{
  "title": "Updated Campaign"
}
```

#### GET `/:id/versions`

Returns version history for the article, same structure as page versions.

---

### 1.8 Media Module

**Base path:** `/api/v1/media`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List media (paginated, filterable) |
| GET | `/:id` | Public | Get media item by ID |
| GET | `/:id/download` | Public | Download original file |
| POST | `/upload` | Public | Upload a file |
| POST | `/embed` | Public | Create an embed entry |
| POST | `/:id/crop` | Public | Crop an image |
| PATCH | `/:id` | Public | Update media metadata |
| DELETE | `/:id` | Public | Delete media (204) |

#### GET `/`

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Search in title/filename |
| `mediaType` | string | — | Filter: `image`, `video`, `document`, `embed` |
| `limit` | number | `20` | Results per page |
| `offset` | number | `0` | Pagination offset |

#### POST `/upload`

Upload a file using multipart form data.

**curl example:**

```bash
curl -X POST http://localhost:3002/api/v1/media/upload \
  -F "file=@/path/to/image.jpg"
```

Images are automatically optimized through a Sharp pipeline and converted to WebP format.

#### POST `/embed`

Create an embed entry (e.g., YouTube video).

**Request:**

```json
{
  "url": "https://youtube.com/watch?v=xxx",
  "title": "Video Title"
}
```

#### POST `/:id/crop`

Crop an existing image. Creates a new cropped version.

**Request:**

```json
{
  "x": 0,
  "y": 0,
  "width": 400,
  "height": 300
}
```

#### PATCH `/:id`

Update media metadata (title, description).

**Request:**

```json
{
  "title": "New Title",
  "description": "Description"
}
```

#### DELETE `/:id`

Deletes the media item and its associated file. Returns **204 No Content**.

---

### 1.9 Menus Module

**Base path:** `/api/v1/menus`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List menus (hierarchical tree) |
| GET | `/flat` | Public | List menus (flat list) |
| GET | `/public` | Public | Public menus for website |
| GET | `/:id` | Public | Get menu by ID |
| POST | `/` | Public | Create a menu item |
| POST | `/bulk/publish` | Public | Bulk publish menus |
| POST | `/bulk/unpublish` | Public | Bulk unpublish menus |
| POST | `/bulk/delete` | Public | Bulk delete menus |
| PATCH | `/reorder` | Public | Reorder menu items |
| PATCH | `/:id` | Public | Update menu item |
| DELETE | `/:id` | Public | Delete menu item (204) |

#### GET `/`

Returns menus as a nested tree. Supports filters:

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in title |
| `status` | number | 1 = published, 0 = draft |
| `groupName` | string | Menu group (e.g., `main`, `footer`) |

#### GET `/flat`

Same filters as above but returns a flat list instead of a tree structure.

#### GET `/public`

Returns published menus for website consumption.

| Param | Type | Description |
|-------|------|-------------|
| `group` | string | Menu group name (e.g., `main`) |

#### POST `/`

Create a new menu item.

**Request:**

```json
{
  "title": "About",
  "slug": "about",
  "url": "/about",
  "parentId": 0,
  "groupName": "main",
  "status": 1,
  "ordering": 1
}
```

- `parentId`: set to `0` for top-level items, or an existing menu ID for children.

#### POST `/bulk/publish`

Publish multiple menu items at once.

**Request:**

```json
{
  "ids": [1, 2, 3]
}
```

#### POST `/bulk/unpublish`

Unpublish multiple menu items.

**Request:**

```json
{
  "ids": [1, 2, 3]
}
```

#### POST `/bulk/delete`

Delete multiple menu items.

**Request:**

```json
{
  "ids": [1, 2, 3]
}
```

#### PATCH `/reorder`

Reorder menu items by setting new ordering values.

**Request:**

```json
{
  "items": [
    { "id": 1, "ordering": 1 },
    { "id": 2, "ordering": 2 }
  ]
}
```

#### PATCH `/:id`

**Request:**

```json
{
  "title": "Updated Menu"
}
```

#### DELETE `/:id`

Deletes a menu item. Returns **204 No Content**.

---

### 1.10 Tags Module

**Base path:** `/api/v1/tags`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all tags |
| GET | `/:id` | Public | Get tag by ID |
| GET | `/:id/media` | Public | Media items with this tag |
| POST | `/` | Public | Create a tag |
| POST | `/media/:mediaId/assign` | Public | Assign tags to media |
| POST | `/media/:mediaId/remove` | Public | Remove tags from media |
| PATCH | `/:id` | Public | Update tag |
| DELETE | `/:id` | Public | Delete tag |

#### POST `/`

**Request:**

```json
{
  "title": "Environment",
  "slug": "environment"
}
```

#### POST `/media/:mediaId/assign`

Assign one or more tags to a media item.

**Request:**

```json
{
  "tagIds": [1, 2]
}
```

#### POST `/media/:mediaId/remove`

Remove tags from a media item.

**Request:**

```json
{
  "tagIds": [1]
}
```

#### PATCH `/:id`

**Request:**

```json
{
  "title": "Updated Tag"
}
```

---

### 1.11 Logos Module

**Base path:** `/api/v1/logos`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all logos (media items) |
| POST | `/upload` | Public | Upload a logo |

#### GET `/`

Returns all media items categorized as logos.

#### POST `/upload`

Upload a logo file with a language tag.

**Multipart form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The logo image file |
| `language` | string | Yes | Language code: `en`, `id`, `fr`, `es`, `ar`, `zh` |
| `parentId` | number | No | Parent logo ID (for variants) |

**curl example:**

```bash
curl -X POST http://localhost:3002/api/v1/logos/upload \
  -F "file=@/path/to/logo.png" \
  -F "language=en"
```

---

### 1.12 Settings Module

**Base path:** `/api/v1/settings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | Get all settings |
| GET | `/system-info` | Public | System information |
| GET | `/media` | Public | Media-specific settings |
| GET | `/:scope` | Public | Settings by scope |
| PATCH | `/` | Public | Update settings |

#### GET `/`

Returns all system settings as key-value pairs grouped by scope.

#### GET `/system-info`

Returns system information (Node version, database status, uptime, etc.).

#### GET `/media`

Returns media-related settings (max file size, allowed types, etc.).

#### GET `/:scope`

Returns settings filtered by scope name.

**Example:**

```
GET /api/v1/settings/general
```

#### PATCH `/`

Update one or more settings. Accepts an array of setting objects.

**Request:**

```json
{
  "settings": [
    {
      "scope": "general",
      "key": "site_name",
      "value": "UNICEF Indonesia"
    }
  ]
}
```

---

### 1.13 Payments Module

**Base path:** `/api/v1/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/charge` | Public | Create a payment charge |
| POST | `/notification` | Public | Midtrans webhook callback |
| GET | `/status/:refId` | Public | Check payment status |
| POST | `/cancel/:refId` | Public | Cancel a pending payment |

#### POST `/charge`

Initiate a payment through Midtrans Core API.

**Request:**

```json
{
  "amount": 250000,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@test.com",
  "phone": "081234567890",
  "paymentMethod": "bank_transfer",
  "bankCode": "bca",
  "campaignType": 2
}
```

| Field | Values |
|-------|--------|
| `paymentMethod` | `bank_transfer`, `gopay`, `qris` |
| `bankCode` | `bca`, `bni`, `bri`, `mandiri`, `permata` (for bank_transfer) |
| `campaignType` | `1` = monthly, `2` = one-off |

**Response `201`:**

```json
{
  "refId": "TXN-20260304-ABC123",
  "status": "pending",
  "paymentMethod": "bank_transfer",
  "vaNumber": "1234567890123",
  "bank": "bca",
  "amount": 250000,
  "expiryTime": "2026-03-05T12:00:00.000Z"
}
```

#### POST `/notification`

Midtrans server-to-server webhook. Do not call directly — Midtrans sends this automatically when payment status changes.

#### GET `/status/:refId`

Check the current status of a payment.

**Example:**

```
GET /api/v1/payments/status/TXN-20260304-ABC123
```

**Response:**

```json
{
  "refId": "TXN-20260304-ABC123",
  "status": "paid",
  "paidAt": "2026-03-04T13:45:00.000Z"
}
```

#### POST `/cancel/:refId`

Cancel a pending payment. Only works for payments still in `pending` status.

---

### 1.14 Transactions Module

**Base path:** `/api/v1/transactions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List transactions (paginated, filterable) |
| GET | `/stats` | Public | Aggregated statistics |
| GET | `/count` | Public | Total transaction count |
| GET | `/user/:userId` | Public | Transactions for a user |
| GET | `/:refId` | Public | Get transaction by reference ID |

#### GET `/`

List all transactions with filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in name/email/refId |
| `status` | number | 0 = pending, 1 = paid, 2 = failed, 3 = cancelled |
| `campaignType` | number | 1 = monthly, 2 = one-off |
| `dateFrom` | string | Start date (`YYYY-MM-DD`) |
| `dateTo` | string | End date (`YYYY-MM-DD`) |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

**Example:**

```
GET /api/v1/transactions?status=1&campaignType=2&dateFrom=2026-01-01&dateTo=2026-12-31&limit=20&offset=0
```

#### GET `/stats`

Returns aggregated donation statistics: totals, breakdowns by campaign type, monthly trends.

#### GET `/count`

Returns total transaction count.

#### GET `/user/:userId`

Returns all transactions belonging to a specific user.

#### GET `/:refId`

Returns a single transaction by its reference ID.

---

### 1.15 Donor Portal Module

**Base path:** `/api/v1/donor`

> All endpoints in this module require authentication via Google OAuth token.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Required | Get donor profile |
| PATCH | `/profile` | Required | Update donor profile |
| GET | `/donations` | Required | Donor's donation history |
| GET | `/donations/:refId` | Required | Single donation detail |
| GET | `/subscriptions` | Required | Active monthly subscriptions |
| POST | `/subscriptions/:refId/cancel` | Required | Cancel a subscription |
| GET | `/stats` | Required | Donor's donation stats |

#### GET `/profile`

Returns the authenticated donor's profile data.

#### PATCH `/profile`

Update donor profile fields.

**Request:**

```json
{
  "name": "Updated Name",
  "phoneNumber": "081234567890"
}
```

#### GET `/donations`

Returns the donor's donation history with filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | number | Filter by payment status |
| `dateFrom` | string | Start date |
| `dateTo` | string | End date |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

#### GET `/donations/:refId`

Returns full detail for a specific donation.

#### GET `/subscriptions`

Returns all active monthly donation subscriptions for the authenticated donor.

#### POST `/subscriptions/:refId/cancel`

Cancels a monthly subscription. Stops future retry attempts.

#### GET `/stats`

Returns the donor's aggregated stats (total donated, number of donations, etc.).

---

### 1.16 Content Blocks Module

**Base path:** `/api/v1/content-blocks`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all saved blocks |
| GET | `/:id` | Public | Get block by ID |
| POST | `/` | Public | Save a new block |
| PATCH | `/:id` | Public | Update a block |
| DELETE | `/:id` | Public | Delete a block |

Content blocks are reusable editor components that can be saved from the visual editor and inserted into any page.

#### POST `/`

Save a new reusable block.

**Request:**

```json
{
  "name": "Hero Template",
  "type": "EditorHero",
  "body": "{...serialized props}",
  "authorId": 1
}
```

- `type`: The Craft.js component type name.
- `body`: JSON-stringified props/children from the editor serialization.

#### PATCH `/:id`

**Request:**

```json
{
  "name": "Updated Name"
}
```

---

### 1.17 Log Activity Module

**Base path:** `/api/v1/log-activity`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List activity logs |
| GET | `/count` | Public | Total log count |

#### GET `/`

Returns system activity logs with filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `feature` | string | Filter by module (e.g., `pages`, `media`, `users`) |
| `action` | string | Filter by action (e.g., `create`, `update`, `delete`) |
| `userId` | number | Filter by user who performed the action |
| `dateFrom` | string | Start date |
| `dateTo` | string | End date |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

**Example:**

```
GET /api/v1/log-activity?feature=pages&action=create&userId=1&limit=20&offset=0
```

#### GET `/count`

Returns total count of activity logs (useful for pagination).

---

### 1.18 Content / SEO Module

**Base path:** `/api/v1/content`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sitemap.xml` | Public | Auto-generated XML sitemap |
| GET | `/robots.txt` | Public | Robots.txt file |
| GET | `/preview` | Public | Preview an unpublished page |

#### GET `/sitemap.xml`

Returns an auto-generated XML sitemap including all published pages.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `baseUrl` | string | The base URL for sitemap links (e.g., `https://unicef.org`) |

**Example:**

```
GET /api/v1/content/sitemap.xml?baseUrl=https://unicef.org
```

#### GET `/robots.txt`

Returns a generated `robots.txt` file.

#### GET `/preview`

Renders a preview of an unpublished page using a time-limited token.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `token` | string | Preview token from POST `/pages/:id/preview` |

---

### 1.19 Reports Module

**Base path:** `/api/v1/reports`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/export/pdf` | Public | Export donation report as PDF |
| GET | `/export/excel` | Public | Export donation report as Excel |

#### GET `/export/pdf`

Generate and download a PDF report of donations.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | string | Start date (`YYYY-MM-DD`) |
| `dateTo` | string | End date (`YYYY-MM-DD`) |

**Example:**

```
GET /api/v1/reports/export/pdf?dateFrom=2026-01-01&dateTo=2026-12-31
```

#### GET `/export/excel`

Generate and download an Excel report of donations. Same query parameters as the PDF export.

---

### 1.20 WebSocket: Editor Presence

**Namespace:** `/editor`  
**Transport:** Socket.IO

Real-time collaboration for the visual page editor. Multiple users editing the same page see each other's cursors and presence.

#### Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `presence:join` | Client → Server | `{ "pageId": "123", "userId": 1, "name": "Admin User" }` | Join a page editing session |
| `presence:users` | Server → Client | `[{ "userId": 1, "name": "Admin", "color": "#ef4444" }]` | Broadcast active users list |
| `cursor:move` | Client → Server | `{ "x": 150, "y": 320 }` | Report cursor position |
| `cursor:update` | Server → Client | `{ "clientId": "abc", "x": 150, "y": 320, "name": "Admin", "color": "#ef4444" }` | Broadcast cursor position to others |

#### Connection Example (Socket.IO client)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002/editor", {
  auth: { token: "Bearer <jwt_token>" },
});

socket.emit("presence:join", {
  pageId: "123",
  userId: 1,
  name: "Admin User",
});

socket.on("presence:users", (users) => {
  console.log("Active editors:", users);
});

socket.on("cursor:update", (data) => {
  // Render remote cursor at data.x, data.y
});

// Throttle cursor emissions to ~50ms
let lastEmit = 0;
document.addEventListener("mousemove", (e) => {
  if (Date.now() - lastEmit > 50) {
    socket.emit("cursor:move", { x: e.clientX, y: e.clientY });
    lastEmit = Date.now();
  }
});
```

---

## 2. Feature Workflows

### 2.1 CMS Login Flow

```
User                        CMS (React)                   API Server
 │                            │                              │
 │── Visit /login ──────────►│                              │
 │                            │── POST /auth/login ────────►│
 │                            │◄── { accessToken, user } ──│
 │                            │── Store token in           │
 │                            │   localStorage              │
 │◄── Redirect to /dashboard──│                              │
 │                            │                              │
 │── Any request ────────────►│── Authorization: Bearer ──►│
 │                            │◄── 200 OK ─────────────────│
 │                            │                              │
 │── Click Logout ───────────►│── POST /auth/logout ──────►│
 │                            │── Clear localStorage        │
 │◄── Redirect to /login ─────│                              │
```

**Step-by-step:**

1. Open the CMS at `http://localhost:5174`.
2. If not authenticated, the app redirects to `/login`.
3. Enter email and password → the CMS calls `POST /api/v1/auth/login`.
4. On success, the JWT token is stored in `localStorage`.
5. The user is redirected to `/dashboard`.
6. All subsequent API requests include the `Authorization: Bearer <token>` header.
7. Clicking **Logout** calls `POST /api/v1/auth/logout`, clears the token, and redirects to `/login`.

---

### 2.2 Creating a Page with Visual Editor

1. Navigate to **Pages** in the CMS sidebar.
2. Click **"Create Page"** to open the template picker.
3. Select a layout template (Landing Page, Campaign, Article, etc.) or start with a **Blank** page. The template populates initial blocks in the editor.
4. **Drag blocks** from the left sidebar (Toolbox) onto the canvas. Available blocks include Hero, Text, Image, Video, CTA Button, Columns, Spacer, and more.
5. **Click any block** to select it — the right panel displays its settings.
6. Adjust **style properties**: width, height, padding, margin, colors, font family, font size, font weight, text alignment, border radius, background color, etc.
7. Use **responsive preview** toggles in the toolbar (Desktop / Tablet / Mobile) to check layout at different breakpoints.
8. Click **"Save"** → triggers `POST /api/v1/pages` (new page) or `PATCH /api/v1/pages/:id` (existing page).
9. Click **"Preview"** → opens the page on the public website in a new tab using a preview token.
10. Click **"Publish"** → triggers `POST /api/v1/pages/:id/publish`, making the page live.
11. Click **"Versions"** → shows version history with timestamps and the ability to restore any previous version.

---

### 2.3 Real-time Collaboration

1. **User A** opens a page in the editor at `/pages/:id`.
2. **User B** opens the same page.
3. Both clients connect to the WebSocket `/editor` namespace.
4. Each sends a `presence:join` event with their `pageId`, `userId`, and `name`.
5. The server assigns a unique color to each user and broadcasts `presence:users` to all connected clients.
6. **Avatars** appear in the editor toolbar showing all active collaborators.
7. As users move their mouse, `cursor:move` events are emitted (throttled to every 50ms).
8. Other users see **colored cursor arrows** with name labels in real time.
9. When a user disconnects, their cursor and avatar disappear from all other clients.

---

### 2.4 Donation Flow (One-off)

1. A donor visits `http://localhost:3001/en/donate`.
2. Selects a **donation amount** and **payment method** (BCA Virtual Account, BNI VA, GoPay, QRIS, etc.).
3. Fills in personal info: first name, last name, email, phone number.
4. Clicks **"Donate"** → the website calls `POST /api/v1/payments/charge` with `campaignType: 2`.
5. **For bank_transfer:** a modal displays the VA number, bank name, total amount, and expiry time.
6. The donor pays through their banking app using the VA number.
7. Midtrans sends a webhook to `POST /api/v1/payments/notification`.
8. The API updates the transaction status to `paid`.
9. Back on the website, the donor clicks **"I've completed payment"** → the UI polls `GET /api/v1/payments/status/:refId` to show the updated status.

---

### 2.5 Donation Flow (Monthly)

1. Same initial flow as one-off, but the donor selects the **"Monthly"** toggle.
2. `campaignType: 1` is sent to the charge endpoint.
3. A transaction record is created with `campaignType: 1`.
4. If the payment is not completed within the expiry window, the **worker service** picks it up.
5. The worker's cron job runs every **5 minutes**, creating retry charges with refIds in the format `{refId}-retry-{cycleNumber}`.
6. Retries continue for a maximum of **24 hours**.
7. Once paid, the subscription is marked active. The donor can view and manage it in the Donor Portal.

---

### 2.6 Donor Portal (Google OAuth)

1. A donor visits `http://localhost:3001/en/donor/login`.
2. Clicks **"Login with Google"** → redirects to `GET /api/v1/auth/google`.
3. The user sees the **Google consent screen** and grants access.
4. Google redirects to `GET /api/v1/auth/google/callback`.
5. The server finds an existing user by Google email or creates a new one.
6. A JWT token is issued and the user is redirected to `/auth/callback?token=xxx` on the website.
7. The website stores the token in `localStorage`.
8. The donor can now access:
   - **Profile** — view/edit personal info
   - **Donation History** — paginated list of all donations
   - **Subscriptions** — view active monthly subscriptions, cancel if needed

---

### 2.7 Media Upload & Tagging

1. In the CMS, navigate to **Media** in the sidebar.
2. Click **"Upload"** to open the upload dialog.
3. Drag a file into the drop zone or click to select from the file picker.
4. The file is uploaded via `POST /api/v1/media/upload`. Images are automatically optimized (compressed, converted to WebP).
5. After upload, click on the media item to open the **detail sidebar**.
6. Edit the **title** and **description** → saved via `PATCH /api/v1/media/:id`.
7. **Assign tags:** select from existing tags or create new ones → `POST /api/v1/tags/media/:mediaId/assign` with tag IDs.
8. **Crop image:** use the crop tool → `POST /api/v1/media/:id/crop` with coordinates.

---

### 2.8 User / Role / Permission Management

1. **Create a User:**
   - CMS → **Users** → Click "Add User"
   - Fill in email, password, name, and select a role
   - `POST /api/v1/users`

2. **Create a Role:**
   - CMS → **Roles** → Click "Add Role"
   - Enter title, slug/name, and group name
   - `POST /api/v1/roles`

3. **Assign Permissions to a Role:**
   - CMS → **Roles** → Select a role → **Permissions tab**
   - Toggle permissions per module (e.g., `pages.view`, `pages.create`, `pages.edit`, `pages.delete`)
   - `PUT /api/v1/roles/:id/permissions` with the selected permission IDs

4. **Assign a Role to a User:**
   - CMS → **Users** → Select a user → Change role
   - `PATCH /api/v1/users/:id/role`

---

## 3. Testing Guide

### 3.1 Testing Auth

**Browser:**
Visit `http://localhost:5174` → enter `admin@unicef.org` / `password123` → should see the dashboard.

**Postman / curl:**

```bash
# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@unicef.org", "password": "password123"}'

# Get profile (use token from login response)
curl http://localhost:3002/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"

# Update profile
curl -X PATCH http://localhost:3002/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Updated Admin"}'

# Forgot password
curl -X POST http://localhost:3002/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@unicef.org"}'

# Logout
curl -X POST http://localhost:3002/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Verify:**
- Login returns `accessToken` and `user` object with role.
- Profile returns current user data.
- Profile update reflects changes on subsequent GET.
- Forgot password returns success message.
- Logout invalidates the token.

---

### 3.2 Testing Users

**Browser:**
Visit `http://localhost:5174/users` → should see user list with search, filter, and pagination.

**Postman / curl:**

```bash
# List users
curl "http://localhost:3002/api/v1/users?search=admin&status=1&limit=20&offset=0"

# Get user count
curl http://localhost:3002/api/v1/users/count

# Get single user
curl http://localhost:3002/api/v1/users/1

# Create user
curl -X POST http://localhost:3002/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "new@user.com", "password": "password123", "name": "New User", "roleId": 1, "status": 1}'

# Update user
curl -X PATCH http://localhost:3002/api/v1/users/2 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete user (soft delete)
curl -X DELETE http://localhost:3002/api/v1/users/2

# Change user role
curl -X PATCH http://localhost:3002/api/v1/users/2/role \
  -H "Content-Type: application/json" \
  -d '{"roleId": 2}'
```

**Verify:**
- List returns paginated user array with total count.
- Create returns the new user object.
- Delete sets status to 0 (user still in list with inactive filter).
- Role change reflects in the user's profile.

---

### 3.3 Testing Roles

**Browser:**
Visit `http://localhost:5174/roles` → should see roles list with permissions management.

**Postman / curl:**

```bash
# List roles
curl http://localhost:3002/api/v1/roles

# Get role with permissions
curl http://localhost:3002/api/v1/roles/1

# Create role
curl -X POST http://localhost:3002/api/v1/roles \
  -H "Content-Type: application/json" \
  -d '{"title": "Content Manager", "name": "content-manager", "groupName": "content"}'

# Update role
curl -X PATCH http://localhost:3002/api/v1/roles/2 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Role"}'

# Set permissions
curl -X PUT http://localhost:3002/api/v1/roles/2/permissions \
  -H "Content-Type: application/json" \
  -d '{"permissionIds": [1, 2, 3, 4]}'

# Delete role
curl -X DELETE http://localhost:3002/api/v1/roles/3
```

**Verify:**
- GET /:id includes `permissions` array.
- PUT permissions replaces all existing permissions.
- DELETE fails with error if users are assigned to the role.

---

### 3.4 Testing Permissions

**Browser:**
Visit `http://localhost:5174/roles` → click a role → Permissions tab shows grouped permissions.

**Postman / curl:**

```bash
# List all permissions
curl http://localhost:3002/api/v1/permissions

# Create permission
curl -X POST http://localhost:3002/api/v1/permissions \
  -H "Content-Type: application/json" \
  -d '{"module": "donations", "action": "export"}'

# Delete permission
curl -X DELETE http://localhost:3002/api/v1/permissions/10
```

**Verify:**
- GET returns permissions grouped by module.
- New permissions appear in the grouped response.

---

### 3.5 Testing Pages

**Browser:**
Visit `http://localhost:5174/pages` → should see page list. Click "Create Page" → template picker → editor.

**Postman / curl:**

```bash
# List pages
curl "http://localhost:3002/api/v1/pages?search=&status=0&limit=20&offset=0"

# Get page by ID
curl http://localhost:3002/api/v1/pages/1

# Get page by slug
curl http://localhost:3002/api/v1/pages/by-slug/about-us

# Create page
curl -X POST http://localhost:3002/api/v1/pages \
  -H "Content-Type: application/json" \
  -d '{"title": "About Us", "slug": "about-us", "description": "About page", "keywords": "about,unicef", "body": "[]"}'

# Update page
curl -X PATCH http://localhost:3002/api/v1/pages/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "status": 1}'

# Duplicate page
curl -X POST http://localhost:3002/api/v1/pages/1/duplicate

# Publish page
curl -X POST http://localhost:3002/api/v1/pages/1/publish

# Unpublish page
curl -X POST http://localhost:3002/api/v1/pages/1/unpublish

# Generate preview
curl -X POST http://localhost:3002/api/v1/pages/1/preview \
  -H "Content-Type: application/json" \
  -d '{"expiresInMinutes": 60}'

# Get versions
curl http://localhost:3002/api/v1/pages/1/versions

# Delete page
curl -X DELETE http://localhost:3002/api/v1/pages/1
```

**Verify:**
- Create returns page with `status: 0` (draft).
- Publish sets `status: 2`.
- Duplicate creates a new page with modified slug.
- Delete returns 204 No Content.
- Versions returns array of historical snapshots.
- By-slug returns the same page as by-ID.

---

### 3.6 Testing Donations / Articles

**Browser:**
Visit `http://localhost:5174/donations` → should see campaign/article list with editor.

**Postman / curl:**

```bash
# List donations
curl http://localhost:3002/api/v1/donations

# Get donation by ID
curl http://localhost:3002/api/v1/donations/1

# Create donation article
curl -X POST http://localhost:3002/api/v1/donations \
  -H "Content-Type: application/json" \
  -d '{"title": "Monthly Campaign", "slug": "monthly-campaign", "description": "Help children", "body": "[]", "status": 0, "donateType": 1}'

# Update donation article
curl -X PATCH http://localhost:3002/api/v1/donations/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Campaign"}'

# Get versions
curl http://localhost:3002/api/v1/donations/1/versions

# Delete donation article
curl -X DELETE http://localhost:3002/api/v1/donations/1
```

**Verify:**
- CRUD operations work end-to-end.
- Body field stores Craft.js serialized JSON.
- Versions track changes over time.

---

### 3.7 Testing Media

**Browser:**
Visit `http://localhost:5174/media` → should see media grid. Click "Upload" to test file uploads.

**Postman / curl:**

```bash
# List media
curl "http://localhost:3002/api/v1/media?search=&mediaType=image&limit=20&offset=0"

# Get media by ID
curl http://localhost:3002/api/v1/media/1

# Upload file
curl -X POST http://localhost:3002/api/v1/media/upload \
  -F "file=@/path/to/image.jpg"

# Create embed
curl -X POST http://localhost:3002/api/v1/media/embed \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": "Sample Video"}'

# Crop image
curl -X POST http://localhost:3002/api/v1/media/1/crop \
  -H "Content-Type: application/json" \
  -d '{"x": 0, "y": 0, "width": 400, "height": 300}'

# Update metadata
curl -X PATCH http://localhost:3002/api/v1/media/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title", "description": "Updated description"}'

# Download file
curl -O http://localhost:3002/api/v1/media/1/download

# Delete media
curl -X DELETE http://localhost:3002/api/v1/media/1
```

**Verify:**
- Upload returns media object with generated URL.
- Images are auto-optimized and converted to WebP.
- Crop creates a new version of the image.
- Download returns the original file.
- Delete returns 204 No Content.

---

### 3.8 Testing Menus

**Browser:**
Visit `http://localhost:5174/menus` → should see menu table with drag-to-reorder and bulk actions.

**Postman / curl:**

```bash
# List menus (tree)
curl "http://localhost:3002/api/v1/menus?groupName=main&status=1"

# List menus (flat)
curl "http://localhost:3002/api/v1/menus/flat?groupName=main"

# Public menus (for website)
curl "http://localhost:3002/api/v1/menus/public?group=main"

# Get menu by ID
curl http://localhost:3002/api/v1/menus/1

# Create menu
curl -X POST http://localhost:3002/api/v1/menus \
  -H "Content-Type: application/json" \
  -d '{"title": "About", "slug": "about", "url": "/about", "parentId": 0, "groupName": "main", "status": 1, "ordering": 1}'

# Bulk publish
curl -X POST http://localhost:3002/api/v1/menus/bulk/publish \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'

# Bulk unpublish
curl -X POST http://localhost:3002/api/v1/menus/bulk/unpublish \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'

# Bulk delete
curl -X POST http://localhost:3002/api/v1/menus/bulk/delete \
  -H "Content-Type: application/json" \
  -d '{"ids": [4, 5]}'

# Reorder menus
curl -X PATCH http://localhost:3002/api/v1/menus/reorder \
  -H "Content-Type: application/json" \
  -d '{"items": [{"id": 1, "ordering": 1}, {"id": 2, "ordering": 2}]}'

# Update menu
curl -X PATCH http://localhost:3002/api/v1/menus/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Menu"}'

# Delete menu
curl -X DELETE http://localhost:3002/api/v1/menus/1
```

**Verify:**
- Tree view returns nested children under parents.
- Flat view returns all items at the same level.
- Public endpoint only returns published items.
- Reorder updates ordering values.
- Bulk operations affect multiple records.

---

### 3.9 Testing Tags

**Browser:**
Visit `http://localhost:5174/tags` → should see tags list with CRUD.

**Postman / curl:**

```bash
# List tags
curl http://localhost:3002/api/v1/tags

# Get tag by ID
curl http://localhost:3002/api/v1/tags/1

# Get media for a tag
curl http://localhost:3002/api/v1/tags/1/media

# Create tag
curl -X POST http://localhost:3002/api/v1/tags \
  -H "Content-Type: application/json" \
  -d '{"title": "Environment", "slug": "environment"}'

# Assign tags to media
curl -X POST http://localhost:3002/api/v1/tags/media/1/assign \
  -H "Content-Type: application/json" \
  -d '{"tagIds": [1, 2]}'

# Remove tags from media
curl -X POST http://localhost:3002/api/v1/tags/media/1/remove \
  -H "Content-Type: application/json" \
  -d '{"tagIds": [1]}'

# Update tag
curl -X PATCH http://localhost:3002/api/v1/tags/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Tag"}'

# Delete tag
curl -X DELETE http://localhost:3002/api/v1/tags/1
```

**Verify:**
- Tag assignment links tags to media items.
- GET /:id/media returns media items with the tag.
- Removing tags breaks the association without deleting either record.

---

### 3.10 Testing Logos

**Browser:**
Visit `http://localhost:5174/logos` → should see logo gallery organized by language.

**Postman / curl:**

```bash
# List logos
curl http://localhost:3002/api/v1/logos

# Upload logo
curl -X POST http://localhost:3002/api/v1/logos/upload \
  -F "file=@/path/to/logo.png" \
  -F "language=en"
```

**Verify:**
- GET returns logos grouped or filterable by language.
- Upload associates the file with the specified language code.

---

### 3.11 Testing Settings

**Browser:**
Visit `http://localhost:5174/settings` → should see grouped settings with edit capability.

**Postman / curl:**

```bash
# Get all settings
curl http://localhost:3002/api/v1/settings

# Get system info
curl http://localhost:3002/api/v1/settings/system-info

# Get media settings
curl http://localhost:3002/api/v1/settings/media

# Get settings by scope
curl http://localhost:3002/api/v1/settings/general

# Update settings
curl -X PATCH http://localhost:3002/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{"settings": [{"scope": "general", "key": "site_name", "value": "UNICEF Indonesia"}]}'
```

**Verify:**
- Settings are grouped by scope.
- System info returns server details.
- Update persists changes visible on subsequent GET.

---

### 3.12 Testing Payments

**Browser:**
Visit `http://localhost:3001/en/donate` → fill in the form → submit to test the Midtrans flow.

**Postman / curl:**

```bash
# Create a charge
curl -X POST http://localhost:3002/api/v1/payments/charge \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250000,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@test.com",
    "phone": "081234567890",
    "paymentMethod": "bank_transfer",
    "bankCode": "bca",
    "campaignType": 2
  }'

# Check payment status
curl http://localhost:3002/api/v1/payments/status/TXN-20260304-ABC123

# Cancel payment
curl -X POST http://localhost:3002/api/v1/payments/cancel/TXN-20260304-ABC123
```

**Verify:**
- Charge returns `refId`, VA number (for bank_transfer), and expiry time.
- Status endpoint reflects current payment state.
- Cancel only works on pending payments.
- Midtrans notification webhook updates status automatically (test via Midtrans dashboard simulator).

---

### 3.13 Testing Transactions

**Browser:**
Visit `http://localhost:5174/transactions` → should see transaction list with filters and search.

**Postman / curl:**

```bash
# List transactions
curl "http://localhost:3002/api/v1/transactions?status=1&campaignType=2&dateFrom=2026-01-01&dateTo=2026-12-31&limit=20&offset=0"

# Get stats
curl http://localhost:3002/api/v1/transactions/stats

# Get count
curl http://localhost:3002/api/v1/transactions/count

# Get user transactions
curl http://localhost:3002/api/v1/transactions/user/1

# Get by reference ID
curl http://localhost:3002/api/v1/transactions/TXN-20260304-ABC123
```

**Verify:**
- List supports pagination and multi-field filtering.
- Stats returns aggregated totals and breakdowns.
- User endpoint returns transactions scoped to a specific user.

---

### 3.14 Testing Donor Portal

**Browser:**
Visit `http://localhost:3001/en/donor/login` → login with Google → access profile, donations, subscriptions.

**Postman / curl:**

```bash
# Get donor profile (requires donor JWT)
curl http://localhost:3002/api/v1/donor/profile \
  -H "Authorization: Bearer <donor_token>"

# Update donor profile
curl -X PATCH http://localhost:3002/api/v1/donor/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <donor_token>" \
  -d '{"name": "Updated Name", "phoneNumber": "081234567890"}'

# Get donations
curl "http://localhost:3002/api/v1/donor/donations?status=1&limit=20&offset=0" \
  -H "Authorization: Bearer <donor_token>"

# Get donation detail
curl http://localhost:3002/api/v1/donor/donations/TXN-20260304-ABC123 \
  -H "Authorization: Bearer <donor_token>"

# Get subscriptions
curl http://localhost:3002/api/v1/donor/subscriptions \
  -H "Authorization: Bearer <donor_token>"

# Cancel subscription
curl -X POST http://localhost:3002/api/v1/donor/subscriptions/TXN-20260304-ABC123/cancel \
  -H "Authorization: Bearer <donor_token>"

# Get donor stats
curl http://localhost:3002/api/v1/donor/stats \
  -H "Authorization: Bearer <donor_token>"
```

**Verify:**
- All endpoints require valid donor JWT (obtained via Google OAuth).
- Profile returns and updates donor information.
- Donations list is scoped to the authenticated donor only.
- Subscription cancel stops future retry attempts.

---

### 3.15 Testing Content Blocks

**Browser:**
In the page editor, save a block from the toolbox → it appears in `http://localhost:5174` editor's reusable blocks library.

**Postman / curl:**

```bash
# List content blocks
curl http://localhost:3002/api/v1/content-blocks

# Get block by ID
curl http://localhost:3002/api/v1/content-blocks/1

# Create block
curl -X POST http://localhost:3002/api/v1/content-blocks \
  -H "Content-Type: application/json" \
  -d '{"name": "Hero Template", "type": "EditorHero", "body": "{\"text\":\"Welcome\"}", "authorId": 1}'

# Update block
curl -X PATCH http://localhost:3002/api/v1/content-blocks/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete block
curl -X DELETE http://localhost:3002/api/v1/content-blocks/1
```

**Verify:**
- Blocks are saved with serialized Craft.js props.
- Blocks appear in the editor's reusable blocks library.
- Deleted blocks no longer appear in listings.

---

### 3.16 Testing Log Activity

**Browser:**
Visit `http://localhost:5174/log-activity` → should see activity log with filters by feature, action, user, and date range.

**Postman / curl:**

```bash
# List activity logs
curl "http://localhost:3002/api/v1/log-activity?feature=pages&action=create&userId=1&limit=20&offset=0"

# Get count
curl http://localhost:3002/api/v1/log-activity/count
```

**Verify:**
- Logs are auto-generated when CRUD operations occur on other modules.
- Filters narrow results correctly.
- Each log entry includes feature, action, userId, timestamp, and metadata.

---

### 3.17 Testing Content / SEO

**Browser:**
Visit `http://localhost:3002/api/v1/content/sitemap.xml?baseUrl=https://unicef.org` in a browser to see the XML sitemap.

**Postman / curl:**

```bash
# Sitemap
curl "http://localhost:3002/api/v1/content/sitemap.xml?baseUrl=https://unicef.org"

# Robots.txt
curl http://localhost:3002/api/v1/content/robots.txt

# Preview page
curl "http://localhost:3002/api/v1/content/preview?token=<preview_token>"
```

**Verify:**
- Sitemap returns valid XML with all published page URLs.
- Robots.txt returns standard format.
- Preview renders the page content when given a valid token; returns error for expired/invalid tokens.

---

### 3.18 Testing Reports

**Browser:**
Visit `http://localhost:5174/reports` → should see donation charts and export buttons.

**Postman / curl:**

```bash
# Export PDF report
curl -O "http://localhost:3002/api/v1/reports/export/pdf?dateFrom=2026-01-01&dateTo=2026-12-31"

# Export Excel report
curl -O "http://localhost:3002/api/v1/reports/export/excel?dateFrom=2026-01-01&dateTo=2026-12-31"
```

**Verify:**
- PDF download contains donation data within the date range.
- Excel download contains the same data in spreadsheet format.
- Both files open correctly in their respective applications.

---

## 4. Feature Alignment Matrix

The following table maps every feature from the project requirements to its implementation status, CMS page, and API endpoint.

| # | Feature | Category | Status | CMS Page | API Endpoint | Notes |
|---|---------|----------|--------|----------|-------------|-------|
| 1 | Login | Auth | ✅ Done | `/login` | `POST /auth/login` | bcrypt + JWT |
| 2 | Forgot Password | Auth | ✅ Done | `/forgot-password` | `POST /auth/forgot-password` | Token-based reset |
| 3 | User Profile | Profile | ✅ Done | `/profile` | `GET /auth/profile` | View + edit |
| 4 | Edit Profile | Profile | ✅ Done | `/profile` | `PATCH /auth/profile` | Name, phone, address, city, postal code, region |
| 5 | Logout | Profile | ✅ Done | Sidebar button | `POST /auth/logout` | Clears token |
| 6 | All Articles | Articles | ✅ Done | `/donations` | `GET /donations` | List with filters |
| 7 | Create New Article | Articles | ✅ Done | `/donations/new` | `POST /donations` | Visual editor with Craft.js |
| 8 | Media Library | Media | ✅ Done | `/media` | `GET /media` | Upload, tag, crop, embed |
| 9 | User Management | Users | ✅ Done | `/users` | `GET /users` | Full CRUD + soft delete |
| 10 | Create New User | Users | ✅ Done | `/users` (dialog) | `POST /users` | With role assignment |
| 11 | Roles | Users | ✅ Done | `/roles` | `GET /roles` | Full CRUD |
| 12 | Permissions | Users | ✅ Done | `/roles` (tab 2) | `GET /permissions` | Grouped by module |
| 13 | Log Activity | Tools | ✅ Done | `/log-activity` | `GET /log-activity` | Filters by feature, action, user, date |
| 14 | System Information | Settings | ✅ Done | `/settings` | `GET /settings/system-info` | Server details |
| 15 | General Settings | Settings | ✅ Done | `/settings` | `PATCH /settings` | Key-value config |
| 16 | Media Settings | Settings | ✅ Done | `/settings` | `GET /settings/media` | File size limits, allowed types |
| 17 | Role/Profile/Permissions | Admin | ✅ Done | `/roles`, `/users` | Multiple | Fine-grained RBAC |
| 18 | Audit Log | Admin | ✅ Done | `/log-activity` | `GET /log-activity` | Auto-logged on all operations |
| 19 | Campaign List | Admin | ✅ Done | `/donations` | `GET /donations` | Filter + search |
| 20 | People & Roles List | Admin | ✅ Done | `/users`, `/roles` | Multiple | With status filter |
| 21 | Create/Edit/Duplicate Pages | Authoring | ✅ Done | `/pages` | `POST/PATCH/duplicate` | Full lifecycle |
| 22 | Content Blocks Library | Authoring | ✅ Done | Editor toolbox | `GET /content-blocks` | Save & reuse blocks |
| 23 | Drag-and-Drop Editor | Authoring | ✅ Done | `/pages/:id` | — | Craft.js-based |
| 24 | Reusable Modules Library | Authoring | ✅ Done | Editor toolbox | `GET /content-blocks` | Save from editor, insert anywhere |
| 25 | Page Preview by Device | Authoring | ✅ Done | Editor toolbar | — | Desktop / Tablet / Mobile toggles |
| 26 | Real-time Co-editing | Authoring | ✅ Done | Editor | WebSocket `/editor` | Cursor presence + avatars |
| 27 | Inline Comments | Authoring | ⚠️ Partial | — | DB table exists | UI not built yet |
| 28 | Duplicate Landing Pages | Design | ✅ Done | `/pages` | `POST /pages/:id/duplicate` | Copy with new slug |
| 29 | Flexible Layout Templates | Design | ✅ Done | `/pages/new` | — | 5 built-in templates |
| 30 | Custom Styling & Themes | Design | ✅ Done | Editor | — | Per-element style controls |
| 31 | Logo Library | Design | ✅ Done | `/logos` | `GET /logos` | Upload by language |
| 32 | Custom Highlight Message | Design | ✅ Done | Editor | — | Promo Bar block |
| 33 | Flexible CTA Elements | Design | ✅ Done | Editor | — | 3 CTA variants + full styling |
| 34 | Navigation/Menu Builder | Design | ✅ Done | `/menus` | `GET /menus` | Hierarchical, reorder, bulk ops |
| 35 | Media Library & Assets | Media | ✅ Done | `/media` | `GET /media` | Upload, tag, crop, search |
| 36 | Video Upload & Embed | Media | ✅ Done | `/media` | `POST /media/embed` | YouTube secure embed |
| 37 | PDF / File Download | Media | ✅ Done | `/media` | `GET /media/:id/download` | Any file type |
| 38 | Asset Optimization | Media | ✅ Done | — | Sharp pipeline | Auto-compressed on upload |
| 39 | WebP Image Support | Media | ✅ Done | — | Auto-conversion | On upload via Sharp |
| 40 | Embedding UNICEF Articles | Media | ⚠️ Partial | Editor | Embed block | iframe/URL embedding |
| 41 | Tagging & Taxonomy Manager | Media | ✅ Done | `/tags` | `GET /tags` | CRUD + assign/remove from media |
| 42 | Payment (Midtrans Sandbox) | Payment | ✅ Done | `/en/donate` | `POST /payments/charge` | Core API integration |
| 43 | Donor Portal SSO | Donor | ✅ Done | `/en/donor/login` | `GET /auth/google` | Google OAuth 2.0 |
| 44 | Donor Profile | Donor | ✅ Done | `/en/donor/profile` | `GET /donor/profile` | View + edit |
| 45 | Donation History | Donor | ✅ Done | `/en/donor/donations` | `GET /donor/donations` | Paginated with filters |
| 46 | Manage Subscriptions | Donor | ✅ Done | `/en/donor/subscriptions` | `POST cancel` | Cancel monthly donations |
| 47 | Monthly Retry | Worker | ✅ Done | — | Cron every 5 min | Auto-retry pending for 24h |
| 48 | Dashboard (Donation Stats) | Dashboard | ✅ Done | `/dashboard` | `GET /transactions/stats` | Real data visualizations |
| 49 | Reports | Reports | ✅ Done | `/reports` | `GET /transactions/stats` | Bar charts + export |
| 50 | Transactions | System | ✅ Done | `/transactions` | `GET /transactions` | Full list with filters |
| 51 | Custom CSS per Page | Editor | ✅ Done | Page settings | — | Textarea in settings panel |
| 52 | Custom JS per Page | Editor | ✅ Done | Page settings | — | Textarea in settings panel |
| 53 | Page Versioning | Content | ✅ Done | Editor toolbar | `GET /pages/:id/versions` | Restore from history |
| 54 | Sitemap | SEO | ✅ Done | — | `GET /content/sitemap.xml` | Auto-generated XML |
| 55 | Robots.txt | SEO | ✅ Done | — | `GET /content/robots.txt` | Auto-generated |

### Summary

| Status | Count |
|--------|-------|
| ✅ Done | **53** |
| ⚠️ Partial | **2** |
| ❌ Not Started | **0** |
| **Total** | **55** |

---

## 5. Platform Recommendations

### Recommended Documentation Tools

#### 1. Postman

Import endpoint collections for interactive API testing:

- Create a Postman collection with all 19 modules organized in folders.
- Set `{{baseUrl}}` variable to `http://localhost:3002/api/v1`.
- Set `{{token}}` variable and configure pre-request scripts to auto-login.
- Share the collection with the team via Postman workspace.

#### 2. GitHub README

This markdown file serves as **living documentation** and should be kept in the repository:

- Update this file whenever endpoints are added or changed.
- Reference it in the main `README.md` for discoverability.
- Use PR reviews to enforce documentation updates alongside code changes.

#### 3. @nestjs/swagger (OpenAPI)

For auto-generated interactive API documentation:

```bash
npm install @nestjs/swagger swagger-ui-express
```

Add to `main.ts`:

```typescript
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

const config = new DocumentBuilder()
  .setTitle("UNICEF Redev API")
  .setDescription("CMS and Donation Platform API")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);
```

Then visit `http://localhost:3002/api/docs` for a fully interactive Swagger UI.

#### 4. Bruno / Insomnia (Alternative to Postman)

Open-source API clients that can import OpenAPI specs and store collections as files in the repository (version-controlled).

---

## 6. Environment Setup

### API Server (`unicef-redev-api/.env`)

```env
# Application
NODE_ENV=development
PORT=3002
APP_URL=http://localhost:3002
WEBSITE_URL=http://localhost:3001
CMS_URL=http://localhost:5174

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/unicef_redev?schema=public

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/callback

# Midtrans Payment Gateway (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_NOTIFICATION_URL=http://localhost:3002/api/v1/payments/notification

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Redis (for BullMQ queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
SMTP_FROM=noreply@unicef.org
```

### Worker Service (`unicef-redev-worker/.env`)

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/unicef_redev?schema=public

# Redis (shared with API)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Midtrans (shared credentials)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Cron Schedules
PAYMENT_RETRY_CRON=*/5 * * * *
EMAIL_CRON=*/1 * * * *
SALESFORCE_CRON=0 */6 * * *
```

### CMS (`unicef-redev-cms/.env`)

```env
VITE_API_URL=http://localhost:3002/api/v1
VITE_WS_URL=http://localhost:3002
VITE_WEBSITE_URL=http://localhost:3001
```

### Website (`unicef-redev-web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3002
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 18.x | Runtime |
| PostgreSQL | >= 14.x | Database |
| Redis | >= 7.x | Queue & caching |
| npm | >= 9.x | Package manager |

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> && cd unicef-redev

# 2. Install dependencies (all services)
cd unicef-redev-api && npm install && cd ..
cd unicef-redev-cms && npm install && cd ..
cd unicef-redev-web && npm install && cd ..
cd unicef-redev-worker && npm install && cd ..

# 3. Set up environment files
cp unicef-redev-api/.env.example unicef-redev-api/.env
cp unicef-redev-cms/.env.example unicef-redev-cms/.env
cp unicef-redev-web/.env.example unicef-redev-web/.env.local
cp unicef-redev-worker/.env.example unicef-redev-worker/.env

# 4. Set up database
cd unicef-redev-api
npx prisma migrate dev
npx prisma db seed
cd ..

# 5. Start all services
# Terminal 1: API
cd unicef-redev-api && npm run start:dev

# Terminal 2: CMS
cd unicef-redev-cms && npm run dev

# Terminal 3: Website
cd unicef-redev-web && npm run dev

# Terminal 4: Worker
cd unicef-redev-worker && npm run start:dev
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| API Server | `http://localhost:3002` | REST API + WebSocket |
| CMS | `http://localhost:5174` | Admin panel (React + Vite) |
| Website | `http://localhost:3001` | Public website (Next.js) |
| Swagger (if enabled) | `http://localhost:3002/api/docs` | Interactive API docs |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@unicef.org` | `password123` |

---

> **Note:** This documentation reflects the current state of the UNICEF Redev platform. Keep it updated as new features are added or existing endpoints change. For the latest schema, run `npx prisma studio` to browse the database interactively.
