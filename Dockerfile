FROM node:7

RUN mkdir -p /application
RUN mkdir -p /package
WORKDIR /application

# Set up the basics:

ENV PORT 80
EXPOSE 80

ENV NODE_PATH=/package/node_modules

COPY package.json /package/package.json
RUN npm install --prefix=/package react react-dom draft-convert
RUN npm install --prefix=/package

# By default, run the application with node:

CMD [ "npm" "run" "dev" ]

