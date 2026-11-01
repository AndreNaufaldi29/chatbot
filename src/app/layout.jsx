import './globals.css';
export const metadata = {
  title: 'WA Support • AI Gemini Chatbot Dashboard',
  description: 'Enterprise WhatsApp Customer Service Chatbot with Google Gemini AI Integration & Real-time Analytics',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#0E0F12] text-zinc-100 antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
