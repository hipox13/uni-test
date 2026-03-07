# REDEV – Perbedaan DBML & Daftar Lengkap 48 Tabel

Dokumen ini menjelaskan **perbedaan kedua file DBML**, **total 48 tabel** (satu DB untuk CMS + Website + Donor Portal), dan **penyesuaian di docs** untuk fitur REDEV. **Prisma schema tidak diubah**; yang disesuaikan hanya dokumentasi.

---

## 1. Perbedaan DB Diagram: Current vs REDEV

| Aspek | `REDEV_DBDIAGRAM.dbml` | `REDEV_DBDIAGRAM_CURRENT.dbml` |
|-------|------------------------|--------------------------------|
| **Sumber** | Berdasarkan **Prisma schema** (API) | Berdasarkan **dump tabel current** (MySQL) yang kamu kirim |
| **Database type** | `PostgreSQL` | `MySQL` |
| **Naming kolom** | **snake_case** (Prisma/convention): `role_id`, `date_registered`, `author_id` | **Persis seperti di DB**: `roleId`, `dateRegistered`, `authorId` (camelCase) |
| **Tipe kolom** | Umum: `varchar`, `int`, `datetime`, `text` | Detail MySQL: `varchar(145)`, `int(10) unsigned`, `tinyint(3)`, `datetime`, dll. |
| **Project name** | `REDEV_CMS` | `REDEV_CMS_Current` |
| **Kegunaan** | Diagram untuk **API/Prisma** (satu DB full: CMS + Website + Donor Portal) | Diagram untuk **DB existing** (struktur asli MySQL) |
| **Jumlah tabel** | **48** | **48** (set yang sama) |

**Kesimpulan:**

- **REDEV_DBDIAGRAM.dbml** → pakai kalau mau diagram yang selaras dengan **Prisma** (PostgreSQL, snake_case).
- **REDEV_DBDIAGRAM_CURRENT.dbml** → pakai kalau mau diagram yang **persis seperti current DB** (MySQL, nama kolom asli).

Keduanya mendokumentasikan **satu DB yang sama** (48 tabel) untuk CMS, Website (checkout, payment, integrasi), dan Donor Portal.

---

## 2. Total Tabel: 48 (Daftar Lengkap)

Satu database dipakai untuk:

- **CMS** (dashboard, pages, donations, reports, users, media, settings, dll.)
- **Website** (checkout, payment gateway, transaksi, callback Xendit/Midtrans/DOKU)
- **Donor Portal** (user, session, token, transaksi donor, subscription)

Daftar 48 tabel di bawah mengikuti urutan Prisma; nama tabel = `@@map(...)` di schema.

### 2.1 User & Auth (7 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 1 | `uni_user` | UniUser | **CMS** (user admin), **Donor Portal** (donor/account) |
| 2 | `uni_user_role` | UniUserRole | **CMS** (role admin), **Donor Portal** (role donor) |
| 3 | `uni_user_logged_token` | UniUserLoggedToken | **CMS** (session admin), **Donor Portal** (session donor) |
| 4 | `uni_user_password_history` | UniUserPasswordHistory | **CMS** + **Donor Portal** (riwayat ganti password) |
| 5 | `uni_user_reqtoken` | UniUserReqtoken | **CMS** (preview/reset token), **Donor Portal** (reset password, magic link) |
| 6 | `uni_user_permission` | UniUserPermission | **CMS** (permission legacy) |
| 7 | `uni_user_roles_v2` | UniUserRolesV2 | **CMS** (user–role v2), **Donor Portal** (role donor) |

### 2.2 Role & Permission (3 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 8 | `uni_permissions_v2` | UniPermissionsV2 | **CMS** (definisi permission) |
| 9 | `uni_role_permissions_v2` | UniRolePermissionsV2 | **CMS** (role–permission) |
| 10 | `uni_role_history` | UniRoleHistory | **CMS** (audit perubahan role) |

### 2.3 CMS – Content: Donation & Pages (7 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 11 | `uni_donation` | UniDonation | **CMS** (kampanye/artikel donasi), **Website** (landing/checkout) |
| 12 | `uni_donation_edits` | UniDonationEdits | **CMS** (co-edit donation) |
| 13 | `uni_donation_tag` | UniDonationTag | **CMS** (tag donasi) |
| 14 | `uni_tag` | UniTag | **CMS** (master tag) |
| 15 | `uni_page` | UniPage | **CMS** (halaman static/block), **Website** (halaman umum) |
| 16 | `uni_page_edits` | UniPageEdits | **CMS** (co-edit page) |
| 17 | `uni_placeholder` | UniPlaceholder | **CMS** (placeholder, email template, error/thankyou page) |

### 2.4 CMS – Data Collections & Metadata (7 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 18 | `uni_metadata` | UniMetadata | **CMS** (settings umum, mailer, media, payment channel config) |
| 19 | `uni_data_faq` | UniDataFaq | **CMS** (FAQ), **Website** (tampilan FAQ) |
| 20 | `uni_data_bank` | UniDataBank | **CMS** (data bank), **Website** (opsi pembayaran) |
| 21 | `uni_data_location` | UniDataLocation | **CMS** (lokasi UNICEF), **Website** (tampilan) |
| 22 | `uni_data_subscriber` | UniDataSubscriber | **CMS** (subscriber), **Website** (form subscribe) |
| 23 | `uni_data_support` | UniDataSupport | **CMS** (partner support), **Website** (tampilan) |
| 24 | `uni_data_testimony` | UniDataTestimony | **CMS** (testimoni), **Website** (tampilan) |

### 2.5 CMS – Media & Menu (2 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 25 | `uni_media` | UniMedia | **CMS** (media library), **Website** (gambar/asset) |
| 26 | `uni_menu` | UniMenu | **CMS** (menu), **Website** (navigasi) |

### 2.6 Payment & Transaction – Core (10 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 27 | `uni_payment_channel` | UniPaymentChannel | **CMS** (config channel), **Website** (checkout/payment) |
| 28 | `uni_transaction` | UniTransaction | **CMS** (laporan, detail transaksi), **Website** (order/checkout), **Donor Portal** (donation history, subscription) |
| 29 | `uni_transaction_paid` | UniTransactionPaid | **CMS** (laporan bayar), **Website** (konfirmasi bayar), **Donor Portal** (riwayat bayar) |
| 30 | `uni_transaction_response` | UniTransactionResponse | **Website** (callback PSP), **CMS** (response finder) |
| 31 | `uni_transaction_weekly` | UniTransactionWeekly | **CMS** (weekly report), **Website** (donasi mingguan) |
| 32 | `uni_transaction_paymentlink` | UniTransactionPaymentlink | **Website** (payment link), **CMS** (monitoring) |
| 33 | `uni_click_wa_bubble` | UniClickWaBubble | **CMS** (WA bubble report), **Website** (konfigurasi bubble) |
| 34 | `uni_gopay_retries` | UniGopayRetries | **Website** (retry Gopay) |
| 35 | `uni_salesforce_paymentlink` | UniSalesforcePaymentlink | **CMS** (Salesforce payment link), **Integration** (Salesforce) |
| 36 | `uni_salesforce_response` | UniSalesforceResponse | **CMS** (API Responses), **Integration** (Salesforce) |

### 2.7 Logging, Mail, Download & E-Cert (6 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 37 | `uni_log_activity` | UniLogActivity | **CMS** (audit log) |
| 38 | `uni_mail_sent` | UniMailSent | **CMS** (Sent Items), **Website** (konfirmasi email), **Donor Portal** (email ke donor) |
| 39 | `uni_download_log` | UniDownloadLog | **CMS** (TY Download Log), **Website** (thank you page download) |
| 40 | `uni_download_utm_ecertif_log` | UniDownloadUtmEcertifLog | **CMS** (Dynamic Download Log) |
| 41 | `uni_custom_ecert` | UniCustomEcert | **CMS** (Custom E-Certificate), **Website** (generate e-cert) |
| 42 | `uni_xendit_reminder_payment_link` | UniXenditReminderPaymentLink | **Website** (reminder Xendit), **CMS** (monitoring) |

### 2.8 Shorten Link & Legacy Web (6 tabel)

| # | Tabel | Prisma model | Dipakai oleh |
|---|------|--------------|--------------|
| 43 | `uni_z_shorten_link` | UniZShortenLink | **Website** (URL shortener), **Value max** (personalized link) |
| 44 | `web_doku_rcrreg_notify` | WebDokuRcrregNotify | **Website** (callback DOKU) |
| 45 | `web_midtrans_callback` | WebMidtransCallback | **Website** (callback Midtrans) |
| 46 | `web_transaction` | WebTransaction | **Website** (legacy transaksi) |
| 47 | `web_xendit_callback` | WebXenditCallback | **Website** (callback Xendit) |
| 48 | `web_xendit_recurring` | WebXenditRecurring | **Website** (recurring Xendit), **Donor Portal** (subscription) |

---

## 3. Ringkasan Per Tujuan

- **Hanya CMS:** uni_donation_edits, uni_donation_tag, uni_tag, uni_page_edits, uni_placeholder, uni_permissions_v2, uni_role_permissions_v2, uni_role_history, uni_log_activity, uni_user_permission (dan sebagian uni_metadata, uni_menu, uni_media).
- **CMS + Website:** uni_donation, uni_page, uni_data_*, uni_media, uni_menu, uni_payment_channel, uni_metadata, uni_click_wa_bubble, uni_custom_ecert, uni_download_*, uni_mail_sent, uni_salesforce_*, uni_transaction*, uni_z_shorten_link, web_*.
- **CMS + Donor Portal:** uni_user, uni_user_role, uni_user_logged_token, uni_user_password_history, uni_user_reqtoken, uni_user_roles_v2.
- **Website + Donor Portal:** uni_transaction, uni_transaction_paid, uni_transaction_weekly, web_xendit_recurring, uni_mail_sent.

Semua tabel di atas adalah **satu DB**; tidak ada pemisahan DB per produk.

---

## 4. Penyesuaian di Docs untuk REDEV

Yang dilakukan **hanya di docs** (Prisma tetap 48 tabel, tidak diubah):

1. **REDEV_DBDIAGRAM.dbml**  
   - Sudah berisi 48 tabel selaras Prisma (PostgreSQL, snake_case).  
   - Dipakai sebagai diagram “REDEV full” (CMS + Website + Donor Portal).

2. **REDEV_DBDIAGRAM_CURRENT.dbml**  
   - Ditambah agar **persis** dengan struktur current (MySQL, camelCase) yang kamu kirim.  
   - 48 tabel yang sama, hanya konvensi nama dan tipe disesuaikan dengan dump.

3. **REDEV_CMS_SITEMAP.md**  
   - Sitemap REDEV CMS dengan mapping menu → tabel (pages, donations, reports, dll.).

4. **REDEV_FEATURE_TABLE_MAPPING.md**  
   - Mapping fitur REDEV (CMS menu, Website menu, Donor Portal menu) ke tabel.  
   - Matriks fungsi (Add New, Update, Delete, Export, Filter, dll.) per menu CMS.  
   - Tabel yang dipakai untuk Website (checkout, integrasi, payment success, analytics) dan Donor Portal (account, session, donation history, subscription, refund, dll.).

5. **REDEV_DB_DIAGRAM_AND_TABLES.md** (dokumen ini)  
   - Penjelasan beda kedua DBML.  
   - Daftar lengkap 48 tabel + penggunaan (CMS / Website / Donor Portal).  
   - Ringkasan penyesuaian docs untuk REDEV.

**Tidak ada penambahan atau pengurangan tabel di Prisma**; yang disesuaikan hanya dokumentasi agar fitur-fitur REDEV (CMS, Website, Donor Portal) terpetakan ke 48 tabel yang sudah ada. Jika nanti ada kebutuhan tabel baru (mis. refund, saved payment method, redirect), itu bisa ditambah terpisah ke Prisma dan ke DBML.

---

## 5. Cara Pakai File DBML

- **Import ke dbdiagram.io:** Create New Diagram → Import → Import from DBML → pilih file.
- **REDEV_DBDIAGRAM.dbml** → diagram “standar REDEV” (selaras Prisma).
- **REDEV_DBDIAGRAM_CURRENT.dbml** → diagram “current DB” (MySQL, nama kolom asli).

Keduanya merepresentasikan **48 tabel yang sama** untuk satu database penuh (CMS + Website + Donor Portal).
