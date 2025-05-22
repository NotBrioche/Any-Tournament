FROM node:alpine AS build
WORKDIR /app

COPY . .

RUN npm install --omit=dev && npm run build:css

FROM node:alpine AS main
COPY --from=build /app .

EXPOSE 3000
EXPOSE 8080

CMD ["node", "index.js"]