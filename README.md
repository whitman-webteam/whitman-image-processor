# Image Processor

This app provides batch resizing and cropping tools. It incorporates recommended image sizes for our website. It is purely a front-end app with no state management. Users are warned that leaving the app idle in browser may lead to lost work. This app is designed to provide the same basic tools we commonly use in Photoshop, without the overhead and advanced features we don't need.



## Svelte basics
### Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.3 create --template minimal --types jsdoc --install npm image-flow
```

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
