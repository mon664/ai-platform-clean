"use client";

import Link from 'next/link';
import styles from './FeatureSection.module.css';
import { useDesign } from '@/context/DesignContext';

export default function FeatureSection({ title, description }: { title?: string, description?: string }) {
    const { settings } = useDesign();

    const displayTitle = title || settings.featureTitle;
    const displayDescription = description || settings.featureDescription;

    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.imageWrapper}>
                    {/* Placeholder for illustration-gift-wrapping.png */}
                    <div className={styles.placeholderImage}>
                        <span>Illustration Placeholder</span>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <Link href="/shop/personal" className={styles.categoryLink}>Personal Items</Link>
                        <Link href="/shop/dining" className={styles.categoryLink}>Dining</Link>
                        <Link href="/shop/decor" className={styles.categoryLink}>Décor</Link>
                    </div>
                    <h2 className={styles.title}>{displayTitle}</h2>
                    <p className={styles.description}>
                        {displayDescription}
                    </p>
                    <Link href="/shop" className={styles.link}>
                        View the Collection
                    </Link>
                </div>
            </div>
        </section>
    );
}
