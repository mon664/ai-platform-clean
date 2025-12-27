import Image from 'next/image';
import Link from 'next/link';
import styles from './ProductGrid.module.css';

interface Product {
    id: string;
    name: string;
    price?: string;
    image: string;
    slug: string;
}

interface ProductGridProps {
    products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Latest Products</h2>
                    <Link href="/shop" className={styles.viewAll}>
                        Shop All
                    </Link>
                </div>
                <div className={styles.grid}>
                    {products.map((product) => (
                        <Link href={`/product/${product.slug}`} key={product.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className={styles.image}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className={styles.placeholderImage}></div>
                                )}
                            </div>
                            <div className={styles.details}>
                                <h3 className={styles.name}>{product.name}</h3>
                                {product.price && <p className={styles.price}>{product.price}</p>}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
