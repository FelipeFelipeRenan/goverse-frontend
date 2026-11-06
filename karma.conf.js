module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
        ],
        reporters: ['progress'],
        browsers: ['ChromeHeadless'],
        customLaunchers: {
            // CI/containers: Chrome não roda o sandbox como root
            ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] },
        },
        restartOnFileChange: true,
    });
};
