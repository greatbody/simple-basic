10 REM Comprehensive BASIC Demo
20 PRINT "=== Simple BASIC Interpreter Demo ==="
30 PRINT
40 REM Variables and math
50 LET X = 10
60 LET Y = 5
70 PRINT "X = "; X; ", Y = "; Y
80 PRINT "X + Y = "; X + Y
90 PRINT "X * Y = "; X * Y
100 PRINT
110 REM String operations
120 LET NAME$ = "BASIC"
130 LET GREETING$ = "Hello, " + NAME$ + "!"
140 PRINT GREETING$
150 PRINT
160 REM Arrays
170 DIM NUMBERS(3)
180 FOR I = 1 TO 3
190 NUMBERS(I) = I * I
200 NEXT I
210 PRINT "Array contents:"
220 FOR I = 1 TO 3
230 PRINT "NUMBERS("; I; ") = "; NUMBERS(I)
240 NEXT I
250 PRINT
260 REM Conditionals
270 IF X > Y THEN PRINT "X is greater than Y"
280 IF X = Y THEN PRINT "X equals Y" ELSE PRINT "X does not equal Y"
290 PRINT
300 REM Data statements
310 DATA "Alice", 25, "Bob", 30
320 READ PERSON1$, AGE1, PERSON2$, AGE2
330 PRINT PERSON1$; " is "; AGE1; " years old"
340 PRINT PERSON2$; " is "; AGE2; " years old"
350 PRINT
360 PRINT "Demo completed successfully!"
370 END
