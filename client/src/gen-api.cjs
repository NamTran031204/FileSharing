const {codegen} = require('swagger-axios-codegen');

codegen({
    methodNameMode: 'path',
    remoteUrl: 'http://localhost:5000/v3/api-docs',
    outputDir: './src/api/api',
    strictNullChecks: false,
    modelMode: 'interface',
    multipleFileMode: true,
    useStaticMethod: true
})