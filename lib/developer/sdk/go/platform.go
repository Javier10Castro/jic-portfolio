package platform

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Config struct {
	APIKey     string
	BaseURL    string
	Timeout    time.Duration
	MaxRetries int
}

type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	maxRetries int
}

func NewClient(config Config) *Client {
	if config.APIKey == "" { config.APIKey = os.Getenv("PLATFORM_API_KEY") }
	if config.BaseURL == "" { config.BaseURL = "https://api.platform.io/v1" }
	if config.Timeout == 0 { config.Timeout = 30 * time.Second }
	if config.MaxRetries == 0 { config.MaxRetries = 3 }
	return &Client{
		apiKey:     config.APIKey,
		baseURL:    config.BaseURL,
		httpClient: &http.Client{Timeout: config.Timeout},
		maxRetries: config.MaxRetries,
	}
}

func (c *Client) request(method, path string, body interface{}) ([]byte, error) {
	var reqBody io.Reader
	if body != nil { b, _ := json.Marshal(body); reqBody = bytes.NewReader(b) }
	req, _ := http.NewRequest(method, c.baseURL+path, reqBody)
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "platform-sdk-go/4.5.0")
	var resp *http.Response
	var err error
	for i := 0; i <= c.maxRetries; i++ {
		if i > 0 { time.Sleep(time.Duration(1<<i) * 100 * time.Millisecond) }
		resp, err = c.httpClient.Do(req)
		if err == nil && resp.StatusCode < 500 { break }
	}
	if err != nil { return nil, err }
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func (c *Client) Get(path string) ([]byte, error) { return c.request("GET", path, nil) }
func (c *Client) Post(path string, body interface{}) ([]byte, error) { return c.request("POST", path, body) }
func (c *Client) ListPlugins() ([]byte, error) { return c.Get("/plugins") }
func (c *Client) ListIntegrations() ([]byte, error) { return c.Get("/integrations") }
