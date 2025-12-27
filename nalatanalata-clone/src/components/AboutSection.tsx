import Link from 'next/link';
import styles from './AboutSection.module.css';

export default function AboutSection() {
    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    <h2 className={styles.title}>About Nalata Nalata</h2>
                    <p className={styles.text}>
                        Nalata Nalata is a retail experience founded on the appreciation of people and their stories.
                        We curate a selection of goods that are designed to last, used daily, and kept for a lifetime.
                        Our collection highlights the craftsmanship of makers who infuse their work with a sense of humanity.
                    </p>
                    <Link href="/about" className={styles.link}>
                        Read Our Story
                    </Link>
                </div>
            </div>
        </section>
    );
}
