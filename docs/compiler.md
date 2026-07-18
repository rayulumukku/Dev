# Compiler Architecture

Ray routes JavaScript, TypeScript, JSX, and TSX files through distinct compiler stages.

* **Lexer**: Tokenizes source files.
* **Parser**: Generates a typed AST representation.
* **Optimizer**: Performs dead-code elimination, scope optimization, and tree shaking.
* **Code Generator**: Generates ES-compliant target JS with source maps.
