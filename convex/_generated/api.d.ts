/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as router from "../router.js";
import type * as sampleData from "../sampleData.js";
import type * as suppliers from "../suppliers.js";
import type * as supplies from "../supplies.js";
import type * as userRoles from "../userRoles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auth: typeof auth;
  categories: typeof categories;
  dashboard: typeof dashboard;
  http: typeof http;
  inventory: typeof inventory;
  router: typeof router;
  sampleData: typeof sampleData;
  suppliers: typeof suppliers;
  supplies: typeof supplies;
  userRoles: typeof userRoles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
