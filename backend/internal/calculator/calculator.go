package calculator

import (
	"fmt"
	"math"
	"sort"
)

type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	SquareRoot Operation = "sqrt"
	Percentage Operation = "percentage"
)

type ErrorCode string

const (
	UnknownOperation   ErrorCode = "UNKNOWN_OPERATION"
	InvalidArity       ErrorCode = "INVALID_ARITY"
	DivisionByZero     ErrorCode = "DIVISION_BY_ZERO"
	NegativeSquareRoot ErrorCode = "NEGATIVE_SQUARE_ROOT"
	NonFiniteNumber    ErrorCode = "NON_FINITE_NUMBER"
	NonFiniteResult    ErrorCode = "NON_FINITE_RESULT"
)

type Error struct {
	Code    ErrorCode
	Message string
}

func (error *Error) Error() string {
	return error.Message
}

type Definition struct {
	ID     Operation `json:"id"`
	Label  string    `json:"label"`
	Arity  int       `json:"arity"`
	Symbol string    `json:"symbol"`
}

var definitions = map[Operation]Definition{
	Add:        {ID: Add, Label: "Addition", Arity: 2, Symbol: "+"},
	Subtract:   {ID: Subtract, Label: "Subtraction", Arity: 2, Symbol: "−"},
	Multiply:   {ID: Multiply, Label: "Multiplication", Arity: 2, Symbol: "×"},
	Divide:     {ID: Divide, Label: "Division", Arity: 2, Symbol: "÷"},
	Power:      {ID: Power, Label: "Exponentiation", Arity: 2, Symbol: "xʸ"},
	SquareRoot: {ID: SquareRoot, Label: "Square root", Arity: 1, Symbol: "√"},
	Percentage: {ID: Percentage, Label: "Percentage", Arity: 1, Symbol: "%"},
}

func Operations() []Definition {
	operations := make([]Definition, 0, len(definitions))
	for _, definition := range definitions {
		operations = append(operations, definition)
	}

	sort.Slice(operations, func(left, right int) bool {
		return operations[left].ID < operations[right].ID
	})

	return operations
}

func Calculate(operation Operation, operands []float64) (float64, error) {
	definition, exists := definitions[operation]
	if !exists {
		return 0, &Error{Code: UnknownOperation, Message: "The requested operation is not supported."}
	}
	if len(operands) != definition.Arity {
		return 0, &Error{
			Code:    InvalidArity,
			Message: fmt.Sprintf("%s requires exactly %d operand(s).", definition.Label, definition.Arity),
		}
	}

	for _, operand := range operands {
		if math.IsNaN(operand) || math.IsInf(operand, 0) {
			return 0, &Error{Code: NonFiniteNumber, Message: "Operands must be finite numbers."}
		}
	}

	var result float64
	switch operation {
	case Add:
		result = operands[0] + operands[1]
	case Subtract:
		result = operands[0] - operands[1]
	case Multiply:
		result = operands[0] * operands[1]
	case Divide:
		if operands[1] == 0 {
			return 0, &Error{Code: DivisionByZero, Message: "Cannot divide by zero."}
		}
		result = operands[0] / operands[1]
	case Power:
		result = math.Pow(operands[0], operands[1])
	case SquareRoot:
		if operands[0] < 0 {
			return 0, &Error{Code: NegativeSquareRoot, Message: "Cannot calculate the square root of a negative number."}
		}
		result = math.Sqrt(operands[0])
	case Percentage:
		result = operands[0] / 100
	default:
		return 0, &Error{Code: UnknownOperation, Message: "The requested operation is not supported."}
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, &Error{Code: NonFiniteResult, Message: "The calculation result is outside the supported numeric range."}
	}

	return result, nil
}
