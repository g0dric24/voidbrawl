import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [ index( 'routes/home.tsx' ), route( 'sandbox', 'routes/sandbox/route.tsx' ) ] satisfies RouteConfig;
