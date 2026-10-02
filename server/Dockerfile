FROM node:20-alpine
WORKDIR /srv
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
EXPOSE 3000
CMD ["node", "index.js"]
