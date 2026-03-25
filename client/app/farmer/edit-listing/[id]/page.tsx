"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Listing = {
  id: string;
  quantityKg: number;
  pricePerKg: number;
  notes?: string | null;
  status: string;
  vegetable: {
    id: string;
    name: string;
  };
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [form, setForm] = useState({
    quantityKg: "",
    pricePerKg: "",
    notes: "",
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const role = getRole();

    if (role !== "FARMER") {
      router.replace("/login");
      return;
    }

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/my/${listingId}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load listing.");
        }

        setListing(data);
        setForm({
          quantityKg: String(data.quantityKg),
          pricePerKg: String(data.pricePerKg),
          notes: data.notes || "",
          status: data.status || "ACTIVE",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.quantityKg || Number(form.quantityKg) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (!form.pricePerKg || Number(form.pricePerKg) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/${listingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            quantityKg: Number(form.quantityKg),
            pricePerKg: Number(form.pricePerKg),
            notes: form.notes || undefined,
            status: form.status,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Update failed.");
      }

      setSuccess("Listing updated successfully.");

      setTimeout(() => {
        router.push("/farmer/listings");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border rounded-xl shadow p-6 text-gray-600">
            Loading listing...
          </div>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/farmer/listings")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Listings
          </Button>

          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push("/farmer/listings")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Listings
        </Button>

        <div className="bg-white border rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold">Edit Listing</h1>

          {listing && (
            <p className="text-sm text-gray-500 mt-2">
              Vegetable: <span className="font-medium">{listing.vegetable.name}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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
                Quantity (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full border rounded-xl p-3"
                value={form.quantityKg}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantityKg: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Price per kg
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-xl p-3"
                value={form.pricePerKg}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                rows={4}
                className="w-full border rounded-xl p-3"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                className="w-full border rounded-xl p-3"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SOLD">SOLD</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/farmer/listings")}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Updating..." : "Update Listing"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}