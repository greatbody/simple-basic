#!/usr/bin/env deno run --allow-read

import { Lexer } from './lexer.ts';
import { Parser } from './parser.ts';
import { Interpreter } from './interpreter.ts';
import { TokenType } from './types.ts';

// Simple test framework
class TestRunner {
  private tests: Array<() => void> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void): void {
    this.tests.push(() => {
      try {
        console.log(`Testing: ${name}`);
        fn();
        console.log(`✓ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
        this.failed++;
      }
    });
  }

  run(): void {
    console.log('Running tests...\n');

    for (const test of this.tests) {
      test();
    }

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);

    if (this.failed > 0) {
      Deno.exit(1);
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual: string | number | boolean | TokenType | undefined, expected: string | number | boolean | TokenType | undefined, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertArrayEqual(actual: (string | number | boolean | TokenType | undefined)[], expected: (string | number | boolean | TokenType | undefined)[], message?: string): void {
    if (actual.length !== expected.length) {
      throw new Error(message || `Array lengths differ: expected ${expected.length}, got ${actual.length}`);
    }

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(message || `Arrays differ at index ${i}: expected ${expected[i]}, got ${actual[i]}`);
      }
    }
  }
}

const runner = new TestRunner();

// Lexer tests
runner.test('Lexer - Basic tokens', () => {
  const lexer = new Lexer('10 PRINT "Hello"');
  const tokens = lexer.tokenize();

  runner.assertEqual(tokens[0].type, TokenType.NUMBER);
  runner.assertEqual(tokens[0].value, '10');
  runner.assertEqual(tokens[1].type, TokenType.PRINT);
  runner.assertEqual(tokens[2].type, TokenType.STRING);
  runner.assertEqual(tokens[2].value, 'Hello');
  runner.assertEqual(tokens[3].type, TokenType.EOF);
});

runner.test('Lexer - Math operators', () => {
  const lexer = new Lexer('+ - * / ^ = < > <= >= <> !=');
  const tokens = lexer.tokenize();

  const expectedTypes = [
    TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE,
    TokenType.POWER, TokenType.EQUAL, TokenType.LESS, TokenType.GREATER,
    TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL, TokenType.NOT_EQUAL, TokenType.NOT_EQUAL,
    TokenType.EOF
  ];

  for (let i = 0; i < expectedTypes.length; i++) {
    runner.assertEqual(tokens[i].type, expectedTypes[i]);
  }
});

runner.test('Lexer - Keywords', () => {
  const lexer = new Lexer('LET GOTO IF THEN FOR NEXT DATA READ');
  const tokens = lexer.tokenize();

  const expectedTypes = [
    TokenType.LET, TokenType.GOTO, TokenType.IF, TokenType.THEN,
    TokenType.FOR, TokenType.NEXT, TokenType.DATA, TokenType.READ,
    TokenType.EOF
  ];

  for (let i = 0; i < expectedTypes.length; i++) {
    runner.assertEqual(tokens[i].type, expectedTypes[i]);
  }
});

// Parser tests
runner.test('Parser - Simple PRINT statement', () => {
  const lexer = new Lexer('10 PRINT "Hello"');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  runner.assertEqual(program.statements.length, 1);
  runner.assertEqual(program.statements[0].type, 'PrintStatement');
  runner.assertEqual(program.statements[0].lineNumber, 10);
});

runner.test('Parser - LET statement', () => {
  const lexer = new Lexer('20 LET A = 5 + 3');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  runner.assertEqual(program.statements.length, 1);
  runner.assertEqual(program.statements[0].type, 'LetStatement');
  runner.assertEqual(program.statements[0].lineNumber, 20);
});

runner.test('Parser - FOR loop', () => {
  const lexer = new Lexer('30 FOR I = 1 TO 10 STEP 2');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();

  runner.assertEqual(program.statements.length, 1);
  runner.assertEqual(program.statements[0].type, 'ForStatement');
});

// Interpreter tests
runner.test('Interpreter - Simple PRINT', () => {
  const source = '10 PRINT "Hello, World!"';
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter();

  const output = interpreter.interpret(program);
  runner.assertEqual(output.length, 1);
  runner.assert(output[0].includes('Hello, World!'), 'Output should contain Hello, World!');
});

runner.test('Interpreter - Math operations', () => {
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
  runner.assert(output[0].includes('8'), 'First output should be 8');
  runner.assert(output[1].includes('15'), 'Second output should be 15');
});

runner.test('Interpreter - FOR loop', () => {
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
  runner.assert(output.length >= 3, 'Should have at least 3 outputs');
});

runner.test('Interpreter - IF statement', () => {
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
  runner.assert(output[0].includes('Greater'), 'Should print Greater');
  runner.assert(output[1].includes('Not less'), 'Should print Not less');
});

runner.test('Interpreter - Arrays', () => {
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
  runner.assert(output[0].includes('10'), 'Should print 10');
  runner.assert(output[1].includes('20'), 'Should print 20');
});

runner.test('Interpreter - DATA/READ', () => {
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
  runner.assert(output[0].includes('42'), 'Should print 42');
  runner.assert(output[1].includes('Hello'), 'Should print Hello');
});

runner.test('Interpreter - String operations', () => {
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
  runner.assert(output[0].includes('Hello World'), 'Should print Hello World');
});

// Run all tests
runner.run();
