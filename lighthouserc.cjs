module.exports = {
  ci: {
    collect: {
      staticDistDir: './public',
      url: ['http://localhost/', 'http://localhost/preisrechner/'],
      numberOfRuns: 1,
      settings: { chromeFlags: '--headless --no-sandbox' }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-report' }
  }
};
