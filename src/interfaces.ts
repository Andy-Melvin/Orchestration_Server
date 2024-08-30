export interface SMmessage {
    category: string;
    kind: string;
    name: string;
    body: object;
}

export interface ConversationRequest {
    input: { text: string };
    variables?: { [key: string]: any; };
    optionalArgs?: { [key: string]: any; };
}

export interface ConversationResponse {
    input?: { text: string };
    output: { text: string };
    variables?: { [key: string]: any; };
    fallback?: boolean;
}
