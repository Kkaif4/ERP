"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enCommon from "./common/en.json";
import mrCommon from "./common/mr.json";
import hiCommon from "./common/hi.json";
import enAuth from "./auth/en.json";
import mrAuth from "./auth/mr.json";
import hiAuth from "./auth/hi.json";
import enNav from "./nav/en.json";
import mrNav from "./nav/mr.json";
import hiNav from "./nav/hi.json";
import enMaster from "./master/en.json";
import mrMaster from "./master/mr.json";
import hiMaster from "./master/hi.json";
import enDashboard from "./dashboard/en.json";
import mrDashboard from "./dashboard/mr.json";
import hiDashboard from "./dashboard/hi.json";
import enSettings from "./settings/en.json";
import mrSettings from "./settings/mr.json";
import hiSettings from "./settings/hi.json";
import enBills from "./bills/en.json";
import mrBills from "./bills/mr.json";
import hiBills from "./bills/hi.json";
import enPayments from "./payments/en.json";
import mrPayments from "./payments/mr.json";
import hiPayments from "./payments/hi.json";
import enLedger from "./ledger/en.json";
import mrLedger from "./ledger/mr.json";
import hiLedger from "./ledger/hi.json";
import enStaff from "./staff/en.json";
import mrStaff from "./staff/mr.json";
import hiStaff from "./staff/hi.json";

type Language = "en" | "mr" | "hi";

const dictionaries: any = {
    en: { common: enCommon, auth: enAuth, nav: enNav, master: enMaster, dashboard: enDashboard, bills: enBills, payments: enPayments, ledger: enLedger, settings: enSettings, staff: enStaff },
    mr: { common: mrCommon, auth: mrAuth, nav: mrNav, master: mrMaster, dashboard: mrDashboard, bills: mrBills, payments: mrPayments, ledger: mrLedger, settings: mrSettings, staff: mrStaff },
    hi: { common: hiCommon, auth: hiAuth, nav: hiNav, master: hiMaster, dashboard: hiDashboard, bills: hiBills, payments: hiPayments, ledger: hiLedger, settings: hiSettings, staff: hiStaff },
};

interface TranslationContextType {
    t: (key: string, vars?: Record<string, any>) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("mr");

    useEffect(() => {
        const savedLang = typeof window !== 'undefined' ? localStorage.getItem("lang") as Language : null;
        if (savedLang && ["en", "mr", "hi"].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("lang", lang);
    };

    const t = (key: string, vars?: Record<string, any>) => {
        const keys = key.split(".");

        const getFromDict = (dict: any) => {
            let current = dict;
            for (const k of keys) {
                if (current?.[k] === undefined) return undefined;
                current = current[k];
            }
            return current;
        };

        let result = getFromDict(dictionaries[language]) || getFromDict(dictionaries.en);

        if (typeof result === 'string') {
            if (vars) {
                Object.entries(vars).forEach(([k, v]) => {
                    result = (result as string).replace(`{{${k}}}`, String(v));
                });
            }
            return result;
        }

        if (typeof result === 'object' && result !== null) {
            console.warn(`Translation key "${key}" resolved to an object. Returning key instead.`);
            return key;
        }

        return key;
    };

    return (
        <TranslationContext.Provider value={{ t, language, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}
