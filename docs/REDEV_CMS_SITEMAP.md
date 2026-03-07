# REDEV CMS Sitemap – Current vs Redevelopment

Dokumen ini membandingkan **current CMS sitemap** (dari InDiGO existing) dengan **REDEV CMS sitemap** yang diusulkan, termasuk menu yang perlu ditambah/diubah dan mapping ke database (Prisma).

---

## 1. Current Sitemap (Referensi dari Gambar)

| Top-Level | Sub-items |
|-----------|-----------|
| **PAGES** | All Pages, Create New |
| **ARTICLES** | All Pages, Create New |
| **DONATION REPORTS** | All Request, Monthly New Register, All Transaction, Responses Finder, Weekly Donation, Payment Link Report |
| **TRANSACTION TOOLS** | Bulk Stop, Salesforce Payload, Bulk Update Xendit, Bulk Update Midtrans |
| **E-CERTIFICATE TOOLS** | Custom E-Certification, Custom E-Certification Log, Ty Download Log, Dynamic Download Log |
| **DATA COLLECTION** | Testimonial, Banks, Location, Support, FAQ, FAQ Weekly |
| **SUBSCRIBERS** | All Subscribers |
| **MEDIA** | Library |
| **USERS** | Users, Create New, Roles, Permissions |
| **SALESFORCE** | API Responses |
| **TOOLS & MONITORING** | Sent Items, Log Activity |
| **APPEARANCES** | Menus, Placeholders, Error Pages, Thankyou Pages, Email Template |
| **SETTINGS** | System Information, General Settings, UTM E-Certificate Settings, Mailer Settings, Media Settings, Email Reminder Settings, WhatsApp Bubble |

---

## 2. REDEV CMS Sitemap (Struktur yang Disarankan)

Struktur berikut disesuaikan dengan fitur redev, konsisten dengan **Pages / Donations (Articles) / Reports / Data / Users / Appearances / Settings**, dan selaras dengan tabel di Prisma.

### 2.1 DASHBOARD
- **Dashboard** (overview: stats, recent activity)
- *DB: tidak ada tabel khusus; agregasi dari uni_transaction, uni_page, uni_donation, uni_media*

---

### 2.2 PAGES (Content – Website Pages)
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| All Pages | `/pages` | List semua halaman (draft/review/published) | uni_page |
| Create New | `/pages/new` | Buat halaman baru (block editor) | uni_page |

**Tetap sama dengan current.** Sudah ada di redev (Pages + block editor).

---

### 2.3 DONATIONS / ARTICLES (Campaign Donation)
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| All Donations | `/donations` | List campaign donasi (monthly/one-off) | uni_donation |
| Create New | `/donations/new` | Buat campaign donasi baru | uni_donation |

**Current:** "ARTICLES" dengan "All Pages, Create New".  
**REDEV:** Ganti label jadi **DONATIONS** (atau "Campaigns"), submenu **All Donations** + **Create New** agar jelas ini untuk campaign (uni_donation).

---

### 2.4 DONATION REPORTS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| All Request | `/reports/requests` | Request donasi / registrasi | uni_transaction (+ filter) |
| Monthly New Register | `/reports/monthly-register` | Registrasi bulanan | uni_transaction |
| All Transaction | `/reports/transactions` | Semua transaksi | uni_transaction, uni_transaction_paid |
| Responses Finder | `/reports/responses` | Cari response payment gateway | uni_transaction_response |
| Weekly Donation | `/reports/weekly-donation` | Donasi mingguan | uni_transaction_weekly |
| Payment Link Report | `/reports/payment-link` | Laporan payment link | uni_transaction_paymentlink |

**Tetap** semua submenu current; pastikan tiap laporan pakai filter/aggregasi yang sesuai dari tabel di atas.

---

### 2.5 TRANSACTION TOOLS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Bulk Stop | `/tools/bulk-stop` | Bulk stop recurring | uni_transaction, uni_transaction_paid |
| Salesforce Payload | `/tools/salesforce-payload` | Payload ke Salesforce | uni_salesforce_paymentlink, uni_salesforce_response |
| Bulk Update Xendit | `/tools/bulk-update-xendit` | Bulk update Xendit | uni_transaction, uni_xendit_reminder_payment_link (legacy: web_xendit_*) |
| Bulk Update Midtrans | `/tools/bulk-update-midtrans` | Bulk update Midtrans | uni_transaction, web_midtrans_callback |

**Tetap** sama dengan current; mapping ke tabel yang relevan untuk each tool.

---

### 2.6 E-CERTIFICATE TOOLS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Custom E-Certification | `/tools/ecert/custom` | Generate custom e-cert | uni_custom_ecert |
| Custom E-Certification Log | `/tools/ecert/custom-log` | Log custom e-cert | uni_custom_ecert |
| Download Log (Ty) | `/tools/ecert/download-log` | Log download e-cert | uni_download_log |
| UTM / Dynamic Download Log | `/tools/ecert/utm-download-log` | Log download UTM/dynamic | uni_download_utm_ecertif_log |

**Perubahan nama:** "Ty Download Log" → **Download Log**; "Dynamic Download Log" → **UTM / Dynamic Download Log** agar konsisten dengan nama tabel.

---

### 2.7 DATA COLLECTION
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Testimonial | `/data/testimonials` | Testimoni | uni_data_testimony |
| Banks | `/data/banks` | Bank untuk donasi | uni_data_bank |
| Location | `/data/locations` | Lokasi event/kegiatan | uni_data_location |
| Support | `/data/supports` | Data dukungan | uni_data_support |
| FAQ | `/data/faq` | FAQ (tree) | uni_data_faq |
| FAQ Weekly | `/data/faq-weekly` | FAQ weekly (jika beda flow) | uni_data_faq (filter) atau view khusus |

**Tetap** sama; pastikan CRUD masing-masing mengacu ke tabel yang benar.

---

### 2.8 SUBSCRIBERS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| All Subscribers | `/subscribers` | List subscriber | uni_data_subscriber |

**Tetap** satu submenu.

---

### 2.9 MEDIA
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Library | `/media` | Media library | uni_media |

**REDEV:** Bisa tetap "Library" atau cukup **Media** (karena di redev sudah pakai "Media"). Route `/media` sudah ada.

---

### 2.10 USERS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Users | `/users` | List user CMS | uni_user |
| Create New | `/users/new` | Tambah user | uni_user |
| Roles | `/users/roles` | Role management | uni_user_role, uni_user_roles_v2 |
| Permissions | `/users/permissions` | Permissions (v2) | uni_permissions_v2, uni_role_permissions_v2 |

**Tetap** sama dengan current.

---

### 2.11 SALESFORCE
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| API Responses | `/salesforce/responses` | Response dari Salesforce API | uni_salesforce_response |
| Payment Links (opsional) | `/salesforce/payment-links` | Payment link ke Salesforce | uni_salesforce_paymentlink |

**Tambahan redev:** Submenu **Payment Links** (opsional) agar jelas beda dengan "API Responses".

---

### 2.12 TOOLS & MONITORING
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Sent Items | `/tools/sent-items` | Email terkirim | uni_mail_sent |
| Log Activity | `/tools/log-activity` | Audit log aktivitas | uni_log_activity |

**Tetap** sama.

---

### 2.13 APPEARANCES
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| Menus | `/menus` | Menu navigasi (tree) | uni_menu |
| Placeholders | `/appearance/placeholders` | Placeholder template | uni_placeholder |
| Error Pages | `/appearance/error-pages` | Halaman error (bisa pakai uni_page + type/template) | uni_page atau uni_metadata |
| Thankyou Pages | `/appearance/thankyou-pages` | Halaman thank you | uni_page atau uni_metadata |
| Email Template | `/appearance/email-templates` | Template email (bisa simpan di uni_metadata atau uni_placeholder) | uni_metadata / uni_placeholder |

**REDEV:** Pastikan Error Pages & Thankyou Pages punya definisi jelas: pakai **uni_page** (type/template) atau **uni_metadata** (key-value).

---

### 2.14 SETTINGS
| Menu Item | Route (saran) | Deskripsi | DB Table |
|-----------|----------------|-----------|----------|
| System Information | `/settings/system` | Info sistem | uni_metadata (opsional) |
| General Settings | `/settings/general` | Setting umum | uni_metadata |
| UTM E-Certificate Settings | `/settings/utm-ecert` | Setting UTM e-cert | uni_metadata |
| Mailer Settings | `/settings/mailer` | Konfigurasi mail | uni_metadata |
| Media Settings | `/settings/media` | Upload, size, type | uni_metadata |
| Email Reminder Settings | `/settings/email-reminder` | Reminder email | uni_metadata / xendit_reminder |
| WhatsApp Bubble | `/settings/whatsapp-bubble` | Tracking klik WA bubble | uni_click_wa_bubble |

**Tetap** sama; WhatsApp Bubble jelas pakai **uni_click_wa_bubble**.

---

## 3. Ringkasan: Menu yang Harus Ada di REDEV CMS

- **Dashboard** – 1 item.
- **Pages** – All Pages, Create New (sudah ada di redev).
- **Donations (Articles)** – All Donations, Create New (ganti label dari "Articles").
- **Donation Reports** – 6 sub (All Request, Monthly New Register, All Transaction, Responses Finder, Weekly Donation, Payment Link Report).
- **Transaction Tools** – 4 sub (Bulk Stop, Salesforce Payload, Bulk Update Xendit, Bulk Update Midtrans).
- **E-Certificate Tools** – 4 sub (Custom, Custom Log, Download Log, UTM/Dynamic Download Log).
- **Data Collection** – 6 sub (Testimonial, Banks, Location, Support, FAQ, FAQ Weekly).
- **Subscribers** – All Subscribers.
- **Media** – Library (atau "Media").
- **Users** – Users, Create New, Roles, Permissions.
- **Salesforce** – API Responses (+ opsional Payment Links).
- **Tools & Monitoring** – Sent Items, Log Activity.
- **Appearances** – Menus, Placeholders, Error Pages, Thankyou Pages, Email Template.
- **Settings** – 7 sub (System, General, UTM E-Cert, Mailer, Media, Email Reminder, WhatsApp Bubble).

---

## 4. Perubahan Nama / Penambahan Dibanding Current

| Current | REDEV | Catatan |
|---------|--------|--------|
| ARTICLES | **DONATIONS** (atau Campaigns) | Sub: All Donations, Create New |
| E-Cert "Ty Download Log" | **Download Log** | uni_download_log |
| E-Cert "Dynamic Download Log" | **UTM / Dynamic Download Log** | uni_download_utm_ecertif_log |
| SALESFORCE | SALESFORCE | Tambah opsi sub: **Payment Links** |
| MEDIA – Library | MEDIA – **Library** atau **Media** | Sesuai copy redev |

Tidak ada menu current yang dihapus; hanya penyesuaian nama dan penambahan submenu opsional (Salesforce Payment Links).

---

## 5. Mapping Cepat: Route → Tabel Utama

| Area | Route prefix | Tabel utama |
|------|--------------|-------------|
| Dashboard | `/dashboard` | (agregasi) |
| Pages | `/pages` | uni_page |
| Donations | `/donations` | uni_donation |
| Reports | `/reports/*` | uni_transaction, uni_transaction_paid, uni_transaction_response, uni_transaction_weekly, uni_transaction_paymentlink |
| Transaction Tools | `/tools/*` | uni_transaction, uni_salesforce_*, uni_xendit_reminder_*, web_midtrans_callback |
| E-Cert Tools | `/tools/ecert/*` | uni_custom_ecert, uni_download_log, uni_download_utm_ecertif_log |
| Data Collection | `/data/*` | uni_data_testimony, uni_data_bank, uni_data_location, uni_data_support, uni_data_faq |
| Subscribers | `/subscribers` | uni_data_subscriber |
| Media | `/media` | uni_media |
| Users | `/users/*` | uni_user, uni_user_role, uni_permissions_v2, uni_role_permissions_v2, uni_user_roles_v2 |
| Salesforce | `/salesforce/*` | uni_salesforce_response, uni_salesforce_paymentlink |
| Tools & Monitoring | `/tools/sent-items`, `/tools/log-activity` | uni_mail_sent, uni_log_activity |
| Appearances | `/menus`, `/appearance/*` | uni_menu, uni_placeholder, uni_page / uni_metadata |
| Settings | `/settings/*` | uni_metadata, uni_click_wa_bubble |

Dokumen ini bisa dipakai sebagai acuan single source untuk menu dan route REDEV CMS serta untuk penyesuaian setelah ada detail dari Excel/PPT (mis. timeline atau fitur tambahan).
