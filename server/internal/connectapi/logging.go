package connectapi

import (
	"context"
	"log"
	"time"

	"connectrpc.com/connect"
)

type LoggingInterceptor struct{}

func (LoggingInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		start := time.Now()
		res, err := next(ctx, req)
		duration := time.Since(start)
		procedure := req.Spec().Procedure
		if err != nil {
			log.Printf("[RPC] %s error=%v took=%s", procedure, err, duration)
		} else {
			log.Printf("[RPC] %s ok took=%s", procedure, duration)
		}
		return res, err
	}
}

func (LoggingInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (LoggingInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}
