import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  integrations: [react(), tailwind()],
  site: "https://astroproject-4637hho7p-anjans-projects-2103206a.vercel.app", // Update this to your production URL
  base: "/", // Adjust this if necessary
});
