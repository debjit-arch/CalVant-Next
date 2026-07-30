// Public billing-service client — pricing page + self-serve signup are the only
// two callers, neither has a session yet, so no auth interceptor here.
// Mirrors the "https://api.calvant.com/<service>" gateway convention used
// everywhere else in this app (see src/modules/admin/api/adminApi.js).
import axios from "axios";

const BILLING_BASE = "https://api.calvant.com/billing-service/api/billing";

const billingApi = axios.create({
  baseURL: BILLING_BASE,
  headers: { "Content-Type": "application/json" },
});

export const getStarterPackage = () => billingApi.get("/starter-package").then((r) => r.data);

export const getAddOns = () => billingApi.get("/addons").then((r) => r.data);

export const selfServeSignup = (payload) =>
  billingApi.post("/self-serve-signup", payload).then((r) => r.data);

export default billingApi;
