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
    <section className="relative z-10 py-24 bg-primary/[0.03]">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 italic">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Find answers to common questions about the INGRES ChatBOT. Can't find what you're looking for? Contact our support team.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-glow rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Contact Support
            </motion.button>
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
                  className="glass-card px-5 border rounded-xl"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
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
