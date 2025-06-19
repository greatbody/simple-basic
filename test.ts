import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Lexer } from './lexer.ts';
import { Parser } from './parser.ts';
import { Interpreter } from './interpreter.ts';
import { TokenType } from './types.ts';

// Lexer tests
Deno.test('Lexer - Basic tokens', () => {
  const lexer = new Lexer('10 PRINT "Hello"');
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, TokenType.NUMBER);
  assertEquals(tokens[0].value, '10');
  assertEquals(tokens[1].type, TokenType.PRINT);
  assertEquals(tokens[2].type, TokenType.STRING);
  assertEquals(tokens[2].value, 'Hello');
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test('Lexer - Math operators', () => {
  const lexer = new Lexer('+ - * / ^ = < > <= >= <> !=');
  const tokens = lexer.tokenize();

  const expectedTypes = [
    TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE,
    TokenType.POWER, TokenType.EQUAL, TokenType.LESS, TokenType.GREATER,
    TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL, TokenType.NOT_EQUAL, TokenType.NOT_EQUAL,
    TokenType.EOF
  ];

  for (let i = 0; i < expectedTypes.length; i++) {
    assertEquals(tokens[i].type, expectedTypes[i]);
  }
});

Deno.test('Lexer - Keywords', () => {
  const lexer = new Lexer('LET GOTO IF THEN FOR NEXT DATA READ');
  const tokens = lexer.tokenize();

  const expectedTypes = [
    TokenType.LET, TokenType.GOTO, TokenType.IF, TokenType.THEN,
    TokenType.FOR, TokenType.NEXT, TokenType.DATA, TokenType.READ,
    TokenType.EOF
  ];

  for (let i = 0; i < expectedTypes.length; i++) {
    assertEquals(tokens[i].type, expectedTypes[i]);
  }
});

// Parser tests
Deno.test('Parser - Simple PRINT statement', () => {
  const lexer = new Lexer('10 PRINT "Hello"');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  assertEquals(program.statements.length, 1);
  assertEquals(program.statements[0].type, 'PrintStatement');
  assertEquals(program.statements[0].lineNumber, 10);
});

Deno.test('Parser - LET statement', () => {
  const lexer = new Lexer('20 LET A = 5 + 3');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  assertEquals(program.statements.length, 1);
  assertEquals(program.statements[0].type, 'LetStatement');
  assertEquals(program.statements[0].lineNumber, 20);
});

Deno.test('Parser - FOR loop', () => {
  const lexer = new Lexer('30 FOR I = 1 TO 10 STEP 2');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  assertEquals(program.statements.length, 1);
  assertEquals(program.statements[0].type, 'ForStatement');
});

// Interpreter tests
Deno.test('Interpreter - Simple PRINT', () => {
  const source = '10 PRINT "Hello, World!"';
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assertEquals(output.length, 1);
  assert(output[0].includes('Hello, World!'), 'Output should contain Hello, World!');
});

Deno.test('Interpreter - Math operations', () => {
  const source = `
    10 LET A = 5
    20 LET B = 3
    30 PRINT A + B
    40 PRINT A * B
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output[0].includes('8'), 'First output should be 8');
  assert(output[1].includes('15'), 'Second output should be 15');
});

Deno.test('Interpreter - FOR loop', () => {
  const source = `
    10 FOR I = 1 TO 3
    20 PRINT I;
    30 NEXT I
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output.length >= 3, 'Should have at least 3 outputs');
});

Deno.test('Interpreter - IF statement', () => {
  const source = `
    10 LET X = 5
    20 IF X > 3 THEN PRINT "Greater"
    30 IF X < 3 THEN PRINT "Less" ELSE PRINT "Not less"
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output[0].includes('Greater'), 'Should print Greater');
  assert(output[1].includes('Not less'), 'Should print Not less');
});

Deno.test('Interpreter - Arrays', () => {
  const source = `
    10 DIM A(3)
    20 A(1) = 10
    30 A(2) = 20
    40 PRINT A(1)
    50 PRINT A(2)
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output[0].includes('10'), 'Should print 10');
  assert(output[1].includes('20'), 'Should print 20');
});

Deno.test('Interpreter - DATA/READ', () => {
  const source = `
    10 DATA 42, "Hello"
    20 READ A, B$
    30 PRINT A
    40 PRINT B$
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output[0].includes('42'), 'Should print 42');
  assert(output[1].includes('Hello'), 'Should print Hello');
});

Deno.test('Interpreter - String operations', () => {
  const source = `
    10 LET A$ = "Hello"
    20 LET B$ = "World"
    30 PRINT A$ + " " + B$
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  assert(output[0].includes('Hello World'), 'Should print Hello World');
});
