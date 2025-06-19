# Simple BASIC Interpreter

[![Deno](https://img.shields.io/badge/deno-v1.0+-green.svg)](https://deno.land/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple yet feature-rich BASIC language interpreter implemented in TypeScript for the Deno runtime. This project provides an educational implementation of a classic programming language with modern tooling.

## ✨ Features

- **Line Numbers**: Traditional BASIC line numbering system
- **Variables**: Numeric and string variables (string variables end with $)
- **Arrays**: One-dimensional and multi-dimensional arrays with DIM statement
- **Control Flow**:
  - GOTO statements for unconditional jumps
  - IF-THEN-ELSE conditional statements
  - FOR-NEXT loops with optional STEP
- **Data Handling**: DATA, READ, and RESTORE statements
- **Operators**:
  - Arithmetic: +, -, *, /, ^ (power)
  - Comparison: =, <>, <, >, <=, >=
  - Logical: AND, OR, NOT
- **String Operations**: String concatenation with +
- **Output**: PRINT statement with comma and semicolon separators
- **Comments**: REM statements

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) v1.0 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/greatbody/simple-basic.git
   cd simple-basic
   ```

2. **Run tests to verify installation:**
   ```bash
   deno run --allow-read test.ts
   ```

## 📖 Usage

### Running BASIC Programs

**Execute a BASIC file:**
```bash
deno run --allow-read main.ts examples/hello.bas
```

**Interactive REPL mode:**
```bash
deno run --allow-read main.ts
```

**Make the interpreter executable (optional):**
```bash
chmod +x main.ts
./main.ts examples/hello.bas
```

### Interactive Mode Commands

| Command | Description                 |
| ------- | --------------------------- |
| `RUN`   | Execute the current program |
| `LIST`  | Display the current program |
| `NEW`   | Clear the current program   |
| `HELP`  | Show available commands     |
| `EXIT`  | Quit the interpreter        |

**Interactive mode supports:**
- Direct command execution (immediate mode)
- Line-numbered program building
- Program editing and execution

## 📝 BASIC Language Reference

### Variables
```basic
10 LET A = 5
20 B = 10          REM LET is optional
30 NAME$ = "John"  REM String variables end with $
```

### Arrays
```basic
10 DIM NUMBERS(10)        REM One-dimensional array
20 DIM MATRIX(5, 5)       REM Two-dimensional array
30 NUMBERS(1) = 42
40 MATRIX(2, 3) = 100
```

### Control Flow
```basic
10 IF X > 0 THEN PRINT "Positive"
20 IF X < 0 THEN PRINT "Negative" ELSE PRINT "Zero or positive"
30 GOTO 100
40 FOR I = 1 TO 10 STEP 2
50   PRINT I
60 NEXT I
```

### Data Statements
```basic
10 DATA 1, 2, 3, "Hello", "World"
20 READ A, B, C, MSG1$, MSG2$
30 RESTORE
40 READ FIRST
```

### Output
```basic
10 PRINT "Hello, World!"
20 PRINT A, B, C          REM Comma separator (tab)
30 PRINT A; B; C          REM Semicolon separator (no space)
```

## 📁 Examples

The `examples/` directory contains demonstration programs:

| File               | Description                             |
| ------------------ | --------------------------------------- |
| `hello.bas`        | Simple hello world program              |
| `math.bas`         | Mathematical operations and expressions |
| `loops.bas`        | FOR-NEXT loop examples with STEP        |
| `arrays.bas`       | Array declaration and manipulation      |
| `data.bas`         | DATA/READ/RESTORE statement usage       |
| `conditionals.bas` | IF-THEN-ELSE and GOTO statements        |
| `strings.bas`      | String operations and concatenation     |

**Try running an example:**
```bash
deno run --allow-read main.ts examples/loops.bas
```

## 🏗️ Architecture

The interpreter follows a traditional three-phase design:

```
Source Code → Lexer → Tokens → Parser → AST → Interpreter → Output
```

| Component       | File             | Responsibility                                             |
| --------------- | ---------------- | ---------------------------------------------------------- |
| **Lexer**       | `lexer.ts`       | Tokenizes BASIC source code into tokens                    |
| **Parser**      | `parser.ts`      | Builds Abstract Syntax Tree (AST) from tokens              |
| **Interpreter** | `interpreter.ts` | Executes the AST and manages runtime state                 |
| **Types**       | `types.ts`       | Type definitions for tokens, AST nodes, and runtime values |
| **Main**        | `main.ts`        | CLI interface and program entry point                      |
| **Tests**       | `test.ts`        | Comprehensive test suite for all components                |

## 🔧 Development

### Running Tests
```bash
deno run --allow-read test.ts
```

### Type Checking
```bash
deno check *.ts
```

## ⚠️ Error Handling

The interpreter provides comprehensive error reporting:
- **Syntax errors** with line and column information
- **Runtime errors** with execution context
- **Type errors** for invalid operations
- **Array bounds checking**
- **Variable reference validation**

## 🚧 Known Limitations

This educational interpreter has some intentional limitations:

- ❌ No user input (`INPUT` statement)
- ❌ No file I/O operations
- ❌ No subroutines (`GOSUB`/`RETURN`)
- ❌ Limited built-in functions
- ❌ No graphics or sound capabilities
- ❌ Single-threaded execution only

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes and add tests**
4. **Ensure tests pass:** `deno run --allow-read test.ts`
5. **Commit your changes:** `git commit -m 'Add amazing feature'`
6. **Push to the branch:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Ideas for Contributions
- Add `INPUT` statement for user interaction
- Implement `GOSUB`/`RETURN` for subroutines
- Add more built-in mathematical functions
- Improve error messages and debugging features
- Add more comprehensive examples

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for new language features
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic BASIC interpreters from the 1970s and 1980s
- Built with modern TypeScript and Deno for educational purposes
