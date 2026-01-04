"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserActions({ userId, userEmail }: { userId: string, userEmail: string }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error('Failed to delete');
            setIsDeleteDialogOpen(false);
            router.refresh();
        } catch (error) {
            alert("Error deleting user");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword })
            });
            if (!res.ok) throw new Error('Failed to update password');
            alert("Password updated successfully");
            setIsPasswordDialogOpen(false);
            setNewPassword("");
        } catch (error) {
            alert("Error updating password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Change Password">
                        <KeyRound className="w-4 h-4" />
                    </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {userEmail}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handlePasswordChange} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                    <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {userEmail}? This will permanently remove their account and all associated documents.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleDelete} disabled={isLoading} variant="destructive" className="bg-red-600 hover:bg-red-700">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete user"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
