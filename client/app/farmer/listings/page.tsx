"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Listing = {
  id: string;
  quantityKg: number;
  pricePerKg: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  vegetable: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    province: string;
    district: string;
    city?: string | null;
  };
};

export default function FarmerListingsPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    const role = getRole();

    if (role !== "FARMER") {
      router.replace("/login");
      return;
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/my`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load listings.");
        }

        setListings(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Error loading listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [router]);

  const openDeleteConfirmation = (id: string) => {
    setError("");
    setSuccess("");
    setSelectedListingId(id);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedListingId) return;

    try {
      setDeletingId(selectedListingId);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/${selectedListingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Delete failed");
      }

      setListings((prev) =>
        prev.filter((item) => item.id !== selectedListingId)
      );

      setSuccess("Listing deleted successfully.");
      setOpenDeleteDialog(false);
      setSelectedListingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/farmer/edit-listing/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push("/farmer/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Listings</h1>

          <Button onClick={() => router.push("/farmer/create-listing")}>
            Create Listing
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          {!loading && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        {loading && (
          <div className="bg-white p-6 rounded-xl shadow border text-gray-600">
            Loading listings...
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="bg-white p-6 rounded-xl shadow border text-gray-500">
            No listings found.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white p-5 rounded-xl shadow border"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {listing.vegetable.name}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {listing.location.province} - {listing.location.district}
                    {listing.location.city ? ` - ${listing.location.city}` : ""}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                  {listing.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Price:</span> Rs{" "}
                  {listing.pricePerKg.toFixed(2)} / kg
                </p>
                <p>
                  <span className="font-medium">Quantity:</span>{" "}
                  {listing.quantityKg} kg
                </p>
              </div>

              {listing.notes && (
                <div className="mt-4 rounded-lg border bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">{listing.notes}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Posted on{" "}
                {new Date(listing.createdAt).toLocaleDateString("en-GB", {
                  dateStyle: "medium",
                })}
              </p>

              <div className="mt-5 flex gap-5">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(listing.id)}
                  className="flex-1"
                >
                  Edit
                </Button>

                <Button
                  variant="outline"
                  onClick={() => openDeleteConfirmation(listing.id)}
                  disabled={deletingId === listing.id}
                  className="flex-1"
                >
                  {deletingId === listing.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This listing will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setSelectedListingId(null);
                }}
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={handleDelete}
                disabled={!!deletingId}
              >
                {deletingId ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}