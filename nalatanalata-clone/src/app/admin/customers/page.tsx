import styles from '../admin.module.css';

// Mock Data
const customers = [
    { id: 1, name: "John Doe", email: "john@example.com", joined: "2023-11-01", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", joined: "2023-11-05", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", joined: "2023-11-10", status: "Inactive" },
];

export default function CustomersPage() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>고객 관리</h1>
                <button className={styles.actionButton}>+ 고객 추가</button>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>이름</th>
                            <th>이메일</th>
                            <th>가입일</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.id}</td>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>{customer.joined}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: customer.status === 'Active' ? '#e6f7ff' : '#fff1f0',
                                        color: customer.status === 'Active' ? '#1890ff' : '#f5222d',
                                        fontSize: '12px'
                                    }}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td>
                                    <button style={{
                                        marginRight: '8px',
                                        padding: '4px 8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}>수정</button>
                                    <button style={{
                                        padding: '4px 8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: 'white',
                                        color: 'red',
                                        cursor: 'pointer'
                                    }}>삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
