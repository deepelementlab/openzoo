package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type S3Storage struct {
	client      *s3.Client
	bucket      string
	cdnDomain   string
	endpointURL string
}

func NewS3StorageFromEnv() *S3Storage {
	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		slog.Info("S3_BUCKET not set, cloud upload disabled")
		return nil
	}
	region := os.Getenv("S3_REGION")
	if region == "" {
		region = "us-west-2"
	}
	opts := []func(*config.LoadOptions) error{
		config.WithRegion(region),
	}
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	if accessKey != "" && secretKey != "" {
		opts = append(opts, config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		))
	}
	cfg, err := config.LoadDefaultConfig(context.Background(), opts...)
	if err != nil {
		slog.Error("failed to load AWS config", "error", err)
		return nil
	}
	cdnDomain := os.Getenv("CLOUDFRONT_DOMAIN")
	endpointURL := os.Getenv("AWS_ENDPOINT_URL")
	s3Opts := []func(*s3.Options){}
	if endpointURL != "" {
		s3Opts = append(s3Opts, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(endpointURL)
			o.UsePathStyle = true
		})
	}
	slog.Info("S3 storage initialized", "bucket", bucket, "region", region, "cdn_domain", cdnDomain, "endpoint_url", endpointURL)
	return &S3Storage{
		client:      s3.NewFromConfig(cfg, s3Opts...),
		bucket:      bucket,
		cdnDomain:   cdnDomain,
		endpointURL: endpointURL,
	}
}

func (s *S3Storage) storageClass() types.StorageClass {
	if s.endpointURL != "" {
		return types.StorageClassStandard
	}
	return types.StorageClassIntelligentTiering
}

func (s *S3Storage) KeyFromURL(rawURL string) string {
	if s.endpointURL != "" {
		prefix := strings.TrimRight(s.endpointURL, "/") + "/" + s.bucket + "/"
		if strings.HasPrefix(rawURL, prefix) {
			return strings.TrimPrefix(rawURL, prefix)
		}
	}
	for _, prefix := range []string{
		"https://" + s.cdnDomain + "/",
		"https://" + s.bucket + "/",
	} {
		if strings.HasPrefix(rawURL, prefix) {
			return strings.TrimPrefix(rawURL, prefix)
		}
	}
	if i := strings.LastIndex(rawURL, "/"); i >= 0 {
		return rawURL[i+1:]
	}
	return rawURL
}

func (s *S3Storage) Delete(ctx context.Context, key string) {
	if key == "" {
		return
	}
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		slog.Error("s3 DeleteObject failed", "key", key, "error", err)
	}
}

func (s *S3Storage) DeleteKeys(ctx context.Context, keys []string) {
	for _, key := range keys {
		s.Delete(ctx, key)
	}
}

func isInlineContentType(ct string) bool {
	return strings.HasPrefix(ct, "image/") || strings.HasPrefix(ct, "text/") || ct == "application/pdf"
}

func (s *S3Storage) Upload(ctx context.Context, key string, data []byte, contentType string, filename string) (string, error) {
	safe := SanitizeFilename(filename)
	disposition := "attachment"
	if isInlineContentType(contentType) {
		disposition = "inline"
	}
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:             aws.String(s.bucket),
		Key:                aws.String(key),
		Body:               bytes.NewReader(data),
		ContentType:        aws.String(contentType),
		ContentDisposition: aws.String(fmt.Sprintf(`%s; filename="%s"`, disposition, safe)),
		CacheControl:       aws.String("max-age=432000,public"),
		StorageClass:       s.storageClass(),
	})
	if err != nil {
		return "", fmt.Errorf("s3 PutObject: %w", err)
	}
	if s.endpointURL != "" {
		return fmt.Sprintf("%s/%s/%s", strings.TrimRight(s.endpointURL, "/"), s.bucket, key), nil
	}
	domain := s.bucket
	if s.cdnDomain != "" {
		domain = s.cdnDomain
	}
	return fmt.Sprintf("https://%s/%s", domain, key), nil
}

func (s *S3Storage) UploadFromReader(ctx context.Context, key string, reader io.Reader, contentType string, filename string) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("s3 ReadAll: %w", err)
	}
	return s.Upload(ctx, key, data, contentType, filename)
}

func (s *S3Storage) ServeFile(_ http.ResponseWriter, _ *http.Request, _ string) {
	slog.Warn("ServeFile not supported for S3 storage, use direct URLs instead")
}
