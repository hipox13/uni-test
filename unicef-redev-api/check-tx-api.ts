async function check() {
    const refId = 'UNICEF-20260304191808-42246a5c';
    try {
        const res = await fetch(`http://localhost:3002/api/v1/payments/status/${refId}`);
        const data = await res.json();
        console.log('--- API Transaction Status (All Cycles) ---');

        if (data.transaction?.paids) {
            data.transaction.paids.forEach((p: any) => {
                console.log(`Cycle ${p.cycleNumber}: status=${p.status}, amount=${p.paidAmount}, VA=${p.failedMessage || 'N/A'}`);
            });
        }
    } catch (err) {
        console.error('Failed to fetch:', err);
    }
}

check();
