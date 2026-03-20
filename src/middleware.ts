import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only the landing page and Auth routes are public
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/convex(.*)" // Allow Convex to handle its own internal pings
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
