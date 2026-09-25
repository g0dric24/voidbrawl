import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    index( 'routes/home.tsx' ),
    route( 'sandbox', 'routes/sandbox/route.tsx' ),
    route( 'play', 'routes/play/route.tsx' ),
] satisfies RouteConfig;
