import express from 'express';
import * as WebSocket from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { handleMessage, callLLMEndpoint } from './controller';  // Import the LLM function
import { ConversationRequest, ConversationResponse, SMmessage } from 'interfaces'; // Import necessary types

// Load environment variables from .env file
dotenv.config();
const PORT = process.env.EXPRESS_PORT || 5050;

// Initialize application
const app = express();
const server = createServer(app);

// Use JSON middleware to parse JSON bodies
app.use(express.json());

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log('A new client Connected');
    
    ws.on('message', (message) => {
        handleMessage(ws, message);
    });
});

// Express API Endpoint to test LLM integration
app.post('/test-llm', async (req, res) => {
    const conversationRequest: ConversationRequest = req.body;

    if (!conversationRequest || !conversationRequest.input || !conversationRequest.input.text) {
        return res.status(400).send('Invalid request. Please provide a valid ConversationRequest with input text.');
    }

    try {
        // Call the LLM endpoint to get a response for the user's input
        const generatedText = await callLLMEndpoint(conversationRequest.input.text);

        // Construct the ConversationResponse
        let conversationResponse: ConversationResponse = {
            input: { text: conversationRequest.input.text },
            output: { text: generatedText },
            variables: {}
        };

        // Example logic for additional response handling (e.g., if the request is of type 'init')
        if (conversationRequest.optionalArgs?.kind === 'init') {
            conversationResponse.output.text = 'Hi there!';
        }

        // Example fallback response for questions starting with 'why'
        if (conversationRequest.input.text.toLowerCase().startsWith('why')) {
            conversationResponse.output.text = 'I do not know how to answer that';
            conversationResponse.fallback = true;
        }

        // Example response for showing a card
        if (conversationRequest.input.text.toLowerCase() === 'show card') {
            conversationResponse.output.text = 'Here is a cat @showcards(cat)';
            conversationResponse.variables['public-cat'] = {
                'component': 'image',
                'data': {
                    'alt': 'A cute kitten',
                    'url': 'https://placekitten.com/300/300'
                }
            };
        }

        // Send the conversation response back to the client
        res.json(conversationResponse);

    } catch (error) {
        console.error('Error processing LLM request: ', error);
        res.status(500).send('Error calling LLM API.');
    }
});

// Express Server
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}.`);
});
