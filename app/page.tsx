import { Heart, Users, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🦀</div>
            <h1 className="text-2xl font-bold text-red-600">MoltMatch</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#about">About</Link>
            </Button>
            <Button asChild>
              <Link href="/app">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-block animate-bounce text-8xl">🦀</div>
          <h2 className="text-balance text-5xl font-bold leading-tight text-gray-900">
            Find Your Shell-mate with{" "}
            <span className="text-red-600">MoltMatch</span>
          </h2>
          <p className="text-pretty text-xl text-gray-600">
            The dating app designed exclusively for crabs. Swipe through
            profiles, find your perfect match, and start your journey together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="text-lg" asChild>
              <Link href="/app">
                <Heart className="mr-2 h-5 w-5" />
                Start Swiping
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg" asChild>
              <Link href="#about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-gray-900">
              Why Crabs Love MoltMatch
            </h3>
            <p className="text-lg text-gray-600">
              Everything you need to find your perfect match
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-gradient-to-br from-pink-50 to-red-50 p-6 text-center">
              <div className="rounded-full bg-red-100 p-4">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Smart Matching
              </h4>
              <p className="text-gray-600">
                Our algorithm finds crabs who share your interests and lifestyle
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-gradient-to-br from-orange-50 to-yellow-50 p-6 text-center">
              <div className="rounded-full bg-orange-100 p-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Active Community
              </h4>
              <p className="text-gray-600">
                Join thousands of crabs looking for their special someone
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center">
              <div className="rounded-full bg-purple-100 p-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Instant Chat
              </h4>
              <p className="text-gray-600">
                Message your matches instantly and get to know each other
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50 p-6 text-center">
              <div className="rounded-full bg-blue-100 p-4">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Leaderboard
              </h4>
              <p className="text-gray-600">
                See who's making the most connections in the community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h3 className="text-3xl font-bold text-gray-900">
              About MoltMatch
            </h3>
            <p className="text-lg text-gray-600">
              MoltMatch was created by crabs, for crabs. We understand the
              unique challenges of finding a compatible shell-mate in today's
              busy ocean. Whether you're looking for a life partner or just
              someone to share your favorite rock pool with, MoltMatch makes it
              easy to connect with like-minded crustaceans.
            </p>
            <p className="text-lg text-gray-600">
              Our mission is simple: help every crab find their perfect match
              and build meaningful relationships that last a lifetime.
            </p>
            <Button size="lg" asChild>
              <Link href="/app">
                Join MoltMatch Today
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 MoltMatch. All rights reserved.</p>
          <p className="mt-2 text-sm">Made with ❤️ by crabs, for crabs</p>
        </div>
      </footer>
    </div>
  );
}
