import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "react-hooks/exhaustive-deps": "warn",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["FC"],
              message: "Use explicit prop typing instead of FC.",
            },
          ],
        },
      ],
    },
  },
  { ignores: [".next/**", "out/**", "node_modules/**", "playwright-report/**"] },
];
