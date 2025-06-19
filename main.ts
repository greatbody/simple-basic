#!/usr/bin/env deno run --allow-read --allow-write

import { Lexer } from './lexer.ts';
import { Parser } from './parser.ts';
import { Interpreter } from './interpreter.ts';
import { BasicError } from './types.ts';

class BasicInterpreter {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter();
  }

  async runFile(filename: string): Promise<void> {
    try {
      const source = await Deno.readTextFile(filename);
      this.runSource(source);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`Error: File '${filename}' not found.`);
      } else {
        console.error(`Error reading file: ${error.message}`);
      }
    }
  }

  runSource(source: string): void {
    try {
      // Lexical analysis
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      // Syntax analysis
      const parser = new Parser(tokens);
      const program = parser.parse();

      // Interpretation
      const output = this.interpreter.interpret(program);

      // Print output
      for (const line of output) {
        console.log(line);
      }
    } catch (error) {
      if (error instanceof BasicError) {
        console.error(`${error.name}: ${error.message}`);
        if (error.line !== undefined) {
          console.error(`  at line ${error.line}`);
        }
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
  }

  async runInteractive(): Promise<void> {
    console.log('Simple BASIC Interpreter');
    console.log('Type BASIC commands or "exit" to quit.');
    console.log('Use line numbers for program mode, or direct commands for immediate mode.');
    console.log('');

    const program: string[] = [];
    let inProgramMode = false;

    while (true) {
      const prompt = inProgramMode ? 'BASIC> ' : 'READY> ';
      const input = await this.readLine(prompt);

      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        break;
      }

      if (input.toLowerCase() === 'run') {
        if (program.length === 0) {
          console.log('No program to run.');
          continue;
        }

        const source = program.join('\n');
        this.runSource(source);
        continue;
      }

      if (input.toLowerCase() === 'list') {
        if (program.length === 0) {
          console.log('No program loaded.');
        } else {
          for (const line of program.sort()) {
            console.log(line);
          }
        }
        continue;
      }

      if (input.toLowerCase() === 'new') {
        program.length = 0;
        inProgramMode = false;
        console.log('Program cleared.');
        continue;
      }

      if (input.toLowerCase() === 'help') {
        this.showHelp();
        continue;
      }

      // Check if input starts with a line number
      const lineNumberMatch = input.match(/^\s*(\d+)\s*(.*)/);

      if (lineNumberMatch) {
        // Program mode - store line
        const lineNumber = parseInt(lineNumberMatch[1]);
        const code = lineNumberMatch[2].trim();

        if (code === '') {
          // Delete line
          const index = program.findIndex(line => line.startsWith(lineNumber.toString()));
          if (index !== -1) {
            program.splice(index, 1);
          }
        } else {
          // Add or replace line
          const lineText = `${lineNumber} ${code}`;
          const index = program.findIndex(line => {
            const existingLineNum = parseInt(line.split(' ')[0]);
            return existingLineNum === lineNumber;
          });

          if (index !== -1) {
            program[index] = lineText;
          } else {
            program.push(lineText);
          }
        }

        inProgramMode = true;
      } else {
        // Immediate mode - execute directly
        if (input.trim() !== '') {
          this.runSource(input);
        }
      }
    }

    console.log('Goodbye!');
  }

  private async readLine(prompt: string): Promise<string> {
    // Write prompt
    await Deno.stdout.write(new TextEncoder().encode(prompt));

    // Read input
    const buffer = new Uint8Array(1024);
    const n = await Deno.stdin.read(buffer);

    if (n === null) {
      return 'exit';
    }

    return new TextDecoder().decode(buffer.subarray(0, n)).trim();
  }

  private showHelp(): void {
    console.log('Available commands:');
    console.log('  RUN     - Execute the current program');
    console.log('  LIST    - Display the current program');
    console.log('  NEW     - Clear the current program');
    console.log('  HELP    - Show this help message');
    console.log('  EXIT    - Quit the interpreter');
    console.log('');
    console.log('BASIC Language Features:');
    console.log('  Line numbers: 10 PRINT "Hello"');
    console.log('  Variables: LET A = 5 or A = 5');
    console.log('  Arrays: DIM A(10), A(5) = 42');
    console.log('  Control flow: GOTO, IF-THEN-ELSE, FOR-NEXT');
    console.log('  Data: DATA 1,2,3 / READ A,B,C / RESTORE');
    console.log('  Output: PRINT "text", variable');
    console.log('  Comments: REM This is a comment');
    console.log('  Math: +, -, *, /, ^ (power)');
    console.log('  Comparison: =, <>, <, >, <=, >=');
    console.log('  Logic: AND, OR, NOT');
    console.log('');
  }
}

async function main(): Promise<void> {
  const args = Deno.args;
  const basicInterpreter = new BasicInterpreter();

  if (args.length === 0) {
    // Interactive mode
    await basicInterpreter.runInteractive();
  } else if (args.length === 1) {
    // File mode
    await basicInterpreter.runFile(args[0]);
  } else {
    console.error('Usage: deno run --allow-read main.ts [filename]');
    console.error('  filename - BASIC program file to execute');
    console.error('  (no args) - Start interactive mode');
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
