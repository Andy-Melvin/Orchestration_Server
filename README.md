# Orchestration-nodejs

This is an example orchestration server implementation using Node JS.
It is set up to be used as a conversation server.

## Run it

Run the dev npm script for development, it will automatically re-start and update as you make any code changes:

```sh
npm install
npm run dev
```

You can change the server port by editing the `.env` file.

## Modify it

You can edit the `handleRequest()` function in `controller.ts`.
The example takes the input from the conversation request and sends an "echo" conversation response. It also shows examples of how to set up a welcome message, a fallback response (this can be useful if you have other skills configured in your DDNA Studio project), and a response with SM content cards.

### Fallback responses

You can flag any given conversation response as a "fallback". This can be helpful when using skills in your DDNA studio project: if a fallback response is detected, a skill in the project may be used to fulfill the original request.

For example you may be using a fallback skill powered by a LLM, on top of your orchestration skill configured as a base conversation. For a given request, your orchestration server may reply with a fallback response, such as "I do not know how to answer that". If the fallback flag is set, the SM system can automatically redirect the original request to the fallback skill, producing a more appropriate answer.

The sample code in `controller.ts` shows an example flagging a response as fallback for any request that starts with the word "why":

```ts
// Set fallback response example (can be handled by skills in the project)
if (req.input.text.toLowerCase().startsWith('why')) {
    resp.output.text = 'I do not know how to answer that';
    resp.fallback = true;
}
```
