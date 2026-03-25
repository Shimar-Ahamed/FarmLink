"use client";

import Logo from "@/components/auth/login/AppLogo";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleRoleSelect = (role: "buyer" | "farmer") => {
    if (role === "buyer") {
      router.push("/signup/buyer");
    } else {
      router.push("/signup/farmer");
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
      <div className="bg-white mx-4 my-6 px-6 py-10 sm:px-12 sm:py-14 rounded-2xl shadow-lg max-w-xl w-full">
        <Logo />

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-6 sm:mt-10">
          <div
            className="flex flex-col items-center justify-center w-52 h-52 bg-gray-50 border border-gray-300 rounded-full shadow-sm hover:border-4 hover:border-yellow-400 transition-all duration-200 cursor-pointer"
            onClick={() => handleRoleSelect("farmer")}
          >
            <Image
              src="/auth/Farmer.png"
              width={100}
              height={100}
              alt="Farmer"
              className="w-auto h-auto"
            />
            <p className="text-sm sm:text-base font-bold text-center mt-4">
              I’m a Farmer
            </p>
          </div>

          <div
            className="flex flex-col items-center justify-center w-52 h-52 bg-gray-50 border border-gray-300 rounded-full shadow-sm hover:border-4 hover:border-yellow-400 transition-all duration-200 cursor-pointer"
            onClick={() => handleRoleSelect("buyer")}
          >
            <Image
              src="/auth/Buyer.png"
              width={100}
              height={100}
              alt="Buyer"
              className="w-auto h-auto"
            />
            <p className="text-sm sm:text-base font-bold text-center mt-4">
              I’m a Buyer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}