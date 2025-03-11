"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    router.push("/login?force=true");
  };

  const handleRegister = () => {
    router.push("/register?force=true");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AI Tools
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/")
                    ? "border-blue-500 text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Home
              </Link>

              {/* Add more navigation items as needed */}
            </div>
          </div>

          <div className="hidden md:flex md:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/profile")
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogin}
                  className={`px-3 py-2 rounded-md text-sm font-medium 
                    text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200`}
                >
                  Log In
                </button>
                <button
                  onClick={handleRegister}
                  className={`px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive("/")
                ? "border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-gray-800"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Home
          </Link>
        </div>

        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          {user ? (
            <div className="space-y-1">
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                Signed in as {user.email}
              </div>
              <Link
                href="/profile"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/profile")
                    ? "border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-gray-800"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={handleLogin}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Log In
              </button>
              <button
                onClick={handleRegister}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
