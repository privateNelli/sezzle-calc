package main

import (
	"log"
	"net/http"
	"os"

	"github.com/example/sezzle-calc/backend/internal/api"
)

func main() {
	address := os.Getenv("CALCULATOR_API_ADDR")
	if address == "" {
		address = ":8080"
	}

	server := &http.Server{
		Addr:    address,
		Handler: api.NewHandler(),
	}

	log.Printf("calculator API listening on %s", address)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
