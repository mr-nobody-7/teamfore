import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ManifestoSection } from "@/components/marketing/manifesto-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { PricingSection } from "@/components/marketing/pricing-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { TrustStrip } from "@/components/marketing/trust-strip";

export default function Home() {
  return (
    <div className="dark bg-background text-foreground">
      <MarketingNav />
      <HeroSection />
      <TrustStrip />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ManifestoSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  );
}
