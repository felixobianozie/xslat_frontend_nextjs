export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-200">
      {/* Animated dots */}
      <div className="flex items-center gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sky-500"
            style={{
              animation: `lhsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes lhsDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1);   }
          40%            { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
