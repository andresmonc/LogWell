module.exports = function(api) {
  api.cache(true);
  
  const loose = true; // Consistent loose mode for all class-related plugins
  
  return {
    presets: [
      ['@babel/preset-env', {
        targets: {
          browsers: ['> 1%', 'last 2 versions'],
        },
        modules: false, // Let webpack handle modules
      }],
      ['@babel/preset-react', {
        runtime: 'automatic',
      }],
      '@babel/preset-typescript',
    ],
    plugins: [
      // All class-related plugins with consistent loose mode
      ['@babel/plugin-transform-class-properties', { loose }],
      ['@babel/plugin-transform-private-methods', { loose }],
      ['@babel/plugin-transform-private-property-in-object', { loose }],
    ],
  };
};

