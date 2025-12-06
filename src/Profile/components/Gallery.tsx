import { AnimatePresence, easeOut } from "motion/react";
import * as motion from "motion/react-client";
import { useState } from "react";
import data from "./data.js";

// ساختار داده (بدون تغییر)
const allIngredients = [
    { icon: "📂​", label: "Project" },
    { icon: "📄​", label: "Certificates" },
    { icon: "👤​", label: "AboutMe" },
];

const [Project, Certificates, AboutMe] = allIngredients;
const tabs = [Project, Certificates, AboutMe];

export default function Gallery() {
    const [selectedTab, setSelectedTab] = useState(tabs[0]);

    // 🛠️ تابع اصلاح شده برای مدیریت هر سه نوع زبانه (پروژه، مدارک، درباره من)
    const renderContents = (tabLabel: string) => {
        // 1. حالت خاص: AboutMe
        if (tabLabel === 'AboutMe') {
            const aboutMeContent = data.aboutme[0];
            return (
                <div key={aboutMeContent.id} className="col-span-3 bg-gray-500 rounded-lg shadow-xl">
                    <h3 className="text-lg font-bold text-black">{aboutMeContent.name}</h3>
                    <p className="text-sm text-amber-200 mt-4">{aboutMeContent.describtion}</p>
                </div>
            );
        }

        // 2. حالت‌های Project و Certificates (نیاز به Map دارند)
        let dataKey = '';
        if (tabLabel === 'Project') dataKey = 'projects';
        else if (tabLabel === 'Certificates') dataKey = 'certificates';

        // @ts-ignore: نادیده گرفتن تایپ‌اسکریپت موقت برای دسترسی به کلید data
        const contentArray = data[dataKey];

        if (!contentArray || contentArray.length === 0) {
            return <p className="bg-gray-500 col-span-3 text-center text-gray-700 mt-10">محتوایی یافت نشد.</p>;
        }

        // Map کردن آرایه و برگرداندن JSX
        return contentArray.map((entry: any) => {
            return (
                <div
                    key={entry.id}
                    className="p-4 bg-gray-500 w-full min-h-56 overflow-hidden mt-4 rounded-lg shadow-md"
                >
                    <p className="text-xs font-semibold text-black">{entry.name}</p>
                    <p className="text-xs text-amber-200 mt-10">{entry.describtion}</p>
                </div>
            );
        });
    };
    
    const contents = renderContents(selectedTab.label);

    return (
        <div className="flex flex-col w-full justify-center items-center">
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
            <main className="w-full flex justify-center items-center min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab ? selectedTab.label : "empty"}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 w-full justify-center items-center gap-4"
                    >
                        {contents}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}