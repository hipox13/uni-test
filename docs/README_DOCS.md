# REDEV – Docs

## Isi folder `docs/`

### 1. `REDEV_DB_DIAGRAM_AND_TABLES.md` *(mulai dari sini)*
- **Perbedaan dua file DBML:** `REDEV_DBDIAGRAM.dbml` (Prisma/PostgreSQL, snake_case) vs `REDEV_DBDIAGRAM_CURRENT.dbml` (current MySQL, camelCase).
- **Total 48 tabel** dalam satu DB untuk **CMS + Website + Donor Portal**, beserta daftar lengkap dan penggunaan per tabel (CMS / Website / Donor Portal).
- Ringkasan **penyesuaian di docs** untuk fitur REDEV (tanpa mengubah Prisma).

**Cara pakai:** Baca dulu untuk paham diagram mana yang dipakai dan bagaimana 48 tabel dipakai di tiga area (CMS, Website, Donor Portal).

### 2. `REDEV_CMS_SITEMAP.md`
- Perbandingan **current CMS sitemap** vs **REDEV CMS sitemap**.
- Daftar menu: Dashboard, Pages, Donations, Donation Reports, Transaction Tools, E-Certificate Tools, Data Collection, Subscribers, Media, Users, Salesforce, Tools & Monitoring, Appearances, Settings.
- Setiap menu/submenu: **route saran** dan **tabel database** yang dipakai.

**Cara pakai:** Acuan sidebar/routing CMS dan memastikan tidak ada fitur current yang hilang.

### 3. `REDEV_FEATURE_TABLE_MAPPING.md`
- Mapping **fitur REDEV** (CMS menu, Website menu, Donor Portal menu) ke **tabel**.
- Matriks fungsi (Add New, Update, Delete, Export, Filter Date, Filter Transaction, Duplicate) per menu CMS.
- Tabel untuk Website (Checkout, Integration, Security, Payment Success, Analytics) dan Donor Portal (account, session, donation history, subscription, refund, dll.).

**Cara pakai:** Mengetahui tabel mana yang dipakai untuk fitur tertentu di CMS, Website, atau Donor Portal.

### 4. `REDEV_DBDIAGRAM.dbml`
- DBML **selaras Prisma** (PostgreSQL, snake_case).
- **48 tabel** (uni_*, web_*) + relasi + Note.
- Satu DB penuh: CMS + Website + Donor Portal.

**Cara pakai:** Import ke [dbdiagram.io](https://dbdiagram.io) → Create New Diagram → Import from DBML. Untuk diagram "standar REDEV".

### 5. `REDEV_DBDIAGRAM_CURRENT.dbml`
- DBML **persis struktur current** (MySQL, nama kolom asli/camelCase).
- **48 tabel** yang sama, konvensi dan tipe mengikuti dump DB current.

**Cara pakai:** Import ke dbdiagram.io jika ingin diagram yang match dengan DB MySQL existing.

---

## Catatan

- **Prisma** (`unicef-redev-api/prisma/schema.prisma`) punya **48 model**; satu DB dipakai untuk CMS, Website, dan Donor Portal. Docs disesuaikan dengan fitur REDEV tanpa mengubah schema.
- File Excel/PowerPoint (format biner) tidak bisa dibaca langsung; sitemap dan DBML disusun dari current sitemap, Prisma, dan daftar tabel yang kamu berikan.
- Jika ada fitur baru yang butuh tabel baru, bisa ditambah ke Prisma dan ke file DBML terpisah.
