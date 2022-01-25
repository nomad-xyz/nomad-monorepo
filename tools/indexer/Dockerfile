FROM node:16
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY nomad-xyz-sdk-1.2.4.tgz ./nomad-xyz-sdk-1.2.4.tgz
RUN npm i


RUN npm i ./nomad-xyz-sdk-1.2.4.tgz

# RUN rm ./nomad-xyz-sdk-1.2.4.tgz

COPY api ./api
COPY core ./core
COPY migrations ./migrations
COPY main.ts ./main.ts

CMD [ "npm", "run", "start" ]