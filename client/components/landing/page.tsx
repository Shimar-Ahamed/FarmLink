"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { TrendingUp, Leaf, ShoppingCart, Sprout, Users } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur border-b z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/auth/logo.png"
              alt="FarmLink Logo"
              width={150}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/login")}
              className="text-sm px-4 py-2 hover:bg-accent rounded-md"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/role")}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16">
        <div className="relative h-[600px] md:h-[650px]">
          <Image
            src="/farm-hero.png"
            alt="Fresh colorful vegetables at a market"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-xl text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Sprout className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Smart Vegetable Marketplace
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Fresh Vegetables. <span className="text-primary">Fair Prices.</span>
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
                Connect vegetable farmers and buyers directly with AI-powered
                price forecasts and simple market insights.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push("/role")}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-base font-medium"
                >
                  Get Started Free
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="border border-white/30 bg-white/10 text-white px-8 py-3 rounded-lg text-base hover:bg-white/20"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-primary">FarmLink</span>?
          </h2>

          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Everything you need to buy and sell vegetables smarter.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Vegetable Price Forecasts",
                desc: "AI-powered weekly vegetable price predictions help farmers understand market direction before selling.",
              },
              {
                icon: Users,
                title: "Direct Farmer-Buyer Connection",
                desc: "Farmers and buyers connect directly without relying only on middlemen.",
              },
              {
                icon: ShoppingCart,
                title: "Easy Vegetable Discovery",
                desc: "Buyers can browse available vegetable listings by location and contact farmers quickly.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-8 border border-border rounded-2xl bg-card hover:border-primary/50 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Role
          </h2>

          <p className="text-muted-foreground text-lg mb-14">
            Whether you grow vegetables or buy them, FarmLink supports both.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "For Vegetable Farmers",
                features: [
                  "View weekly vegetable price forecasts",
                  "Get simple AI-based market insights",
                  "Create and manage vegetable listings",
                  "Sell directly to buyers",
                ],
                btn: "Continue as Farmer",
              },
              {
                title: "For Vegetable Buyers",
                features: [
                  "Browse active vegetable listings",
                  "Filter by district and vegetable type",
                  "View farmer contact details",
                  "Connect directly with farmers",
                ],
                btn: "Continue as Buyer",
              },
            ].map((role, i) => (
              <div
                key={i}
                className="border border-border rounded-2xl p-8 bg-card hover:border-primary/50 hover:shadow-xl transition-all text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  {i === 0 ? (
                    <Leaf className="w-8 h-8 text-primary" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-4">{role.title}</h3>

                <ul className="space-y-3 mb-8">
                  {role.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push("/role")}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
                >
                  {role.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <Image
              src="/auth/logo.png"
              alt="FarmLink Logo"
              width={140}
              height={45}
              className="h-9 w-auto"
            />
          </div>

          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} FarmLink — Smart Vegetable Marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}