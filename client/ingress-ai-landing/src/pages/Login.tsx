import Navbar from "@/components/Navbar";
import LoginCard from "@/components/LoginCard";
import WaveBackground from "@/components/WaveBackground";
import { useForceLightMode } from "@/hooks/useForceLightMode";

const Login = () => {
  useForceLightMode();

  return (
    <div className="relative min-h-screen">
      <WaveBackground />
      <Navbar />
      <section className="relative z-10 flex min-h-screen items-center justify-center pt-24 px-6">
        <LoginCard />
      </section>
    </div>
  );
};

export default Login;
