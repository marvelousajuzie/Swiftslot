/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",           // tells Jest to use ts-jest for TS files
  testEnvironment: "node",     // backend tests run in Node, not browser
  testMatch: ["**/tests/**/*.test.ts"], // looks for files like server/tests/*.test.ts
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true
}
