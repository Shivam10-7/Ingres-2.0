const Footer = () => {
  return (
    <footer className="relative z-10 mt-8 border-t border-slate-300 bg-slate-900 text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* About */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">
              India Groundwater Resource Estimation System (INGRES)
            </h4>
            <p className="text-xs md:text-sm leading-relaxed text-slate-200">
              INGRES is developed by the Central Ground Water Board (CGWB), Ministry of Jal Shakti,
              Government of India, to provide official groundwater resource information for planning
              and decision making.
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h5 className="text-sm font-semibold mb-3">Useful Links</h5>
            <ul className="space-y-1 text-xs md:text-sm text-slate-200">
              <li><a href="#" className="hover:underline">INGRES Portal</a></li>
              <li><a href="#" className="hover:underline">CGWB Website</a></li>
              <li><a href="#" className="hover:underline">User Manual</a></li>
              <li><a href="#" className="hover:underline">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-sm font-semibold mb-3">Contact</h5>
            <ul className="space-y-1 text-xs md:text-sm text-slate-200">
              <li>Email: support@ingres.gov.in</li>
              <li>Phone: +91-11-XXXX-XXXX</li>
              <li className="pt-2 leading-relaxed">
                Central Ground Water Board<br />
                Ministry of Jal Shakti, Government of India<br />
                New Delhi — 110001
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] md:text-xs text-slate-300 text-center md:text-left">
            © 2026 India Groundwater Resource Estimation System (INGRES). All content is owned by the Government of India.
          </p>
          <div className="flex gap-4 text-[11px] md:text-xs text-slate-300">
            <a href="#" className="hover:underline">Terms &amp; Conditions</a>
            <span>|</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
