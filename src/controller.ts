import { ConversationRequest, ConversationResponse, SMmessage } from 'interfaces';
import * as WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Hugging Face API endpoint and token
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/openai-community/gpt2';
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Function to handle incoming WebSocket messages
export function handleMessage(ws: WebSocket, message: any) {
    try {
        const msg: SMmessage = JSON.parse(message);
        if (msg.name == 'conversationRequest') {
            let request: ConversationRequest = msg.body as ConversationRequest;
            handleRequest(ws, request);
        }
    } catch (error) {
        console.log('Unrecognized message: ', message, error);
    }
}

// Function to handle conversation requests
export async function handleRequest(ws: WebSocket, req: ConversationRequest) {
    console.log('Conv request: ', req);

    try {
        // Call the Hugging Face API with the user input
        const generatedText = await callLLMEndpoint(req.input.text);

        // Construct the ConversationResponse
        let resp: ConversationResponse = {
            input: { text: req.input.text },
            output: { text: generatedText },
            variables: {}
        };

        // Handle special cases
        if (req.optionalArgs?.kind == 'init') {
            resp.output.text = 'Hi there!';
        }

        if (req.input.text.toLowerCase().startsWith('why')) {
            resp.output.text = 'I do not know how to answer that';
            resp.fallback = true;
        }

        if (req.input.text.toLowerCase() == 'show card') {
            resp.output.text = 'Here is a cat @showcards(cat)';
            resp.variables['public-cat'] = {
                'component': 'image',
                'data': {
                    'alt': 'A cute kitten',
                    'url': 'https://placekitten.com/300/300'
                }
            };
        }

        // Send the response back to the client
        sendMessage(ws, resp);

    } catch (error) {
        console.error('Error processing request: ', error);
        
        // Send a fallback response if there's an error
        sendMessage(ws, {
            input: { text: req.input.text },
            output: { text: 'There was an error processing your request.' },
            variables: {},
            fallback: true
        });
    }
}

// Function to call the LLM Endpoint
export async function callLLMEndpoint(inputText: string): Promise<string> {
    try {
        const response = await axios.post(
            HUGGINGFACE_API_URL,
            { inputs: inputText },
            {
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract the generated text from the Hugging Face API response
        return response.data[0]?.generated_text || 'No response from LLM';

    } catch (error) {
        console.error('Error calling Hugging Face API: ', error);
        throw error;
    }
}

// Function to send a message back through WebSocket
function sendMessage(ws: WebSocket, resp: ConversationResponse) {
    let message: SMmessage = {
        category: 'scene',
        kind: 'request',
        name: 'conversationResponse',
        body: resp
    };

    ws.send(JSON.stringify(message));
}
