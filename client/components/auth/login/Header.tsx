const Header = () => (
  <div>
    <h2 className="font-poppins text-black text-2xl font-semibold mb-2 sm:mb-3 text-center">
      Sign into your Account
    </h2>
    <p className="font-poppins text-black text-lg sm:text-base text-center mb-6">
      Do you want to Sign Up?{" "}
      <a href="/signup" className="text-accent text-black underline">
        Register Here
      </a>
    </p>
  </div>
);

export default Header;
