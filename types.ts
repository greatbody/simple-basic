// Token types for lexical analysis
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',

  // Keywords
  PRINT = 'PRINT',
  LET = 'LET',
  GOTO = 'GOTO',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  FOR = 'FOR',
  TO = 'TO',
  STEP = 'STEP',
  NEXT = 'NEXT',
  DATA = 'DATA',
  READ = 'READ',
  RESTORE = 'RESTORE',
  DIM = 'DIM',
  END = 'END',
  REM = 'REM',

  // Operators
  PLUS = 'PLUS',           // +
  MINUS = 'MINUS',         // -
  MULTIPLY = 'MULTIPLY',   // *
  DIVIDE = 'DIVIDE',       // /
  POWER = 'POWER',         // ^ or **
  ASSIGN = 'ASSIGN',       // =

  // Comparison operators
  EQUAL = 'EQUAL',         // =
  NOT_EQUAL = 'NOT_EQUAL', // <> or !=
  LESS = 'LESS',           // <
  GREATER = 'GREATER',     // >
  LESS_EQUAL = 'LESS_EQUAL',     // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=

  // Logical operators
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Punctuation
  COMMA = 'COMMA',         // ,
  SEMICOLON = 'SEMICOLON', // ;
  COLON = 'COLON',         // :
  LEFT_PAREN = 'LEFT_PAREN',   // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  LEFT_BRACKET = 'LEFT_BRACKET',   // [
  RIGHT_BRACKET = 'RIGHT_BRACKET', // ]

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// AST Node types
export interface ASTNode {
  type: string;
  line?: number;
}

export interface Program extends ASTNode {
  type: 'Program';
  statements: Statement[];
}

export interface Statement extends ASTNode {
  lineNumber?: number;
}

export interface PrintStatement extends Statement {
  type: 'PrintStatement';
  expressions: Expression[];
  separator?: 'comma' | 'semicolon';
}

export interface LetStatement extends Statement {
  type: 'LetStatement';
  variable: Variable;
  expression: Expression;
}

export interface GotoStatement extends Statement {
  type: 'GotoStatement';
  lineNumber: number;
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  condition: Expression;
  thenStatement: Statement;
  elseStatement?: Statement;
}

export interface ForStatement extends Statement {
  type: 'ForStatement';
  variable: string;
  start: Expression;
  end: Expression;
  step?: Expression;
  body: Statement[];
}

export interface NextStatement extends Statement {
  type: 'NextStatement';
  variable?: string;
}

export interface DataStatement extends Statement {
  type: 'DataStatement';
  values: (string | number)[];
}

export interface ReadStatement extends Statement {
  type: 'ReadStatement';
  variables: Variable[];
}

export interface RestoreStatement extends Statement {
  type: 'RestoreStatement';
  lineNumber?: number;
}

export interface DimStatement extends Statement {
  type: 'DimStatement';
  arrays: ArrayDeclaration[];
}

export interface ArrayDeclaration {
  name: string;
  dimensions: Expression[];
}

export interface EndStatement extends Statement {
  type: 'EndStatement';
}

export interface RemStatement extends Statement {
  type: 'RemStatement';
  comment: string;
}

// Expression types
export interface Expression extends ASTNode {}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends Expression {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface NumberLiteral extends Expression {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral extends Expression {
  type: 'StringLiteral';
  value: string;
}

export interface Variable extends Expression {
  type: 'Variable';
  name: string;
  indices?: Expression[];
}

export interface FunctionCall extends Expression {
  type: 'FunctionCall';
  name: string;
  arguments: Expression[];
}

// Runtime types
export type ArrayElement = RuntimeValue | ArrayElement[];

export interface RuntimeValue {
  type: 'number' | 'string' | 'array';
  value: number | string | ArrayElement[];
}

export interface RuntimeContext {
  variables: Map<string, RuntimeValue>;
  arrays: Map<string, RuntimeValue>;
  dataValues: (string | number)[];
  dataPointer: number;
  programCounter: number;
  forLoops: Map<string, ForLoopContext>;
  callStack: number[];
}

export interface ForLoopContext {
  variable: string;
  current: number;
  end: number;
  step: number;
  startLine: number;
}

// Error types
export class BasicError extends Error {
  constructor(message: string, public line?: number, public column?: number) {
    super(message);
    this.name = 'BasicError';
  }
}

export class SyntaxError extends BasicError {
  constructor(message: string, line?: number, column?: number) {
    super(message, line, column);
    this.name = 'SyntaxError';
  }
}

export class RuntimeError extends BasicError {
  constructor(message: string, line?: number) {
    super(message, line);
    this.name = 'RuntimeError';
  }
}
