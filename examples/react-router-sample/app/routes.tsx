import { lazy } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import aboutLoader from './about.loader.js';
import Layout from './layout.js';
// import Home from './home.js';
// import About from './about.js';

const isServer = typeof document === 'undefined';

const Home = lazy(() => import(/* webpackChunkName: "home" */ './home.js'));
const About = lazy(() => import(/* webpackChunkName: "about" */ './about.js'));

export default [
  {
    id: 'layout',
    path: '/',
    Component: Layout,
    // up to you where your loaders run (client or server), this one dynamically
    // imports the correct one to avoid putting the server code in client
    // bundles
    async loader(args: LoaderFunctionArgs) {
      const mod = await (isServer
        ? import('./layout.server.js')
        : import('./layout.client.js'));
      return mod.loader(args);
    },
    // same with the action, you'll probably want to abstract this kind of stuff
    // in a createRoute() kind of thing
    async action(args: ActionFunctionArgs) {
      const mod = await (isServer
        ? import('./layout.server.js')
        : import('./layout.client.js'));
      return mod.action(args);
    },
    children: [
      {
        id: 'home',
        index: true,
        Component: Home,
      },
      {
        id: 'about',
        path: 'about',
        Component: About,
        // this loader runs in both places
        loader: aboutLoader,
      },
    ],
  },
];
