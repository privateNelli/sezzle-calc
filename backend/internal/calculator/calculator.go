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
	InvalidExpression  ErrorCode = "INVALID_EXPRESSION"
	DivisionByZero     ErrorCode = "DIVISION_BY_ZERO"
	NegativeSquareRoot ErrorCode = "NEGATIVE_SQUARE_ROOT"
	NonFiniteNumber    ErrorCode = "NON_FINITE_NUMBER"
	NonFiniteResult    ErrorCode = "NON_FINITE_RESULT"
)

const MaxExpressionOperands = 16

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

func Evaluate(operands []float64, operations []Operation) (float64, error) {
	if err := validateExpression(operands, operations); err != nil {
		return 0, err
	}

	values := make([]float64, 0, len(operands))
	pending := make([]Operation, 0, len(operations))

	for index, operand := range operands {
		values = append(values, operand)
		if index == len(operations) {
			break
		}

		incoming := operations[index]
		for len(pending) > 0 && shouldReduce(pending[len(pending)-1], incoming) {
			reduced, err := reduceTop(&values, &pending)
			if err != nil {
				return 0, err
			}
			values = append(values, reduced)
		}
		pending = append(pending, incoming)
	}

	for len(pending) > 0 {
		reduced, err := reduceTop(&values, &pending)
		if err != nil {
			return 0, err
		}
		values = append(values, reduced)
	}

	if len(values) != 1 {
		return 0, &Error{Code: InvalidExpression, Message: "The expression could not be evaluated."}
	}

	return values[0], nil
}

func validateExpression(operands []float64, operations []Operation) error {
	if len(operands) < 2 || len(operands) > MaxExpressionOperands {
		return &Error{Code: InvalidExpression, Message: "An expression must contain between 2 and 16 operands."}
	}
	if len(operations) != len(operands)-1 {
		return &Error{Code: InvalidExpression, Message: "An expression must contain one binary operation between each operand."}
	}

	for _, operand := range operands {
		if math.IsNaN(operand) || math.IsInf(operand, 0) {
			return &Error{Code: NonFiniteNumber, Message: "Operands must be finite numbers."}
		}
	}

	for _, operation := range operations {
		definition, exists := definitions[operation]
		if !exists {
			return &Error{Code: UnknownOperation, Message: "The requested operation is not supported."}
		}
		if definition.Arity != 2 {
			return &Error{Code: InvalidExpression, Message: "Only binary operations can appear in a multi-step expression."}
		}
	}

	return nil
}

func shouldReduce(pending, incoming Operation) bool {
	pendingPrecedence := precedence(pending)
	incomingPrecedence := precedence(incoming)
	if pendingPrecedence > incomingPrecedence {
		return true
	}
	if pendingPrecedence < incomingPrecedence {
		return false
	}
	return incoming != Power
}

func precedence(operation Operation) int {
	switch operation {
	case Add, Subtract:
		return 1
	case Multiply, Divide:
		return 2
	case Power:
		return 3
	default:
		return 0
	}
}

func reduceTop(values *[]float64, pending *[]Operation) (float64, error) {
	if len(*pending) == 0 || len(*values) < 2 {
		return 0, &Error{Code: InvalidExpression, Message: "The expression could not be evaluated."}
	}

	operation := (*pending)[len(*pending)-1]
	*pending = (*pending)[:len(*pending)-1]

	right := (*values)[len(*values)-1]
	left := (*values)[len(*values)-2]
	*values = (*values)[:len(*values)-2]

	return Calculate(operation, []float64{left, right})
}
