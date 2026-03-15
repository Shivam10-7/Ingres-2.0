import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is INGRES ChatBOT?",
    a: "INGRES ChatBOT is an AI-powered virtual assistant that provides instant access to India's groundwater resource data, assessment reports, and scientific insights from the India Ground Water Resource Estimation System.",
  },
  {
    q: "How accurate is the data?",
    a: "The data is sourced directly from the Central Ground Water Board (CGWB) and is updated regularly. All information is based on official government assessments and scientific methodologies.",
  },
  {
    q: "Which languages are supported?",
    a: "Currently the chatbot supports English and Hindi. We are working on adding support for more regional languages to improve accessibility across India.",
  },
  {
    q: "Is the service free to use?",
    a: "Yes, the INGRES ChatBOT is a free public service developed under the Government of India's Digital India initiative to promote transparency and data accessibility.",
  },
  {
    q: "Can I export data and reports?",
    a: "Yes, you can export query results, charts, and analysis reports in multiple formats including PDF, CSV, and Excel for further use in your research or planning.",
  },
  {
    q: "How do I clear data from the ChatBOT?",
    a: "You can clear your conversation history at any time using the 'Clear Chat' button. Your data is not stored permanently and sessions are anonymized for privacy.",
  },
];

const FaqSection = () => {
  return (
    <section
      className="relative z-10 border-t border-slate-200 py-16"
      style={{
        backgroundImage: "url('/FAQbg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-700 mb-6 max-w-md">
              Find answers to common questions about the INGRES ChatBOT.
            </p>
          </motion.div>

          {/* Right – Accordion */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-lg border border-slate-200 bg-white px-5 shadow-sm"
                >
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-700 pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
