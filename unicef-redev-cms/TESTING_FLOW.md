# CMS Testing Flow Guide

Panduan lengkap untuk menguji semua fitur CMS yang telah dibuat.

## Prerequisites

1. **Backend API harus running:**
   ```bash
   cd unicef-redev-api
   npm run dev
   # API akan berjalan di http://localhost:3000
   ```

2. **Frontend CMS harus running:**
   ```bash
   cd unicef-redev-cms
   npm run dev
   # CMS akan berjalan di http://localhost:5174
   ```

3. **Mock Data Mode (Optional):**
   - Jika ingin test tanpa database, set `VITE_USE_MOCK_DATA=true` di `.env`
   - Jika ingin test dengan database, set `VITE_USE_MOCK_DATA=false` atau hapus variabel tersebut

---

## Testing Flow

### 1. Dashboard Overview ✅

**Lokasi:** `/dashboard`

**Yang harus dicek:**
- [ ] Dashboard menampilkan statistik (Total Pages, Media Files, Menu Items, Recent Activity)
- [ ] Semua angka menunjukkan "0" jika belum ada data
- [ ] Quick Actions buttons terlihat dan bisa diklik
- [ ] Recent Pages section menampilkan pesan "No pages yet"

---

### 2. Pages Management (CRUD) 📄

#### 2.1 Create New Page

**Lokasi:** Klik "Create New Page" dari Dashboard atau `/pages/new`

**Steps:**
1. [ ] Klik button "Create New Page" atau navigasi ke `/pages/new`
2. [ ] Isi form Page Settings:
   - **Title:** "Test Page" (required)
   - **Slug:** "test-page" (optional, akan auto-generate dari title)
   - **Description:** "This is a test page description"
   - **Keywords:** "test, cms, unicef"
3. [ ] Tambahkan beberapa blocks dari sidebar:
   - Klik "Heading" → Isi text "Welcome to Test Page", pilih level H1
   - Klik "Rich Text" → Isi content "This is a paragraph of text..."
   - Klik "Image" → Masukkan image URL (atau gunakan URL dari media library nanti)
   - Klik "CTA Button" → Text: "Donate Now", URL: "/donate"
4. [ ] Klik "Save Draft" → Harus muncul alert "Page saved successfully!"
5. [ ] Verifikasi page muncul di list `/pages` dengan status "Draft"

#### 2.2 View Pages List

**Lokasi:** `/pages`

**Yang harus dicek:**
- [ ] List menampilkan semua pages yang sudah dibuat
- [ ] Kolom menampilkan: Title, Slug, Author, Status, Modified Date, Actions
- [ ] Status badge menampilkan warna yang sesuai:
  - Draft: gray
  - Review: yellow
  - Published: green
- [ ] Search bar berfungsi (coba cari "test")
- [ ] Status filter berfungsi (coba filter "Draft")

#### 2.3 Edit Page

**Lokasi:** `/pages/:id` (klik "Edit" pada page di list)

**Steps:**
1. [ ] Klik "Edit" pada salah satu page
2. [ ] Ubah title menjadi "Updated Test Page"
3. [ ] Tambahkan block baru (misalnya "Divider")
4. [ ] Edit block yang sudah ada (ubah text heading)
5. [ ] Drag & drop untuk reorder blocks (jika ada lebih dari 1 block)
6. [ ] Hapus salah satu block dengan klik "Remove"
7. [ ] Klik "Save Draft" → Verifikasi perubahan tersimpan

#### 2.4 Publish Page

**Lokasi:** `/pages/:id` (edit page yang sudah dibuat)

**Steps:**
1. [ ] Edit page yang statusnya "Draft"
2. [ ] Pastikan page memiliki title dan slug
3. [ ] Klik button "Publish" → Harus muncul alert "Page published!"
4. [ ] Kembali ke `/pages` → Verifikasi status berubah menjadi "Published"
5. [ ] Coba filter dengan status "Published" → Page harus muncul

#### 2.5 Delete Page

**Lokasi:** `/pages` (dari list)

**Steps:**
1. [ ] Klik "Delete" pada salah satu page
2. [ ] Konfirmasi deletion (jika ada confirmation dialog)
3. [ ] Verifikasi page hilang dari list

---

### 3. Media Library 📸

#### 3.1 Upload Media

**Lokasi:** `/media`

**Steps:**
1. [ ] Navigasi ke `/media`
2. [ ] Klik button "Upload Media"
3. [ ] Pilih file gambar (JPG, PNG) atau PDF
4. [ ] Tunggu upload selesai → Harus muncul alert "File uploaded successfully!"
5. [ ] Verifikasi file muncul di grid dengan thumbnail (untuk images)
6. [ ] Cek informasi file: Title, Type, File Size

#### 3.2 View Media Grid

**Yang harus dicek:**
- [ ] Grid menampilkan semua media files
- [ ] Images menampilkan thumbnail/preview
- [ ] PDF files menampilkan placeholder "PDF"
- [ ] Hover effect bekerja dengan baik
- [ ] Setiap card menampilkan: thumbnail, title, type, file size

#### 3.3 Search & Filter Media

**Steps:**
1. [ ] Gunakan search bar untuk mencari file berdasarkan nama
2. [ ] Gunakan type filter untuk filter "Images" atau "PDFs"
3. [ ] Verifikasi hasil filter sesuai

#### 3.4 Copy Media URL

**Steps:**
1. [ ] Klik button "Copy URL" pada salah satu media
2. [ ] Paste di browser/notepad → Verifikasi URL valid
3. [ ] URL harus bisa diakses (jika backend running dan file ada)

#### 3.5 Delete Media

**Steps:**
1. [ ] Klik "Delete" pada salah satu media
2. [ ] Konfirmasi deletion
3. [ ] Verifikasi file hilang dari grid
4. [ ] Verifikasi file juga terhapus dari server (cek folder uploads)

#### 3.6 Use Media in Page Editor

**Steps:**
1. [ ] Buka Page Editor (`/pages/new` atau edit existing page)
2. [ ] Tambahkan block "Image"
3. [ ] Copy URL dari Media Library
4. [ ] Paste URL ke field "Image URL" di Image block
5. [ ] Verifikasi preview image muncul
6. [ ] Save page → Verifikasi image muncul di page

---

### 4. Menus Management 🍔

#### 4.1 Create Menu Items

**Lokasi:** `/menus`

**Steps:**
1. [ ] Navigasi ke `/menus`
2. [ ] Klik "Add Menu Item"
3. [ ] Isi form:
   - **Title:** "Home" (required)
   - **URL:** "/"
   - **Target:** "Same window"
   - **Group:** "main"
   - **Parent Menu ID:** (kosongkan untuk root item)
   - **Order:** 1
4. [ ] Klik "Create" → Harus muncul alert "Menu created successfully!"
5. [ ] Buat beberapa menu items lagi:
   - "About" → URL: "/about", Group: "main", Order: 2
   - "Contact" → URL: "/contact", Group: "main", Order: 3
   - "Privacy" → URL: "/privacy", Group: "footer", Order: 1

#### 4.2 Create Nested Menu (Submenu)

**Steps:**
1. [ ] Buat parent menu: "Services" → URL: "/services", Group: "main"
2. [ ] Buat child menu: "Service 1" → URL: "/services/service-1", Parent Menu ID: [ID dari Services], Group: "main"
3. [ ] Buat child menu lagi: "Service 2" → URL: "/services/service-2", Parent Menu ID: [ID dari Services], Group: "main"
4. [ ] Verifikasi menu tree menampilkan hierarchy dengan indentasi
5. [ ] Child menus harus muncul di bawah parent dengan border-left

#### 4.3 Filter by Group

**Steps:**
1. [ ] Gunakan dropdown filter "All Groups"
2. [ ] Pilih "Main" → Hanya menu dengan group "main" yang muncul
3. [ ] Pilih "Footer" → Hanya menu dengan group "footer" yang muncul
4. [ ] Pilih "All Groups" → Semua menu muncul

#### 4.4 Edit Menu Item

**Steps:**
1. [ ] Klik "Edit" pada salah satu menu item
2. [ ] Ubah title menjadi "Updated Menu"
3. [ ] Ubah URL menjadi "/updated-url"
4. [ ] Klik "Update" → Harus muncul alert "Menu updated successfully!"
5. [ ] Verifikasi perubahan tersimpan

#### 4.5 Delete Menu Item

**Steps:**
1. [ ] Klik "Delete" pada salah satu menu item
2. [ ] Konfirmasi deletion
3. [ ] Verifikasi menu hilang dari tree
4. [ ] Jika ada child menus, verifikasi mereka juga terhapus (atau menjadi orphan)

---

### 5. Integration Testing 🔗

#### 5.1 Create Complete Page with All Block Types

**Steps:**
1. [ ] Buat page baru "Complete Test Page"
2. [ ] Tambahkan semua block types satu per satu:
   - **Heading:** "Main Heading" (H1)
   - **Rich Text:** "Paragraph content..."
   - **Image:** Upload image dari media library
   - **Gallery:** Multiple image URLs
   - **CTA Button:** "Click Here" → "/action"
   - **Embed:** YouTube URL
   - **FAQ Accordion:** Tambahkan 2-3 FAQ items
   - **Promo Bar:** Text + Link + Background color
   - **Divider:** Horizontal line
   - **Two Column:** Left dan right content
   - **Form Embed:** Form URL
3. [ ] Reorder blocks dengan drag & drop
4. [ ] Save dan Publish page
5. [ ] Verifikasi semua blocks tersimpan dengan benar

#### 5.2 Test Workflow: Draft → Review → Published

**Steps:**
1. [ ] Buat page baru → Status: Draft
2. [ ] Edit page → Tambahkan content
3. [ ] Save Draft → Status tetap Draft
4. [ ] Publish page → Status berubah ke Published
5. [ ] Verifikasi page bisa diakses via public URL (jika ada frontend public)

#### 5.3 Test Search Across All Modules

**Steps:**
1. [ ] Buat beberapa pages dengan title berbeda
2. [ ] Upload beberapa media files dengan nama berbeda
3. [ ] Buat beberapa menu items dengan title berbeda
4. [ ] Test search di masing-masing module:
   - Pages: Cari berdasarkan title
   - Media: Cari berdasarkan filename/title
   - Menus: (tidak ada search, tapi bisa filter by group)

---

### 6. Error Handling & Edge Cases ⚠️

#### 6.1 Test Empty States

**Yang harus dicek:**
- [ ] Pages list kosong → Menampilkan "No pages found" dengan button "Create your first page"
- [ ] Media grid kosong → Menampilkan "No media found" dengan button "Upload your first file"
- [ ] Menus tree kosong → Menampilkan "No menus found" dengan button "Create your first menu item"

#### 6.2 Test Validation

**Steps:**
1. [ ] Create page tanpa title → Harus muncul error/validation
2. [ ] Upload file terlalu besar → Harus muncul error
3. [ ] Upload file type tidak didukung → Harus muncul error
4. [ ] Create menu tanpa title → Harus muncul error

#### 6.3 Test Loading States

**Yang harus dicek:**
- [ ] Loading indicator muncul saat fetch data
- [ ] Loading state untuk upload media
- [ ] Loading state untuk save/publish page

#### 6.4 Test Network Errors

**Steps:**
1. [ ] Stop backend server
2. [ ] Coba fetch pages → Harus muncul error message yang user-friendly
3. [ ] Coba upload media → Harus muncul error message
4. [ ] Start backend server lagi → Coba lagi, harus berhasil

---

### 7. UI/UX Testing 🎨

#### 7.1 Responsive Design

**Yang harus dicek:**
- [ ] Sidebar responsive di mobile (collapse/expand)
- [ ] Tables responsive (scroll horizontal atau stack)
- [ ] Media grid responsive (columns adjust)
- [ ] Forms responsive

#### 7.2 Navigation

**Yang harus dicek:**
- [ ] Sidebar navigation highlight active page
- [ ] Breadcrumbs (jika ada) berfungsi
- [ ] Back button di page editor berfungsi
- [ ] Link navigation smooth

#### 7.3 Visual Consistency

**Yang harus dicek:**
- [ ] Semua buttons menggunakan style yang konsisten
- [ ] Colors sesuai dengan design system (calm palette)
- [ ] Typography konsisten
- [ ] Spacing konsisten
- [ ] Tidak ada icons/emojis (sesuai request)

---

## Checklist Summary

### Pages Module ✅
- [ ] Create page
- [ ] Edit page
- [ ] Delete page
- [ ] Publish page
- [ ] Search pages
- [ ] Filter by status
- [ ] Block editor (add, edit, remove, reorder)
- [ ] All block types working

### Media Module ✅
- [ ] Upload media
- [ ] View media grid
- [ ] Search media
- [ ] Filter by type
- [ ] Copy URL
- [ ] Delete media
- [ ] Use media in page editor

### Menus Module ✅
- [ ] Create menu item
- [ ] Create nested menu
- [ ] Edit menu item
- [ ] Delete menu item
- [ ] Filter by group
- [ ] View menu tree

### Integration ✅
- [ ] Complete workflow test
- [ ] Cross-module integration
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

---

## Tips Testing

1. **Gunakan Browser DevTools:**
   - Network tab untuk melihat API calls
   - Console untuk melihat errors
   - Elements untuk inspect styling

2. **Test dengan Mock Data:**
   - Set `VITE_USE_MOCK_DATA=true` untuk test tanpa database
   - Set `VITE_USE_MOCK_DATA=false` untuk test dengan real API

3. **Test dengan Real Data:**
   - Pastikan backend connected ke database
   - Test semua CRUD operations
   - Verify data persistence

4. **Document Issues:**
   - Catat semua bugs yang ditemukan
   - Screenshot error messages
   - Note steps to reproduce

---

## Next Steps After Testing

Setelah semua testing selesai, kamu bisa:
1. Fix bugs yang ditemukan
2. Improve UI/UX berdasarkan feedback
3. Add more features (drag & drop untuk menus, bulk actions, dll)
4. Optimize performance
5. Add unit tests dan integration tests
