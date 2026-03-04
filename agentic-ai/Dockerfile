FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY agentic-ai/package.json ./agentic-ai/
RUN npm install --workspace=agentic-ai
COPY agentic-ai/ ./agentic-ai/
WORKDIR /app/agentic-ai
RUN npx tsc

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/agentic-ai/package.json ./agentic-ai/
COPY --from=builder /app/agentic-ai/dist/ ./agentic-ai/dist/
COPY --from=builder /app/agentic-ai/src/prompts/ ./agentic-ai/dist/prompts/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/agentic-ai/node_modules/ ./agentic-ai/node_modules/
WORKDIR /app/agentic-ai
ENV NODE_ENV=production
EXPOSE 5200
CMD ["node", "dist/index.js"]
