<?php
namespace Platform\Sdk;

class PlatformClient {
    private string $apiKey;
    private string $baseUrl;
    private int $maxRetries;

    public function __construct(?string $apiKey = null, string $baseUrl = 'https://api.platform.io/v1') {
        $this->apiKey = $apiKey ?? getenv('PLATFORM_API_KEY') ?? '';
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->maxRetries = 3;
    }

    private function request(string $method, string $path, ?array $data = null): array {
        $url = $this->baseUrl . $path;
        $headers = ['Authorization: Bearer ' . $this->apiKey, 'Content-Type: application/json', 'User-Agent: platform-sdk-php/4.5.0'];
        for ($i = 0; $i <= $this->maxRetries; $i++) {
            if ($i > 0) usleep((int)(pow(2, $i) * 100000));
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpCode < 500) return json_decode($response, true) ?? [];
        }
        return [];
    }

    public function get(string $path): array { return $this->request('GET', $path); }
    public function post(string $path, array $data = []): array { return $this->request('POST', $path, $data); }
    public function listPlugins(): array { return $this->get('/plugins'); }
    public function listIntegrations(): array { return $this->get('/integrations'); }
}
