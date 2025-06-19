import {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  PrintStatement,
  LetStatement,
  GotoStatement,
  IfStatement,
  ForStatement,
  NextStatement,
  DataStatement,
  ReadStatement,
  RestoreStatement,
  DimStatement,
  EndStatement,
  RemStatement,
  BinaryExpression,
  UnaryExpression,
  NumberLiteral,
  StringLiteral,
  Variable,
  ArrayDeclaration,
  SyntaxError
} from './types.ts';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      // Skip newlines at the top level
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: 'Program',
      statements
    };
  }

  private statement(): Statement | null {
    try {
      // Check for line number
      let lineNumber: number | undefined;
      if (this.check(TokenType.NUMBER)) {
        lineNumber = parseInt(this.advance().value);
      }

      let stmt: Statement | null = null;

      if (this.match(TokenType.PRINT)) {
        stmt = this.printStatement();
      } else if (this.match(TokenType.LET)) {
        stmt = this.letStatement();
      } else if (this.match(TokenType.GOTO)) {
        stmt = this.gotoStatement();
      } else if (this.match(TokenType.IF)) {
        stmt = this.ifStatement();
      } else if (this.match(TokenType.FOR)) {
        stmt = this.forStatement();
      } else if (this.match(TokenType.NEXT)) {
        stmt = this.nextStatement();
      } else if (this.match(TokenType.DATA)) {
        stmt = this.dataStatement();
      } else if (this.match(TokenType.READ)) {
        stmt = this.readStatement();
      } else if (this.match(TokenType.RESTORE)) {
        stmt = this.restoreStatement();
      } else if (this.match(TokenType.DIM)) {
        stmt = this.dimStatement();
      } else if (this.match(TokenType.END)) {
        stmt = this.endStatement();
      } else if (this.match(TokenType.REM)) {
        stmt = this.remStatement();
      } else if (this.check(TokenType.IDENTIFIER)) {
        // Implicit LET statement
        stmt = this.implicitLetStatement();
      } else {
        throw new SyntaxError(`Unexpected token: ${this.peek().value}`, this.peek().line, this.peek().column);
      }

      if (stmt) {
        stmt.lineNumber = lineNumber;
      }

      // Consume optional newline
      this.match(TokenType.NEWLINE);

      return stmt;
    } catch (error) {
      // Skip to next line on error
      this.synchronize();
      throw error;
    }
  }

  private printStatement(): PrintStatement {
    const expressions: Expression[] = [];
    let separator: 'comma' | 'semicolon' | undefined;

    if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      expressions.push(this.expression());

      while (this.match(TokenType.COMMA, TokenType.SEMICOLON)) {
        const currentSeparator = this.previous().type === TokenType.COMMA ? 'comma' : 'semicolon';
        if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
          expressions.push(this.expression());
        } else {
          // If there's no expression after the separator, this separator determines the ending behavior
          separator = currentSeparator;
          break;
        }
      }
    }

    return {
      type: 'PrintStatement',
      expressions,
      separator
    };
  }

  private letStatement(): LetStatement {
    const variable = this.variable();
    this.consume(TokenType.EQUAL, "Expected '=' after variable");
    const expression = this.expression();

    return {
      type: 'LetStatement',
      variable,
      expression
    };
  }

  private implicitLetStatement(): LetStatement {
    const variable = this.variable();
    this.consume(TokenType.EQUAL, "Expected '=' after variable");
    const expression = this.expression();

    return {
      type: 'LetStatement',
      variable,
      expression
    };
  }

  private gotoStatement(): GotoStatement {
    const lineNumber = this.consume(TokenType.NUMBER, "Expected line number after GOTO");

    return {
      type: 'GotoStatement',
      lineNumber: parseInt(lineNumber.value)
    };
  }

  private ifStatement(): IfStatement {
    const condition = this.expression();
    this.consume(TokenType.THEN, "Expected THEN after IF condition");

    const thenStatement = this.statement();
    if (!thenStatement) {
      throw new SyntaxError("Expected statement after THEN", this.peek().line, this.peek().column);
    }

    let elseStatement: Statement | undefined;
    if (this.match(TokenType.ELSE)) {
      const stmt = this.statement();
      if (stmt) {
        elseStatement = stmt;
      }
    }

    return {
      type: 'IfStatement',
      condition,
      thenStatement,
      elseStatement
    };
  }

  private forStatement(): ForStatement {
    const variable = this.consume(TokenType.IDENTIFIER, "Expected variable name after FOR").value;
    this.consume(TokenType.EQUAL, "Expected '=' after FOR variable");
    const start = this.expression();
    this.consume(TokenType.TO, "Expected TO after FOR start value");
    const end = this.expression();

    let step: Expression | undefined;
    if (this.match(TokenType.STEP)) {
      step = this.expression();
    }

    return {
      type: 'ForStatement',
      variable,
      start,
      end,
      step,
      body: [] // Will be filled by interpreter
    };
  }

  private nextStatement(): NextStatement {
    let variable: string | undefined;
    if (this.check(TokenType.IDENTIFIER)) {
      variable = this.advance().value;
    }

    return {
      type: 'NextStatement',
      variable
    };
  }

  private dataStatement(): DataStatement {
    const values: (string | number)[] = [];

    do {
      if (this.check(TokenType.NUMBER)) {
        values.push(parseFloat(this.advance().value));
      } else if (this.check(TokenType.STRING)) {
        values.push(this.advance().value);
      } else {
        throw new SyntaxError("Expected number or string in DATA statement", this.peek().line, this.peek().column);
      }
    } while (this.match(TokenType.COMMA));

    return {
      type: 'DataStatement',
      values
    };
  }

  private readStatement(): ReadStatement {
    const variables: Variable[] = [];

    do {
      variables.push(this.variable());
    } while (this.match(TokenType.COMMA));

    return {
      type: 'ReadStatement',
      variables
    };
  }

  private restoreStatement(): RestoreStatement {
    let lineNumber: number | undefined;
    if (this.check(TokenType.NUMBER)) {
      lineNumber = parseInt(this.advance().value);
    }

    return {
      type: 'RestoreStatement',
      lineNumber
    };
  }

  private dimStatement(): DimStatement {
    const arrays: ArrayDeclaration[] = [];

    do {
      const name = this.consume(TokenType.IDENTIFIER, "Expected array name").value;
      this.consume(TokenType.LEFT_PAREN, "Expected '(' after array name");

      const dimensions: Expression[] = [];
      do {
        dimensions.push(this.expression());
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after array dimensions");

      arrays.push({ name, dimensions });
    } while (this.match(TokenType.COMMA));

    return {
      type: 'DimStatement',
      arrays
    };
  }

  private endStatement(): EndStatement {
    return {
      type: 'EndStatement'
    };
  }

  private remStatement(): RemStatement {
    let comment = '';

    // Read everything until newline as comment
    while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      comment += this.advance().value + ' ';
    }

    return {
      type: 'RemStatement',
      comment: comment.trim()
    };
  }

  private expression(): Expression {
    return this.logicalOr();
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.DIVIDE, TokenType.MULTIPLY)) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        operand: right
      } as UnaryExpression;
    }

    return this.power();
  }

  private power(): Expression {
    let expr = this.primary();

    while (this.match(TokenType.POWER)) {
      const operator = this.previous().value;
      const right = this.unary(); // Right associative
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      } as BinaryExpression;
    }

    return expr;
  }

  private primary(): Expression {
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'NumberLiteral',
        value: parseFloat(this.previous().value)
      } as NumberLiteral;
    }

    if (this.match(TokenType.STRING)) {
      return {
        type: 'StringLiteral',
        value: this.previous().value
      } as StringLiteral;
    }

    if (this.check(TokenType.IDENTIFIER)) {
      return this.variable();
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    throw new SyntaxError(`Unexpected token: ${this.peek().value}`, this.peek().line, this.peek().column);
  }

  private variable(): Variable {
    const name = this.advance().value;
    let indices: Expression[] | undefined;

    if (this.match(TokenType.LEFT_PAREN)) {
      indices = [];
      do {
        indices.push(this.expression());
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after array indices");
    }

    return {
      type: 'Variable',
      name,
      indices
    };
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const token = this.peek();
    throw new SyntaxError(message, token.line, token.column);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.NEWLINE) return;

      switch (this.peek().type) {
        case TokenType.PRINT:
        case TokenType.LET:
        case TokenType.GOTO:
        case TokenType.IF:
        case TokenType.FOR:
        case TokenType.NEXT:
        case TokenType.DATA:
        case TokenType.READ:
        case TokenType.RESTORE:
        case TokenType.DIM:
        case TokenType.END:
        case TokenType.REM:
          return;
      }

      this.advance();
    }
  }
}
