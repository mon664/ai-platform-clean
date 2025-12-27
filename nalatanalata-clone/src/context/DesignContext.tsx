"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DesignSettings {
    heroTitle: string;
    heroSubtitle: string;
    heroButtonText: string;
    featureTitle: string;
    featureDescription: string;
}

interface DesignContextType {
    settings: DesignSettings;
    updateSettings: (newSettings: Partial<DesignSettings>) => void;
}

const defaultSettings: DesignSettings = {
    heroTitle: '수공예 조리도구',
    heroSubtitle: '매일 사용해도 오래 사용할 수 있도록 디자인되어 평생 사용할 수 있습니다.',
    heroButtonText: '컬렉션 쇼핑하기',
    featureTitle: 'Holiday Season',
    featureDescription: 'A selection of thoughtful pieces for giving and gathering, available at 2 Extra Place and online.',
};

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('designSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse design settings", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const updateSettings = (newSettings: Partial<DesignSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('designSettings', JSON.stringify(updated));
    };

    // Prevent hydration mismatch by rendering children only after load, 
    // or you could render with defaults. For simplicity, we'll render with defaults initially 
    // but the useEffect will update it quickly. 
    // To avoid flash of default content if user customized it, we can wait for load.
    // However, for SEO, we might want defaults. Let's just return children.

    return (
        <DesignContext.Provider value={{ settings, updateSettings }}>
            {children}
        </DesignContext.Provider>
    );
}

export function useDesign() {
    const context = useContext(DesignContext);
    if (context === undefined) {
        throw new Error('useDesign must be used within a DesignProvider');
    }
    return context;
}
