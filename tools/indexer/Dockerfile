FROM node:16
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json


# START should delete later
COPY nomad-xyz-sdk-1.2.4.tgz ./nomad-xyz-sdk-1.2.4.tgz
RUN npm i


RUN npm i ./nomad-xyz-sdk-1.2.4.tgz

# RUN rm ./nomad-xyz-sdk-1.2.4.tgz
# END should delete later


COPY api ./api
COPY main.ts ./main.ts

COPY prisma ./prisma
RUN npm run build

COPY core ./core

CMD [ "npm", "run", "start" ]