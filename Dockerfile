FROM node:17-alpine3.15 as BUILD_IMAGE
WORKDIR app
COPY package.json package-lock.json ./
RUN npm install --production
COPY locales locales/
COPY dist dist/

FROM node:17-alpine3.15
WORKDIR app
COPY --from=BUILD_IMAGE app .
CMD ["node", "/app/dist/app.js"]

