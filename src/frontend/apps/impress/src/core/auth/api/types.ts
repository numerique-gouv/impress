/**
 * Represents user retrieved from the API.
 * @interface User
 * @property {string} id - The id of the user.
 * @property {string} sub - The `sub` field of OIDC
 * @property {string} email - The email of the user.
 * @property {string} name - The name of the user.
 */
export interface User {
  id: string;
  sub: string;
  email: string;
}
