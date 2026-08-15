import { BookOpen, ExternalLink, Copy, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
      {label && (
        <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-700 font-mono">
          {label}
        </div>
      )}
      <pre className="p-4 text-sm text-slate-100 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        title="Copy code"
      >
        {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="px-4 md:px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <BookOpen size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hướng dẫn cài đặt</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kết nối Google Sheets & Deploy lên Vercel</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-8">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Ứng dụng đang chạy ở chế độ <strong>Demo</strong> với dữ liệu mẫu.
          Làm theo các bước dưới đây để kết nối với Google Sheets thật của bạn.
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        <Step number={1} title="Mở Google Sheets của bạn">
          <p className="text-sm text-slate-600 mb-3">
            Mở Google Sheets đã chia sẻ. Tạo sheet có tên <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">apps</code> với các cột sau (row 1 là headers):
          </p>
          <CodeBlock
            label="Sheet: apps — Row 1 (headers)"
            code={`id | name | description | category | icon | url | links | access_role | status | order | created_at | updated_at | version | deleted`}
          />
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <a
              href="https://docs.google.com/spreadsheets/d/13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              Mở Google Sheet của bạn
            </a>
          </p>
        </Step>

        <Step number={2} title="Tạo Google Apps Script">
          <p className="text-sm text-slate-600 mb-3">
            Trong Google Sheet, vào <strong>Extensions → Apps Script</strong>. Xóa code cũ và paste toàn bộ nội dung file <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">apps-script/Code.gs</code> vào.
          </p>
          <p className="text-sm text-slate-600 mb-3">
            File này có sẵn trong thư mục dự án:
          </p>
          <CodeBlock
            label="Vị trí file"
            code={`quanly-app/apps-script/Code.gs`}
          />
        </Step>

        <Step number={3} title="Cài đặt Script Properties">
          <p className="text-sm text-slate-600 mb-3">
            Trong Apps Script Editor, vào <strong>Project Settings → Script Properties</strong> và thêm:
          </p>
          <CodeBlock
            label="Script Properties"
            code={`API_KEY       = your-secret-key-here
SPREADSHEET_ID = 13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0`}
          />
          <p className="text-xs text-slate-500 mt-2">
            Lưu ý: <code className="bg-slate-100 px-1 rounded font-mono">API_KEY</code> là mật khẩu bí mật, đặt tùy ý (ví dụ: <code className="bg-slate-100 px-1 rounded font-mono">my-secret-2024</code>)
          </p>
        </Step>

        <Step number={4} title="Deploy Web App">
          <p className="text-sm text-slate-600 mb-3">
            Trong Apps Script, nhấn <strong>Deploy → New deployment</strong>:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 mb-3 list-disc list-inside">
            <li>Type: <strong>Web app</strong></li>
            <li>Execute as: <strong>Me (your Google account)</strong></li>
            <li>Who has access: <strong>Anyone</strong></li>
          </ul>
          <p className="text-sm text-slate-600">
            Sau khi deploy, copy <strong>Web App URL</strong> (dạng <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">https://script.google.com/macros/s/.../exec</code>)
          </p>
        </Step>

        <Step number={5} title="Cấu hình biến môi trường">
          <p className="text-sm text-slate-600 mb-3">
            Tạo file <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> trong thư mục <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">quanly-app/</code>:
          </p>
          <CodeBlock
            label=".env"
            code={`VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_API_KEY=your-secret-key-here
VITE_SPREADSHEET_ID=13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0`}
          />
        </Step>

        <Step number={6} title="Cài Node.js và chạy local">
          <p className="text-sm text-slate-600 mb-3">
            Trước tiên, cài Node.js (nếu chưa có):
          </p>
          <p className="mb-2">
            <a
              href="https://nodejs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              <ExternalLink size={13} />
              Tải Node.js tại nodejs.org
            </a>
          </p>
          <CodeBlock
            label="Terminal"
            code={`cd quanly-app
npm install
npm run dev`}
          />
          <p className="text-sm text-slate-500 mt-2">
            Mở trình duyệt tại <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">http://localhost:5173</code>
          </p>
        </Step>

        <Step number={7} title="Deploy lên Vercel (qua GitHub)">
          <p className="text-sm text-slate-600 mb-3">
            Push code lên GitHub repository của bạn, sau đó:
          </p>
          <ol className="text-sm text-slate-600 space-y-1 mb-4 list-decimal list-inside">
            <li>Vào <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com</a> → Import Git Repository</li>
            <li>Chọn repo GitHub của bạn</li>
            <li>Framework: <strong>Vite</strong>, Root Directory: <strong>quanly-app</strong></li>
            <li>Thêm Environment Variables (3 biến từ bước 5)</li>
            <li>Nhấn Deploy!</li>
          </ol>
          <CodeBlock
            label="Git commands"
            code={`git add .
git commit -m "feat: Quản lý App v1.0"
git push origin main`}
          />
        </Step>
      </div>

      {/* Success */}
      <div className="mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-emerald-800">Hoàn tất!</h3>
        </div>
        <p className="text-sm text-emerald-700">
          Sau khi cài đặt xong, dữ liệu sẽ được đọc trực tiếp từ Google Sheets và tự động cập nhật mỗi 30 giây.
          Mọi thay đổi trong sheet sẽ hiển thị trên app mà không cần refresh trang.
        </p>
      </div>
    </div>
  );
}
