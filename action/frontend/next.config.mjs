// Next.js configuration for GitHub Pages static deployment with auto basePath
// - Reads BASE_PATH from env (preferred, set in CI)
// - Falls back to inferring from GITHUB_REPOSITORY when running in CI
// - Uses empty basePath locally for dev convenience

const getBasePath = () => {
  const basePathFromEnv = process.env.BASE_PATH;
  if (typeof basePathFromEnv === 'string') {
    return basePathFromEnv;
  }

  if (process.env.CI && process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) {
      const lowerOwner = owner.toLowerCase();
      const lowerRepo = repo.toLowerCase();
      const isUserSite = lowerRepo === `${lowerOwner}.github.io`;
      return isUserSite ? '' : `/${repo}`;
    }
  }

  return '';
};

const computedBasePath = getBasePath();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: computedBasePath || undefined,
  assetPrefix: computedBasePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;


