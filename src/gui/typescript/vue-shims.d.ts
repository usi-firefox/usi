/**
 *  https://github.com/Microsoft/TypeScript-Vue-Starter
 * 
 *  When using Webpack or Browserify, Vue has plugins like vue-loader and vueify which allow you to author
 *  your components in HTML-like files. These files, which end in a .vue extension, are single file components.
 * 
 *  There are a few things that need to be put in place to use .vue files with TypeScript,
 *  but luckily we're already halfway there. We already installed vue-loader earlier when we got our dev dependencies.
 *  We also specified the appendTsSuffixTo: [/\.vue$/], option to ts-loader in our webpack.config.js file,
 *  which allows TypeScript to process the code extracted from a single file component.
 * 
 *  One extra thing we'll have to do is tell TypeScript what .vue files will look like when they're imported.
 *  We'll do this with a vue-shims.d.ts file:
 */

declare module "*.vue" {
    import Vue from "vue";
    export default Vue;
}