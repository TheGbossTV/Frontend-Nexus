import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("category/:slug", "routes/category.tsx"),
  route("library/:slug", "routes/library.tsx"),
] satisfies RouteConfig;
