/**
 * Webpack plugin to fix ESM module resolution issues
 * Adds .js extensions to imports that are missing them
 */
class ESMResolverPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('ESMResolverPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('ESMResolverPlugin', (data) => {
        if (!data) return;
        
        // List of packages that need file extensions
        const packagesNeedingExtensions = [
          '@react-native-async-storage/async-storage',
          '@react-navigation/native',
          '@react-navigation/stack',
          '@react-navigation/elements',
        ];
        
        // Check if this is a relative import from one of these packages
        const isRelativeImport = data.request.startsWith('./') || data.request.startsWith('../');
        const context = data.context || '';
        
        if (isRelativeImport) {
          const needsExtension = packagesNeedingExtensions.some(pkg => 
            context.includes(pkg) && 
            !data.request.endsWith('.js') && 
            !data.request.endsWith('.ts') &&
            !data.request.endsWith('.tsx') &&
            !data.request.includes('.')
          );
          
          if (needsExtension) {
            data.request = data.request + '.js';
          }
        }
      });
    });
  }
}

module.exports = ESMResolverPlugin;

