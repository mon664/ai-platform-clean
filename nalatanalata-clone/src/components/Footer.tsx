import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.top}>
                    <div className={styles.newsletter}>
                        <h3>Let&apos;s keep in touch.</h3>
                        <p>Subscribe to the Nalata Nalata newsletter to receive information on the latest happenings in our store.</p>
                        <form className={styles.form}>
                            <input type="email" placeholder="Enter your email address" className={styles.input} />
                            <button type="submit" className={styles.button}>Subscribe</button>
                        </form>
                    </div>

                    <div className={styles.links}>
                        <div className={styles.column}>
                            <Link href="/shipping-returns">Shipping and Returns</Link>
                            <Link href="/terms-conditions">Terms and Conditions</Link>
                            <Link href="/contact">Contact</Link>
                            <Link href="/friends">Friends</Link>
                        </div>
                        <div className={styles.column}>
                            <Link href="/careers">Careers</Link>
                            <Link href="/gift-card">Gift Card</Link>
                            <Link href="/registry">Registry</Link>
                        </div>
                        <div className={styles.column}>
                            <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
                            <a href="#" target="_blank" rel="noopener noreferrer">Facebook</a>
                            <a href="#" target="_blank" rel="noopener noreferrer">Pinterest</a>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} Nalata Nalata. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
