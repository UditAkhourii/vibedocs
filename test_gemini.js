
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    try {
        const result = await model.generateContent("Hello");
        console.log("Success:", await result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
