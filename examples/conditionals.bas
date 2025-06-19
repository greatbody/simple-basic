10 REM IF-THEN-ELSE and GOTO demonstration
20 LET X = 15
30 PRINT "X = "; X
40 IF X > 10 THEN PRINT "X is greater than 10"
50 IF X < 20 THEN PRINT "X is less than 20" ELSE PRINT "X is 20 or greater"
60 IF X = 15 THEN GOTO 100
70 PRINT "This line should not be printed"
80 GOTO 120
100 PRINT "X equals 15, jumped here with GOTO"
110 REM Test logical operators
120 LET A = 1
130 LET B = 0
140 PRINT "A = "; A; ", B = "; B
150 IF A AND B THEN PRINT "A AND B is true" ELSE PRINT "A AND B is false"
160 IF A OR B THEN PRINT "A OR B is true" ELSE PRINT "A OR B is false"
170 IF NOT B THEN PRINT "NOT B is true" ELSE PRINT "NOT B is false"
180 END
