module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(@exodus|whatwg-encoding|html-encoding-sniffer)/)',
    ],
    moduleNameMapper: {
        '^@anna/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/test/cases/**/*.test.js'],
    setupFiles: [
        '<rootDir>/common/extensions/collectionExtension.js',
        '<rootDir>/common/extensions/arrayExtension.js',
    ],
};
