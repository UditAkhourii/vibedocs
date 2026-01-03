"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner or use basic alert

export function SyncUsersButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/seed/sync', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                // simple alert or toast
                alert(data.message || "Users Synced Successfully");
                router.refresh();
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            alert("Error syncing users");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={loading}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync Users'}
        </Button>
    );
}
