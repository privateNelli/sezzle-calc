package calculator

import (
	"math"
	"testing"
)

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
