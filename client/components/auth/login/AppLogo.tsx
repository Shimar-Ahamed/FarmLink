import Image from "next/image";

const Logo = () => (
  <div className="flex justify-center mb-4">
    <Image
      src="/auth/logo.png"
      alt="Farmlink Logo"
      width={300}
      height={130}
      className="max-w-custom-sm sm:max-w-custom-lg"
    />
  </div>
);

export default Logo;
