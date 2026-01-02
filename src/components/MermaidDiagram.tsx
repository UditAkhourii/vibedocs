"use client";
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export const MermaidDiagram = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState("");

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
        });

        const render = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (error) {
                console.error("Mermaid Render Error", error);
                setSvg(`<div class="text-red-500 text-xs p-2 border border-red-500/20 rounded">Failed to render diagram</div>`);
            }
        };
        render();
    }, [chart]);

    return <div className="flex justify-center my-6" dangerouslySetInnerHTML={{ __html: svg }} />;
};
