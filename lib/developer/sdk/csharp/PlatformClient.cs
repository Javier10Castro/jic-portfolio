using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Platform.Sdk
{
    public class PlatformClient
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly int _maxRetries;

        public PlatformClient(string apiKey = null, string baseUrl = "https://api.platform.io/v1")
        {
            _apiKey = apiKey ?? Environment.GetEnvironmentVariable("PLATFORM_API_KEY") ?? "";
            _baseUrl = baseUrl;
            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
            _http.DefaultRequestHeaders.Add("User-Agent", "platform-sdk-csharp/4.5.0");
            _maxRetries = 3;
        }

        public async Task<string> RequestAsync(string method, string path, object data = null)
        {
            var url = $"{_baseUrl}{path}";
            var content = data != null ? new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json") : null;
            for (int i = 0; i <= _maxRetries; i++)
            {
                if (i > 0) await Task.Delay((int)Math.Pow(2, i) * 100);
                try
                {
                    HttpResponseMessage resp = method switch
                    {
                        "GET" => await _http.GetAsync(url),
                        "POST" => await _http.PostAsync(url, content),
                        "DELETE" => await _http.DeleteAsync(url),
                        _ => throw new ArgumentException($"Unsupported method: {method}")
                    };
                    if ((int)resp.StatusCode < 500) return await resp.Content.ReadAsStringAsync();
                }
                catch { if (i == _maxRetries) throw; }
            }
            return "{}";
        }

        public Task<string> GetAsync(string path) => RequestAsync("GET", path);
        public Task<string> PostAsync(string path, object data) => RequestAsync("POST", path, data);
        public Task<string> ListPluginsAsync() => GetAsync("/plugins");
        public Task<string> ListIntegrationsAsync() => GetAsync("/integrations");
    }
}
