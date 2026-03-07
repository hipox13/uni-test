# Penjelasan Detail Semua Folder

Dokumen ini menjelaskan **untuk apa** setiap folder di `unicef-redev-api` dan `unicef-redev-worker`, termasuk `rest`, `shared`, `common`, `config`, `interceptors`, `pipes`, dan lain-lain.

---

## 1. unicef-redev-api/src — Struktur Utama

```
src/
├── main.ts           # Entry point (HTTP server)
├── app.module.ts     # Root module
├── rest/             # Semua yang spesifik untuk REST API
└── shared/           # Code yang bisa dipakai REST dan (jika satu repo) Worker
```

### 1.1. rest/ — Maksud dan Isi

**Maksud:** Semua code yang **hanya dipakai oleh REST API** (HTTP layer).

**Kenapa namanya "rest"?**
- Aplikasi ini punya satu "surface" utama: REST API (nanti bisa tambah GraphQL).
- Semua yang berhubungan dengan HTTP (controllers, routes, guards, pipes) dikelompokkan di sini.
- Kalau nanti ada GraphQL, bisa tambah folder `graphql/` di samping `rest/` tanpa mengacaukan struktur.

**Isi folder rest/:**
- **rest.module.ts** — Modul yang mengumpulkan semua modul REST (auth, users, donations, dll).
- **modules/** — Satu folder per fitur (auth, users, donations, transactions, payments, media, content, reports). Masing-masing punya controller + service + module.
- **common/** — Code yang dipakai **oleh banyak modul** di REST: decorators, filters, guards, interceptors, pipes.

**Ringkas:**  
`rest/` = "lapisan HTTP" aplikasi. Semua endpoint, proteksi endpoint, validasi request, dan format response hidup di sini.

---

### 1.2. shared/ — Maksud dan Isi

**Maksud:** Code yang **bukan spesifik HTTP** dan bisa dipakai ulang — oleh REST API dan (di repo lain) oleh Worker.

**Kenapa namanya "shared"?**
- **Prisma** (koneksi DB) dipakai REST dan Worker.
- **Config** (env, konstanta) dipakai REST dan Worker.
- **Business logic** (donations, transactions, payments, email, salesforce, reports) bisa dipakai:
  - Di REST: dari controller → panggil service di `rest/modules/` yang bisa memanggil logic di `shared/modules/`.
  - Di Worker: cron dan processor memanggil logic yang sama tanpa lewat HTTP.

**Isi folder shared/:**
- **prisma/** — PrismaService (koneksi DB) dan PrismaModule. Semua modul yang butuh DB pakai ini.
- **config/** — Konfigurasi dari env (port, database URL, JWT secret, dll). Satu tempat baca konfigurasi.
- **modules/** — Logic bisnis yang "murni" (tidak tahu HTTP):
  - donations, transactions — logic donasi & transaksi
  - payments (doku, xendit, midtrans, gopay) — adapter ke payment gateway
  - email — kirim email
  - salesforce — integrasi CRM
  - reports — generate report (data, PDF, Excel)

**Ringkas:**  
`shared/` = "inti aplikasi" yang tidak tergantung HTTP. REST dan Worker sama-sama mengandalkan shared (DB, config, logic bisnis).

---

### 1.3. rest vs shared — Perbedaan Singkat

| Aspek | rest/ | shared/ |
|--------|--------|---------|
| **Dipakai oleh** | Hanya REST API (HTTP) | REST API + Worker (backend mana pun yang pakai DB & logic) |
| **Isi utama** | Controllers, routes, guards, pipes, filters, interceptors, decorators | Prisma, config, business logic (services/adapters) |
| **Tahu tentang HTTP?** | Ya (request, response, status code) | Tidak (hanya data & DB) |
| **Contoh** | `POST /api/v1/donations` → DonationsController | DonationsService yang query DB, validasi bisnis |

---

## 2. unicef-redev-api/src/rest/common — Untuk Apa?

**Maksud:** Kumpulan **utilities dan komponen yang dipakai oleh banyak modul REST** (bukan hanya satu modul seperti auth atau donations).

**Kenapa namanya "common"?**  
Karena ini **common** (umum) untuk semua atau hampir semua feature di `rest/modules/`: auth, users, donations, transactions, payments, dll.

**Isi common/ (dan kegunaannya):**

- **decorators/** — Custom decorator NestJS.
  - Contoh: `@CurrentUser()` untuk ambil user dari `request.user` (setelah JWT guard).
  - Contoh: `@Roles('admin')`, `@Public()`.
  - Dipakai di banyak controller.

- **filters/** — Exception filters.
  - Menangkap error (NotFoundException, UnauthorizedException, dll) dan mengubahnya jadi response HTTP yang konsisten (status code, format JSON).
  - Satu filter bisa dipakai global atau per controller/route.

- **guards/** — Authentication & authorization.
  - Contoh: JwtAuthGuard (cek token JWT), RolesGuard (cek role user), LocalAuthGuard (untuk login).
  - Dipakai di controller yang butuh proteksi (hampir semua kecuali login/public).

- **interceptors/** — Intercept request/response.
  - Sebelum/sesudah route handler jalan.
  - Kegunaan: logging (log request + response), transform response (bentuk standar `{ data, meta }`), timeout, dll.
  - Bisa dipakai global atau per controller/route.

- **pipes/** — Validasi & transformasi input.
  - Validasi: parameter route, query, body (bisa dipakai bareng class-validator).
  - Transformasi: misalnya string → number untuk `id`, atau format khusus (misalnya refId).
  - Dipakai di parameter controller (Param, Query, Body).

**Ringkas:**  
`rest/common/` = "toolkit" untuk REST: keamanan (guards), validasi/transform (pipes), penanganan error (filters), logging/format response (interceptors), dan helper decorator (decorators). Semua modul di `rest/modules/` memakai komponen ini.

---

## 3. config — Di shared/config

**Lokasi:** `unicef-redev-api/src/shared/config/` (biasanya isi `index.ts`).

**Maksud:** Satu tempat untuk **membaca dan mengekspos konfigurasi aplikasi** (dari env atau default).

**Untuk apa?**
- Menyimpan nilai seperti: `port`, `databaseUrl`, `jwtSecret`, `jwtExpiresIn`, `nodeEnv`.
- Supaya tidak ada `process.env.XXX` tersebar di banyak file.
- Bisa ditambah validasi (misalnya env wajib ada) dan typing (TypeScript).

**Siapa yang pakai?**
- REST: main.ts (port), auth (JWT), Prisma (database URL).
- Worker: Prisma, cron, queue (Redis URL), email, dll.

**Ringkas:**  
`config` = satu sumber kebenaran untuk konfigurasi; dipakai oleh `rest/` dan `shared/` (dan di Worker oleh `shared/`).

---

## 4. unicef-redev-worker/src — shared vs worker

```
src/
├── worker.ts      # Entry point Worker (bukan HTTP)
├── shared/        # Sama konsep dengan API: DB, config, business logic
└── worker/        # Yang spesifik Worker: cron, queue processors
```

### 4.1. shared/ (di Worker)

**Maksud:** Sama seperti di API — code yang **bukan spesifik HTTP** dan dipakai untuk jalankan job di background.

**Isi (biasanya mirror API):**
- **prisma/** — PrismaService untuk akses DB (sama schema dengan API).
- **config/** — Config (env): DB, Redis, dll.
- **modules/** — Logic yang dipakai cron/processor: donations, transactions, payments (doku, xendit, dll), email, salesforce, reports.

**Kenapa ada shared di Worker?**  
Worker tidak jalan di proses yang sama dengan API; dia proses terpisah. Jadi dia butuh:
- Koneksi DB sendiri (PrismaService),
- Config sendiri,
- Dan logic bisnis yang sama (payment gateway, email, salesforce, report) supaya job diproses dengan benar.

Di project kamu, shared di Worker bisa berupa copy dari shared di API, atau nanti bisa diganti pakai package bersama (monorepo).

**Ringkas:**  
`worker/src/shared/` = "inti" Worker: DB + config + business logic, tanpa HTTP.

---

### 4.2. worker/ (di Worker)

**Maksud:** Semua code yang **spesifik proses background**: jadwal (cron) dan antrian job (Bull processors).

**Isi:**
- **worker.module.ts** — Root module Worker: import ScheduleModule, BullModule, PrismaModule, dan daftar cron services + processors.
- **cron/** — Job yang jalan berdasarkan jadwal waktu:
  - payment-cron.service.ts — misalnya cek transaksi recurring yang jatuh tempo.
  - salesforce-cron.service.ts — sync ke Salesforce secara berkala.
  - email-cron.service.ts — kirim reminder/notifikasi berdasarkan jadwal.
- **processors/** — Job yang jalan dari queue (Bull/Redis):
  - payment.processor.ts — proses job bayar (retry, charge, update status).
  - salesforce.processor.ts — proses job sync ke Salesforce.
  - email.processor.ts — proses job kirim email.
  - report.processor.ts — proses job generate report (PDF/Excel).

**Kenapa dipisah cron vs processors?**
- **Cron** = "kapan jalan" (jadwal).
- **Processors** = "apa yang dikerjakan" (satu job dari queue).  
Cron bisa hanya enqueue job; processor yang eksekusi. Jadi struktur jelas: jadwal di `cron/`, eksekusi job di `processors/`.

**Ringkas:**  
`worker/src/worker/` = "otak" Worker: jadwal + konsumer queue; tidak ada HTTP, hanya job.

---

## 5. rest/common — Satu Per Satu

### 5.1. common/decorators

**Untuk apa:** Custom decorator NestJS yang dipakai di controller (atau di tempat lain di REST).

**Contoh:**
- `@CurrentUser()` — Mengambil `request.user` (user dari JWT/local strategy) jadi parameter handler.
- `@Roles('admin', 'editor')` — Menandai route butuh role tertentu (dibaca RolesGuard).
- `@Public()` — Menandai route tidak perlu JWT (dibaca JwtAuthGuard).

Tanpa decorator ini, kamu harus tulis `@Request() req` lalu `req.user` di setiap method; dengan decorator, cukup `@CurrentUser() user`.

---

### 5.2. common/filters

**Untuk apa:** Menangkap exception yang dilempar di mana saja (controller, service, guard, pipe) dan mengubahnya jadi response HTTP yang seragam.

**Contoh:**
- `NotFoundException` → 404 + body JSON standar.
- `UnauthorizedException` → 401.
- Custom filter bisa log error, sembunyikan detail di production, atau format `{ code, message, timestamp }`.

Ini yang bikin semua error dari aplikasi keluar dengan format yang sama dan status code yang benar.

---

### 5.3. common/guards

**Untuk apa:** Memutus apakah request **boleh** masuk ke route handler atau tidak (authentication & authorization).

**Contoh:**
- **JwtAuthGuard** — Cek header `Authorization: Bearer <token>`, validasi JWT, isi `request.user`. Kalau token invalid/expired → 401.
- **RolesGuard** — Cek `request.user.role` sesuai metadata dari decorator `@Roles(...)`. Kalau role tidak sesuai → 403.
- **LocalAuthGuard** — Dipakai khusus di login: validasi email+password, isi `request.user` untuk dipakai AuthService.

Jadi: **guards** = "pintu" ke route; kalau guard gagal, request tidak sampai ke controller.

---

### 5.4. common/interceptors

**Untuk apa:** Kode yang jalan **sebelum dan sesudah** route handler. Bisa mengubah request sebelum sampai handler atau mengubah response sebelum dikirim ke client.

**Kegunaan umum:**
- **Logging** — Log method, URL, body, user, response time.
- **Transform response** — Ubah semua response jadi bentuk standar, misalnya `{ success: true, data: ... }` atau tambah `meta` (pagination, timestamp).
- **Timeout** — Batasi waktu eksekusi request.
- **Cache** — Cache response untuk GET tertentu.

Contoh: setiap response dari API dibungkus `{ data, timestamp }` — itu bisa dilakukan satu interceptor global.

---

### 5.5. common/pipes

**Untuk apa:** Validasi dan transformasi **nilai** yang masuk ke route handler (parameter route, query, body).

**Validasi:**
- Memastikan tipe dan format (number, string, format refId, email).
- Bisa dipakai bareng DTO + class-validator; pipe memastikan data yang sampai ke controller sudah valid. Kalau tidak valid → throw exception → filter yang format response error.

**Transformasi:**
- Query string `"123"` → number `123` untuk `id`.
- String `"true"` → boolean `true`.
- Bisa pipe kustom untuk refId, date, dll.

Jadi: **pipes** = "pintu" untuk data: memastikan dan mengubah input sebelum dipakai di controller.

---

## 6. Ringkasan Alur

### Di REST API (unicef-redev-api)

1. **Request masuk** → `main.ts` → `app.module` → `rest.module` → controller di `rest/modules/...`.
2. **Sebelum sampai controller:**  
   `rest/common` dipakai: **guards** (auth), **pipes** (validasi), **interceptors** (misalnya log).
3. **Di controller:** Bisa pakai **decorators** dari `common/decorators` (misalnya `@CurrentUser()`).
4. **Controller** memanggil **service** (di `rest/modules/.../...service`). Service bisa memanggil **shared** (Prisma, shared/modules) untuk DB dan business logic.
5. **Sesudah handler:** **Interceptors** bisa ubah response; kalau ada exception, **filters** yang format error response.

### Di Worker (unicef-redev-worker)

1. **Proses jalan** lewat `worker.ts` → `worker.module` (tidak ada HTTP).
2. **shared/** — Sama seperti di API: Prisma, config, modules (payments, email, salesforce, reports) untuk akses DB dan eksekusi logic.
3. **worker/cron/** — Menjalankan job berdasarkan jadwal (recurring payment, sync Salesforce, email reminder).
4. **worker/processors/** — Memproses job dari queue (payment retry, email, report, salesforce sync).

---

## 7. Tabel Referensi Cepat

| Folder | Repo | Untuk apa |
|--------|------|-----------|
| **src/rest** | API | Semua yang spesifik REST (HTTP): controllers, routes, common utilities. |
| **src/shared** | API | DB (Prisma), config, business logic yang dipakai REST (dan konsepnya sama untuk Worker). |
| **src/rest/common** | API | Decorators, filters, guards, interceptors, pipes — dipakai bersama oleh semua modul REST. |
| **src/shared/config** | API | Konfigurasi aplikasi (env, default). |
| **src/shared/prisma** | API | Koneksi database (PrismaService/PrismaModule). |
| **src/shared/modules** | API | Logic bisnis murni (donations, transactions, payments, email, salesforce, reports). |
| **src/shared** | Worker | Sama konsep: Prisma, config, modules — untuk akses DB dan logic di job. |
| **src/worker** | Worker | Cron services + Bull processors (jadwal + konsumer queue). |
| **common/decorators** | API | Custom decorator (CurrentUser, Roles, Public). |
| **common/filters** | API | Penanganan exception → response HTTP seragam. |
| **common/guards** | API | Authentication & authorization (JWT, Roles, Local). |
| **common/interceptors** | API | Logging, transform response, timeout, cache. |
| **common/pipes** | API | Validasi & transformasi parameter/query/body. |

Dengan penjelasan ini, setiap folder punya satu peran yang jelas: **rest** = HTTP, **shared** = inti backend (DB + config + logic), **common** = toolkit REST, **worker** = jadwal + queue.
