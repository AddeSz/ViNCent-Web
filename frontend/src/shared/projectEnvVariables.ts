type ProjectEnvVariablesType = Pick<
  ImportMetaEnv,
  "VITE_BACKEND_URL" | "VITE_PORT" | "VITE_GENERATE_SOURCEMAP"
>;

const projectEnvVariables: ProjectEnvVariablesType = {
  VITE_BACKEND_URL: "${VITE_BACKEND_URL}",
  VITE_PORT: "${VITE_PORT}",
  VITE_GENERATE_SOURCEMAP: "${VITE_GENERATE_SOURCEMAP}",
};

export const getProjectEnvVariables = (): {
  envVariables: ProjectEnvVariablesType;
} => {
  return {
    envVariables: {
      VITE_BACKEND_URL: !projectEnvVariables.VITE_BACKEND_URL.includes("VITE_")
        ? projectEnvVariables.VITE_BACKEND_URL
        : import.meta.env.VITE_BACKEND_URL,
      VITE_PORT: !projectEnvVariables.VITE_PORT.includes("VITE_")
        ? projectEnvVariables.VITE_PORT
        : import.meta.env.VITE_PORT,
      VITE_GENERATE_SOURCEMAP:
        !projectEnvVariables.VITE_GENERATE_SOURCEMAP.includes("VITE_")
          ? projectEnvVariables.VITE_GENERATE_SOURCEMAP
          : import.meta.env.VITE_GENERATE_SOURCEMAP,
    },
  };
};
