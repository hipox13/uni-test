# Frontend Files Location Guide

## 📁 Struktur File Frontend CMS

### Root Structure
```
unicef-redev-cms/
├── src/
│   ├── App.tsx                    # Main router & layout
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles (Tailwind)
│   ├── vite-env.d.ts              # TypeScript env types
│   │
│   ├── features/                  # Feature pages
│   │   ├── pages/                 # Pages Management
│   │   │   ├── PagesPage.tsx      # Pages list
│   │   │   └── PageEditorPage.tsx # Page editor (block-based)
│   │   │
│   │   ├── media/                 # Media Library
│   │   │   └── MediaPage.tsx      # Upload & manage media
│   │   │
│   │   ├── menus/                 # Menus Management
│   │   │   └── MenusPage.tsx      # Menu tree editor
│   │   │
│   │   ├── dashboard/             # Dashboard
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── donations/             # Donations
│   │   │   └── DonationsPage.tsx
│   │   │
│   │   ├── transactions/          # Transactions
│   │   │   └── TransactionsPage.tsx
│   │   │
│   │   ├── reports/               # Reports
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   ├── users/                 # Users
│   │   │   └── UsersPage.tsx
│   │   │
│   │   └── settings/              # Settings
│   │       └── SettingsPage.tsx
│   │
│   ├── components/                # Reusable components
│   │   ├── layout/
│   │   │   └── Layout.tsx         # Main layout (currently unused, layout in App.tsx)
│   │   ├── common/                # Common components
│   │   └── ui/                    # UI components
│   │
│   └── lib/                       # Utilities & configs
│       ├── api/
│       │   ├── client.ts          # Axios client + mock interceptor
│       │   └── mockData.ts        # Mock data for testing
│       ├── hooks/                 # Custom React hooks
│       └── utils/                 # Utility functions
│
├── .env                           # Environment variables
├── .env.example                   # Example env file
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.js               # PostCSS config
└── package.json                   # Dependencies
```

---

## 🎯 Main Feature Files

### 1. **Pages Management**
**Location:** `src/features/pages/`

- **PagesPage.tsx** - List semua pages dengan filter & search
  - Route: `/pages`
  - Features: List, filter by status, search, create new, edit, delete

- **PageEditorPage.tsx** - Block-based editor (WordPress-style)
  - Route: `/pages/:id` atau `/pages/new`
  - Features:
    - Page settings (title, slug, description, keywords)
    - Block editor dengan drag & drop
    - 11 block types (heading, richtext, image, gallery, CTA, embed, FAQ, promo, two-column, form, divider)
    - Save draft & publish

### 2. **Media Library**
**Location:** `src/features/media/`

- **MediaPage.tsx** - Upload & manage media files
  - Route: `/media`
  - Features:
    - Upload files (image & PDF)
    - Grid view dengan preview
    - Search & filter by type
    - Copy URL & delete

### 3. **Menus Management**
**Location:** `src/features/menus/`

- **MenusPage.tsx** - Menu tree editor
  - Route: `/menus`
  - Features:
    - Tree structure display
    - Create/Edit/Delete menu items
    - Filter by group (main, footer, sidebar)
    - Form modal untuk add/edit

---

## 🔧 Configuration Files

### API Client & Mock Data
**Location:** `src/lib/api/`

- **client.ts** - Axios client dengan mock interceptor
  - Base URL configuration
  - Mock data interceptor (jika `VITE_USE_MOCK_DATA=true`)
  - Request/response interceptors

- **mockData.ts** - Mock data untuk testing
  - `mockPages` - Sample pages data
  - `mockMedia` - Sample media data
  - `mockMenus` - Sample menus data
  - `mockPageDetail` - Sample page dengan blocks

### Routing & Layout
**Location:** `src/App.tsx`

- Main router setup
- Sidebar navigation
- Route definitions
- Layout structure

---

## 🚀 How to Access Features

### Development Mode:
```bash
cd unicef-redev-cms
npm run dev
# Open http://localhost:5174
```

### Routes:
- `/` → Redirects to `/dashboard`
- `/dashboard` → Dashboard page
- `/pages` → Pages list
- `/pages/new` → Create new page
- `/pages/:id` → Edit page
- `/media` → Media library
- `/menus` → Menus management
- `/donations` → Donations (skeleton)
- `/transactions` → Transactions (skeleton)
- `/reports` → Reports (skeleton)
- `/users` → Users (skeleton)
- `/settings` → Settings (skeleton)

---

## 📝 Key Files to Edit

### Untuk menambah fitur baru:
1. **Create feature page:** `src/features/[feature-name]/[FeatureName]Page.tsx`
2. **Add route:** Edit `src/App.tsx` → add route & import
3. **Add navigation:** Edit `src/App.tsx` → add to `navItems` array
4. **Add API calls:** Edit `src/lib/api/client.ts` (atau create service)

### Untuk styling:
- **Global styles:** `src/index.css`
- **Tailwind config:** `tailwind.config.js`
- **Component styles:** Inline Tailwind classes di component

### Untuk API integration:
- **API client:** `src/lib/api/client.ts`
- **Mock data:** `src/lib/api/mockData.ts`
- **Environment:** `.env` file

---

## 🎨 Component Structure Example

```typescript
// src/features/pages/PagesPage.tsx
export function PagesPage() {
  // 1. State management
  const [search, setSearch] = useState('');
  
  // 2. Data fetching (TanStack Query)
  const { data, isLoading } = useQuery({ ... });
  
  // 3. Mutations (create/update/delete)
  const createMutation = useMutation({ ... });
  
  // 4. Event handlers
  const handleSubmit = () => { ... };
  
  // 5. Render UI
  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

---

## 🔍 Finding Files Quickly

### By Feature:
- **Pages:** `src/features/pages/`
- **Media:** `src/features/media/`
- **Menus:** `src/features/menus/`

### By Type:
- **Pages:** `src/features/*/Page.tsx`
- **API:** `src/lib/api/`
- **Components:** `src/components/`
- **Config:** Root level (`tailwind.config.js`, `.env`, dll)

---

## 💡 Tips

1. **Hot Reload:** File changes auto-reload di dev mode
2. **TypeScript:** Semua file `.tsx` punya type checking
3. **Tailwind:** Gunakan utility classes untuk styling
4. **Mock Data:** Set `VITE_USE_MOCK_DATA=true` untuk test tanpa backend
5. **API Calls:** Semua via `apiClient` dari `src/lib/api/client.ts`

---

**Happy Coding!** 🚀
