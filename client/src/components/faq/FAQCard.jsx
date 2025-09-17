import { useEffect, useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";

const FAQCard = ({ faqs = [] }) => {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h3 className="mb-4 text-center text-3xl text-black dark:text-white font-semibold">
          Frequently asked questions
        </h3>
        {faqs.map((faq, index) => (
          <Question key={faq._id || faq.id || `faq-${index}`} title={faq.question} defaultOpen={faq.defaultOpen}>
            <div className="text-slate-600 dark:text-slate-400">{faq.answer}</div>
          </Question>
        ))}
      </div>
    </div>
  );
};

const Question = ({ title, children, defaultOpen = false }) => {
  const [ref, { height }] = useMeasure();
  const [open, setOpen] = useState(defaultOpen);
  const [darkMode, setDarkMode] = useState();

  useEffect(() => {
    const checkDark = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [])

  const chevronColor = darkMode ? "rgb(255 255 255)" : "rgb(124 58 237)";

  return (
    <motion.div
      animate={open ? "open" : "closed"}
      className="border-b-[1px] border-b-slate-600 dark:border-b-[#393E46]"
    >
      <button
        onClick={() => setOpen((pv) => !pv)}
        className="flex w-full items-center justify-between gap-4 py-6"
      >
        <motion.span
          variants={{
            open: {
              color: darkMode ? "rgb(209 213 219)" : "rgb(0 0 0)",
            },
            closed: {
              color: darkMode ? "rgb(255 255 255)" : "rgb(0 0 0)",
            },
          }}
          className="text-left text-lg font-medium cursor-pointer"
        >
          {title}
        </motion.span>
        <motion.span
          variants={{
            open: { rotate: "180deg" },
            closed: { rotate: "0deg" },
          }}
          className="cursor-pointer"
        >
          <FiChevronDown color={chevronColor} />
        </motion.span>
      </button>

      <motion.div
        variants={{
          open: {
            opacity: 1,
            height: height,
            marginBottom: "1.5rem",
          },
          closed: {
            opacity: 0,
            height: 0,
            marginBottom: "0rem",
          },
        }}
        className="overflow-hidden text-slate-500 dark:text-slate-400 pl-2 cursor-pointer"
      >
        <div ref={ref}>{children}</div>
      </motion.div>
    </motion.div>
  );
};

export default FAQCard;