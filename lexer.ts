import { Token, TokenType, SyntaxError } from './types.ts';

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  private keywords: Map<string, TokenType> = new Map([
    ['PRINT', TokenType.PRINT],
    ['LET', TokenType.LET],
    ['GOTO', TokenType.GOTO],
    ['IF', TokenType.IF],
    ['THEN', TokenType.THEN],
    ['ELSE', TokenType.ELSE],
    ['FOR', TokenType.FOR],
    ['TO', TokenType.TO],
    ['STEP', TokenType.STEP],
    ['NEXT', TokenType.NEXT],
    ['DATA', TokenType.DATA],
    ['READ', TokenType.READ],
    ['RESTORE', TokenType.RESTORE],
    ['DIM', TokenType.DIM],
    ['END', TokenType.END],
    ['REM', TokenType.REM],
    ['AND', TokenType.AND],
    ['OR', TokenType.OR],
    ['NOT', TokenType.NOT],
  ]);

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });

    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      return null;
    }

    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.advance();

    // Handle newlines
    if (char === '\n') {
      return {
        type: TokenType.NEWLINE,
        value: '\n',
        line: startLine,
        column: startColumn
      };
    }

    // Handle numbers
    if (this.isDigit(char)) {
      return this.number(start, startLine, startColumn);
    }

    // Handle strings
    if (char === '"') {
      return this.string(startLine, startColumn);
    }

    // Handle identifiers and keywords
    if (this.isAlpha(char)) {
      return this.identifier(start, startLine, startColumn);
    }

    // Handle operators and punctuation
    switch (char) {
      case '+': return this.makeToken(TokenType.PLUS, '+', startLine, startColumn);
      case '-': return this.makeToken(TokenType.MINUS, '-', startLine, startColumn);
      case '*':
        if (this.peek() === '*') {
          this.advance();
          return this.makeToken(TokenType.POWER, '**', startLine, startColumn);
        }
        return this.makeToken(TokenType.MULTIPLY, '*', startLine, startColumn);
      case '/': return this.makeToken(TokenType.DIVIDE, '/', startLine, startColumn);
      case '^': return this.makeToken(TokenType.POWER, '^', startLine, startColumn);
      case '=': return this.makeToken(TokenType.EQUAL, '=', startLine, startColumn);
      case '<':
        if (this.peek() === '=') {
          this.advance();
          return this.makeToken(TokenType.LESS_EQUAL, '<=', startLine, startColumn);
        } else if (this.peek() === '>') {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUAL, '<>', startLine, startColumn);
        }
        return this.makeToken(TokenType.LESS, '<', startLine, startColumn);
      case '>':
        if (this.peek() === '=') {
          this.advance();
          return this.makeToken(TokenType.GREATER_EQUAL, '>=', startLine, startColumn);
        }
        return this.makeToken(TokenType.GREATER, '>', startLine, startColumn);
      case '!':
        if (this.peek() === '=') {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUAL, '!=', startLine, startColumn);
        }
        throw new SyntaxError(`Unexpected character: ${char}`, startLine, startColumn);
      case ',': return this.makeToken(TokenType.COMMA, ',', startLine, startColumn);
      case ';': return this.makeToken(TokenType.SEMICOLON, ';', startLine, startColumn);
      case ':': return this.makeToken(TokenType.COLON, ':', startLine, startColumn);
      case '(': return this.makeToken(TokenType.LEFT_PAREN, '(', startLine, startColumn);
      case ')': return this.makeToken(TokenType.RIGHT_PAREN, ')', startLine, startColumn);
      case '[': return this.makeToken(TokenType.LEFT_BRACKET, '[', startLine, startColumn);
      case ']': return this.makeToken(TokenType.RIGHT_BRACKET, ']', startLine, startColumn);
      default:
        throw new SyntaxError(`Unexpected character: ${char}`, startLine, startColumn);
    }
  }

  private number(start: number, line: number, column: number): Token {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Handle decimal numbers
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.input.substring(start, this.position);
    return {
      type: TokenType.NUMBER,
      value,
      line,
      column
    };
  }

  private string(line: number, column: number): Token {
    let value = '';

    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      value += this.advance();
    }

    if (this.isAtEnd()) {
      throw new SyntaxError('Unterminated string', line, column);
    }

    this.advance(); // consume closing "

    return {
      type: TokenType.STRING,
      value,
      line,
      column
    };
  }

  private identifier(start: number, line: number, column: number): Token {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    // Handle string variable suffix ($)
    if (this.peek() === '$') {
      this.advance();
    }

    const value = this.input.substring(start, this.position).toUpperCase();
    const type = this.keywords.get(value) || TokenType.IDENTIFIER;

    return {
      type,
      value,
      line,
      column
    };
  }

  private makeToken(type: TokenType, value: string, line: number, column: number): Token {
    return { type, value, line, column };
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private advance(): string {
    if (this.isAtEnd()) return '\0';

    const char = this.input[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input[this.position + 1];
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
