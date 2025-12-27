import Link from 'next/link';
import Image from 'next/image';
import styles from './JournalSection.module.css';

interface JournalEntry {
    id: string;
    title: string;
    excerpt?: string;
    slug: string;
    image?: string;
}

interface JournalSectionProps {
    entries: JournalEntry[];
}

export default function JournalSection({ entries }: JournalSectionProps) {
    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Journal</h2>
                    <Link href="/journal" className={styles.viewAll}>
                        Read All
                    </Link>
                </div>
                <div className={styles.grid}>
                    {entries.map((entry) => (
                        <Link href={`/journal/${entry.slug}`} key={entry.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                {entry.image ? (
                                    <Image
                                        src={entry.image}
                                        alt={entry.title}
                                        fill
                                        className={styles.image}
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className={styles.placeholderImage}></div>
                                )}
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.entryTitle}>{entry.title}</h3>
                                {entry.excerpt && <p className={styles.excerpt}>{entry.excerpt}</p>}
                                <span className={styles.readMore}>Read Story</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
