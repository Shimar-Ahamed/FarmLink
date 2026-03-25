"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { setRole, setToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { provinceDistrictMap } from "@/app/constants/province-district";
import { districtCityMap } from "@/app/constants/district-city";

export default function BuyerSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "",
    mobile: "",
    password: "",
    ownerName: "",
    buyerType: "",
    whatsapp: "",
    province: "",
    district: "",
    city: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProvinceChange = (val: string) => {
    setError(null);
    setForm((prev) => ({
      ...prev,
      province: val,
      district: "",
      city: "",
    }));
  };

  const handleDistrictChange = (val: string) => {
    setError(null);
    setForm((prev) => ({
      ...prev,
      district: val,
      city: "",
    }));
  };

  const isFormInvalid =
    !form.businessName.trim() ||
    !form.mobile.trim() ||
    !form.password.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    if (!/^0\d{9}$/.test(form.mobile.trim())) {
      setError("Enter a valid mobile number.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.whatsapp.trim() && !/^0\d{9}$/.test(form.whatsapp.trim())) {
      setError("Enter a valid WhatsApp number.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        ownerName: form.ownerName || undefined,
        buyerType: form.buyerType || undefined,
        whatsapp: form.whatsapp || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
        address: form.address || undefined,
      };

      const res = await api.post("/auth/signup/buyer", payload);

      setToken(res.data.access_token);
      setRole(res.data.role);

      router.push("/buyer/market");
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
     <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/background.png')",
        overflow: "hidden",
        backgroundPosition: "bottom center",
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-8 md:p-12 my-4 sm:my-8 md:my-16 rounded-2xl shadow-lg w-full max-w-4xl shadow-[0_8px_20px_rgb(0,0,0,0.12)]">
        <div className="flex flex-col items-center justify-center text-center mb-6 gap-4">
          <Image
            src="/auth/logo.png"
            alt="FarmLink Logo"
            width={300}
            height={130}
            className="max-w-[200px]"
          />
          <h1 className="font-poppins text-primary font-semibold text-2xl sm:text-3xl">
            Buyer Registration
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={onSubmit}
          className="w-full max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full border rounded-xl p-3"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Owner Name{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Buyer Type{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Select
                value={form.buyerType}
                onValueChange={(val) => handleChange("buyerType", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select buyer type" />
                </SelectTrigger>
                <SelectContent>
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
              <label className="block text-sm font-medium mb-1">
                WhatsApp{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border rounded-xl p-3"
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Province{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Select value={form.province} onValueChange={handleProvinceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(provinceDistrictMap).map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                District{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Select
                value={form.district}
                onValueChange={handleDistrictChange}
                disabled={!form.province}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {(provinceDistrictMap[form.province] ?? []).map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                City{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Select
                value={form.city}
                onValueChange={(val) => handleChange("city", val)}
                disabled={!form.district}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {(districtCityMap[form.district] ?? []).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Address{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Street name / Road name"
                className="w-full border rounded-xl p-3"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={loading || isFormInvalid}
            className="w-full mt-6 bg-black text-white rounded-xl p-3 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Buyer Account"}
          </button>

          <button
            type="button"
            className="w-full mt-3 underline text-sm"
            onClick={() => router.push("/login")}
          >
            Already have an account? Login
          </button>
        </form>
      </div>
    </div>
  );
}