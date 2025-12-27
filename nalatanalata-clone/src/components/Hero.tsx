"use client";

import styles from './Hero.module.css';
import Link from 'next/link';
import { useDesign } from '@/context/DesignContext';

export default function Hero({ title, subtitle, buttonText }: { title?: string, subtitle?: string, buttonText?: string }) {
    const { settings } = useDesign();

    const displayTitle = title || settings.heroTitle;
    const displaySubtitle = subtitle || settings.heroSubtitle;
    const displayButtonText = buttonText || settings.heroButtonText;

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1 className={styles.title}>{displayTitle}</h1>
                    <p className={styles.subtitle}>
                        {displaySubtitle}
                    </p>
                    <Link href="/shop" className={styles.button}>
                        {displayButtonText}
                    </Link>
                </div>
            </div>
        </section>
    );
}
