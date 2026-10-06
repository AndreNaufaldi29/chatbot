import './globals.css';
export const metadata = {
  title: 'WA Support • AI Gemini Chatbot Dashboard',
  description: 'Enterprise WhatsApp Customer Service Chatbot with Google Gemini AI Integration & Real-time Analytics',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#0b1120] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
