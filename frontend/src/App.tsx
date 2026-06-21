import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import Landing from "@/pages/Landing";
import Upload from "@/pages/Upload";
import Analysis from "@/pages/Analysis";
import Output from "@/pages/Output";
import Analytics from "@/pages/Analytics";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Landing /></Page>} />
          <Route path="/upload" element={<Page><Upload /></Page>} />
          <Route path="/analysis" element={<Page><Analysis /></Page>} />
          <Route path="/output" element={<Page><Output /></Page>} />
          <Route path="/analytics" element={<Page><Analytics /></Page>} />
          <Route path="*" element={<Page><Landing /></Page>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
