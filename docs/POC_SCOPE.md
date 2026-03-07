# POC Scope — Full Feature Breakdown

## Status Legend
- ✅ Done — functional, tested
- ⚠️ Partial — exists but incomplete
- 🔲 Todo — needs to be built
- 📌 Stub — file exists, no real logic

---

## Phase A — Core POC (Priority)

### A1. CMS Auth & Profile
| Feature | Current | Todo |
|---------|---------|------|
| Login page (email/password) | 📌 API stub | Build login API (bcrypt + JWT), CMS login page, auth context |
| Logout | None | Clear token, redirect to login |
| Forgot password | None | API: reset token email, CMS: forgot password form |
| User profile (view) | Hardcoded "Admin" | CMS: profile page with user data |
| Edit profile | None | CMS: edit name/email/password |
| Auth guard (CMS routes) | None | Protect all CMS routes, redirect to /login if no token |

### A2. Users, Roles & Permissions
| Feature | Current | Todo |
|---------|---------|------|
| Users list | 📌 API returns [] | API: real findAll/findOne from uni_user. CMS: users table |
| Create user | None | API: create user (hash password). CMS: create user form |
| Edit/delete user | None | API + CMS |
| Roles CRUD | ✅ API done | CMS: roles management UI |
| Permissions list | None | API: list permissions. CMS: permissions table |
| Assign role to user | None | API + CMS |
| Assign permissions to role | ✅ API done | CMS: permission checkboxes per role |

### A3. Visual Editor — All Elements Working
| Feature | Current | Todo |
|---------|---------|------|
| 13 block types | ✅ Done | — |
| Inline editing (click to type) | ❌ Must click Settings panel | Implement contentEditable for Heading, RichText |
| Resize width/height | None | Add width/height controls per block |
| Alignment (left/center/right) | None | Add textAlign prop to all text blocks |
| Padding & margin controls | None | Add spacing controls in settings panel |
| Typography (font size, weight, color) | None | Add font controls in settings panel |
| Background color per block | Only Promo Bar | Add bg color to all blocks |
| Custom CSS per page | None | Add custom CSS field in Page Settings |
| Custom JS per page | None | Add custom JS field in Page Settings |
| Block reorder (drag) | ✅ Done | — |
| Undo/Redo | ✅ Done | — |
| Responsive preview | ✅ Done (3 viewports) | — |
| Live Preview (new tab) | None | Button → open website URL in new tab with draft data |

### A4. Real-time Collaboration (Phase A: Block-level)
| Feature | Current | Todo |
|---------|---------|------|
| WebSocket server | ⚠️ Menus gateway exists | Create pages/editor gateway |
| User presence (who's editing) | None | Show avatars of connected users |
| Cursor position sharing | None | Broadcast selected block + cursor position |
| Block-level locking | None | Lock block when user clicks it, show colored border |
| Auto-unlock on inactivity | None | 5 min timeout |

### A5. Payment — Midtrans Core API Sandbox
| Feature | Current | Todo |
|---------|---------|------|
| Payment module | 📌 API skeleton | Implement Midtrans Core API integration |
| Charge (one-off) | None | API: create charge, redirect/handle |
| Charge (monthly/subscription) | None | API: create subscription, handle notifications |
| Notification webhook | None | API: POST endpoint for Midtrans callbacks |
| Retry logic (monthly, every 5 min) | None | Worker cron or Bull queue |
| Transaction status tracking | None | Update uni_transaction based on callback |
| Payment channels config | 📌 Table exists | API: list channels. CMS: manage channels |

### A6. Donor Portal
| Feature | Current | Todo |
|---------|---------|------|
| Google OAuth SSO | None | API: Google OAuth flow. Portal: login with Google |
| Donor registration | None | API + Portal UI |
| Profile (view/edit) | None | Name, email, phone, address book |
| Donation history | None | List transactions from uni_transaction |
| Manage subscriptions | None | View/edit/cancel monthly donations |
| Download receipt/e-cert | None | Generate PDF receipt |

### A7. Articles (Donations)
| Feature | Current | Todo |
|---------|---------|------|
| Articles list | ✅ Done | — |
| Create/edit article | ✅ Done (Visual Editor) | — |
| Article categories/types | ⚠️ donationType field | Improve UI |
| Duplicate article | None | API + CMS button |

### A8. Media Library
| Feature | Current | Todo |
|---------|---------|------|
| Upload (image, PDF, video, audio) | ✅ Done | — |
| Tag media | ✅ API done | CMS: tag UI in media detail |
| Crop images | ✅ API done | CMS: crop UI |
| Video embed (YouTube) | ✅ API done | — |
| WebP auto-conversion | ✅ Done | — |
| Asset optimization | ✅ Done (Sharp) | — |
| PDF / file download | ✅ API done | — |

### A9. Tools & Monitoring
| Feature | Current | Todo |
|---------|---------|------|
| Log Activity | None (table exists) | API: CRUD for uni_log_activity. CMS: activity log page with filters |
| Activity logging middleware | None | NestJS interceptor to auto-log create/update/delete actions |

### A10. Settings
| Feature | Current | Todo |
|---------|---------|------|
| System Information | ✅ Done | — |
| General Settings | ✅ Done | — |
| Media Settings | ✅ Done | — |

### A11. Design System Elements
| Feature | Current | Todo |
|---------|---------|------|
| Logo library | ✅ API done | CMS: logos page (upload, list by language) |
| Promo bar (per page) | ✅ Block exists | — |
| Flexible CTA elements | ✅ Block exists | Add more style options |
| Menu builder | ✅ Done | — |
| Tagging & taxonomy | ✅ API done | CMS: tags management page |
| Duplicate pages | ✅ API done | CMS: button works |
| Layout templates | None | Predefined page templates user can pick when creating |
| Custom styling & themes | None | Theme picker or custom CSS in settings |
| Embedding UNICEF articles | ⚠️ Embed block exists | Add "UNICEF Articles" block that pulls via API |
| Reusable blocks library | None (table: redev_content_block) | API + CMS: save/load reusable blocks |

### A12. Content Features
| Feature | Current | Todo |
|---------|---------|------|
| Pages CRUD | ✅ Done | — |
| Page versioning | ✅ API done | CMS: version history UI |
| Inline comments | None (table: redev_content_comment) | API + CMS: comment thread per block |

---

## Phase B — Enhancement (After POC Approved)

### B1. Character-level Collaboration
- Upgrade from block-level locking to Yjs CRDT
- Multiple users edit same text block simultaneously
- Per-character cursor tracking

### B2. Advanced Reporting
- PDF/Excel export
- Dashboard charts (Chart.js / Recharts)
- Date range filters
- Transaction drill-down

### B3. Donor Portal Enhancements
- Saved payment methods
- Refund requests
- Communication preferences / consent
- Support tickets
- E-certificate download

### B4. Worker Cron Jobs
- Payment retry (monthly recurring)
- Email reminders
- Salesforce sync

---

## Summary Count

| Category | Total | Done | Partial | Todo |
|----------|-------|------|---------|------|
| Auth & Profile | 6 | 0 | 1 | 5 |
| Users/Roles/Perms | 7 | 2 | 0 | 5 |
| Editor Elements | 14 | 5 | 0 | 9 |
| Real-time Collab | 5 | 0 | 1 | 4 |
| Payment (Midtrans) | 7 | 0 | 1 | 6 |
| Donor Portal | 6 | 0 | 0 | 6 |
| Articles | 4 | 3 | 1 | 0 |
| Media | 7 | 7 | 0 | 0 |
| Tools & Monitoring | 2 | 0 | 0 | 2 |
| Settings | 3 | 3 | 0 | 0 |
| Design System | 11 | 5 | 2 | 4 |
| Content Features | 3 | 2 | 0 | 1 |
| **TOTAL** | **75** | **27** | **6** | **42** |
