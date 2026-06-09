// import axios from "axios";

// const adminAxios = axios.create();

// adminAxios.interceptors.request.use((config) => {
//   const token = sessionStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;

//   const user = JSON.parse(sessionStorage.getItem("user") || "{}");
//   if (user.organization) config.headers["x-org"] = user.organization;

//   const region = user.region || sessionStorage.getItem("selected_region") || "US";
//   if (region !== "AUTO") config.headers["x-region"] = region;

//   return config;
// });

// adminAxios.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     // Do NOT auto-logout here — cross-service 401/403 errors
//     // (risk-service, tprm-service etc.) should not clear the session.
//     // Only adminApi (user-service) handles auth-based logout.
//     return Promise.reject(err);
//   }
// );

// export default adminAxios;

import axios from "axios";

const adminAxios = axios.create();

adminAxios.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");
    const user  = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (user.organization) {
        config.headers["x-org"] = user.organization;
    }

    // x-role — extract from array if needed e.g. ['root'] → 'root'
    const role = Array.isArray(user.role) ? user.role[0] : user.role;
    if (role) {
        config.headers["x-role"] = role;
    }

    // x-region — no hardcoded fallback; let backend default to "in"
    const region = user.region || sessionStorage.getItem("selected_region");
    if (region && region !== "AUTO") {
        config.headers["x-region"] = region;
    }

    return config;
});

adminAxios.interceptors.response.use(
    (res) => res,
    (err) => {
        return Promise.reject(err);
    }
);

export default adminAxios;