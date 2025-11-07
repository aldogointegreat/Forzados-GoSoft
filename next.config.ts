import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async redirects() {
		return [
			{
				source: "/",
				destination: "/dashboard/consultas",
				permanent: true,
			},
			{
				source: "/dashboard",
				destination: "/dashboard/consultas",
				permanent: true,
			},
		];
	},
 
 
};

export default nextConfig;
