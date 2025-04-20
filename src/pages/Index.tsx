
import Navbar from "@/components/Navbar";
import BroKodSection from "@/components/BroKodSection";
import LiveClasses from "@/components/LiveClasses";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4">
        <BroKodSection />
        <LiveClasses />
      </div>
    </div>
  );
};

export default Index;
