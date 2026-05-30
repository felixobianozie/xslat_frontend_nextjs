import HeroSection from "./components/Herosection";
import FacilitiesSection from "./components/Facilitiessection";
import AboutSection from "./components/Aboutsection";
import AcademicProgramsSection from "./components/Academicprogramssection";
import AdmissionContactSection from "./components/Admissioncontactsection";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      {/* HeroSection renders its own stats-bar spacer internally */}
      <HeroSection />
      <FacilitiesSection />
      <AboutSection />
      <AcademicProgramsSection />
      <AdmissionContactSection />
      <Footer />
    </main>
  );
}
