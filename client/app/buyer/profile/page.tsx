"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { provinceDistrictMap } from "@/app/constants/province-district";
import { districtCityMap } from "@/app/constants/district-city";

export default function BuyerProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    buyerType: "",
    whatsapp: "",
    address: "",
    province: "",
    district: "",
    city: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const role = getRole();

    if (role !== "BUYER") {
      router.replace("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/buyer/me`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load profile.");
        }

        setForm({
          businessName: data.businessName || "",
          ownerName: data.ownerName || "",
          buyerType: data.buyerType || "",
          whatsapp: data.whatsapp || "",
          address: data.address || "",
          province: data.location?.province || "",
          district: data.location?.district || "",
          city: data.location?.city || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (key: string, value: string) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProvinceChange = (value: string) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      province: value,
      district: "",
      city: "",
    }));
  };

  const handleDistrictChange = (value: string) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      district: value,
      city: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    if (form.whatsapp.trim() && !/^0\d{9}$/.test(form.whatsapp.trim())) {
      setError("Enter a valid WhatsApp number.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        businessName: form.businessName,
        ownerName: form.ownerName || undefined,
        buyerType: form.buyerType || undefined,
        whatsapp: form.whatsapp || undefined,
        address: form.address || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/buyer/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Update failed.");
      }

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border rounded-xl shadow p-6 text-gray-600">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push("/buyer/market")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Market
        </Button>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h1 className="text-2xl font-bold mb-6">Buyer Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Owner Name
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Buyer Type
              </label>
              <Select
                value={form.buyerType || "none"}
                onValueChange={(value) =>
                  handleChange("buyerType", value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select buyer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No buyer type selected</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Supermarket">Supermarket</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                WhatsApp
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Province
              </label>
              <Select
                value={form.province || "none"}
                onValueChange={(value) =>
                  handleProvinceChange(value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No province selected</SelectItem>
                  {Object.keys(provinceDistrictMap).map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                District
              </label>
              <Select
                value={form.district || "none"}
                onValueChange={(value) =>
                  handleDistrictChange(value === "none" ? "" : value)
                }
                disabled={!form.province}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No district selected</SelectItem>
                  {(provinceDistrictMap[form.province] ?? []).map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                City
              </label>
              <Select
                value={form.city || "none"}
                onValueChange={(value) =>
                  handleChange("city", value === "none" ? "" : value)
                }
                disabled={!form.district}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No city selected</SelectItem>
                  {(districtCityMap[form.district] ?? []).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Address
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Update Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}