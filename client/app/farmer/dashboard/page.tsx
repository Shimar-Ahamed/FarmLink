"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuth, getRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function FarmerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();

    if (role !== "FARMER") {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const actions = [
    {
      title: "View Full Forecast",
      description:
        "Check detailed weekly price predictions, market trends, and AI insights.",
      onClick: () => router.push("/farmer/forecast"),
    },
    {
      title: "My Listings",
      description:
        "View and manage your current vegetable listings in the marketplace.",
      onClick: () => router.push("/farmer/listings"),
    },
    {
      title: "Create Listing",
      description:
        "Add a new product listing so buyers can see your available harvest.",
      onClick: () => router.push("/farmer/create-listing"),
    },
    {
      title: "Update Profile",
      description:
        "Edit your farmer profile details such as contact information and address.",
      onClick: () => router.push("/farmer/profile"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Farmer Dashboard
              </h1>
              <p className="mt-2 text-gray-600 leading-6 max-w-2xl">
                Welcome to FarmLink. Use the options below to view your forecast,
                manage listings, create new marketplace posts, and update your
                profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleLogout}
                className="bg-[#FFE286] text-black hover:bg-[#f5d76e]"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {actions.map((action) => (
            <div
              key={action.title}
              className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {action.title}
                </h2>
                <p className="mt-3 text-sm text-gray-600 leading-6">
                  {action.description}
                </p>
              </div>

              <button
                onClick={action.onClick}
                className="mt-6 w-full rounded-xl bg-[#FFE286] text-black py-3 font-medium hover:bg-[#f5d76e] transition"
              >
                {action.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}