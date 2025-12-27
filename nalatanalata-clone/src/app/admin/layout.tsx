import Link from 'next/link';
import styles from './admin.module.css';

// Simple SVG Icons
const HomeIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>;
const OrderIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
const ProductIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11z" /><path d="M17.5 13h-11L2 22h20z" /></svg>; // Simplified
const UserIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
const DesignIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>; // Info icon as placeholder
const ChartIcon = () => <svg className={styles.navIcon} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2v-3h2v3zm4 0h-2v-5h2v5z" /></svg>;

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.adminContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <HomeIcon />
                    <Link href="/" className={styles.sidebarLogo}>
                        Cafe24 Style
                    </Link>
                </div>
                <nav className={styles.nav}>
                    <Link href="/admin" className={styles.navLink}>
                        <HomeIcon /> 홈
                    </Link>
                    <Link href="/admin/orders" className={styles.navLink}>
                        <OrderIcon /> 주문
                    </Link>
                    <Link href="/admin/products" className={styles.navLink}>
                        <ProductIcon /> 상품
                    </Link>
                    <Link href="/admin/customers" className={styles.navLink}>
                        <UserIcon /> 고객
                    </Link>
                    <Link href="/admin/design" className={styles.navLink}>
                        <DesignIcon /> 디자인 (PC/모바일)
                    </Link>
                    <Link href="/admin/editor" className={styles.navLink}>
                        <DesignIcon /> 비주얼 에디터 (Puck) <span className={styles.badge}>NEW</span>
                    </Link>
                    <Link href="/admin/analytics" className={styles.navLink}>
                        <ChartIcon /> 카페24 애널리틱스 <span className={styles.badge}>NEW</span>
                    </Link>
                    <Link href="/admin/stats" className={styles.navLink}>
                        <ChartIcon /> 통계
                    </Link>
                </nav>
            </aside>
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
