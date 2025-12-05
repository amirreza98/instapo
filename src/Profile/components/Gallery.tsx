import { AnimatePresence, easeIn, easeOut } from "motion/react"
import * as motion from "motion/react-client"
import { useState } from "react"
import tabContents from "./index"

export default function Gallery() {
    const [selectedTab, setSelectedTab] = useState(tabs[0])

    return (
        <div className="flex flex-col w-full bg-white/30 justify-center items-center">
            <nav className="w-full">
                <ul className="flex flex-row w-full justify-evenly">
                    {tabs.map((item) => (
                        <motion.li
                            key={item.label}
                            initial={{ y:-15, opacity:0, fontWeight: 400, fontSize: "1rem", borderTop: "none" }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                fontWeight: item === selectedTab ? 600 : 400,
                                fontSize: item === selectedTab ? "1.1rem" : "1rem",
                                borderTop: item === selectedTab ? "4px solid black" : "none",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, ease: easeOut }}
                            className="p-10 cursor-pointer py-3 justify-center"
                            onClick={() => setSelectedTab(item)}
                        >
                            {`${item.icon} ${item.label}`}
                        </motion.li>
                    ))}
                </ul>
            </nav>
            <main className="flex flex-col items-center justify-center h-96 text-9xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab ? selectedTab.label : "empty"}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-3"
                    >
                    {tabContents.map((content) => (
                        <div key={content} className="p-10">
                            
                    ))}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}


/**
 * ==============   Data   ================
 */

const allIngredients = [
    { icon: "📂​", label: "Project" },
    { icon: "📄​", label: "Certificates" },
    { icon: "👤​", label: "AboutMe" },
]

const [Project, Certificates, AboutMe] = allIngredients
const tabs = [Project, Certificates, AboutMe]

const tabContents = {
    [Project.label]: "📂​ Projects Content",
    [Certificates.label]: "📄​ Certificates Content",
    [AboutMe.label]: "👤​ AboutMe Content",
}
