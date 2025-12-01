import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Heading and description */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          Hire NextGen Dev with{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            NextGen Technology
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Connect talented developers with innovative companies through our intelligent matching platform
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-4 flex-col sm:flex-row justify-center items-center mb-16">
        <Link href="/signup?role=candidate" className="w-full sm:w-auto">
          <button className="group relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              I'm a Candidate
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </Link>

        <Link href="/signup?role=recruiter" className="w-full sm:w-auto">
          <button className="group relative w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-300">
            <span className="flex items-center justify-center gap-2">
              I'm a Recruiter
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>
        </Link>
      </div>
    </main>
  );
}