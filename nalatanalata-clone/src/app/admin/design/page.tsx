"use client";

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { useDesign } from '@/context/DesignContext';

export default function DesignPage() {
    const { settings, updateSettings } = useDesign();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        alert('Design settings saved!');
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Design Editor</h1>
                <button onClick={handleSave} className={styles.actionButton}>
                    Save Changes
                </button>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Hero Section</h2>
                <div className={styles.formGroup}>
                    <label htmlFor="heroTitle" className={styles.label}>Title</label>
                    <input
                        id="heroTitle"
                        type="text"
                        name="heroTitle"
                        value={localSettings.heroTitle}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Enter Hero Title"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="heroSubtitle" className={styles.label}>Subtitle</label>
                    <textarea
                        id="heroSubtitle"
                        name="heroSubtitle"
                        value={localSettings.heroSubtitle}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Enter Hero Subtitle"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="heroButtonText" className={styles.label}>Button Text</label>
                    <input
                        id="heroButtonText"
                        type="text"
                        name="heroButtonText"
                        value={localSettings.heroButtonText}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Enter Button Text"
                    />
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Feature Section (Holiday Season)</h2>
                <div className={styles.formGroup}>
                    <label htmlFor="featureTitle" className={styles.label}>Title</label>
                    <input
                        id="featureTitle"
                        type="text"
                        name="featureTitle"
                        value={localSettings.featureTitle}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Enter Feature Title"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="featureDescription" className={styles.label}>Description</label>
                    <textarea
                        id="featureDescription"
                        name="featureDescription"
                        value={localSettings.featureDescription}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Enter Feature Description"
                    />
                </div>
            </div>
        </div>
    );
}
