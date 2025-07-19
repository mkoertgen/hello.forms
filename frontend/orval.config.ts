import { defineConfig } from 'orval';

export default defineConfig({
  formsApi: {
    input: {
      target: 'http://localhost:3000/api-json',
    },
    output: {
      mode: 'split',
      target: 'src/app/generated/api.ts',
      schemas: 'src/app/generated/models',
      client: 'angular',
      mock: true,
      override: {
        angular: {
          provideIn: 'root',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
