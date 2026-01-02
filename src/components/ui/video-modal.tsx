"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface VideoModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    videoId: string;
    title?: string;
    children?: React.ReactNode;
}

export function VideoModal({ isOpen, onClose, videoId, title, children }: VideoModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] w-[95vw] bg-[#0A0A0B] border-white/10 p-0 overflow-hidden gap-0">
                <DialogTitle className="sr-only">{title || "Video Video"}</DialogTitle>
                <div className="relative pt-[56.25%] bg-black">
                    <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={title || "YouTube video player"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                {children && <div className="p-6 bg-[#141416] border-t border-white/5">{children}</div>}
            </DialogContent>
        </Dialog>
    );
}
