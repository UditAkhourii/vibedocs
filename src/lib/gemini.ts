
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type GeneratedDocSection = {
    id: string;
    title: string;
    category: string;
    description: string;
};

// Phase 1: The Architect (Structure Planning)
export async function generateDocsStructure(
    repoName: string,
    fileStructure: string,
    packageJson: string,
    deepContext: string
): Promise<GeneratedDocSection[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    You are an ELITE Software Architect.
    Your task is to Plan the Documentation Structure for: ${repoName}.

    CONTEXT:
    1. File Tree:
    ${fileStructure.substring(0, 10000)}

    ${packageJson ? `2. package.json:\n${packageJson.substring(0, 5000)}\n` : ''}

    ${deepContext ? `3. Key Source Code (Deep Scan):\n${deepContext.substring(0, 40000)}\n` : ''}

    INSTRUCTIONS:
    - Analyze the system architecture based on the provided files.
    - Create a Table of Contents (TOC) for a comprehensive documentation site.
    - **CRITICAL**: You MUST organize sections into logical, DISTINCT categories.
    - **ABSOLUTE PROHIBITION**: Do NOT put everything under a single category. You MUST use **at least 3 different categories**.
    - **DO NOT** use generic categories like "General", "Project Docs", "Documentation", or "Misc".
    - Aim for 5-8 distinct categories to create a rich, navigable structure.
    - Avoid huge categories. If a category has more than 5 items, split it.

    - DO NOT generate the actual content yet. Just the plan.
    - Be granular.
    - OUTPUT MUST BE RAW JSON ONLY. NO PREAMBLE. NO EXPLANATION.

    OUTPUT FORMAT: JSON Array of objects.
    [
      { 
        "id": "arch-overview", 
        "title": "System Architecture", 
        "category": "Architecture",
        "description": "High-level diagram and explanation of the system components."
      },
      {
        "id": "quick-start",
        "title": "Quick Start",
        "category": "Getting Started",
        "description": "How to get up and running."
      }
    ]
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // More robust JSON extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const cleanJson = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const docs = JSON.parse(cleanJson);

            // Analyze diversity
            const categories = new Set(docs.map((d: any) => d.category));
            const isLowDiversity = categories.size < 2; // If only 1 category, that's bad.

            // Enforce categories and add heuristics
            return docs.map((doc: any) => {
                let category = doc.category;
                const lowerCat = category ? category.toLowerCase() : "";

                // 1. Check for bad categories OR low diversity
                if (!category ||
                    lowerCat === "project docs" ||
                    lowerCat === "general" ||
                    lowerCat === "documentation" ||
                    lowerCat === "docs" ||
                    isLowDiversity
                ) {
                    // 2. Simple Keyword Heuristics to fix bad categorization
                    const lowerTitle = doc.title.toLowerCase();

                    if (lowerTitle.includes("intro") || lowerTitle.includes("start") || lowerTitle.includes("install") || lowerTitle.includes("setup") || lowerTitle.includes("getting started") || lowerTitle.includes("overview")) {
                        category = "Getting Started";
                    } else if (lowerTitle.includes("api") || lowerTitle.includes("reference") || lowerTitle.includes("interface") || lowerTitle.includes("type") || lowerTitle.includes("schema") || lowerTitle.includes("sdk")) {
                        category = "API Reference";
                    } else if (lowerTitle.includes("architect") || lowerTitle.includes("system") || lowerTitle.includes("design") || lowerTitle.includes("structure") || lowerTitle.includes("pattern") || lowerTitle.includes("flow")) {
                        category = "Architecture";
                    } else if (lowerTitle.includes("component") || lowerTitle.includes("ui") || lowerTitle.includes("view") || lowerTitle.includes("page") || lowerTitle.includes("screen")) {
                        category = "Components";
                    } else if (lowerTitle.includes("util") || lowerTitle.includes("lib") || lowerTitle.includes("helper") || lowerTitle.includes("shared") || lowerTitle.includes("common")) {
                        category = "Utilities";
                    } else if (lowerTitle.includes("hook") || lowerTitle.includes("state") || lowerTitle.includes("store") || lowerTitle.includes("context") || lowerTitle.includes("provider")) {
                        category = "State Management";
                    } else if (lowerTitle.includes("config") || lowerTitle.includes("env") || lowerTitle.includes("setting") || lowerTitle.includes("option")) {
                        category = "Configuration";
                    } else if (lowerTitle.includes("deploy") || lowerTitle.includes("ci") || lowerTitle.includes("cd") || lowerTitle.includes("build") || lowerTitle.includes("release") || lowerTitle.includes("docker")) {
                        category = "Deployment & DevOps";
                    } else if (lowerTitle.includes("test") || lowerTitle.includes("spec") || lowerTitle.includes("e2e") || lowerTitle.includes("coverage")) {
                        category = "Testing";
                    } else if (lowerTitle.includes("auth") || lowerTitle.includes("service") || lowerTitle.includes("controller") || lowerTitle.includes("backend") || lowerTitle.includes("server") || lowerTitle.includes("database") || lowerTitle.includes("model")) {
                        category = "Backend & Services";
                    } else if (lowerTitle.includes("guide") || lowerTitle.includes("tutorial") || lowerTitle.includes("how") || lowerTitle.includes("example") || lowerTitle.includes("walkthrough")) {
                        category = "Guides";
                    } else if (lowerTitle.includes("advanced") || lowerTitle.includes("deep") || lowerTitle.includes("internal") || lowerTitle.includes("core") || lowerTitle.includes("engine") || lowerTitle.includes("optimization")) {
                        category = "Advanced Topics";
                    } else {
                        category = "General Documentation";
                    }
                }

                return { ...doc, category };
            });
        } catch (e) {
            console.error("Failed to parse Gemini JSON. Raw text:", text);
            throw new Error("AI returned invalid JSON structure.");
        }
    } catch (error: any) {
        console.error("Gemini Structure Plan failed:", error);
        throw new Error(error.message || "Failed to plan documentation");
    }
}

// Phase 2: The Writer (Content Generation)
export async function generatePageContent(
    pageTitle: string,
    sectionDescription: string,
    deepContext: string,
    repoName: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    You are a Senior Technical Writer.
    Task: Write the "${pageTitle}" section for the ${repoName} documentation.

    Context Code:
    ${deepContext.substring(0, 40000)}

    Section Goal: ${sectionDescription}

    GUIDELINES:
    - **CRITICAL**: Focus on the **PUBLIC INTERFACE** and **USAGE**.
    - Do NOT explain internal implementation details or private variables unless they are critical for configuration.
    - Write for the USER of this code, not the maintainer.
    - If documented component/function is internal, mention it is internal but briefly explain its role.
    - Use Code Blocks to illustrate usage examples.
    - If documenting API, document input/outputs and types.
    - Use standard Markdown formatting.
    - DO NOT include the page title or a top-level H1 in your output (the UI handles this). Start directly with sections (H2/H3).
    - Do NOT wrap the main output (no JSON, just the markdown string).

    OUTPUT: Pure Markdown content.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error(`Gemini Content Gen failed for ${pageTitle}:`, error);
        return `> **Error**: Failed to generate content for this section.\n> \n> *${error.message}*`;
    }
}

// Phase 3: The Librarian (Context Chat)
export async function streamChatContext(
    history: { role: "user" | "model", parts: string }[],
    contextDocs: string,
    query: string
) {
    const systemInstruction = `
    You are the SuperDocs AI Assistant.
    You are an expert on the provided documentation context.
    
    CONTEXT:
    ${contextDocs}

    INSTRUCTIONS:
    - Answer the user's question based ONLY on the provided context.
    - If the answer is not in the context, say "I don't have enough information in the docs to answer that."
    - Be concise, helpful, and friendly.
    - Format answers in Markdown.
    `;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: systemInstruction
    });

    const chat = model.startChat({
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.parts }]
        }))
    });

    const result = await chat.sendMessageStream(query);
    return result.stream;
}
