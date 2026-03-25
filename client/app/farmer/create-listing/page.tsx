"use client";

import { useEffect, useState } from "react";
import { getRole, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
} from "@/components/ui/alert";

type Vegetable = {
  id: string;
  name: string;
  slug: string;
};

export default function CreateListingPage() {
  const router = useRouter();

  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loadingVegetables, setLoadingVegetables] = useState(true);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vegetableId: "",
    quantityKg: "",
    pricePerKg: "",
    notes: "",
  });

  useEffect(() => {
    const role = getRole();

    if (role !== "FARMER") {
      router.replace("/login");
      return;
    }

    const fetchVeg = async () => {
      try {
        setLoadingVegetables(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/vegetables`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load vegetables.");
        }

        if (!Array.isArray(data)) {
          throw new Error("Vegetable response is invalid.");
        }

        setVegetables(data);
      } catch (err: any) {
        setError(err.message || "Failed to load vegetables.");
        setVegetables([]);
      } finally {
        setLoadingVegetables(false);
      }
    };

    fetchVeg();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.vegetableId) {
      setError("Please select a vegetable.");
      return;
    }

    if (!form.quantityKg || Number(form.quantityKg) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (!form.pricePerKg || Number(form.pricePerKg) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            vegetableId: form.vegetableId,
            quantityKg: Number(form.quantityKg),
            pricePerKg: Number(form.pricePerKg),
            notes: form.notes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error creating listing.");
      }

      setMessage("Listing created successfully!");

      setForm({
        vegetableId: "",
        quantityKg: "",
        pricePerKg: "",
        notes: "",
      });

      // Auto redirect after success
      setTimeout(() => {
        router.push("/farmer/listings");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Error creating listing.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">

        <Button
          variant="outline"
          onClick={() => router.push("/farmer/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-2xl shadow border p-6">
          <h1 className="text-2xl font-bold mb-6">
            Create Listing
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Error Alert */}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}

            {message && (
              <Alert>
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Vegetable */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Vegetable
              </label>

              <Select
                value={form.vegetableId}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    vegetableId: val,
                  })
                }
                disabled={loadingVegetables}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingVegetables
                        ? "Loading vegetables..."
                        : "Select Vegetable"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {vegetables.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity (kg)
              </label>

              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="Enter quantity"
                className="w-full border p-3 rounded-xl"
                value={form.quantityKg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantityKg: e.target.value,
                  })
                }
              />
            </div>

            {/* Price */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Price per kg
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter price per kg"
                className="w-full border p-3 rounded-xl"
                value={form.pricePerKg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricePerKg: e.target.value,
                  })
                }
              />
            </div>

            {/* Notes */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes{" "}
                <span className="text-gray-400 font-normal">
                  (optional)
                </span>
              </label>

              <textarea
                placeholder="Add a short note"
                className="w-full border p-3 rounded-xl resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            {/* Submit Button */}

            <button
              disabled={loadingSubmit}
              className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-60"
            >
              {loadingSubmit
                ? "Creating Listing..."
                : "Create Listing"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}