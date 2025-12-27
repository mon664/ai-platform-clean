import Link from 'next/link';
import styles from '../admin.module.css';

const PRODUCTS = [
    { id: '1', name: 'Chopsticks - Bamboo', price: '$24.00', stock: 45 },
    { id: '2', name: 'Hands & Hand Vase', price: '$120.00', stock: 12 },
    { id: '3', name: 'White Oak Standing Shoehorn', price: '$85.00', stock: 28 },
    { id: '4', name: 'Cherry Bark Photo Frame', price: '$65.00', stock: 15 },
    { id: '5', name: 'Cherry Bark Candy Box', price: '$55.00', stock: 30 },
    { id: '6', name: 'Down Feather Hand Warmers', price: '$45.00', stock: 50 },
    { id: '7', name: 'Murai Stool', price: '$350.00', stock: 5 },
    { id: '8', name: 'Still Incense Holder - Cone', price: '$38.00', stock: 42 },
];

export default function ProductsPage() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Products</h1>
                <Link href="/admin/products/new" className={styles.actionButton}>
                    Add Product
                </Link>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PRODUCTS.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.price}</td>
                                <td>{product.stock}</td>
                                <td>Active</td>
                                <td>
                                    <button style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>Edit</button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
