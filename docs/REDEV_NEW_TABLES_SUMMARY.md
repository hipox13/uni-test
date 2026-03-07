# REDEV – Ringkasan Tabel & Field Baru di Prisma

Dokumen ini menjelaskan **tabel dan relasi baru** yang ditambahkan ke `unicef-redev-api/prisma/schema.prisma` untuk mendukung fitur REDEV (CMS, Website, Donor Portal). **Tabel existing (uni_*, web_*) tidak diubah**; hanya penambahan model baru dengan prefix **redev_**.

---

## 1. Daftar Tabel Baru (15 tabel)

| # | Tabel (Prisma model) | Map DB | Fitur REDEV yang dilayani |
|---|----------------------|--------|----------------------------|
| 1 | RedevLeadSubmission | redev_lead_submission | Lead submissions list, Lead data export, General forms (surveys, contact, lead gen) |
| 2 | RedevRedirect | redev_redirect | Page redirects list, Redirect management (URL, IP/geo) |
| 3 | RedevDonorPaymentMethod | redev_donor_payment_method | Saved payment methods, Update payment method (Donor Portal) |
| 4 | RedevRefundRequest | redev_refund_request | Request refund, Refund status, Donor care approve/reject |
| 5 | RedevConsentHistory | redev_consent_history | Communication preferences, Marketing consent history |
| 6 | RedevSupportTicket | redev_support_ticket | Support tickets, Create and track help cases |
| 7 | RedevDonorAddress | redev_donor_address | Address book (billing/shipping, label, default) |
| 8 | RedevContentComment | redev_content_comment | Inline comments on pages/donations (authoring) |
| 9 | RedevContentBlock | redev_content_block | Reusable modules library, Content blocks library |
| 10 | RedevSecurityBlock | redev_security_block | Block country/IPs (Security – Website) |
| 11 | RedevWebForm | redev_web_form | Web-forms list, Form definitions (non-donation) |
| 12 | RedevPersonalizedLink | redev_personalized_link | Value max: personalized URLs (upgrade, save, reactivate, extra cash, pledge, payment update) |
| 13 | RedevDonorInterest | redev_donor_interest | Capture interests/campaigns, Capture surveys/questions |
| 14 | RedevAbandonedCart | redev_abandoned_cart | Abandoned donation (cart) recovery |
| 15 | RedevUserAuthMethod | redev_user_auth_method | SSO login, Passkey/biometric, Multi-factor authentication |

---

## 2. Kenapa tabel ini dipakai (per fitur)

### 2.1 Admin/Data & Website – Lead & Forms

- **RedevLeadSubmission**  
  **Untuk apa:** Menyimpan semua submission form non-donasi (contact us, survey, lead gen) yang integrasi ke CRM.  
  **Kenapa tabel baru:** Data lead beda dengan transaksi donasi (uni_transaction); butuh list terpisah untuk “Lead submissions list”, export lead, dan filter per form/source.  
  **Field kunci:** formId (opsional, ke RedevWebForm), source, email, name, phone, payload (JSON), createdAt.

- **RedevWebForm**  
  **Untuk apa:** Definisi form non-donasi (field, validasi, target URL) untuk “Web-forms list” dan form umum.  
  **Kenapa tabel baru:** Supaya form terdaftar di CMS dan submission (RedevLeadSubmission) bisa dikaitkan ke form mana.

### 2.2 Governance & Admin – Redirect

- **RedevRedirect**  
  **Untuk apa:** Aturan redirect: URL → URL, atau berdasarkan country/IP (geo/internal).  
  **Kenapa tabel baru:** Redirect management butuh entitas tersendiri (prioritas, aktif/nonaktif, tipe) dan tidak cocok hanya di uni_metadata.

### 2.3 Donor Portal – Pembayaran & Alamat

- **RedevDonorPaymentMethod**  
  **Untuk apa:** Metode pembayaran tersimpan donor (token PSP, last4, brand) untuk one-click atau ganti metode.  
  **Kenapa tabel baru:** uni_transaction hanya simpan transaksi per kejadian; “Saved payment methods” butuh entitas per user (userId + gateway + token/isDefault).

- **RedevDonorAddress**  
  **Untuk apa:** Buku alamat donor: beberapa alamat dengan label (Home/Office/Billing/Shipping) dan default.  
  **Kenapa tabel baru:** uni_user hanya satu address; “Address book” butuh banyak alamat per user dengan label dan default.

### 2.4 Donor Portal – Refund

- **RedevRefundRequest**  
  **Untuk apa:** Alur refund: donor minta refund → status (pending/approved/rejected) → donor care review.  
  **Kenapa tabel baru:** Status refund dan approval tidak cukup hanya di uni_transaction; butuh riwayat request, alasan, reviewer, dan response message.

### 2.5 Donor Portal – Consent & Komunikasi

- **RedevConsentHistory**  
  **Untuk apa:** Riwayat preferensi komunikasi (email/SMS/WhatsApp/push) dan consent marketing per channel/topic.  
  **Kenapa tabel baru:** “Marketing consent history” harus auditable (siapa, kapan, channel/topic, consent true/false); tidak cukup hanya satu kolom di uni_user.

### 2.6 Donor Portal – Support

- **RedevSupportTicket**  
  **Untuk apa:** Tiket bantuan donor: buat tiket, status (open/pending/resolved/closed), assign ke staff.  
  **Kenapa tabel baru:** Butuh entitas tiket terpisah dari transaksi dan user; untuk “Support tickets” dan “Create and track help cases”.

### 2.7 Authoring – Komentar & Blok

- **RedevContentComment**  
  **Untuk apa:** Komentar inline di halaman atau donasi (page/donation + opsional blockId) untuk review copy/design/legal.  
  **Kenapa tabel baru:** Butuh relasi ke UniPage/UniDonation dan author; resolvedAt/resolvedBy untuk workflow.

- **RedevContentBlock**  
  **Untuk apa:** Library blok konten yang bisa dipakai ulang (accordion, carousel, FAQ, card, dll.).  
  **Kenapa tabel baru:** “Reusable modules library” butuh entitas blok (name, slug, body JSON, type) terpisah dari konten halaman.

### 2.8 Website – Keamanan

- **RedevSecurityBlock**  
  **Untuk apa:** Blokir akses berdasarkan country atau IP (scope global/market/site).  
  **Kenapa tabel baru:** “Block country/IPs” butuh daftar rule (type, value, scope, isActive) yang bisa dikelola terpisah dari uni_metadata.

### 2.9 Value Max – Personalized URL

- **RedevPersonalizedLink**  
  **Untuk apa:** Link personalisasi untuk aksi donor: upgrade, save, reactivate, extra cash, pledge conversion, update payment (tanpa isi form PII).  
  **Kenapa tabel baru:** Butuh token unik, tipe aksi, kaitan ke user/transaksi, expiry dan usedAt; uni_user_reqtoken lebih umum (auth/preview), jadi dedicated table lebih jelas untuk value max.

### 2.10 Donor Portal – Minat & Survey

- **RedevDonorInterest**  
  **Untuk apa:** Simpan minat donor dan jawaban survey (campaign/interest code, response).  
  **Kenapa tabel baru:** “Capture interests/campaigns” dan “Capture surveys/questions” butuh riwayat per user per source/key; tidak cukup hanya metaData di transaksi.

### 2.11 Website – Abandoned Cart

- **RedevAbandonedCart**  
  **Untuk apa:** Data keranjang/checkout yang tidak selesai untuk email/SMS recovery.  
  **Kenapa tabel baru:** Butuh snapshot (email, session, articleId, amount, step, payload) dan flag emailSentAt; berbeda dari uni_transaction yang untuk transaksi yang jadi.

### 2.12 Donor Portal – Auth (SSO / Passkey / MFA)

- **RedevUserAuthMethod**  
  **Untuk apa:** Kaitan user ke metode auth eksternal: SSO (Google/Apple), Passkey, MFA (TOTP).  
  **Kenapa tabel baru:** “Social/SSO login”, “Passkey/biometric”, “Multi-factor authentication” butuh simpan provider, providerId, dan meta (mis. credential id) per user.

---

## 3. Relasi ke Tabel Existing

- **UniUser** → dipakai oleh: RedevDonorPaymentMethod, RedevConsentHistory, RedevSupportTicket, RedevDonorAddress, RedevDonorInterest, RedevUserAuthMethod, RedevRefundRequest (user + reviewer), RedevContentComment (author), RedevPersonalizedLink (opsional userId).
- **UniTransaction** → dipakai oleh: RedevRefundRequest (transactionRefId), RedevPersonalizedLink (refId opsional).
- **UniPage** → dipakai oleh: RedevContentComment (pageId opsional).
- **UniDonation** → dipakai oleh: RedevContentComment (donationId opsional).
- **RedevWebForm** → dipakai oleh: RedevLeadSubmission (formId opsional).

Tidak ada penghapusan atau perubahan kolom di uni_* / web_*; hanya penambahan relasi dari sisi model redev_* (dan back-relation di UniUser, UniTransaction, UniPage, UniDonation).

---

## 4. Field baru di tabel existing

Tidak ada field baru yang ditambahkan ke uni_user, uni_transaction, dll. Semua kebutuhan REDEV untuk fitur di atas dipenuhi dengan **tabel baru redev_***. Jika nanti butuh kolom tambahan di tabel existing (mis. uni_user.preferredLanguage), bisa ditambah terpisah.

---

## 5. Migrasi

Setelah menambah model di Prisma:

1. Buat migrasi: `npx prisma migrate dev --name add_redev_tables`
2. Cek hasil di DB dan pastikan hanya tabel **redev_*** yang bertambah.

---

## 6. Ringkasan per area fitur

| Area | Tabel baru | Kegunaan singkat |
|------|------------|------------------|
| Admin/Data | RedevLeadSubmission, RedevWebForm, RedevRedirect | Lead list & export, web-forms list, redirect list |
| Donor Portal | RedevDonorPaymentMethod, RedevDonorAddress, RedevRefundRequest, RedevConsentHistory, RedevSupportTicket, RedevDonorInterest, RedevUserAuthMethod | Saved payment, address book, refund flow, consent history, tickets, interests/surveys, SSO/Passkey/MFA |
| Authoring | RedevContentComment, RedevContentBlock | Inline comments, reusable blocks |
| Website | RedevSecurityBlock, RedevAbandonedCart | Block country/IP, abandoned cart recovery |
| Value max | RedevPersonalizedLink | Personalized one-click URLs |

Semua tabel di atas sudah ditambahkan ke **prisma/schema.prisma** dan siap dipakai untuk implementasi fitur REDEV.
