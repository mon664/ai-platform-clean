import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.container}`}>
                <div className={styles.left}>
                    <Link href="/" className={styles.logo}>
                        nalatanalata
                    </Link>
                </div>

                <div className={styles.center}>
                    <nav className={styles.nav}>
                        <div className={styles.navItem}>
                            <Link href="/shop" className={styles.link}>Shop</Link>
                            <div className={styles.megaMenu}>
                                <div className={styles.megaMenuContainer}>
                                    <div className={styles.menuColumn}>
                                        <h4>Shop All</h4>
                                        <Link href="/shop">Nalata Nalata</Link>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <h4>Categories</h4>
                                        <Link href="/shop/dining">Dining</Link>
                                        <Link href="/shop/bedroom-bath">Bedroom & Bath</Link>
                                        <Link href="/shop/kitchen">Kitchen</Link>
                                        <Link href="/shop/decor">Decor</Link>
                                        <Link href="/shop/home">Home</Link>
                                        <Link href="/shop/personal">Personal</Link>
                                        <Link href="/shop/furniture-lighting">Furniture & Lighting</Link>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <h4>Brands</h4>
                                        <Link href="/brands">View All Brands</Link>
                                        <Link href="/brands/azmaya">Azmaya</Link>
                                        <Link href="/brands/saito-wood">Saito Wood</Link>
                                        <Link href="/brands/jicon">Jicon</Link>
                                        <Link href="/brands/koizumi">Makoto Koizumi</Link>
                                        <Link href="/brands/factory-zoomer">Factory Zoomer</Link>
                                        <Link href="/brands/ivazen">Ivazen</Link>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <Image
                                            src="/images/mega-menu-shop.png"
                                            alt="Featured Shop"
                                            width={300}
                                            height={200}
                                            className={styles.featuredImage}
                                        />
                                        <span className={styles.featuredCaption}>Saito Wood Wooden Mirror for Nalata Nalata</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link href="/journal" className={styles.link}>Journal</Link>
                        <Link href="/exhibitions" className={styles.link}>Exhibitions</Link>
                        <div className={styles.navItem}>
                            <Link href="/about" className={styles.link}>About</Link>
                            <div className={styles.megaMenu}>
                                <div className={styles.megaMenuContainer}>
                                    <div className={styles.menuColumn}>
                                        <h4>About Us</h4>
                                        <Link href="/about/story">Our Story</Link>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <p className={styles.addressText}>
                                            Nalata Nalata<br />
                                            2 Extra Place<br />
                                            New York, NY, 10003<br />
                                            212.228.1030<br />
                                            hello@nalatanalata.com
                                        </p>
                                        <br />
                                        <p className={styles.hoursText}>
                                            Wednesday, Friday, Saturday, Sunday<br />
                                            1pm to 5pm
                                        </p>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <Image
                                            src="/images/mega-menu-about.png"
                                            alt="About Us"
                                            width={300}
                                            height={200}
                                            className={styles.featuredImage}
                                        />
                                        <span className={styles.featuredCaption}>About Us</span>
                                        <p className={styles.aboutDescription}>Who we are and what we do</p>
                                    </div>
                                    <div className={styles.menuColumn}>
                                        <div className={styles.placeholderBox}></div>
                                        <span className={styles.featuredCaption}>Our Story</span>
                                        <p className={styles.aboutDescription}>How we started</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>

                <div className={styles.right}>
                    <button className={styles.iconButton} aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                    <Link href="/account" className={styles.iconButton} aria-label="Account">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                    <Link href="/wishlist" className={styles.iconButton} aria-label="Wishlist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </Link>
                    <Link href="/cart" className={styles.iconButton} aria-label="Cart">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                    </Link>
                    <button className={styles.menuButton}>
                        <span className={styles.menuIcon}></span>
                    </button>
                </div>
            </div>
        </header>
    );
}
