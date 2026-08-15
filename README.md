# Quản Lý App 📱

Hệ thống quản lý ứng dụng và đường link kết nối nội bộ doanh nghiệp. Dữ liệu lưu trên **Google Sheets**, backend qua **Google Apps Script**, frontend build bằng **Vite + React + TypeScript**, deploy lên **Vercel**.

![Preview](./docs/preview.png)

## Tính năng

- 🗂️ Xem app theo nhóm danh mục (KẾ TOÁN, MARKETING, NHÂN SỰ, TIỆN ÍCH)
- 🔍 Tìm kiếm và lọc theo danh mục
- ➕ Thêm / sửa / xóa app trực tiếp lên Google Sheets
- 🔗 Quản lý nhiều đường link kết nối cho mỗi app
- 🔒 Phân quyền truy cập theo vai trò
- 🔄 Tự động cập nhật từ Sheets mỗi 30 giây
- 📱 Responsive cho cả desktop và mobile

## Cài đặt nhanh

### 1. Clone và cài dependencies

```bash
git clone <your-github-repo>
cd quanly-app
npm install
```

### 2. Cấu hình Google Apps Script

1. Mở [Google Sheet](https://docs.google.com/spreadsheets/d/13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0) của bạn
2. **Extensions → Apps Script**
3. Paste toàn bộ nội dung file `apps-script/Code.gs`
4. **Project Settings → Script Properties**, thêm:
   ```
   API_KEY        = your-secret-key-here
   SPREADSHEET_ID = 13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0
   ```
5. **Deploy → New Deployment** (Web app, Anyone can access)
6. Copy Web App URL

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `quanly-app/`:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
VITE_API_KEY=your-secret-key-here
VITE_SPREADSHEET_ID=13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0
```

### 4. Cấu trúc Google Sheet

Sheet `apps` — Row 1 là headers:
```
id | name | description | category | icon | url | links | access_role | status | order | created_at | updated_at | version | deleted
```

Sheet `users` — Row 1 là headers:
```
id | name | email | role | department | avatar | active | version | deleted | created_at | updated_at
```

### 5. Chạy local

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173)

## Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **Import Git Repository**
3. Chọn thư mục root: `quanly-app`
4. Thêm **Environment Variables** (3 biến từ bước 3)
5. **Deploy!**

## Cấu trúc project

```
quanly-app/
├── apps-script/
│   ├── Code.gs           # Google Apps Script backend
│   └── appsscript.json   # Manifest
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AppShell.tsx       # Layout shell + navigation
│   │   └── AppFormModal.tsx   # Add/edit app modal
│   ├── lib/
│   │   ├── apiClient.ts       # API client + mock data
│   │   └── useSheetStream.ts  # Live streaming hook
│   ├── pages/
│   │   ├── HomePage.tsx   # Main card grid view
│   │   ├── UsersPage.tsx  # User management
│   │   └── GuidePage.tsx  # Setup guide
│   ├── types.ts           # TypeScript types
│   ├── main.tsx           # App entry + routing
│   └── index.css          # Global styles
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tech Stack

| | |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| State | TanStack Query + Zustand |
| Icons | lucide-react |
| Toast | sonner |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Deploy | Vercel via GitHub |
