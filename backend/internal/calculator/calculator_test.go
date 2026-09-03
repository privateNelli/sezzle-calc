package calculator

import (
	"math"
	"testing"
)

func TestOperationsCatalog(t *testing.T) {
	operations := Operations()
	if len(operations) != 7 {
		t.Fatalf("len(Operations()) = %d, want 7", len(operations))
	}
	if operations[0].ID != Add {
		t.Errorf("first operation = %q, want %q", operations[0].ID, Add)
	}
	for index := 1; index < len(operations); index++ {
		if operations[index-1].ID >= operations[index].ID {
			t.Fatalf("operations are not sorted by id: %q then %q", operations[index-1].ID, operations[index].ID)
		}
	}
}

func TestErrorMessage(t *testing.T) {
	err := &Error{Code: DivisionByZero, Message: "Cannot divide by zero."}
	if err.Error() != "Cannot divide by zero." {
		t.Errorf("Error() = %q, want %q", err.Error(), "Cannot divide by zero.")
	}
}

func TestCalculate(t *testing.T) {
	testCases := []struct {
		name      string
		operation Operation
		operands  []float64
		want      float64
	}{
		{name: "adds two numbers", operation: Add, operands: []float64{8, 2}, want: 10},
		{name: "subtracts two numbers", operation: Subtract, operands: []float64{8, 2}, want: 6},
		{name: "multiplies two numbers", operation: Multiply, operands: []float64{8, 2}, want: 16},
		{name: "divides two numbers", operation: Divide, operands: []float64{8, 2}, want: 4},
		{name: "raises a number to a power", operation: Power, operands: []float64{2, 3}, want: 8},
		{name: "calculates a square root", operation: SquareRoot, operands: []float64{9}, want: 3},
		{name: "converts a percentage", operation: Percentage, operands: []float64{25}, want: 0.25},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			got, err := Calculate(testCase.operation, testCase.operands)

			if err != nil {
				t.Fatalf("Calculate() returned an unexpected error: %v", err)
			}
			if got != testCase.want {
				t.Errorf("Calculate() = %v, want %v", got, testCase.want)
			}
		})
	}
}

func TestEvaluate(t *testing.T) {
	testCases := []struct {
		name       string
		operands   []float64
		operations []Operation
		want       float64
	}{
		{name: "adds a pair", operands: []float64{8, 2}, operations: []Operation{Add}, want: 10},
		{name: "adds more than two operands", operands: []float64{1, 2, 3}, operations: []Operation{Add, Add}, want: 6},
		{name: "applies multiplication before addition", operands: []float64{1, 2, 3}, operations: []Operation{Add, Multiply}, want: 7},
		{name: "applies subtraction left to right", operands: []float64{8, 3, 2}, operations: []Operation{Subtract, Subtract}, want: 3},
		{name: "applies division and multiplication left to right", operands: []float64{8, 2, 4}, operations: []Operation{Divide, Multiply}, want: 16},
		{name: "applies exponentiation from the right", operands: []float64{2, 3, 2}, operations: []Operation{Power, Power}, want: 512},
		{name: "mixes addition, multiplication, and subtraction", operands: []float64{1, 2, 3, 4}, operations: []Operation{Add, Multiply, Subtract}, want: 3},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			got, err := Evaluate(testCase.operands, testCase.operations)

			if err != nil {
				t.Fatalf("Evaluate() returned an unexpected error: %v", err)
			}
			if got != testCase.want {
				t.Errorf("Evaluate() = %v, want %v", got, testCase.want)
			}
		})
	}
}

func TestEvaluateRejectsInvalidInput(t *testing.T) {
	testCases := []struct {
		name       string
		operands   []float64
		operations []Operation
		wantCode   ErrorCode
	}{
		{name: "rejects a single operand", operands: []float64{4}, operations: nil, wantCode: InvalidExpression},
		{name: "rejects a mismatched operation count", operands: []float64{1, 2, 3}, operations: []Operation{Add}, wantCode: InvalidExpression},
		{name: "rejects a unary operation in the chain", operands: []float64{9, 4}, operations: []Operation{SquareRoot}, wantCode: InvalidExpression},
		{name: "rejects an unknown operation", operands: []float64{1, 2}, operations: []Operation{"average"}, wantCode: UnknownOperation},
		{name: "rejects division by zero in a later term", operands: []float64{1, 2, 0}, operations: []Operation{Add, Divide}, wantCode: DivisionByZero},
		{name: "rejects non-finite operands", operands: []float64{1, math.Inf(1)}, operations: []Operation{Add}, wantCode: NonFiniteNumber},
		{name: "rejects NaN operands", operands: []float64{math.NaN(), 2}, operations: []Operation{Add}, wantCode: NonFiniteNumber},
		{name: "rejects too many operands", operands: make([]float64, MaxExpressionOperands+1), operations: make([]Operation, MaxExpressionOperands), wantCode: InvalidExpression},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			_, err := Evaluate(testCase.operands, testCase.operations)

			if err == nil {
				t.Fatal("Evaluate() returned nil error, want an error")
			}

			calculationError, ok := err.(*Error)
			if !ok {
				t.Fatalf("Evaluate() error type = %T, want *Error", err)
			}
			if calculationError.Code != testCase.wantCode {
				t.Errorf("Evaluate() error code = %q, want %q", calculationError.Code, testCase.wantCode)
			}
		})
	}
}

func TestEvaluateRejectsExpressionsThatAreTooLong(t *testing.T) {
	operands := make([]float64, MaxExpressionOperands+1)
	operations := make([]Operation, MaxExpressionOperands)
	for index := range operands {
		operands[index] = 1
	}
	for index := range operations {
		operations[index] = Add
	}

	_, err := Evaluate(operands, operations)
	if err == nil {
		t.Fatal("Evaluate() returned nil error, want an error")
	}

	calculationError, ok := err.(*Error)
	if !ok {
		t.Fatalf("Evaluate() error type = %T, want *Error", err)
	}
	if calculationError.Code != InvalidExpression {
		t.Errorf("Evaluate() error code = %q, want %q", calculationError.Code, InvalidExpression)
	}
}

func TestCalculateRejectsInvalidInput(t *testing.T) {
	testCases := []struct {
		name      string
		operation Operation
		operands  []float64
		wantCode  ErrorCode
	}{
		{name: "rejects an unknown operation", operation: "average", operands: []float64{8, 2}, wantCode: UnknownOperation},
		{name: "rejects an invalid arity", operation: Add, operands: []float64{8}, wantCode: InvalidArity},
		{name: "rejects division by zero", operation: Divide, operands: []float64{8, 0}, wantCode: DivisionByZero},
		{name: "rejects square root of negative number", operation: SquareRoot, operands: []float64{-1}, wantCode: NegativeSquareRoot},
		{name: "rejects non-finite operands", operation: Add, operands: []float64{math.Inf(1), 1}, wantCode: NonFiniteNumber},
		{name: "rejects NaN operands", operation: Add, operands: []float64{math.NaN(), 1}, wantCode: NonFiniteNumber},
		{name: "rejects non-finite result", operation: Power, operands: []float64{math.MaxFloat64, 2}, wantCode: NonFiniteResult},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			_, err := Calculate(testCase.operation, testCase.operands)

			if err == nil {
				t.Fatal("Calculate() returned nil error, want an error")
			}

			calculationError, ok := err.(*Error)
			if !ok {
				t.Fatalf("Calculate() error type = %T, want *Error", err)
			}
			if calculationError.Code != testCase.wantCode {
				t.Errorf("Calculate() error code = %q, want %q", calculationError.Code, testCase.wantCode)
			}
		})
	}
}
