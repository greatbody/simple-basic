# Simple BASIC Interpreter

A simple BASIC language interpreter implemented in TypeScript for Deno runtime.

## Features

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

## Installation

Make sure you have Deno installed. If not, install it from [deno.land](https://deno.land/).

## Usage

### Running from a file

```bash
deno run --allow-read main.ts examples/hello.bas
```

### Interactive mode

```bash
deno run --allow-read main.ts
```

In interactive mode, you can:
- Enter BASIC commands directly for immediate execution
- Use line numbers to build a program
- Use `RUN` to execute the program
- Use `LIST` to display the current program
- Use `NEW` to clear the program
- Use `HELP` to see available commands
- Use `EXIT` to quit

## BASIC Language Syntax

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

## Examples

The `examples/` directory contains several demonstration programs:

- `hello.bas` - Simple hello world
- `math.bas` - Mathematical operations
- `loops.bas` - FOR-NEXT loop examples
- `arrays.bas` - Array operations
- `data.bas` - DATA/READ/RESTORE usage
- `conditionals.bas` - IF-THEN-ELSE and GOTO
- `strings.bas` - String operations

## Architecture

The interpreter consists of four main components:

1. **Lexer** (`lexer.ts`) - Tokenizes BASIC source code
2. **Parser** (`parser.ts`) - Builds an Abstract Syntax Tree (AST)
3. **Interpreter** (`interpreter.ts`) - Executes the AST
4. **Main** (`main.ts`) - CLI interface and program entry point

## Error Handling

The interpreter provides helpful error messages for:
- Syntax errors during parsing
- Runtime errors during execution
- Line number references and error locations

## Limitations

This is a simple educational interpreter with some limitations:
- No user input (INPUT statement)
- No file I/O operations
- No subroutines (GOSUB/RETURN)
- Limited built-in functions
- No graphics or sound

## Contributing

Feel free to extend the interpreter with additional BASIC features!

## License

This project is open source and available under the MIT License.
