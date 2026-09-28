FROM node:20-slim

# Install OpenSSL for Prisma ORM
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces requires UID 1000 user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

COPY --chown=user:user package*.json ./
COPY --chown=user:user prisma ./prisma/

RUN npm install

COPY --chown=user:user . .

RUN npm run build

ENV PORT=7860
ENV NODE_ENV=production
EXPOSE 7860

CMD ["node", "index.js"]
