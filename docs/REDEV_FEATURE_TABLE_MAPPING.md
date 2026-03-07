# REDEV Feature List – Mapping to Tables & Functionality

Dokumen ini memetakan **REDEV CMS feature list**, **Website menu**, dan **Donor Portal menu** ke tabel database (current) dan matriks fungsi (Add New, Update, Delete, Export, Filter, dll).  
**Prisma schema tidak diubah**; mapping mengacu ke struktur tabel current.

---

## 1. CMS Menu → Table & Functionality

| No | Menu | Submenu | Description | Primary Table(s) | Add New | Update | Status | Delete | Export | Visibility | Filter Date | Filter Trans | Duplicate |
|----|------|---------|-------------|------------------|---------|--------|--------|--------|--------|------------|-------------|--------------|-----------|
| 1 | Dashboard | Total Donation | Total donation per payment/campaign | uni_transaction, uni_transaction_paid | - | - | - | - | - | - | Yes | - | - |
| 1 | Dashboard | Total Donor | Total donor per payment/campaign | uni_transaction | - | - | - | - | - | - | - | - | - |
| 2 | Pages | All Pages | List of pages | uni_page | Yes | Yes | Yes | Yes | - | - | - | - | Yes |
| 2 | Pages | Create New | Create new page | uni_page | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 3 | Articles | All Articles | Update landing page content | uni_donation | Yes | Yes | Yes | Yes | Yes | - | - | - | Yes |
| 3 | Articles | Create New Article | Article category data | uni_donation | - | - | - | - | - | - | - | - | - |
| 4 | Donation Reports | All Requests | All transaction requests | uni_transaction | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 4 | Donation Reports | Monthly New Register | Monthly type reports | uni_transaction | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 4 | Donation Reports | All Transactions | Paid transactions | uni_transaction_paid, uni_transaction | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 4 | Donation Reports | Response Finder | Response per transaction | uni_transaction_response | - | - | - | - | - | - | - | - | - |
| 4 | Donation Reports | Weekly Donation | Weekly type reports | uni_transaction_weekly | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 4 | Donation Reports | Detail Transaction | Transaction detail | uni_transaction, uni_transaction_paid | - | - | - | - | - | - | - | - | - |
| 4 | Donation Reports | Edit Subscription | Edit monthly subscription | uni_transaction | - | Yes | - | - | - | - | - | - | - |
| 5 | WA Bubble Reports | Click Report | Configure WhatsApp floating icon | uni_click_wa_bubble | - | Yes | - | - | - | - | - | - | - |
| 6 | Transaction Tools | Bulk Stop | Stop multiple transactions | uni_transaction | - | - | - | - | - | - | - | - | - |
| 6 | Transaction Tools | Salesforce Payload | Send Salesforce payload | uni_salesforce_paymentlink | - | - | - | - | - | - | - | - | - |
| 6 | Transaction Tools | Bulk Update Xendit | Update Xendit transactions | uni_transaction, uni_xendit_reminder_payment_link | - | - | - | - | - | - | - | - | - |
| 6 | Transaction Tools | Bulk Update Midtrans | Update Midtrans transactions | web_midtrans_callback, uni_transaction | - | - | - | - | - | - | - | - | - |
| 7 | e-Certificate Tools | Custom E-Certificate | Customize e-cert | uni_custom_ecert | Yes | Yes | - | - | - | - | - | - | - |
| 7 | e-Certificate Tools | Custom E-Certificate Log | List custom e-certs | uni_custom_ecert | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 7 | e-Certificate Tools | TY Download Log | Thank You page download log | uni_download_log | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 7 | e-Certificate Tools | Dynamic Download Log | Dynamic e-cert download log | uni_download_utm_ecertif_log | - | - | - | - | Yes | Yes | Yes | - | - |
| 8 | Data Collections | Testimonial | Testimonial section | uni_data_testimony | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 8 | Data Collections | Bank | Bank data for donation | uni_data_bank | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 8 | Data Collections | Location | UNICEF location data | uni_data_location | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 8 | Data Collections | Support | Partner support list | uni_data_support | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 8 | Data Collections | FAQ | FAQ page content | uni_data_faq | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 8 | Data Collections | FAQ Weekly | FAQ Weekly page | uni_data_faq | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 9 | Subscribers | All Subscribers | List subscribers | uni_data_subscriber | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 10 | Media | Library | Media library | uni_media | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 11 | Users | User | Manage users | uni_user | Yes | Yes | Yes | Yes | - | - | - | - | - |
| 11 | Users | Create New | New role/user | uni_user, uni_user_role | Yes | - | - | - | - | - | - | - | - |
| 11 | Users | Roles | Role management | uni_user_role | Yes | Yes | - | Yes | - | - | - | - | - |
| 11 | Users | Permissions | Permissions | uni_permissions_v2 | - | - | - | - | - | - | - | - | - |
| 12 | Salesforce | API Responses | Salesforce data | uni_salesforce_response | - | - | - | - | Yes | Yes | Yes | Yes | - |
| 13 | Tools Monitoring | Sent Items | Sent emails list | uni_mail_sent | - | - | - | - | - | - | - | - | - |
| 13 | Tools Monitoring | Log Activity | Activity log | uni_log_activity | - | - | - | - | - | - | Yes | Yes | - |
| 14 | Appearances | Menus | Site menus | uni_menu | Yes | Yes | - | - | - | - | - | - | - |
| 14 | Appearances | Placeholders | Placeholder data | uni_placeholder | Yes | Yes | - | Yes | - | - | - | - | - |
| 14 | Appearances | Error Pages | Error page config | uni_page / uni_metadata | - | Yes | - | - | - | - | - | - | - |
| 14 | Appearances | Thankyou Pages | Thank you page config | uni_page / uni_metadata | - | Yes | - | - | - | - | - | - | - |
| 14 | Appearances | Email Template | Email templates | uni_placeholder / uni_metadata | - | Yes | - | - | - | - | - | - | - |
| 15 | Settings | System Information | PHP/DB version, etc. | (read-only) | - | - | - | - | - | - | - | - | - |
| 15 | Settings | General Settings | Site name, description | uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | UTM e-Certificate Settings | UTM e-cert config | uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | Mailer Settings | Email config | uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | Media Settings | Upload size, thumbnail | uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | Email Reminder Settings | Reminder config | uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | Whatsapp Bubble | WA bubble config | uni_click_wa_bubble / uni_metadata | - | - | - | - | - | - | - | - | - |
| 15 | Settings | Payment Channels | Payment channel config | uni_payment_channel | - | - | - | - | - | - | - | - | - |
| 15 | Profile | User Profile | User info | uni_user | - | - | - | - | - | - | - | - | - |
| 15 | Profile | Edit Profile | Edit user info | uni_user | - | Yes | - | - | - | - | - | - | - |
| 15 | Profile | Logout | Sign out | (session) | - | - | - | - | - | - | - | - | - |
| 16 | Login | Forgot Password | Password reset | uni_user_reqtoken | - | - | - | - | - | - | - | - | - |
| 17 | Detail Transaction | Detail Transaction | Transaction info | uni_transaction | - | - | - | - | - | - | - | - | - |
| 17 | Detail Transaction | Edit Subscription | Edit monthly | uni_transaction | - | Yes | - | - | - | - | - | - | - |
| 17 | Detail Transaction | Resend Thank You Email | Resend confirmation | uni_transaction, uni_mail_sent | - | - | - | - | - | - | - | - | - |
| 17 | Detail Transaction | Edit Consent | Donor consent | uni_transaction.consent | - | Yes | - | - | - | - | - | - | - |
| 17 | Detail Transaction | Navigation to donation page | Redirect URL | uni_donation / uni_metadata | - | - | - | - | - | - | - | - | - |

---

## 2. Admin/Data & Architecture (Items 18–21) – Table Mapping

| Feature Area | Feature | Table(s) / Note |
|--------------|--------|------------------|
| Integration | Salesforce NPSP integration | uni_salesforce_response, uni_salesforce_paymentlink, uni_transaction |
| Admin/Data | Role, profile, permissions | uni_user_role, uni_user_roles_v2, uni_permissions_v2, uni_role_permissions_v2 |
| Admin/Data | Audit log | uni_log_activity |
| Admin/Data | Campaign list | uni_donation |
| Admin/Data | Donation data export | uni_transaction, uni_transaction_paid |
| Admin/Data | Lead data export | (lead form submissions – may need new table or uni_metadata) |
| Admin/Data | Lead submissions list | (same as above) |
| Admin/Data | Donation Report | uni_transaction, uni_transaction_paid |
| Admin/Data | Page redirects list | (redirect rules – uni_metadata or new table) |
| Admin/Data | People & roles list | uni_user, uni_user_role |
| Admin/Data | Web-forms list | (forms config – uni_metadata or new table) |
| Architecture | Multiple Salesforce org | (config – uni_metadata or new table) |
| Architecture | Headless API | (no new table – expose existing) |
| Architecture | Custom Metadata | uni_transaction.metaData, uni_donation.metaData |
| Authoring | Create/edit/duplicate pages | uni_page |
| Authoring | Content blocks library | uni_page.body (JSON blocks) |
| Authoring | Drag-and-drop editor | (UI – uni_page.body) |
| Authoring | Reusable modules library | (could extend uni_page or new table) |
| Authoring | Page preview by device | (UI – uni_page, uni_user_reqtoken for preview token) |
| Authoring | Real-time co-editing | uni_page_edits |
| Authoring | Inline comments | (new table or uni_metadata) |

---

## 3. Website Menu (Checkout, Integration, etc.) – Table Mapping

| Menu | Submenu / Feature | Table(s) |
|------|-------------------|----------|
| Checkout | Multi-step form, product type, amounts, etc. | uni_donation (campaign/config), uni_transaction (order), uni_payment_channel |
| Checkout | Thank-you / failed messages | uni_donation (thankyouPicture, etc.), front-end config |
| Checkout | General forms, lead | uni_transaction or lead table (TBD) |
| Checkout | Donation cart, embeddable widget | (session/cookie + uni_donation) |
| Integration | Xendit / Midtrans / DOKU | uni_transaction_response, web_xendit_callback, web_midtrans_callback, web_doku_rcrreg_notify |
| Security | Block country/IPs | (config – uni_metadata or new) |
| Payment Success | Donor ID Card | uni_transaction, uni_user (if linked) |
| Analytics | Data layer, GTM, pixels | (config – uni_metadata) |

---

## 4. Donor Portal Menu – Table Mapping

| Menu | Submenu | Table(s) |
|------|---------|----------|
| Donor Portal | Account registration | uni_user |
| Donor Portal | Social / SSO, Passkey, MFA, Session | uni_user, uni_user_logged_token, uni_user_reqtoken |
| Donor Portal | Password reset | uni_user_reqtoken |
| Donor Portal | Personal info, Address book | uni_user (extend or new address table) |
| Donor Portal | Saved payment methods | (new table or PSP token – not in current dump) |
| Donor Portal | Donation history | uni_transaction, uni_transaction_paid |
| Donor Portal | Request refund / Refund status | (refund flow – extend uni_transaction or new table) |
| Donor Portal | Manage subscriptions | uni_transaction (recurring), uni_transaction_paid, uni_transaction_weekly |
| Donor Portal | Change frequency, billing date, skip/pause | uni_transaction |
| Donor Portal | Change amount, Update payment method | uni_transaction |
| Donor Portal | Capture interests/surveys | (new table or uni_transaction.metaData) |
| Donor Portal | Communication preferences | (new table or uni_user.metaData) |
| Donor Portal | Support tickets, Live chat | (new table) |
| Donor Portal | Download my data, Privacy settings | uni_user, uni_transaction (export) |

*Donor Portal: banyak fitur memakai **uni_user** dan **uni_transaction**; saved payment methods, refund, preferences, tickets biasanya butuh tabel baru nanti (tidak mengubah Prisma existing).*

---

## 5. Design System, Media, SEO, Governance (Items 22, 23, 24, 27, 28)

| Area | Feature | Table(s) |
|------|--------|----------|
| Design System | Duplicate landing pages, Layout templates, Themes | uni_donation, uni_page |
| Design System | Logo library, Promo bar, CTA, Menu builder | uni_media, uni_metadata, uni_menu |
| Media & Assets | Media library, Video, PDF, Tagging | uni_media |
| Internationalization | SEO & metadata | uni_page (metaData), uni_donation |
| Governance | URL management, Redirects, Backups | uni_metadata, uni_page.slug |
| SEO | Sitemap xml, Robots.txt, Index/noindex | (generated from uni_page, uni_donation; config in uni_metadata) |

---

## 6. Value Max & Personalization (Items 26, 29)

| Feature | Table(s) / Note |
|---------|------------------|
| Personalized upgrade / save / reactivate / extra cash / pledge conversion / payment method update | uni_transaction, uni_user; personalized URLs bisa disimpan di uni_user_reqtoken atau tabel baru (short-lived tokens). |
| Content personalization | uni_page.body, uni_metadata (rules) |

---

## 7. Ringkasan: Tabel Current vs Fitur Baru

- **Semua menu CMS (1–17)** dan Admin/Data (18–19) sudah ter-cover oleh tabel current (uni_*, web_*).
- **Prisma schema tidak diubah**; DBML dan dokumen ini mengacu ke struktur current.
- Fitur yang mungkin butuh **tabel baru** (bukan mengubah Prisma existing, tapi penambahan nanti):
  - Lead submissions (jika belum pakai uni_transaction atau form generic).
  - Redirect rules (jika tidak pakai uni_metadata).
  - Donor: saved payment methods, refund workflow, communication preferences, support tickets.
  - Reusable blocks library (bisa pakai uni_page atau tabel baru).
  - Inline comments (tabel baru atau uni_metadata).

Import **`docs/REDEV_DBDIAGRAM_CURRENT.dbml`** ke dbdiagram.io untuk diagram yang sesuai current tables.
