// 1. IMPORT OUR TOOLS
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

// 2. INITIALIZE THE SERVER AND THE DATABASE
const app = express();
const prisma = new PrismaClient();
// Initialize Gemini AI with our secret key from the .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. MIDDLEWARE (The Security Guards)
app.use(cors()); // Allow our React frontend to talk to us
app.use(express.json()); // Allow the server to understand incoming JSON data

// =========================================================
// 4. OUR API ENDPOINTS (The Waiter's Menu)
// =========================================================

// GET Endpoint: Fetch all expenses from the database
app.get('/api/expenses', async (req, res) => {
  try {
    // Ask Prisma to find many expenses in the database
    const allExpenses = await prisma.expense.findMany();
    // Send them back to the React app
    res.json(allExpenses);
  }  catch (error) {
  // Add this line to print it to your terminal:
  console.error("❌ DATABASE COUPLING ERROR:", error); 
  
  // Update this line to return the raw error message to Hoppscotch:
  res.status(500).json({ error: "Failed to fetch expenses", details: error.message });
}
});

// POST Endpoint: Save a brand new expense to the database
app.post('/api/expenses', async (req, res) => {
  try {
    // Look at the data sent from the React app (amount, category)
    const { amount, category } = req.body;
    
    // Ask Prisma to create a new row in the database
    const newExpense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount), // Ensure it is saved as a number
        category: category
      }
    });
    // Send a success message back to the React app
    res.json(newExpense);
  } catch (error) {
    res.status(500).json({ error: "Failed to save expense" });
  }
});
// POST Endpoint: Analyze voice text using Gemini AI
app.post('/api/analyze', async (req, res) => {
  try {
    // 1. Grab the messy spoken words sent from the frontend React app
    const spokenText = req.body.text;

    // 2. Select the specific Gemini model we want to use (Gemini 1.5 Flash is fast and free)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. PROMPT ENGINEERING: Give the AI strict, unbreakable rules
    const prompt = `
You are an expert financial categorizer.
Read the following spoken text and extract the amount and category as JSON.
Only output the JSON, nothing else.
Spoken Text: "${spokenText}"
    `;

    // 4. Send the prompt to Gemini and wait for it to think
    const result = await model.generateContent(prompt);

    // 5. Extract the AI's final answer
    const aiResponse = result.response.text();

    // 6. Console-log the result to see the AI perfectly structure the data!
    console.log("🤖 GEMINI AI SAYS:", aiResponse);

    // 7. Send the cleaned-up data back to the frontend
    res.json({ result: aiResponse });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to analyze text" });
  }
});
// POST Endpoint: Analyze a receipt image using Gemini Vision
app.post('/api/scan-receipt', async (req, res) => {
  try {
    // 1. Grab the image data sent from the React frontend
    const { imageBase64 } = req.body; 

    // 2. Wake up the Gemini model (using 2.5-flash to match your updated setup!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. PROMPT ENGINEERING: Teach the AI how to behave like an accountant
    const prompt = `
You are an expert accountant. Look at this receipt image.
Extract the Merchant Name and the Total Amount Paid.
Return ONLY a valid JSON object like this: {"merchant": "Name", "amount": 100}
    `;

    // 4. Package the image data so Google's systems can process it
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };

    // 5. Send both the instructions AND the image to Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const aiResponse = result.response.text();
    console.log("🔍 GEMINI VISION SAYS:", aiResponse);

    // 6. Send the extracted data back to your React app
    res.json({ result: aiResponse });

  } catch (error) {
    console.error("Vision AI Error:", error);
    res.status(500).json({ error: "Failed to scan receipt" });
  }
});
// =========================================================
// 5. TURN ON THE SERVER WITH DIAGNOSTICS
// =========================================================
const PORT = 5001;

const server = app.listen(PORT, () => {
  console.log(`Server is running live on http://localhost:${PORT}`);
});

// Catch explicit server network errors
server.on('error', (error) => {
  console.error('❌ SERVER ERROR:', error);
});

// Catch hidden asynchronous code crashes
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});