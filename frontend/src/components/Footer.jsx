export default function Footer() {
  return (
    <footer className="w-full border-t border-surface-200 bg-white py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-surface-400">
        <div>
          <span>© {new Date().getFullYear()} VisionAI. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span>Built with</span>
          <span className="bg-surface-50 border border-surface-150 px-2 py-0.5 rounded-full">React</span>
          <span className="bg-surface-50 border border-surface-150 px-2 py-0.5 rounded-full">FastAPI</span>
          <span className="bg-surface-50 border border-surface-150 px-2 py-0.5 rounded-full">Gemini AI</span>
          <span className="bg-surface-50 border border-surface-150 px-2 py-0.5 rounded-full">Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}
