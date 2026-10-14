import './globals.css';
export const metadata = {
  title: 'WA Support • AI Gemini Chatbot Dashboard',
  description: 'Enterprise WhatsApp Customer Service Chatbot with Google Gemini AI Integration & Real-time Analytics',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#F5F6F8] text-[#233858] antialiased selection:bg-[#5A7194] selection:text-white">
        {children}
      </body>
    </html>
  );
}
