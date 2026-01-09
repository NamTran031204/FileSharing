const {codegen} = require('swagger-axios-codegen');

codegen({
    methodNameMode: 'path',
    remoteUrl: 'http://localhost:8080/v3/api-docs',
    outputDir: './src/api',
    strictNullChecks: false,
    modelMode: 'interface',
    multipleFileMode: true,
    useStaticMethod: true
})