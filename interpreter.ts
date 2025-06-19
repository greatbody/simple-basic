import {
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
  BinaryExpression,
  UnaryExpression,
  NumberLiteral,
  StringLiteral,
  Variable,
  RuntimeValue,
  RuntimeContext,
  ForLoopContext,
  RuntimeError
} from './types.ts';

// Type for multi-dimensional arrays
type ArrayElement = RuntimeValue | ArrayElement[];

export class Interpreter {
  private context: RuntimeContext;
  private statements: Map<number, Statement> = new Map();
  private orderedStatements: Statement[] = [];
  private output: string[] = [];
  private running: boolean = false;

  constructor() {
    this.context = {
      variables: new Map(),
      arrays: new Map(),
      dataValues: [],
      dataPointer: 0,
      programCounter: 0,
      forLoops: new Map(),
      callStack: []
    };
  }

  interpret(program: Program): string[] {
    this.output = [];
    this.running = true;

    // Organize statements by line number
    this.organizeStatements(program.statements);

    // Collect all DATA statements first
    this.collectDataStatements();

    // Execute program
    this.context.programCounter = 0;

    try {
      while (this.running && this.context.programCounter < this.orderedStatements.length) {
        const statement = this.orderedStatements[this.context.programCounter];
        this.executeStatement(statement);
        this.context.programCounter++;
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.output.push(`Runtime Error: ${error.message}`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        this.output.push(`Error: ${message}`);
      }
    }

    return this.output;
  }

  private organizeStatements(statements: Statement[]): void {
    this.statements.clear();
    this.orderedStatements = [];

    // Separate numbered and unnumbered statements
    const numberedStatements: [number, Statement][] = [];
    const unnumberedStatements: Statement[] = [];

    for (const stmt of statements) {
      if (stmt.lineNumber !== undefined) {
        numberedStatements.push([stmt.lineNumber, stmt]);
      } else {
        unnumberedStatements.push(stmt);
      }
    }

    // Sort numbered statements by line number
    numberedStatements.sort((a, b) => a[0] - b[0]);

    // Build maps and ordered list
    for (const [lineNum, stmt] of numberedStatements) {
      this.statements.set(lineNum, stmt);
      this.orderedStatements.push(stmt);
    }

    // Add unnumbered statements at the end
    this.orderedStatements.push(...unnumberedStatements);
  }

  private collectDataStatements(): void {
    this.context.dataValues = [];

    for (const stmt of this.orderedStatements) {
      if (stmt.type === 'DataStatement') {
        const dataStmt = stmt as DataStatement;
        this.context.dataValues.push(...dataStmt.values);
      }
    }

    this.context.dataPointer = 0;
  }

  private executeStatement(statement: Statement): void {
    switch (statement.type) {
      case 'PrintStatement':
        this.executePrint(statement as PrintStatement);
        break;
      case 'LetStatement':
        this.executeLet(statement as LetStatement);
        break;
      case 'GotoStatement':
        this.executeGoto(statement as GotoStatement);
        break;
      case 'IfStatement':
        this.executeIf(statement as IfStatement);
        break;
      case 'ForStatement':
        this.executeFor(statement as ForStatement);
        break;
      case 'NextStatement':
        this.executeNext(statement as NextStatement);
        break;
      case 'ReadStatement':
        this.executeRead(statement as ReadStatement);
        break;
      case 'RestoreStatement':
        this.executeRestore(statement as RestoreStatement);
        break;
      case 'DimStatement':
        this.executeDim(statement as DimStatement);
        break;
      case 'EndStatement':
        this.executeEnd();
        break;
      case 'RemStatement':
        // Comments are ignored during execution
        break;
      case 'DataStatement':
        // Data statements are processed during initialization
        break;
      default:
        throw new RuntimeError(`Unknown statement type: ${statement.type}`, statement.lineNumber);
    }
  }

  private executePrint(statement: PrintStatement): void {
    let output = '';

    for (let i = 0; i < statement.expressions.length; i++) {
      const value = this.evaluateExpression(statement.expressions[i]);
      output += this.valueToString(value);

      if (i < statement.expressions.length - 1) {
        if (statement.separator === 'comma') {
          output += '\t'; // Tab for comma separator
        }
        // Semicolon separator adds no space
      }
    }

    // Add newline unless statement ends with semicolon
    if (statement.separator !== 'semicolon') {
      output += '\n';
    }

    this.output.push(output);
  }

  private executeLet(statement: LetStatement): void {
    const value = this.evaluateExpression(statement.expression);
    this.assignVariable(statement.variable, value);
  }

  private executeGoto(statement: GotoStatement): void {
    const targetIndex = this.findStatementIndex(statement.lineNumber);
    if (targetIndex === -1) {
      throw new RuntimeError(`Line number ${statement.lineNumber} not found`, statement.lineNumber);
    }
    this.context.programCounter = targetIndex - 1; // -1 because it will be incremented
  }

  private executeIf(statement: IfStatement): void {
    const condition = this.evaluateExpression(statement.condition);

    if (this.isTruthy(condition)) {
      this.executeStatement(statement.thenStatement);
    } else if (statement.elseStatement) {
      this.executeStatement(statement.elseStatement);
    }
  }

  private executeFor(statement: ForStatement): void {
    const start = this.evaluateExpression(statement.start);
    const end = this.evaluateExpression(statement.end);
    const step = statement.step ? this.evaluateExpression(statement.step) : { type: 'number', value: 1 };

    if (start.type !== 'number' || end.type !== 'number' || step.type !== 'number') {
      throw new RuntimeError('FOR loop bounds must be numbers', statement.lineNumber);
    }

    const forLoop: ForLoopContext = {
      variable: statement.variable,
      current: start.value,
      end: end.value,
      step: step.value,
      startLine: this.context.programCounter
    };

    this.context.forLoops.set(statement.variable, forLoop);
    this.context.variables.set(statement.variable, start);
  }

  private executeNext(statement: NextStatement): void {
    const variable = statement.variable || this.getLastForVariable();

    if (!variable) {
      throw new RuntimeError('NEXT without FOR', statement.lineNumber);
    }

    const forLoop = this.context.forLoops.get(variable);
    if (!forLoop) {
      throw new RuntimeError(`NEXT without matching FOR: ${variable}`, statement.lineNumber);
    }

    forLoop.current += forLoop.step;
    this.context.variables.set(variable, { type: 'number', value: forLoop.current });

    // Check if loop should continue
    const shouldContinue = forLoop.step > 0
      ? forLoop.current <= forLoop.end
      : forLoop.current >= forLoop.end;

    if (shouldContinue) {
      this.context.programCounter = forLoop.startLine; // Jump back to FOR
    } else {
      this.context.forLoops.delete(variable);
    }
  }

  private executeRead(statement: ReadStatement): void {
    for (const variable of statement.variables) {
      if (this.context.dataPointer >= this.context.dataValues.length) {
        throw new RuntimeError('Out of DATA', statement.lineNumber);
      }

      const value = this.context.dataValues[this.context.dataPointer++];
      const runtimeValue: RuntimeValue = typeof value === 'number'
        ? { type: 'number', value }
        : { type: 'string', value };

      this.assignVariable(variable, runtimeValue);
    }
  }

  private executeRestore(statement: RestoreStatement): void {
    if (statement.lineNumber !== undefined) {
      // Find the first DATA statement at or after the specified line
      let dataIndex = 0;
      for (const stmt of this.orderedStatements) {
        if (stmt.type === 'DataStatement' && stmt.lineNumber && stmt.lineNumber >= statement.lineNumber) {
          break;
        }
        if (stmt.type === 'DataStatement') {
          const dataStmt = stmt as DataStatement;
          dataIndex += dataStmt.values.length;
        }
      }
      this.context.dataPointer = dataIndex;
    } else {
      this.context.dataPointer = 0;
    }
  }

  private executeDim(statement: DimStatement): void {
    for (const arrayDecl of statement.arrays) {
      const dimensions: number[] = [];

      for (const dimExpr of arrayDecl.dimensions) {
        const dimValue = this.evaluateExpression(dimExpr);
        if (dimValue.type !== 'number') {
          throw new RuntimeError('Array dimensions must be numbers', statement.lineNumber);
        }
        dimensions.push(Math.floor(dimValue.value));
      }

      // Create multi-dimensional array
      const array = this.createMultiDimensionalArray(dimensions);
      this.context.arrays.set(arrayDecl.name, { type: 'array', value: array });
    }
  }

  private executeEnd(): void {
    this.running = false;
  }

  private evaluateExpression(expression: Expression): RuntimeValue {
    switch (expression.type) {
      case 'NumberLiteral':
        return { type: 'number', value: (expression as NumberLiteral).value };

      case 'StringLiteral':
        return { type: 'string', value: (expression as StringLiteral).value };

      case 'Variable':
        return this.getVariable(expression as Variable);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(expression as BinaryExpression);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(expression as UnaryExpression);

      default:
        throw new RuntimeError(`Unknown expression type: ${expression.type}`);
    }
  }

  private evaluateBinaryExpression(expression: BinaryExpression): RuntimeValue {
    const left = this.evaluateExpression(expression.left);
    const right = this.evaluateExpression(expression.right);

    switch (expression.operator) {
      case '+':
        if (left.type === 'string' || right.type === 'string') {
          return { type: 'string', value: this.valueToString(left) + this.valueToString(right) };
        }
        return { type: 'number', value: this.toNumber(left) + this.toNumber(right) };

      case '-':
        return { type: 'number', value: this.toNumber(left) - this.toNumber(right) };

      case '*':
        return { type: 'number', value: this.toNumber(left) * this.toNumber(right) };

      case '/': {
        const divisor = this.toNumber(right);
        if (divisor === 0) {
          throw new RuntimeError('Division by zero');
        }
        return { type: 'number', value: this.toNumber(left) / divisor };
      }

      case '^':
      case '**':
        return { type: 'number', value: Math.pow(this.toNumber(left), this.toNumber(right)) };

      case '=':
        return { type: 'number', value: this.compareValues(left, right) === 0 ? 1 : 0 };

      case '<>':
      case '!=':
        return { type: 'number', value: this.compareValues(left, right) !== 0 ? 1 : 0 };

      case '<':
        return { type: 'number', value: this.compareValues(left, right) < 0 ? 1 : 0 };

      case '>':
        return { type: 'number', value: this.compareValues(left, right) > 0 ? 1 : 0 };

      case '<=':
        return { type: 'number', value: this.compareValues(left, right) <= 0 ? 1 : 0 };

      case '>=':
        return { type: 'number', value: this.compareValues(left, right) >= 0 ? 1 : 0 };

      case 'AND':
        return { type: 'number', value: this.isTruthy(left) && this.isTruthy(right) ? 1 : 0 };

      case 'OR':
        return { type: 'number', value: this.isTruthy(left) || this.isTruthy(right) ? 1 : 0 };

      default:
        throw new RuntimeError(`Unknown binary operator: ${expression.operator}`);
    }
  }

  private evaluateUnaryExpression(expression: UnaryExpression): RuntimeValue {
    const operand = this.evaluateExpression(expression.operand);

    switch (expression.operator) {
      case '-':
        return { type: 'number', value: -this.toNumber(operand) };

      case '+':
        return { type: 'number', value: this.toNumber(operand) };

      case 'NOT':
        return { type: 'number', value: this.isTruthy(operand) ? 0 : 1 };

      default:
        throw new RuntimeError(`Unknown unary operator: ${expression.operator}`);
    }
  }

  private getVariable(variable: Variable): RuntimeValue {
    if (variable.indices) {
      // Array access
      const array = this.context.arrays.get(variable.name);
      if (!array) {
        throw new RuntimeError(`Undefined array: ${variable.name}`);
      }

      const indices: number[] = [];
      for (const indexExpr of variable.indices) {
        const indexValue = this.evaluateExpression(indexExpr);
        if (indexValue.type !== 'number') {
          throw new RuntimeError('Array indices must be numbers');
        }
        indices.push(Math.floor(indexValue.value));
      }

      return this.getArrayElement(array.value, indices);
    } else {
      // Simple variable
      const value = this.context.variables.get(variable.name);
      if (!value) {
        // Return 0 for undefined numeric variables, empty string for string variables
        return variable.name.endsWith('$')
          ? { type: 'string', value: '' }
          : { type: 'number', value: 0 };
      }
      return value;
    }
  }

  private assignVariable(variable: Variable, value: RuntimeValue): void {
    if (variable.indices) {
      // Array assignment
      const array = this.context.arrays.get(variable.name);
      if (!array) {
        throw new RuntimeError(`Undefined array: ${variable.name}`);
      }

      const indices: number[] = [];
      for (const indexExpr of variable.indices) {
        const indexValue = this.evaluateExpression(indexExpr);
        if (indexValue.type !== 'number') {
          throw new RuntimeError('Array indices must be numbers');
        }
        indices.push(Math.floor(indexValue.value));
      }

      this.setArrayElement(array.value, indices, value);
    } else {
      // Simple variable assignment
      this.context.variables.set(variable.name, value);
    }
  }

  // Utility methods
  private findStatementIndex(lineNumber: number): number {
    for (let i = 0; i < this.orderedStatements.length; i++) {
      if (this.orderedStatements[i].lineNumber === lineNumber) {
        return i;
      }
    }
    return -1;
  }

  private getLastForVariable(): string | undefined {
    const variables = Array.from(this.context.forLoops.keys());
    return variables[variables.length - 1];
  }

  private createMultiDimensionalArray(dimensions: number[]): ArrayElement[] {
    if (dimensions.length === 1) {
      return new Array(dimensions[0] + 1).fill({ type: 'number', value: 0 });
    }

    const result = new Array(dimensions[0] + 1);
    for (let i = 0; i <= dimensions[0]; i++) {
      result[i] = this.createMultiDimensionalArray(dimensions.slice(1));
    }
    return result;
  }

  private getArrayElement(array: ArrayElement[], indices: number[]): RuntimeValue {
    let current: ArrayElement | ArrayElement[] = array;
    for (const index of indices) {
      if (Array.isArray(current)) {
        if (!current[index]) {
          return { type: 'number', value: 0 };
        }
        current = current[index];
      } else {
        return { type: 'number', value: 0 };
      }
    }
    return Array.isArray(current) ? { type: 'number', value: 0 } : current;
  }

  private setArrayElement(array: ArrayElement[], indices: number[], value: RuntimeValue): void {
    let current: ArrayElement | ArrayElement[] = array;
    for (let i = 0; i < indices.length - 1; i++) {
      if (Array.isArray(current)) {
        current = current[indices[i]];
      }
    }
    if (Array.isArray(current)) {
      current[indices[indices.length - 1]] = value;
    }
  }

  private toNumber(value: RuntimeValue): number {
    if (value.type === 'number') {
      return value.value;
    }
    if (value.type === 'string') {
      const num = parseFloat(value.value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private valueToString(value: RuntimeValue): string {
    if (value.type === 'string') {
      return value.value;
    }
    if (value.type === 'number') {
      return value.value.toString();
    }
    return '';
  }

  private compareValues(left: RuntimeValue, right: RuntimeValue): number {
    if (left.type === 'string' && right.type === 'string') {
      return left.value.localeCompare(right.value);
    }

    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum < rightNum) return -1;
    if (leftNum > rightNum) return 1;
    return 0;
  }

  private isTruthy(value: RuntimeValue): boolean {
    if (value.type === 'number') {
      return value.value !== 0;
    }
    if (value.type === 'string') {
      return value.value !== '';
    }
    return false;
  }
}
