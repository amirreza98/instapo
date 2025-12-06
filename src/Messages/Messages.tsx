import { useEffect, useState, useCallback } from "react";
import emailjs from '@emailjs/browser';
import { Send, CheckCircle, XCircle, Loader2, Mail, User, MessageSquare } from 'lucide-react'; 

// --- ثابت‌های EmailJS ---
const SERVICE_ID = "service_cgzh82l";
const TEMPLATE_ID = "template_nwfxlyr";
const USER_ID = "UWea63uAQQEn7dKjx";

// --- تعریف انواع وضعیت ارسال ---
type Status = "idle" | "sending" | "sent" | "error";

function Contact() {
    const [status, setStatus] = useState<Status>("idle");
    const [formKey, setFormKey] = useState(0); 

    // --- منطق انیمیشن ساده ورود (بدون Hash) ---
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        // تأخیر کوچک برای اجرای انیمیشن هنگام Mount
        const timer = setTimeout(() => setIsVisible(true), 100); 
        return () => clearTimeout(timer);
    }, []);

    // --- تابع ارسال ایمیل (همان منطق قبلی) ---
    const sendEmail = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (status === 'sending') return;
        setStatus("sending");

        emailjs
            .sendForm(SERVICE_ID, TEMPLATE_ID, e.currentTarget, USER_ID)
            .then(
                () => {
                    setStatus("sent");
                    e.currentTarget.reset();
                    setFormKey(prev => prev + 1); 
                },
                (error) => {
                    console.error("FAILED...", error.text);
                    setStatus("error");
                    // بازگشت به حالت idle پس از چند ثانیه
                    setTimeout(() => setStatus("idle"), 5000); 
                }
            );
    }, [status]);
    
    // --- محتوای پویا دکمه ---
    const renderButtonContent = () => {
        switch (status) {
            case "sending":
                return (
                    <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        Sending...
                    </span>
                );
            case "sent":
                return (
                    <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Message Sent!
                    </span>
                );
            case "error":
                return (
                    <span className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Error! Try Again
                    </span>
                );
            case "idle":
            default:
                return (
                    <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Send Message
                    </span>
                );
        }
    };
    
    // --- کامپوننت ورودی با استایل ثابت و آیکون ---
    const InputField = ({ name, type = 'text', placeholder, required, children }) => (
        <div className="relative">
            {children} {/* آیکون Lucide */}
            <input
                id={name}
                type={type}
                name={name}
                className="w-full rounded-xl pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 outline-none transition-all duration-300 placeholder-gray-500 focus:border-purple-500 focus:bg-gray-900"
                placeholder={placeholder}
                required={required}
            />
        </div>
    );

    return (
        // 💫 کانتینر اصلی با گرادیانت پس‌زمینه (برای تضاد با پروفایل)
        <section 
            className="flex items-center justify-center p-8 min-h-screen text-white"
        >
            <div 
                // 🃏 کارت شناور و سه‌بعدی
                className={`max-w-xl w-full bg-gray-800/80 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl border-t border-l border-gray-700/50 
                    transition-all duration-700 transform 
                    ${isVisible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-90 rotate-1"}
                `}
            >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700/50">
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Let's Talk
                    </h2>
                    <Mail className="w-8 h-8 text-pink-500 animate-bounce-slow" /> {/* ✉️ آیکون متحرک */}
                </div>

                <p className="text-gray-400 mb-6 text-lg">
                    Have a project idea or a question? Drop me a message below! I'll be in touch as soon as possible.
                </p>

                <form
                    key={formKey} 
                    className="space-y-6"
                    onSubmit={sendEmail}
                >
                    
                    {/* Input: Name */}
                    <InputField name="user_name" placeholder="Your Full Name" required>
                        <User className="absolute top-1/2 left-4 transform -translate-y-1/2 w-5 h-5 text-purple-400 z-10" />
                    </InputField>

                    {/* Input: Email */}
                    <InputField name="user_email" type="email" placeholder="Your Email Address" required>
                        <Mail className="absolute top-1/2 left-4 transform -translate-y-1/2 w-5 h-5 text-purple-400 z-10" />
                    </InputField>

                    {/* Textarea: Message */}
                    <div className="relative">
                        <MessageSquare className="absolute top-4 left-4 w-5 h-5 text-purple-400 z-10" />
                        <textarea
                            id="message"
                            name="message"
                            rows={5}
                            className="w-full rounded-xl pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 outline-none transition-all duration-300 placeholder-gray-500 focus:border-purple-500 focus:bg-gray-900 resize-none"
                            placeholder="Tell me about your project or inquiry..."
                            required
                        />
                    </div>
                    
                    {/* دکمه ارسال (با استایل نئونی) */}
                    <button
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 transform 
                            shadow-lg shadow-purple-900/50
                            ${status === "sending" ? 
                                "bg-purple-700/70 text-white cursor-not-allowed" : 
                                "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white hover:shadow-xl hover:shadow-purple-700/50"
                            }
                            ${status === "sent" && "bg-green-600/90 shadow-green-900/50"}
                            ${status === "error" && "bg-red-600/90 shadow-red-900/50"}
                        `}
                        type="submit"
                        disabled={status === "sending" || status === "sent"}
                    >
                        {renderButtonContent()}
                    </button>
                    
                    {/* پیام خطا */}
                    {status === "error" && (
                        <p className="text-red-400 text-sm text-center mt-2">
                            Error: The message could not be sent. Please check your network and try again.
                        </p>
                    )}

                </form>
            </div>
        </section>
    );
}

export default Contact;

// --- تعریف انیمیشن سفارشی در Tailwind (برای فایل tailwind.config.js) ---
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite', // استفاده شده برای آیکون ایمیل
      }
    }
  }
}
*/