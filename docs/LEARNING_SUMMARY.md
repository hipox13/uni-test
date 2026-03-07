# Learning Summary: NestJS Backend + React/Vite CMS

## 🎯 What We Built

### Backend (NestJS + Prisma + PostgreSQL)
- **CMS API** dengan Pages, Media, Menus management
- **Block-based editor** (WordPress Gutenberg-style)
- **Authentication** dengan JWT guards
- **File upload** dengan Multer
- **Database** dengan Prisma ORM ke Supabase

### Frontend (React + Vite + TanStack Query)
- **CMS Admin Panel** dengan sidebar navigation
- **Pages Editor** dengan drag & drop blocks
- **Media Library** dengan upload & preview
- **Menus Management** dengan tree structure
- **Mock Data** untuk testing tanpa backend

---

## 📚 NestJS Concepts Learned

### 1. **Module System**
```typescript
@Module({
  imports: [PrismaModule],      // Import other modules
  controllers: [PagesController], // HTTP endpoints
  providers: [PagesService],     // Business logic
  exports: [PagesService],        // Expose to other modules
})
export class PagesModule {}
```

**Key Points:**
- Modules = containers untuk features
- `imports` = dependencies yang dibutuhkan
- `controllers` = HTTP endpoints (routes)
- `providers` = services, repositories, dll
- `exports` = apa yang bisa dipakai module lain

---

### 2. **Controller (HTTP Layer)**
```typescript
@Controller('api/v1/pages')
@UseGuards(JwtAuthGuard)  // Protect all routes
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()           // GET /api/v1/pages
  findAll() { }

  @Post()          // POST /api/v1/pages
  create(@Body() dto: CreatePageDto) { }

  @Get(':id')      // GET /api/v1/pages/:id
  findOne(@Param('id') id: string) { }
}
```

**Key Points:**
- `@Controller()` = base route path
- `@Get()`, `@Post()`, `@Patch()`, `@Delete()` = HTTP methods
- `@Body()`, `@Param()`, `@Query()` = extract data dari request
- `@UseGuards()` = authentication/authorization
- Controller hanya handle HTTP, logic ada di Service

---

### 3. **Service (Business Logic)**
```typescript
@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PageQueryDto) {
    // Business logic here
    return this.prisma.uniPage.findMany({ ... });
  }
}
```

**Key Points:**
- `@Injectable()` = bisa di-inject ke tempat lain
- Service = tempat semua business logic
- Tidak tahu tentang HTTP (bisa dipakai di controller, worker, dll)
- Menggunakan Prisma untuk database operations

---

### 4. **DTO (Data Transfer Object)**
```typescript
export class CreatePageDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
```

**Key Points:**
- DTO = struktur data yang diterima/dikirim via API
- `class-validator` decorators untuk validation
- `@IsString()`, `@IsOptional()`, `@MinLength()` = validation rules
- ValidationPipe otomatis validate sebelum masuk controller

---

### 5. **Guards (Authentication)**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Check if user is authenticated
    return super.canActivate(context);
  }
}
```

**Key Points:**
- Guard = middleware untuk protect routes
- `canActivate()` = return true/false untuk allow/deny request
- JWT Guard = validate JWT token dari header
- `@Public()` decorator = skip guard untuk public routes

---

### 6. **Prisma ORM**
```typescript
// Query
const pages = await this.prisma.uniPage.findMany({
  where: { status: 2 },
  include: { author: true },
  orderBy: { dateModified: 'desc' },
});

// Create
const page = await this.prisma.uniPage.create({
  data: { title: 'New Page', status: 0 },
});

// Update
await this.prisma.uniPage.update({
  where: { id },
  data: { title: 'Updated' },
});
```

**Key Points:**
- Prisma = type-safe database client
- Auto-generated types dari schema.prisma
- `findMany()`, `findUnique()`, `create()`, `update()`, `delete()`
- `include` = join relations (author, modifier, dll)
- `where` = filter conditions

---

### 7. **File Upload (Multer)**
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file: Express.Multer.File) {
  // file.buffer = file content
  // file.originalname = filename
  // file.mimetype = MIME type
  // file.size = file size in bytes
}
```

**Key Points:**
- `FileInterceptor('file')` = handle multipart/form-data
- `@UploadedFile()` = extract uploaded file
- File disimpan ke disk atau cloud storage
- Create database record untuk metadata

---

## 📚 React/Vite Concepts Learned

### 1. **Component Structure**
```typescript
export function PagesPage() {
  const [search, setSearch] = useState('');
  
  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );
}
```

**Key Points:**
- Component = reusable UI piece
- `useState()` = manage component state
- JSX = HTML-like syntax untuk UI
- Props = data passed dari parent component

---

### 2. **React Router (Navigation)**
```typescript
<BrowserRouter>
  <Routes>
    <Route path="/pages" element={<PagesPage />} />
    <Route path="/pages/:id" element={<PageEditorPage />} />
  </Routes>
</BrowserRouter>
```

**Key Points:**
- `BrowserRouter` = enable routing
- `Routes` = container untuk routes
- `Route` = mapping path ke component
- `:id` = dynamic route parameter
- `useNavigate()`, `useParams()` = hooks untuk navigation

---

### 3. **TanStack Query (Data Fetching)**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['pages', { search }],
  queryFn: async () => {
    const response = await apiClient.get('/pages');
    return response.data;
  },
});
```

**Key Points:**
- `useQuery()` = fetch data dengan caching
- `queryKey` = unique identifier untuk cache
- `queryFn` = function yang fetch data
- Auto refetch, caching, error handling
- `useMutation()` = untuk POST/PATCH/DELETE

---

### 4. **React Hook Form**
```typescript
const { register, handleSubmit, watch, setValue } = useForm<PageFormData>();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('title', { required: true })} />
</form>
```

**Key Points:**
- `useForm()` = manage form state
- `register()` = connect input ke form
- `handleSubmit()` = validate & submit
- `watch()` = watch form values
- `setValue()` = programmatically set values

---

### 5. **Axios (HTTP Client)**
```typescript
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// GET
const response = await apiClient.get('/pages');

// POST
await apiClient.post('/pages', data);

// PATCH
await apiClient.patch(`/pages/${id}`, data);
```

**Key Points:**
- Axios = HTTP client library
- `create()` = create configured instance
- Interceptors = modify requests/responses
- Auto JSON serialization
- Error handling built-in

---

## 🧪 Testing: With Database vs Without Database

### Option 1: Testing WITH Database (Real Backend)

#### Setup:
1. **Start Backend API:**
   ```bash
   cd unicef-redev-api
   npm run start:dev
   # API runs on http://localhost:3000
   ```

2. **Start Frontend CMS:**
   ```bash
   cd unicef-redev-cms
   # Create .env file:
   # VITE_API_URL=http://localhost:3000
   # VITE_USE_MOCK_DATA=false
   npm run dev
   ```

3. **Test Endpoints:**
   - Frontend akan call real API
   - Data dari Supabase database
   - Full CRUD operations bekerja

#### Pros:
- ✅ Real integration testing
- ✅ Test dengan actual database
- ✅ Verify Prisma queries bekerja
- ✅ Test authentication flow

#### Cons:
- ❌ Butuh database connection
- ❌ Slower (network calls)
- ❌ Butuh setup backend

---

### Option 2: Testing WITHOUT Database (Mock Data)

#### Setup:
1. **Create `.env` in frontend:**
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_USE_MOCK_DATA=true  # Enable mock mode
   ```

2. **Start Frontend Only:**
   ```bash
   cd unicef-redev-cms
   npm run dev
   # No backend needed!
   ```

3. **How It Works:**
   - Axios interceptor catch requests
   - Return mock data dari `mockData.ts`
   - No network calls ke backend

#### Mock Data Structure:
```typescript
// src/lib/api/mockData.ts
export const mockPages = [
  { id: '1', title: 'Welcome Page', status: 2, ... },
  { id: '2', title: 'About Us', status: 1, ... },
];

// src/lib/api/client.ts
if (useMockData) {
  apiClient.interceptors.request.use((config) => {
    // Return mock response instead of real API call
    if (config.url === '/pages') {
      return Promise.reject({
        response: { data: { data: mockPages } }
      });
    }
  });
}
```

#### Pros:
- ✅ Fast (no network calls)
- ✅ No database needed
- ✅ Test UI/UX quickly
- ✅ Work offline
- ✅ Consistent test data

#### Cons:
- ❌ Not real integration test
- ❌ Can't test backend logic
- ❌ Mock data might not match real data structure

---

## 🔄 Switching Between Modes

### Enable Mock Mode:
```env
# .env
VITE_USE_MOCK_DATA=true
```

### Disable Mock Mode (Use Real API):
```env
# .env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:3000
```

**Note:** Restart dev server setelah ubah `.env`

---

## 📖 Key Learning Points

### NestJS Architecture:
1. **Separation of Concerns:**
   - Controller = HTTP layer
   - Service = Business logic
   - DTO = Data validation
   - Module = Feature container

2. **Dependency Injection:**
   - Services injected via constructor
   - Easy to test (mock dependencies)
   - Loose coupling

3. **Decorators:**
   - `@Controller()`, `@Get()`, `@Post()` = routing
   - `@Injectable()` = DI marker
   - `@UseGuards()` = middleware
   - `@Body()`, `@Param()` = extract data

### React Patterns:
1. **Component Composition:**
   - Break UI into small components
   - Reusable & maintainable

2. **State Management:**
   - `useState()` = local state
   - TanStack Query = server state
   - Zustand = global state (optional)

3. **Data Fetching:**
   - TanStack Query untuk async data
   - Caching & refetching built-in
   - Optimistic updates

---

## 🚀 Next Steps for Learning

### NestJS:
1. **Learn More Decorators:**
   - `@UseInterceptors()` = transform requests/responses
   - `@UsePipes()` = custom validation
   - `@UseFilters()` = error handling

2. **Advanced Features:**
   - WebSockets (real-time)
   - GraphQL (alternative to REST)
   - Microservices architecture
   - Testing (Jest + Supertest)

3. **Best Practices:**
   - Error handling dengan Exception Filters
   - Logging dengan Winston/Pino
   - API documentation dengan Swagger
   - Environment configuration

### React/Vite:
1. **Advanced Hooks:**
   - `useMemo()`, `useCallback()` = performance
   - `useReducer()` = complex state
   - Custom hooks = reusable logic

2. **State Management:**
   - Zustand untuk global state
   - Context API untuk theme/settings
   - Server state vs client state

3. **Performance:**
   - Code splitting
   - Lazy loading components
   - Memoization
   - Virtual scrolling untuk large lists

---

## 🛠️ Quick Reference Commands

### Backend:
```bash
# Start dev server
npm run start:dev

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# View database (Prisma Studio)
npx prisma studio
```

### Frontend:
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Project Structure Summary

```
unicef-redev-api/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── rest/
│   │   ├── modules/            # Feature modules
│   │   │   ├── pages/          # Pages CRUD
│   │   │   ├── media/          # File upload
│   │   │   └── menus/          # Menu management
│   │   └── common/             # Shared (guards, decorators)
│   └── shared/
│       └── prisma/             # Database service
└── prisma/
    └── schema.prisma           # Database schema

unicef-redev-cms/
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Router setup
│   ├── features/               # Feature pages
│   │   ├── pages/              # Pages management
│   │   ├── media/              # Media library
│   │   └── menus/              # Menus management
│   └── lib/
│       └── api/                # API client + mock data
```

---

## ✅ What You've Learned

1. ✅ NestJS module, controller, service pattern
2. ✅ Prisma ORM untuk database operations
3. ✅ JWT authentication dengan guards
4. ✅ File upload dengan Multer
5. ✅ DTO validation dengan class-validator
6. ✅ React components & hooks
7. ✅ TanStack Query untuk data fetching
8. ✅ React Router untuk navigation
9. ✅ React Hook Form untuk forms
10. ✅ Mock data untuk testing tanpa backend
11. ✅ TypeScript untuk type safety
12. ✅ Tailwind CSS untuk styling

**Congratulations!** 🎉 You've built a full-stack CMS with modern best practices!
