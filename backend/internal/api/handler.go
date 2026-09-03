package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/example/sezzle-calc/backend/internal/calculator"
)

type errorResponse struct {
	Error apiError `json:"error"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type operationsResponse struct {
	Operations []calculator.Definition `json:"operations"`
}

type calculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	Operands  []float64            `json:"operands"`
}

type calculateResponse struct {
	Operation calculator.Operation `json:"operation"`
	Operands  []float64            `json:"operands"`
	Result    float64              `json:"result"`
}

type evaluateRequest struct {
	Operands   []float64              `json:"operands"`
	Operations []calculator.Operation `json:"operations"`
}

type evaluateResponse struct {
	Operands   []float64              `json:"operands"`
	Operations []calculator.Operation `json:"operations"`
	Result     float64                `json:"result"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /api/v1/operations", listOperations)
	mux.HandleFunc("POST /api/v1/calculate", calculate)
	mux.HandleFunc("POST /api/v1/evaluate", evaluate)

	return withCORS(mux)
}

func health(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func listOperations(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, operationsResponse{Operations: calculator.Operations()})
}

func calculate(writer http.ResponseWriter, request *http.Request) {
	var input calculateRequest
	if err := decodeJSON(request, &input); err != nil {
		writeError(writer, http.StatusBadRequest, "INVALID_JSON", "The request body must be valid JSON.")
		return
	}

	result, err := calculator.Calculate(input.Operation, input.Operands)
	if err != nil {
		writeCalculationError(writer, err)
		return
	}

	writeJSON(writer, http.StatusOK, calculateResponse{
		Operation: input.Operation,
		Operands:  input.Operands,
		Result:    result,
	})
}

func evaluate(writer http.ResponseWriter, request *http.Request) {
	var input evaluateRequest
	if err := decodeJSON(request, &input); err != nil {
		writeError(writer, http.StatusBadRequest, "INVALID_JSON", "The request body must be valid JSON.")
		return
	}

	result, err := calculator.Evaluate(input.Operands, input.Operations)
	if err != nil {
		writeCalculationError(writer, err)
		return
	}

	writeJSON(writer, http.StatusOK, evaluateResponse{
		Operands:   input.Operands,
		Operations: input.Operations,
		Result:     result,
	})
}

func writeCalculationError(writer http.ResponseWriter, err error) {
	var calculationError *calculator.Error
	if errors.As(err, &calculationError) {
		writeError(writer, http.StatusUnprocessableEntity, string(calculationError.Code), calculationError.Message)
		return
	}
	writeError(writer, http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred.")
}

func decodeJSON(request *http.Request, target any) error {
	decoder := json.NewDecoder(io.LimitReader(request.Body, 1<<20))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		return err
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return errors.New("request body contains multiple JSON values")
	}
	return nil
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if request.Method == http.MethodOptions {
			writer.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(writer, request)
	})
}

func writeError(writer http.ResponseWriter, status int, code, message string) {
	writeJSON(writer, status, errorResponse{Error: apiError{Code: code, Message: message}})
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(value)
}
