10 REM Array demonstration
20 DIM NUMBERS(5)
30 DIM MATRIX(3, 3)
40 REM Fill array with values
50 FOR I = 1 TO 5
60 NUMBERS(I) = I * I
70 NEXT I
80 REM Display array contents
90 PRINT "Array contents:"
100 FOR I = 1 TO 5
110 PRINT "NUMBERS("; I; ") = "; NUMBERS(I)
120 NEXT I
130 REM Fill matrix
140 FOR I = 1 TO 3
150 FOR J = 1 TO 3
160 MATRIX(I, J) = I * 10 + J
170 NEXT J
180 NEXT I
190 REM Display matrix
200 PRINT "Matrix contents:"
210 FOR I = 1 TO 3
220 FOR J = 1 TO 3
230 PRINT MATRIX(I, J) + " ";
240 NEXT J
250 PRINT
260 NEXT I
270 END
