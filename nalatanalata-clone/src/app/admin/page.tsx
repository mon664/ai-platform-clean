import styles from './admin.module.css';

export default function AdminDashboard() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>오늘의 할 일 <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>12월 02일 화요일</span></h1>
            </div>

            <div className={styles.dashboardGrid}>
                {/* Status Grid */}
                <div className={styles.widget}>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>입금전</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>배송준비중</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>배송보류중</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>배송대기</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>배송중</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>취소신청</span>
                            <span className={styles.statusValue} style={{ color: '#ff4d4f' }}>0</span>
                        </div>
                    </div>
                </div>

                {/* Sales Status */}
                <div className={styles.widget}>
                    <div className={styles.widgetHeader}>
                        <h3 className={styles.widgetTitle}>일별 매출 현황</h3>
                        <span style={{ fontSize: '12px', color: '#888' }}>2025-12-02 22:00 기준</span>
                    </div>
                    <table className={styles.salesTable}>
                        <thead>
                            <tr>
                                <th>기간별 매출</th>
                                <th>주문</th>
                                <th>결제</th>
                                <th>환불</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>11월 30일</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                            </tr>
                            <tr>
                                <td>12월 01일</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                            </tr>
                            <tr>
                                <td>12월 02일</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                                <td>0원 (0건)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
