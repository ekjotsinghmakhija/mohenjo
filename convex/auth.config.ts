export default {
  providers: [
    {
      // This refers to the variable you kept in the dashboard
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
