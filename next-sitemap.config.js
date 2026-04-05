/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://image-background-remover.space',
  generateRobotsTxt: true,
  outDir: 'out',
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
}
