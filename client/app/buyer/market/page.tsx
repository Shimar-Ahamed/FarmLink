"use client";

import { useEffect, useMemo, useState } from "react";
import { clearAuth, getRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Listing = {
  id: string;
  quantityKg: number;
  pricePerKg: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  vegetable: { id: string; name: string };
  location: { id: string; province: string; district: string; city?: string | null };
  farmer: {
    id: string;
    fullName: string;
    whatsapp?: string | null;
    user: { mobile: string };
  };
};

export default function BuyerMarketPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVegetable, setSelectedVegetable] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    const role = getRole();
    if (role !== "BUYER") {
      router.replace("/login");
      return;
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/active`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load listings.");
        setListings(data);
      } catch (err: any) {
        setError(err.message || "Failed to load listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [router]);

  const vegetables = useMemo(
    () => [...new Set(listings.map((item) => item.vegetable.name))].sort(),
    [listings]
  );

  const districts = useMemo(
    () => [...new Set(listings.map((item) => item.location.district))].sort(),
    [listings]
  );

  const filteredListings = useMemo(
    () =>
      listings.filter((item) => {
        const vegetableMatch = selectedVegetable ? item.vegetable.name === selectedVegetable : true;
        const districtMatch = selectedDistrict ? item.location.district === selectedDistrict : true;
        return vegetableMatch && districtMatch;
      }),
    [listings, selectedVegetable, selectedDistrict]
  );

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buyer Market</h1>
            <p className="text-gray-500 mt-1">
              Browse active farmer listings and find fresh vegetables directly from the source.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Button
              variant="outline"
              onClick={() => router.push("/buyer/profile")}
            >
              Profile
            </Button>

            <Button
              onClick={handleLogout}
              className="bg-black text-white hover:bg-black/90"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Top Filters */}
        <div className="max-w-4xl">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-600 font-semibold">Filter by Vegetable</Label>
                <Select
                  value={selectedVegetable || "all"}
                  onValueChange={(val) => setSelectedVegetable(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-12">
                    <SelectValue placeholder="All vegetables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vegetables</SelectItem>
                    {vegetables.map((veg) => (
                      <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 font-semibold">Filter by District</Label>
                <Select
                  value={selectedDistrict || "all"}
                  onValueChange={(val) => setSelectedDistrict(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-12">
                    <SelectValue placeholder="All districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All districts</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="space-y-4">
          {loading && <p className="text-gray-500 font-medium">Loading market data...</p>}
          {error && <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

          {!loading && !error && filteredListings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-gray-500 text-lg">No active listings found matching your filters.</p>
              <button
                onClick={() => { setSelectedVegetable(""); setSelectedDistrict(""); }}
                className="mt-4 text-green-600 hover:underline font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* 3-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">

                {/* Card Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{listing.vegetable.name}</h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      📍 {listing.location.district}, {listing.location.province}
                      {listing.location.city ? ` (${listing.location.city})` : ""}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none px-3 py-1">
                    {listing.status}
                  </Badge>
                </div>

                {/* Card Body */}
                <CardContent className="p-5 flex-1 flex flex-col gap-5">

                  {/* Price & Quantity Highlight Box */}
                  <div className="flex bg-green-50/50 rounded-lg border border-green-100 p-4 gap-6">
                    <div className="flex-1 border-r border-green-200 pr-4">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1">Price</p>
                      <p className="text-2xl font-black text-green-700">
                        Rs {listing.pricePerKg.toFixed(2)} <span className="text-sm font-medium text-green-600">/ kg</span>
                      </p>
                    </div>
                    <div className="flex-1 pl-4 text-right">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Qty</p>
                      <p className="text-xl font-bold text-gray-900">{listing.quantityKg} kg</p>
                    </div>
                  </div>

                  {/* Seller Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Seller Details</h3>

                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Farmer Name:</div>
                      <div className="font-medium text-gray-900 text-right">{listing.farmer.fullName}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-500">Contact:</div>

                      <div className="flex gap-3 w-full">
                        {listing.farmer.user.mobile && (
                          <Button
                            variant="outline"
                            className="flex-1 h-12 flex items-center justify-center gap-2"
                            asChild
                          >
                            <a href={`tel:${listing.farmer.user.mobile}`}>
                              <img src="/mobile-icon.png" alt="Call" className="w-4 h-4" />
                              Call
                            </a>
                          </Button>
                        )}

                        {listing.farmer.whatsapp && (
                          <Button
                            className="flex-1 h-12 flex items-center justify-center gap-2 bg-black hover:bg-gray-900"
                            style={{ color: "#FCBF12" }}
                            asChild
                          >
                            <a
                              href={`https://wa.me/${listing.farmer.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {listing.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-auto">
                      <p className="text-xs font-bold text-amber-800 mb-1">Additional Notes:</p>
                      <p className="text-sm text-amber-900">{listing.notes}</p>
                    </div>
                  )}

                </CardContent>

                {/* Card Footer */}
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 text-right">
                  <p className="text-xs text-gray-400 font-medium">
                    Posted on {new Date(listing.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  </p>
                </div>

              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}