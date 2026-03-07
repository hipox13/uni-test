import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { ArrowLeft, Loader2, StopCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BulkStopPage() {
    const navigate = useNavigate();
    const [refIds, setRefIds] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        const ids = refIds.split('\n').map(s => s.trim()).filter(Boolean);
        if (ids.length === 0) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await apiClient.post('/payments/bulk-stop', { refIds: ids });
            setResults(res.data.results);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bulk Stop Subscriptions</h1>
                    <p className="text-muted-foreground">Stop multiple monthly donations at once</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Enter Ref IDs</CardTitle>
                    <CardDescription>
                        Enter one Ref ID per line (e.g., UNICEF-20260305...)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="UNICEF-123456&#10;UNICEF-789012"
                        rows={8}
                        className="font-mono text-sm"
                        value={refIds}
                        onChange={(e) => setRefIds(e.target.value)}
                        disabled={loading}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleProcess}
                            disabled={loading || !refIds.trim()}
                            className="gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
                            Process Bulk Stop
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {error}
                </div>
            )}

            {results && (
                <Card>
                    <CardHeader>
                        <CardTitle>Results Summary</CardTitle>
                        <CardDescription>
                            {results.filter(r => r.success).length} successful, {results.filter(r => !r.success).length} failed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {results.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-md border text-sm">
                                    {r.success ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                    <span className="font-mono flex-1">{r.refId}</span>
                                    {!r.success && <span className="text-destructive text-xs italic">{r.message}</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
