package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlerHealth(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)

	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func TestHandlerListsOperations(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/operations", nil)

	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var response operationsResponse
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("unable to decode response: %v", err)
	}
	if len(response.Operations) != 7 {
		t.Errorf("operations = %d, want 7", len(response.Operations))
	}
}

func TestHandlerCalculates(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/calculate",
		bytes.NewBufferString(`{"operation":"multiply","operands":[6,7]}`),
	)

	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var response calculateResponse
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("unable to decode response: %v", err)
	}
	if response.Result != 42 {
		t.Errorf("result = %v, want 42", response.Result)
	}
}

func TestHandlerEvaluatesExpressions(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/evaluate",
		bytes.NewBufferString(`{"operands":[1,2,3],"operations":["add","multiply"]}`),
	)

	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var response evaluateResponse
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("unable to decode response: %v", err)
	}
	if response.Result != 7 {
		t.Errorf("result = %v, want 7", response.Result)
	}
}

func TestHandlerReturnsStructuredErrors(t *testing.T) {
	testCases := []struct {
		name       string
		path       string
		body       string
		wantStatus int
		wantCode   string
	}{
		{name: "invalid JSON", body: "{", wantStatus: http.StatusBadRequest, wantCode: "INVALID_JSON"},
		{name: "division by zero", body: `{"operation":"divide","operands":[1,0]}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "DIVISION_BY_ZERO"},
		{name: "unknown operation", body: `{"operation":"average","operands":[1,2]}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "UNKNOWN_OPERATION"},
		{name: "invalid expression", path: "/api/v1/evaluate", body: `{"operands":[1,2,3],"operations":["add"]}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "INVALID_EXPRESSION"},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			path := testCase.path
			if path == "" {
				path = "/api/v1/calculate"
			}

			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(
				http.MethodPost,
				path,
				bytes.NewBufferString(testCase.body),
			)

			NewHandler().ServeHTTP(recorder, request)

			if recorder.Code != testCase.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, testCase.wantStatus)
			}

			var response errorResponse
			if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
				t.Fatalf("unable to decode response: %v", err)
			}
			if response.Error.Code != testCase.wantCode {
				t.Errorf("error code = %q, want %q", response.Error.Code, testCase.wantCode)
			}
		})
	}
}

func TestHandlerOptionsAndCORS(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodOptions, "/api/v1/operations", nil)

	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Errorf("status = %d, want %d", recorder.Code, http.StatusNoContent)
	}
	if origin := recorder.Header().Get("Access-Control-Allow-Origin"); origin != "http://localhost:5173" {
		t.Errorf("Allow-Origin = %q, want localhost Vite origin", origin)
	}
}

func TestHandlerRejectsMalformedCalculateBodies(t *testing.T) {
	testCases := []struct {
		name string
		body string
	}{
		{name: "unknown field", body: `{"operation":"add","operands":[1,2],"extra":true}`},
		{name: "multiple JSON values", body: `{"operation":"add","operands":[1,2]}{}`},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(testCase.body))
			NewHandler().ServeHTTP(recorder, request)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
			}
		})
	}
}

func TestHandlerEvaluateInvalidJSON(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/evaluate", bytes.NewBufferString("{"))
	NewHandler().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}
