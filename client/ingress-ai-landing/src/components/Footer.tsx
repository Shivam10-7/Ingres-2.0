import { Droplets } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-border bg-foreground/[0.03] py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="h-6 w-6 text-secondary" />
              <span className="font-display text-lg font-bold gradient-text">
                INGRES
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-powered access to India's groundwater resource data. Developed by CGWB in coordination with State Ground Water Departments.
            </p>
            <div className="flex gap-3">
              {[FaFacebookF, FaLinkedinIn, FaYoutube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {["Home", "About", "Features", "How it Works", "Contact"].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(/\s+/g, "")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {["INGRES Portal", "CGWB Website", "User Guide", "API Documentation", "Privacy Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@ingres.gov.in</li>
              <li>+91-11-XXXX-XXXX</li>
              <li className="pt-2 leading-relaxed">
                Central Ground Water Board<br />
                Ministry of Jal Shakti<br />
                New Delhi — 110001
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">
            © 2026 INGRES ChatBOT. Government of India. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Use
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
